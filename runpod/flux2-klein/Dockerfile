FROM python:3.11-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/runpod-volume/huggingface-cache \
    TRANSFORMERS_CACHE=/runpod-volume/huggingface-cache \
    MODEL_NAME=black-forest-labs/FLUX.2-klein-4B \
    HF_HUB_DISABLE_TELEMETRY=1 \
    TOKENIZERS_PARALLELISM=false

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
      libgl1 libgomp1 libglib2.0-0 ca-certificates git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt
RUN python -m pip install --upgrade pip \
    && python -m pip install -r requirements.txt

COPY handler.py ./handler.py

CMD ["python", "-u", "handler.py"]
