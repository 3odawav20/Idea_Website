import base64
import io
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np
from PIL import Image

import handler


def image_uri(color: tuple[int, int, int]) -> str:
    output = io.BytesIO()
    Image.new("RGB", (256, 256), color).save(output, format="PNG")
    return "data:image/png;base64," + base64.b64encode(output.getvalue()).decode("ascii")


class FakeRuntime:
    def __init__(self):
        self.width = 256
        self.height = 256
        self.device = "cpu"
        self.cv2 = SimpleNamespace(
            MORPH_ELLIPSE=1,
            CC_STAT_AREA=4,
            getStructuringElement=lambda _shape, size: np.ones(size, dtype=np.uint8),
            erode=lambda source, _kernel, iterations=1: source,
            connectedComponentsWithStats=self._components,
            COLOR_RGB2GRAY=1,
            cvtColor=lambda image, _code: np.mean(image, axis=2).astype(np.uint8),
            GaussianBlur=lambda image, _size, sigmaX=0: image,
        )
        self.torch = SimpleNamespace(
            cuda=SimpleNamespace(empty_cache=lambda: None),
            inference_mode=lambda: _null_context(),
            Generator=lambda device: SimpleNamespace(manual_seed=lambda _seed: None),
        )
        self.segment_processor = SimpleNamespace()
        self.segment_model = SimpleNamespace()
        self.depth_processor = SimpleNamespace()
        self.depth_model = SimpleNamespace()
        self.pipeline = None

    def _components(self, source, connectivity=8):
        labels = np.zeros_like(source, dtype=np.int32)
        labels[40:220, 30:226] = 1
        stats = np.array([[0, 0, 0, 0, 0], [30, 40, 196, 180, 35280]], dtype=np.int32)
        return 2, labels, stats, np.zeros((2, 2), dtype=np.float64)


def _null_context():
    class Context:
        def __enter__(self):
            return None

        def __exit__(self, *_args):
            return False

    return Context()


class WorkerContractTests(unittest.TestCase):
    def test_legacy_and_v2_contracts_are_accepted_without_changing_the_response_schema(self):
        for contract in (handler.LEGACY_CONTRACT, handler.CONTRACT_V2):
            payload, version = handler._contract_input({"input": {
                "contract": contract,
                "return_edit_mask": True,
                "preserve_unmasked_pixels": True,
            }})
            self.assertEqual(version, contract)
            self.assertIsInstance(payload, dict)

    def test_rejects_missing_mask_guarantees_and_unknown_contract(self):
        for request in (
            {"contract": handler.CONTRACT_V2, "return_edit_mask": False, "preserve_unmasked_pixels": True},
            {"contract": "unknown", "return_edit_mask": True, "preserve_unmasked_pixels": True},
        ):
            with self.assertRaises(handler.WorkerError):
                handler._contract_input(request)

    def test_two_references_are_decoded_independently(self):
        room = handler._decode_image(image_uri((20, 40, 60)), "original_image")
        material = handler._decode_image(image_uri((200, 100, 50)), "material_reference")
        self.assertIsNot(room, material)
        self.assertEqual(room.getpixel((0, 0)), (20, 40, 60))
        self.assertEqual(material.getpixel((0, 0)), (200, 100, 50))

    def test_malformed_image_and_dimensions_fail_closed(self):
        with self.assertRaises(handler.WorkerError):
            handler._decode_image("https://example.invalid/room.png", "original_image")
        small = io.BytesIO()
        Image.new("RGB", (128, 128)).save(small, format="PNG")
        uri = "data:image/png;base64," + base64.b64encode(small.getvalue()).decode("ascii")
        with self.assertRaises(handler.WorkerError):
            handler._decode_image(uri, "original_image")

    def test_explicit_mask_is_binary_opaque_and_exact_geometry(self):
        mask = np.zeros((256, 256), dtype=np.uint8)
        mask[80:180, 40:200] = 255

        def uri(array):
            out = io.BytesIO()
            Image.fromarray(array).save(out, format="PNG")
            return "data:image/png;base64," + base64.b64encode(out.getvalue()).decode("ascii")

        decoded = handler._decode_input_mask(uri(mask), (256, 256))
        self.assertTrue(np.array_equal(decoded, mask == 255))
        with self.assertRaises(handler.WorkerError):
            handler._decode_input_mask(uri(mask), (257, 256))
        mask[0, 0] = 127
        with self.assertRaises(handler.WorkerError):
            handler._decode_input_mask(uri(mask), (256, 256))
        with self.assertRaises(handler.WorkerError):
            handler._decode_input_mask(uri(np.zeros((256, 256), dtype=np.uint8)), (256, 256))

    def test_explicit_mask_limits_actual_composite_and_legacy_aliases(self):
        runtime = FakeRuntime()
        allowed = np.zeros((256, 256), dtype=bool)
        allowed[40:200, 40:200] = True
        semantic = np.zeros_like(allowed)
        semantic[80:230, 80:230] = True
        protected = np.zeros_like(allowed)
        protected[100:130, 100:130] = True
        expected = allowed & semantic & ~protected
        request = {
            "contract": handler.LEGACY_CONTRACT,
            "return_edit_mask": True,
            "preserve_unmasked_pixels": True,
            "original_image": image_uri((80, 100, 120)),
            "material_reference": image_uri((220, 60, 40)),
            "target_surface": "floor",
            "input_mask": handler._png_data_uri(Image.fromarray(allowed.astype(np.uint8) * 255)),
        }
        depth = np.tile(np.linspace(0, 1, 256, dtype=np.float32)[:, None], (1, 256))
        with patch.object(handler, "_semantic_masks", return_value=({"floor": semantic}, protected)), patch.object(handler, "_estimate_depth", return_value=depth), patch.object(handler, "_run_generation", return_value=Image.new("RGB", (256, 256), (80, 100, 120))):
            result = handler.process(request, runtime)
        self.assertEqual(result["contract"], handler.LEGACY_CONTRACT)
        self.assertEqual(result["mask"], result["edit_mask"])
        self.assertTrue(result["quality"]["input_mask_applied"])
        final_mask = handler._decode_input_mask(result["edit_mask"], (256, 256))
        self.assertTrue(np.array_equal(final_mask, expected))
        image = handler._decode_image(result["image"], "result")
        before = np.asarray(Image.new("RGB", (256, 256), (80, 100, 120)))
        self.assertTrue(np.array_equal(np.asarray(image)[~expected], before[~expected]))
        self.assertFalse(np.array_equal(np.asarray(image)[expected], before[expected]))

    def test_surface_mask_area_guard_rejects_empty_full_and_malformed_masks(self):
        with self.assertRaises(handler.WorkerError):
            handler._validate_mask(np.zeros((256, 256), dtype=bool))
        with self.assertRaises(handler.WorkerError):
            handler._validate_mask(np.ones((256, 256), dtype=bool))
        with self.assertRaises(handler.WorkerError):
            handler._validate_mask(np.zeros((16, 16), dtype=np.uint8))

    def test_generation_receives_room_and_material_as_separate_ordered_references(self):
        runtime = FakeRuntime()

        class PipelineStub:
            def __call__(self, **kwargs):
                self.kwargs = kwargs
                return SimpleNamespace(images=[Image.new("RGB", (kwargs["width"], kwargs["height"]), (1, 2, 3))])

        runtime.pipeline = PipelineStub()
        room = Image.new("RGB", (256, 256), (10, 20, 30))
        material = Image.new("RGB", (256, 256), (200, 150, 100))
        result = handler._run_generation(
            {"output_width": 256, "output_height": 256, "target_surface": "floor", "product": {}},
            runtime,
            room,
            material,
        )
        references = runtime.pipeline.kwargs["image"]
        self.assertEqual(len(references), 2)
        self.assertIsNot(references[0], references[1])
        self.assertEqual(references[0].getpixel((0, 0)), room.getpixel((0, 0)))
        self.assertEqual(references[1].getpixel((0, 0)), material.getpixel((0, 0)))
        self.assertEqual(runtime.pipeline.kwargs["num_inference_steps"], 4)
        self.assertEqual(runtime.pipeline.kwargs["guidance_scale"], 1.0)
        self.assertEqual(result.size, room.size)

    def test_tile_projection_preserves_every_pixel_outside_surface_mask(self):
        runtime = FakeRuntime()
        room = Image.new("RGB", (256, 256), (80, 100, 120))
        material = Image.new("RGB", (256, 256), (220, 60, 40))
        depth = np.tile(np.linspace(0, 1, 256, dtype=np.float32)[:, None], (1, 256))
        mask = np.zeros((256, 256), dtype=bool)
        mask[40:220, 30:226] = True
        result = handler._perspective_texture(
            room,
            material,
            depth,
            mask,
            {"tile_width_mm": 600, "tile_height_mm": 600, "grout_width_mm": 2, "rotation": 0},
            room.copy(),
            runtime,
        )
        before = np.asarray(room)
        after = np.asarray(result)
        self.assertEqual(result.size, room.size)
        self.assertTrue(np.array_equal(before[~mask], after[~mask]))
        self.assertFalse(np.array_equal(before[mask], after[mask]))
        reversed_depth = handler._perspective_texture(
            room,
            material,
            depth[::-1].copy(),
            mask,
            {"tile_width_mm": 600, "tile_height_mm": 600, "grout_width_mm": 2, "rotation": 0},
            room.copy(),
            runtime,
        )
        self.assertFalse(np.array_equal(after[mask], np.asarray(reversed_depth)[mask]))


if __name__ == "__main__":
    unittest.main()
