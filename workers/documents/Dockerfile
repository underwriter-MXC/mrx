FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    clamav clamav-daemon ocrmypdf qpdf tesseract-ocr tesseract-ocr-eng poppler-utils \
    && freshclam \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py ./

RUN useradd --create-home --uid 10001 worker && chown -R worker:worker /app
USER worker

ENV PORT=8080
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080", "--proxy-headers"]
