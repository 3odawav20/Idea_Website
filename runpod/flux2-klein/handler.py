from __future__ import annotations

import base64
import binascii
import io
import math
import os
import threading
from dataclasses import dataclass
from typing import Any

import numpy as np
from PIL import Image

MODEL_ID = "black-forest-labs/FLUX.2-klein-4B"
SEGMENTATION_ID = "nvidia/segformer-b5-finetuned-ade-640-640"
DEPTH_ID = "depth-anything/Depth-Anything-V2-Small-hf"
LEGACY_CONTRACT = "idea-qwen-mask-v1"
CONTRACT_V2 = "idea-flux2-klein-mask-v2"
MAX_IMAGE_BYTES = 12 * 1024 * 1024
MAX_PIXELS = 12_000_000
MAX_EDGE = 8192

_runtime: "Runtime | None" = None
_runtime_lock = threading.Lock()


class WorkerError(ValueError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


@dataclass
class Runtime:
    pipeline: Any
    segment_processor: Any
    segment_model: Any
    depth_processor: Any
    depth_model: Any
    torch: Any
    cv2: Any
    device: str


def _load_runtime() -> Runtime:
    global _runtime
    if _runtime is not None:
        return _runtime
    with _runtime_lock:
        if _runtime is not None:
            return _runtime
        import cv2
        import torch
        from diffusers import Flux2KleinPipeline
        from transformers import (
            AutoImageProcessor,
            AutoModelForDepthEstimation,
            SegformerForSemanticSegmentation,
        )

        if not torch.cuda.is_available():
            raise WorkerError("gpu_required", "A CUDA GPU is required for the FLUX worker")
        device = "cuda"
        dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
        cache_dir = os.getenv("HF_HOME", "/runpod-volume/huggingface-cache")
        local_only = os.getenv("HF_HUB_OFFLINE", "0") == "1"

        segment_processor = AutoImageProcessor.from_pretrained(SEGMENTATION_ID, cache_dir=cache_dir, local_files_only=local_only)
        segment_model = SegformerForSemanticSegmentation.from_pretrained(SEGMENTATION_ID, cache_dir=cache_dir, local_files_only=local_only)
        depth_processor = AutoImageProcessor.from_pretrained(DEPTH_ID, cache_dir=cache_dir, local_files_only=local_only)
        depth_model = AutoModelForDepthEstimation.from_pretrained(DEPTH_ID, cache_dir=cache_dir, local_files_only=local_only)
        pipeline = Flux2KleinPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=dtype,
            cache_dir=cache_dir,
            local_files_only=local_only,
        )
        pipeline.enable_model_cpu_offload()
        _runtime = Runtime(
            pipeline=pipeline,
            segment_processor=segment_processor,
            segment_model=segment_model,
            depth_processor=depth_processor,
            depth_model=depth_model,
            torch=torch,
            cv2=cv2,
            device=device,
        )
        return _runtime


def _decode_image(value: Any, field: str) -> Image.Image:
    if not isinstance(value, str):
        raise WorkerError("invalid_image", f"{field} must be a base64 image data URI")
    prefix, separator, encoded = value.partition(",")
    if not separator or prefix not in (
        "data:image/png;base64",
        "data:image/jpeg;base64",
        "data:image/webp;base64",
    ) or len(encoded) > math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 8:
        raise WorkerError("invalid_image", f"{field} is not a supported bounded image")
    try:
        raw = base64.b64decode(encoded, validate=True)
        if not raw or len(raw) > MAX_IMAGE_BYTES:
            raise ValueError("size")
        with Image.open(io.BytesIO(raw)) as opened:
            image = opened.convert("RGB")
            image.load()
    except (binascii.Error, OSError, ValueError):
        raise WorkerError("invalid_image", f"{field} could not be decoded") from None
    if image.width < 256 or image.height < 256 or image.width > MAX_EDGE or image.height > MAX_EDGE or image.width * image.height > MAX_PIXELS:
        raise WorkerError("invalid_dimensions", f"{field} dimensions are outside the supported range")
    return image


def _contract_input(event: dict[str, Any]) -> tuple[dict[str, Any], str]:
    payload = event.get("input", event)
    if not isinstance(payload, dict):
        raise WorkerError("invalid_request", "Runpod input must be an object")
    contract = payload.get("contract")
    if contract not in (LEGACY_CONTRACT, CONTRACT_V2):
        raise WorkerError("unsupported_contract", "Unsupported visualizer worker contract")
    if payload.get("return_edit_mask") is not True or payload.get("preserve_unmasked_pixels") is not True:
        raise WorkerError("unsafe_request", "A verified edit mask is required")
    return payload, str(contract)


def _semantic_masks(image: Image.Image, runtime: Runtime) -> tuple[dict[str, np.ndarray], np.ndarray]:
    torch = runtime.torch
    processor = runtime.segment_processor
    model = runtime.segment_model
    model.to(runtime.device)
    inputs = None
    logits = None
    try:
        with torch.inference_mode():
            inputs = processor(images=image, return_tensors="pt")
            inputs = {key: value.to(runtime.device) for key, value in inputs.items()}
            logits = model(**inputs).logits
            probabilities = logits.float().softmax(dim=1)[0]
            confidence, classes = probabilities.max(dim=0)
            labels = {int(key): str(value).strip().lower() for key, value in model.config.id2label.items()}
            floor_ids = {index for index, label in labels.items() if label == "floor"}
            wall_ids = {index for index, label in labels.items() if label == "wall"}
            if not floor_ids or not wall_ids:
                raise WorkerError("segmentation_unavailable", "The segmentation model lacks floor or wall labels")
            confidence_np = confidence.cpu().numpy()
            classes_np = classes.cpu().numpy()
            classes_np = runtime.cv2.resize(classes_np.astype(np.uint8), (image.width, image.height), interpolation=runtime.cv2.INTER_NEAREST)
            confidence_np = runtime.cv2.resize(confidence_np.astype(np.float32), (image.width, image.height), interpolation=runtime.cv2.INTER_LINEAR)
            raw_masks = {
                "floor": np.isin(classes_np, list(floor_ids)) & (confidence_np >= 0.58),
                "walls": np.isin(classes_np, list(wall_ids)) & (confidence_np >= 0.58),
            }
            protected_names = (
                "ceiling", "window", "curtain", "door", "chair", "sofa", "table", "bed", "cabinet",
                "shelf", "lamp", "light", "person", "plant", "rug", "carpet", "television", "screen",
                "stair", "column", "fireplace", "mirror", "picture", "painting", "counter", "sink",
            )
            protected_ids = {index for index, label in labels.items() if any(name in label for name in protected_names)}
            protected = np.isin(classes_np, list(protected_ids)) if protected_ids else np.zeros_like(classes_np, dtype=bool)
    finally:
        model.to("cpu")
        del inputs, logits
        torch.cuda.empty_cache()

    masks: dict[str, np.ndarray] = {}
    kernel_size = max(3, int(round(min(image.width, image.height) * 0.006)) | 1)
    kernel = runtime.cv2.getStructuringElement(runtime.cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
    for surface, raw in raw_masks.items():
        # Remove uncertain edges and every recognized protected object before compositing.
        candidate = (raw & ~protected).astype(np.uint8)
        candidate = runtime.cv2.erode(candidate, kernel, iterations=1)
        count, labels_map, stats, _ = runtime.cv2.connectedComponentsWithStats(candidate, connectivity=8)
        minimum_component = max(64, int(image.width * image.height * 0.00008))
        cleaned = np.zeros_like(candidate, dtype=np.uint8)
        for component in range(1, count):
            if stats[component, runtime.cv2.CC_STAT_AREA] >= minimum_component:
                cleaned[labels_map == component] = 255
        masks[surface] = cleaned > 0
    return masks, protected


def _estimate_depth(image: Image.Image, runtime: Runtime) -> np.ndarray:
    torch = runtime.torch
    model = runtime.depth_model
    model.to(runtime.device)
    inputs = None
    depth = None
    try:
        with torch.inference_mode():
            inputs = runtime.depth_processor(images=image, return_tensors="pt")
            inputs = {key: value.to(runtime.device) for key, value in inputs.items()}
            depth = model(**inputs).predicted_depth
            depth = torch.nn.functional.interpolate(
                depth.unsqueeze(1),
                size=(image.height, image.width),
                mode="bicubic",
                align_corners=False,
            )[0, 0]
            depth_np = depth.float().cpu().numpy()
    finally:
        model.to("cpu")
        del inputs, depth
        torch.cuda.empty_cache()
    if not np.isfinite(depth_np).all():
        raise WorkerError("depth_invalid", "Depth estimation returned non-finite values")
    return depth_np


def _grout_rgb(value: Any) -> tuple[int, int, int]:
    if not isinstance(value, str) or len(value) != 7 or value[0] != "#":
        return (221, 216, 207)
    try:
        return tuple(int(value[index : index + 2], 16) for index in (1, 3, 5))
    except ValueError:
        return (221, 216, 207)


def _perspective_texture(
    room: Image.Image,
    material: Image.Image,
    depth: np.ndarray,
    mask: np.ndarray,
    spec: dict[str, Any],
    ai_refinement: Image.Image,
    runtime: Runtime,
) -> Image.Image:
    width, height = room.size
    if depth.shape != (height, width) or mask.shape != (height, width):
        raise WorkerError("geometry_mismatch", "Depth or surface mask dimensions do not match the room")
    selected_depth = depth[mask]
    if selected_depth.size < max(64, int(width * height * 0.001)):
        raise WorkerError("surface_not_detected", "The selected architectural surface was not confidently segmented")
    lo, hi = np.percentile(selected_depth, (5, 95))
    if not np.isfinite(lo) or not np.isfinite(hi) or hi - lo < 1e-6:
        raise WorkerError("depth_invalid", "Surface depth is too uniform to project a perspective texture")

    cv2 = runtime.cv2
    depth_scale = np.clip((depth.astype(np.float32) - lo) / (hi - lo), 0.0, 1.0)
    width_mm = _positive_number(spec.get("tile_width_mm"), 600.0, 50.0, 3200.0)
    height_mm = _positive_number(spec.get("tile_height_mm"), width_mm, 50.0, 3200.0)
    grout_mm = _positive_number(spec.get("grout_width_mm"), 2.0, 1.0, 15.0)
    angle = math.radians(_positive_number(spec.get("rotation"), 0.0, 0.0, 360.0))
    grout_color = _grout_rgb(spec.get("grout"))

    yy, xx = np.indices((height, width), dtype=np.float32)
    cosine, sine = math.cos(angle), math.sin(angle)
    rotated_x = xx * cosine + yy * sine
    rotated_y = -xx * sine + yy * cosine
    base_pitch = max(24.0, min(width, height) * 0.115 * (width_mm / 600.0))
    local_scale = 0.48 + 0.92 * depth_scale
    pitch_x = base_pitch * local_scale
    pitch_y = base_pitch * (height_mm / width_mm) * local_scale
    u = np.mod(rotated_x / np.maximum(pitch_x, 1.0), 1.0)
    v = np.mod(rotated_y / np.maximum(pitch_y, 1.0), 1.0)

    material_array = np.asarray(material, dtype=np.uint8)
    mx = np.minimum((u * material.width).astype(np.int32), material.width - 1)
    my = np.minimum((v * material.height).astype(np.int32), material.height - 1)
    tile = material_array[my, mx].astype(np.float32)
    grout_x = grout_mm / width_mm
    grout_y = grout_mm / height_mm
    grout_pixels = (u >= 1.0 - grout_x) | (v >= 1.0 - grout_y)
    grout_array = np.asarray(grout_color, dtype=np.float32)
    tile[grout_pixels] = grout_array

    source = np.asarray(room, dtype=np.uint8)
    refined = np.asarray(ai_refinement.resize(room.size, Image.Resampling.LANCZOS), dtype=np.uint8)
    source_luma = cv2.cvtColor(source, cv2.COLOR_RGB2GRAY).astype(np.float32)
    refined_luma = cv2.cvtColor(refined, cv2.COLOR_RGB2GRAY).astype(np.float32)
    source_illumination = cv2.GaussianBlur(source_luma, (0, 0), sigmaX=max(3.0, min(width, height) * 0.012))
    refined_illumination = cv2.GaussianBlur(refined_luma, (0, 0), sigmaX=max(3.0, min(width, height) * 0.012))
    median = max(1.0, float(np.median(source_illumination[mask])))
    ai_median = max(1.0, float(np.median(refined_illumination[mask])))
    source_ratio = source_illumination / median
    ai_ratio = refined_illumination / ai_median
    lighting = np.clip(0.8 * source_ratio + 0.2 * ai_ratio, 0.55, 1.55)
    tile = np.clip(tile * lighting[:, :, None], 0, 255).astype(np.uint8)

    output = source.copy()
    output[mask] = tile[mask]
    if not np.array_equal(output[~mask], source[~mask]):
        raise WorkerError("protected_pixels_changed", "The composite changed pixels outside the verified surface mask")
    return Image.fromarray(output, mode="RGB")


def _positive_number(value: Any, default: float, minimum: float, maximum: float) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    return number if math.isfinite(number) and minimum <= number <= maximum else default


def _run_generation(payload: dict[str, Any], runtime: Runtime, room: Image.Image, material: Image.Image) -> Image.Image:
    width = int(payload.get("output_width", room.width))
    height = int(payload.get("output_height", room.height))
    if width != room.width or height != room.height:
        raise WorkerError("geometry_mismatch", "Requested output dimensions must match the uploaded room")

    max_generation_edge = int(os.getenv("FLUX_MAX_EDGE", "1024"))
    scale = min(1.0, max_generation_edge / max(room.size))
    generation_size = (max(256, int(round(room.width * scale))), max(256, int(round(room.height * scale))))
    room_reference = room.resize(generation_size, Image.Resampling.LANCZOS)
    material_reference = material.copy()
    material_scale = min(1.0, max_generation_edge / max(material_reference.size))
    if material_scale < 1.0:
        material_reference = material_reference.resize(
            (max(256, int(round(material.width * material_scale))), max(256, int(round(material.height * material_scale)))),
            Image.Resampling.LANCZOS,
        )

    surface = payload.get("target_surface", "floor")
    if surface not in ("floor", "walls", "both"):
        raise WorkerError("invalid_surface", "target_surface must be floor, walls, or both")
    prompt = str(payload.get("prompt", ""))[:1800]
    product = payload.get("product") if isinstance(payload.get("product"), dict) else {}
    prompt = (
        "Edit IMAGE 1, an architectural room photograph. IMAGE 2 is the exact selected ceramic, porcelain, or stone tile face. "
        f"Replace only the independently segmented {surface} surface. Preserve camera, composition, geometry, objects, ceiling, "
        "windows, curtains, doors, furniture, rugs, fixtures and all unselected pixels. Do not redesign or add objects. "
        "Use image 2 as an independent material reference; do not invent, recolor, collage, or alter its motif. "
        f"Tile dimensions {product.get('tile_width_mm', 600)} by {product.get('tile_height_mm', 600)} mm; "
        f"grout {product.get('grout_width_mm', 2)} mm; selected rotation {product.get('rotation', 0)} degrees. "
        "Maintain plausible original illumination, contact shadows and reflections. "
        + prompt
    )
    generator = runtime.torch.Generator(device=runtime.device).manual_seed(int(payload.get("seed", 0)) % (2**32))
    with runtime.torch.inference_mode():
        generated = runtime.pipeline(
            prompt=prompt,
            image=[room_reference, material_reference],
            width=generation_size[0],
            height=generation_size[1],
            num_inference_steps=4,
            guidance_scale=1.0,
            generator=generator,
            num_images_per_prompt=1,
        ).images[0]
    if not isinstance(generated, Image.Image) or generated.size != generation_size:
        raise WorkerError("generation_invalid", "FLUX returned a result with unexpected dimensions")
    return generated.convert("RGB")


def _validate_mask(mask: np.ndarray) -> float:
    if mask.ndim != 2 or mask.dtype != np.bool_ or not mask.size:
        raise WorkerError("mask_invalid", "The surface segmentation mask is malformed")
    area = float(mask.mean())
    if not math.isfinite(area) or area < 0.001 or area > 0.88:
        raise WorkerError("mask_unsafe", "The automatic surface mask failed conservative area checks")
    return area


def _png_data_uri(image: Image.Image) -> str:
    output = io.BytesIO()
    image.save(output, format="PNG", optimize=True)
    if output.tell() > 18 * 1024 * 1024:
        raise WorkerError("output_too_large", "The verified mask exceeded the response limit")
    return "data:image/png;base64," + base64.b64encode(output.getvalue()).decode("ascii")


def _jpeg_data_uri(image: Image.Image) -> str:
    output = io.BytesIO()
    image.save(output, format="JPEG", quality=92, optimize=True, progressive=True)
    if output.tell() > 18 * 1024 * 1024:
        raise WorkerError("output_too_large", "The verified result exceeded the response limit")
    return "data:image/jpeg;base64," + base64.b64encode(output.getvalue()).decode("ascii")


def process(event: dict[str, Any], runtime: Runtime | None = None) -> dict[str, Any]:
    payload, contract = _contract_input(event)
    room = _decode_image(payload.get("original_image"), "original_image")
    material = _decode_image(payload.get("material_reference"), "material_reference")
    output_width = payload.get("output_width", room.width)
    output_height = payload.get("output_height", room.height)
    if output_width != room.width or output_height != room.height:
        raise WorkerError("geometry_mismatch", "Output dimensions must equal the original room dimensions")

    active_runtime = runtime or _load_runtime()
    masks, _protected = _semantic_masks(room, active_runtime)
    requested_surface = payload.get("target_surface", "floor")
    selected = ("floor", "walls") if requested_surface == "both" else (("floor",) if requested_surface == "floor" else ("walls",))
    if requested_surface not in ("floor", "walls", "both"):
        raise WorkerError("invalid_surface", "target_surface must be floor, walls, or both")
    surface_masks = {name: masks[name] for name in selected}
    if requested_surface == "both":
        union = surface_masks["floor"] | surface_masks["walls"]
    else:
        union = surface_masks[selected[0]]
    total_area = _validate_mask(union)
    areas = {name: _validate_mask(mask) for name, mask in surface_masks.items()}

    depth = _estimate_depth(room, active_runtime)
    generated = _run_generation(payload, active_runtime, room, material)
    product = payload.get("product") if isinstance(payload.get("product"), dict) else {}
    source = np.asarray(room, dtype=np.uint8)
    result_array = source.copy()
    for name, surface_mask in surface_masks.items():
        projected = _perspective_texture(room, material, depth, surface_mask, product, generated, active_runtime)
        projected_array = np.asarray(projected, dtype=np.uint8)
        result_array[surface_mask] = projected_array[surface_mask]
    if not np.array_equal(result_array[~union], source[~union]):
        raise WorkerError("protected_pixels_changed", "The composite changed pixels outside the verified surface masks")
    result = Image.fromarray(result_array, mode="RGB")
    if result.size != room.size:
        raise WorkerError("geometry_mismatch", "The final composite changed the original dimensions")

    mask_image = Image.fromarray((union.astype(np.uint8) * 255), mode="L").convert("RGB")
    output = {
        "image": _jpeg_data_uri(result),
        "mask": _png_data_uri(mask_image),
        "model": MODEL_ID,
        "worker_contract": contract,
        "quality": {
            "dimensions_preserved": True,
            "surface_mask_verified": True,
            "protected_pixels_preserved": True,
            "depth_guided_texture_projection": True,
            "reference_images_independent": 2,
            "surface_mask_fraction": total_area,
            "surface_mask_fractions": areas,
            "inference_steps": 4,
            "guidance_scale": 1.0,
            "physical_scale_calibrated": False,
        },
    }
    return output


def handler(event: dict[str, Any]) -> dict[str, Any]:
    try:
        return process(event)
    except WorkerError as error:
        return {"error": str(error), "code": error.code}
    except Exception:
        # Do not return user image bytes, model internals, credentials, or traces to callers.
        return {"error": "Worker failed to produce a verified visualization", "code": "worker_failed"}


if __name__ == "__main__":
    import runpod

    runpod.serverless.start({"handler": handler})
