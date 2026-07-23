from __future__ import annotations

import hashlib
import hmac
import os
import re
import shutil
import subprocess
import tempfile
import time
import uuid
from pathlib import Path

import httpx
from fastapi import BackgroundTasks, FastAPI, Header, HTTPException
from pydantic import BaseModel, HttpUrl

app = FastAPI(title="MRX Private Document Worker", docs_url=None, redoc_url=None)
MAX_BYTES = 15 * 1024 * 1024
CLAMAV_DATABASE = Path("/var/lib/clamav")


class MalwareDetected(Exception):
    pass


class Job(BaseModel):
    jobId: str
    attachmentId: str
    downloadUrl: HttpUrl
    mimeType: str
    originalName: str
    callbackUrl: HttpUrl


def bearer_valid(value: str | None) -> bool:
    expected = os.environ.get("DOCUMENT_WORKER_TOKEN", "")
    supplied = (value or "").removeprefix("Bearer ")
    return bool(expected) and hmac.compare_digest(expected, supplied)


def magic_valid(payload: bytes, mime: str) -> bool:
    return (
        (mime == "application/pdf" and payload.startswith(b"%PDF"))
        or (mime == "image/jpeg" and payload.startswith(b"\xff\xd8\xff"))
        or (mime == "image/png" and payload.startswith(b"\x89PNG\r\n\x1a\n"))
    )


def redact(text: str) -> tuple[str, list[str]]:
    categories: set[str] = set()
    patterns = [
        ("ssn", re.compile(r"\b\d{3}[- ]?\d{2}[- ]?\d{4}\b"), "[REDACTED SSN]"),
        ("routing_number", re.compile(r"\b(?:routing|aba)\s*(?:number|no\.?|#)?\s*[:\-]?\s*\d{9}\b", re.I), "[REDACTED ROUTING NUMBER]"),
        ("bank_account", re.compile(r"\b(?:account|acct)\s*(?:number|no\.?|#)?\s*[:\-]?\s*\d{6,17}\b", re.I), "[REDACTED BANK ACCOUNT]"),
        ("signature", re.compile(r"(?im)^\s*(?:signature|signed by)\s*[:\-].*$"), "[REDACTED SIGNATURE]"),
    ]
    output = text
    for category, pattern, replacement in patterns:
        output, count = pattern.subn(replacement, output)
        if count:
            categories.add(category)
    return output[:250_000], sorted(categories)


def callback_headers(raw: bytes) -> dict[str, str]:
    secret = os.environ.get("DOCUMENT_WORKER_CALLBACK_SECRET", "")
    timestamp = str(int(time.time()))
    nonce = str(uuid.uuid4())
    signature = hmac.new(secret.encode(), f"{timestamp}.{nonce}.".encode() + raw, hashlib.sha256).hexdigest()
    return {
        "Content-Type": "application/json",
        "X-MRX-Timestamp": timestamp,
        "X-MRX-Nonce": nonce,
        "X-MRX-Signature": signature,
    }


async def send_callback(job: Job, payload: dict) -> None:
    import json

    raw = json.dumps(payload, separators=(",", ":")).encode()
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(str(job.callbackUrl), content=raw, headers=callback_headers(raw))
        response.raise_for_status()


def extract_pdf_text(source: Path, root: Path) -> tuple[str, int]:
    info = subprocess.run(
        ["pdfinfo", str(source)],
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    ).stdout
    page_match = re.search(r"(?im)^Pages:\s*(\d+)", info)
    pages = int(page_match.group(1)) if page_match else 0
    text_source = source
    if re.search(r"(?im)^Encrypted:\s+yes", info):
        decrypted = root / "source-decrypted.pdf"
        decrypt = subprocess.run(
            ["qpdf", "--password=", "--decrypt", str(source), str(decrypted)],
            capture_output=True,
            timeout=60,
            check=False,
        )
        if decrypt.returncode == 0 and decrypted.exists():
            decrypted_scan = subprocess.run(
                ["clamscan", "--no-summary", str(decrypted)],
                capture_output=True,
                timeout=120,
                check=False,
            )
            if decrypted_scan.returncode == 1:
                raise MalwareDetected
            if decrypted_scan.returncode != 0:
                raise RuntimeError("scanner_failed")
            text_source = decrypted

    native_text_path = root / "native.txt"
    native = subprocess.run(
        ["pdftotext", "-layout", str(text_source), str(native_text_path)],
        capture_output=True,
        timeout=120,
        check=False,
    )
    native_text = (
        native_text_path.read_text(errors="replace")
        if native.returncode == 0 and native_text_path.exists()
        else ""
    )
    # OCRmyPDF's sidecar intentionally omits pages that already contain text.
    # Prefer the PDF text layer when it is usable so digital revenue statements
    # do not finish with an empty extraction.
    if len(re.sub(r"\s+", "", native_text)) >= 40:
        return native_text, pages

    sidecar = root / "ocr.txt"
    output_pdf = root / "ocr.pdf"
    result = subprocess.run(
        [
            "ocrmypdf",
            "--skip-text",
            "--deskew",
            "--rotate-pages",
            "--sidecar",
            str(sidecar),
            str(text_source),
            str(output_pdf),
        ],
        capture_output=True,
        timeout=300,
        check=False,
    )
    if result.returncode not in (0, 6):
        raise RuntimeError("ocr_failed")
    ocr_text = sidecar.read_text(errors="replace") if sidecar.exists() else ""
    return "\n".join(part for part in (native_text, ocr_text) if part.strip()), pages


async def process(job: Job, idempotency_key: str) -> None:
    base = {"jobId": job.jobId, "attachmentId": job.attachmentId, "idempotencyKey": idempotency_key}
    try:
        async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
            response = await client.get(str(job.downloadUrl))
            response.raise_for_status()
            payload = response.content
        if len(payload) > MAX_BYTES or job.mimeType not in {"application/pdf", "image/jpeg", "image/png"}:
            await send_callback(job, {**base, "status": "rejected", "reason": "invalid_file"})
            return
        with tempfile.TemporaryDirectory(prefix="mrx-doc-") as directory:
            root = Path(directory)
            extension = {"application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png"}[job.mimeType]
            source = root / f"source{extension}"
            source.write_bytes(payload)
            scan = subprocess.run(["clamscan", "--no-summary", str(source)], capture_output=True, timeout=120, check=False)
            if scan.returncode == 1:
                await send_callback(job, {**base, "status": "rejected", "reason": "malware_detected"})
                return
            if scan.returncode != 0:
                raise RuntimeError("scanner_failed")
            if not magic_valid(payload, job.mimeType):
                await send_callback(job, {**base, "status": "rejected", "reason": "invalid_file"})
                return
            if job.mimeType == "application/pdf":
                text, pages = extract_pdf_text(source, root)
            else:
                result = subprocess.run(["tesseract", str(source), "stdout", "-l", "eng"], capture_output=True, text=True, timeout=180, check=False)
                if result.returncode != 0:
                    raise RuntimeError("ocr_failed")
                text, pages = result.stdout, 1
            redacted, categories = redact(text)
            await send_callback(
                job,
                {
                    **base,
                    "status": "ready",
                    "rawText": text[:250_000],
                    "redactedText": redacted,
                    "pageCount": pages,
                    "piiCategories": categories,
                },
            )
    except MalwareDetected:
        await send_callback(job, {**base, "status": "rejected", "reason": "malware_detected"})
    except Exception:
        await send_callback(job, {**base, "status": "rejected", "reason": "ocr_failed"})


@app.get("/health")
def health() -> dict[str, str]:
    required_commands = ("clamscan", "ocrmypdf", "pdfinfo", "pdftotext", "qpdf", "tesseract")
    database_ready = CLAMAV_DATABASE.is_dir() and any(
        path.suffix in {".cvd", ".cld"} for path in CLAMAV_DATABASE.iterdir()
    )
    if not database_ready or any(shutil.which(command) is None for command in required_commands):
        raise HTTPException(status_code=503, detail="worker_dependencies_unavailable")
    return {"status": "ok"}


@app.post("/jobs", status_code=202)
async def jobs(
    job: Job,
    tasks: BackgroundTasks,
    authorization: str | None = Header(default=None),
    idempotency_key: str | None = Header(default=None),
) -> dict[str, str]:
    if not bearer_valid(authorization):
        raise HTTPException(status_code=401, detail="unauthorized")
    try:
        uuid.UUID(idempotency_key or "")
    except ValueError as error:
        raise HTTPException(status_code=400, detail="invalid idempotency key") from error
    tasks.add_task(process, job, idempotency_key)
    return {"status": "accepted", "idempotencyKey": idempotency_key}
