FROM runpod/pytorch:1.0.3-cu1281-torch291-ubuntu2404
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    HF_HOME=/runpod-volume/huggingface \
    HF_HUB_DISABLE_TELEMETRY=1
COPY requirements.txt .
RUN python -m pip install --no-cache-dir -r requirements.txt
RUN python -c "from transformers import AutoImageProcessor, UperNetForSemanticSegmentation; from diffusers import QwenImageEditPlusPipeline; import torchvision, sentencepiece; from transformers import Qwen2_5_VLForConditionalGeneration; print('WORKER_IMPORTS_OK')"
COPY handler.py .
CMD ["python", "-u", "handler.py"]
