"""IDEA Qwen Image Edit 2511 Serverless worker. No alternate image provider.

Contract: idea-qwen-mask-v1. Failure is explicit; no generated image is returned
without a same-sized, nonempty, non-global binary surface mask.
"""
import base64
import io
import os
import re
import threading
from functools import lru_cache

from PIL import Image, ImageFilter, ImageOps

CONTRACT = "idea-qwen-mask-v1"
QWEN_MODEL = "Qwen/Qwen-Image-Edit-2511"
SEGMENTER = "openmmlab/upernet-convnext-tiny"
DATA_URI = re.compile(r"^data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$")
LOCK = threading.Lock()
Image.MAX_IMAGE_PIXELS = 12_000_000


class ContractError(ValueError):
    pass


def read_image(value, field):
    if not isinstance(value, str) or len(value) > 12_000_000:
        raise ContractError(f"{field}: invalid size")
    match = DATA_URI.fullmatch(value)
    if not match:
        raise ContractError(f"{field}: must be a base64 image data URI")
    try:
        binary = base64.b64decode(match.group(2), validate=True)
        if not 100 <= len(binary) <= 8_388_608:
            raise ContractError(f"{field}: invalid byte length")
        with Image.open(io.BytesIO(binary)) as source:
            if source.format not in ("PNG", "JPEG", "WEBP"):
                raise ContractError(f"{field}: unsupported content")
            source.verify()
        with Image.open(io.BytesIO(binary)) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
        if min(image.size) < 256 or max(image.size) > 8192:
            raise ContractError(f"{field}: invalid dimensions")
        if image.width * image.height > 10_000_000:
            raise ContractError(f"{field}: image too large")
        return image
    except (OSError, ValueError, base64.binascii.Error) as exc:
        if isinstance(exc, ContractError):
            raise
        raise ContractError(f"{field}: image decoding failed") from None


def png_data_uri(image):
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")


def mask_from_classes(labels, id_to_label, surface):
    """Conservatively mask ADE20K wall/floor labels; outside stays immutable."""
    import numpy as np

    if surface not in ("floor", "walls", "both"):
        raise ContractError("INVALID_SURFACE")
    targets = {"floor"} if surface == "floor" else ({"wall"} if surface == "walls" else {"floor", "wall"})
    wanted = []
    for idx, name in id_to_label.items():
        normal = re.sub(r"[^a-z ]", " ", str(name).lower()).strip()
        if normal in targets or normal in {"floor flooring", "wall wall"}:
            wanted.append(int(idx))
    if not wanted:
        raise ContractError("SEGMENTER_LABELS_MISSING")
    selected = np.isin(labels, wanted).astype("uint8") * 255
    image = Image.fromarray(selected, "L").filter(ImageFilter.MinFilter(7))
    # Prevent partially-transparent regions from altering protected pixels.
    image = image.point(lambda v: 255 if v >= 248 else 0)
    fraction = image.histogram()[255] / (image.width * image.height)
    if fraction < 0.003 or fraction > 0.94:
        raise ContractError("SURFACE_MASK_UNRELIABLE")
    return image


@lru_cache(maxsize=1)
def load_segmenter():
    from transformers import AutoImageProcessor, UperNetForSemanticSegmentation

    processor = AutoImageProcessor.from_pretrained(SEGMENTER)
    network = UperNetForSemanticSegmentation.from_pretrained(SEGMENTER).eval()
    return processor, network


def infer_mask(room, surface):
    import torch
    import torch.nn.functional as F

    processor, network = load_segmenter()
    with torch.inference_mode():
        data = processor(images=room, return_tensors="pt")
        logits = network(**data).logits
        resized = F.interpolate(logits, size=(room.height, room.width), mode="bilinear", align_corners=False)
        labels = resized.argmax(dim=1)[0].cpu().numpy()
    return mask_from_classes(labels, network.config.id2label, surface)


@lru_cache(maxsize=1)
def load_image_editor():
    import torch
    from diffusers import QwenImageEditPlusPipeline

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA_NOT_AVAILABLE")
    pipeline = QwenImageEditPlusPipeline.from_pretrained(QWEN_MODEL, torch_dtype=torch.bfloat16)
    pipeline.to("cuda")
    pipeline.set_progress_bar_config(disable=True)
    return pipeline


def scale_input(image, limit=1024):
    if max(image.size) <= limit:
        return image
    ratio = limit / max(image.size)
    return image.resize((max(256, round(image.width * ratio)), max(256, round(image.height * ratio))), Image.Resampling.LANCZOS)


def process(payload):
    if not isinstance(payload, dict):
        raise ContractError("INVALID_INPUT")
    if payload.get("contract") != CONTRACT or payload.get("model") != QWEN_MODEL:
        raise ContractError("INVALID_WORKER_CONTRACT")
    if payload.get("return_edit_mask") is not True or payload.get("preserve_unmasked_pixels") is not True:
        raise ContractError("MASK_REQUIRED")
    room = read_image(payload.get("original_image"), "original_image")
    material = read_image(payload.get("material_reference"), "material_reference")
    width, height = room.size
    if payload.get("output_width") != width or payload.get("output_height") != height:
        raise ContractError("OUTPUT_DIMENSIONS_MISMATCH")
    target = payload.get("target_surface")
    prompt = payload.get("prompt")
    if not isinstance(prompt, str) or not 20 <= len(prompt) <= 6000:
        raise ContractError("INVALID_PROMPT")

    # Segment the original photograph BEFORE editing. Segmentation must never
    # be inferred from the generated image because it could reclassify objects.
    try:
        mask = infer_mask(room, target)
    except Exception as exc:
        raise ContractError('SEGMENTATION_FAILED_' + type(exc).__name__) from None
    try:
        editor = load_image_editor()
    except Exception as exc:
        raise ContractError('QWEN_MODEL_LOAD_FAILED_' + type(exc).__name__) from None
    import torch

    normalized_room = scale_input(room)
    normalized_material = scale_input(material)
    try:
        with torch.inference_mode():
            result = editor(
                image=[normalized_room, normalized_material],
                prompt=prompt,
                negative_prompt=" ",
                true_cfg_scale=4.0,
                guidance_scale=1.0,
                num_inference_steps=28,
                num_images_per_prompt=1,
            ).images[0].convert("RGB")
    except Exception as exc:
        raise ContractError('QWEN_INFERENCE_FAILED_' + type(exc).__name__) from None
    if result.size != room.size:
        result = result.resize(room.size, Image.Resampling.LANCZOS)

    # A second safety boundary: immutable pixels come from the original room.
    composite = Image.composite(result, room, mask)
    return {
        "contract": CONTRACT,
        "model": QWEN_MODEL,
        "image": png_data_uri(composite),
        "edit_mask": png_data_uri(mask),
        "preservation": "original_outside_binary_mask",
    }


def handler(job):
    payload = job.get("input") if isinstance(job, dict) else None
    # This probe only checks container code. It never claims model readiness.
    if isinstance(payload, dict) and payload.get("probe") == "contract":
        return {"contract": CONTRACT, "worker_code_ready": True, "model_inference_verified": False}
    with LOCK:
        try:
            return process(payload)
        except ContractError as exc:
            return {"error": str(exc), "contract": CONTRACT}
        except Exception as exc:
            # Only sanitized failure type; never expose provider tracebacks or secrets.
            return {"error": "WORKER_INFERENCE_FAILED_" + type(exc).__name__, "contract": CONTRACT}


if __name__ == "__main__":
    import runpod

    runpod.serverless.start({"handler": handler})
