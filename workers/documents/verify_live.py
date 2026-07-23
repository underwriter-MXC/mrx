from __future__ import annotations

import hashlib
import hmac
import json
import os
import threading
import urllib.request
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def text_pdf(lines: list[str]) -> bytes:
    escaped = [
        line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)") for line in lines
    ]
    commands = " ".join(
        f"{'0 -28 Td ' if index else ''}({line}) Tj" for index, line in enumerate(escaped)
    )
    stream = f"BT /F1 18 Tf 72 720 Td {commands} ET"
    objects = [
        "<</Type/Catalog/Pages 2 0 R>>",
        "<</Type/Pages/Kids[3 0 R]/Count 1>>",
        "<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>",
        f"<< /Length {len(stream.encode('ascii'))} >>\nstream\n{stream}\nendstream",
        "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
    ]
    pdf = "%PDF-1.4\n% MRX live digital-text validation\n"
    offsets = [0]
    for index, value in enumerate(objects, 1):
        offsets.append(len(pdf.encode("ascii")))
        pdf += f"{index} 0 obj\n{value}\nendobj\n"
    xref_offset = len(pdf.encode("ascii"))
    pdf += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    pdf += "".join(f"{offset:010d} 00000 n \n" for offset in offsets[1:])
    pdf += (
        f"trailer\n<</Size {len(objects) + 1}/Root 1 0 R>>\n"
        f"startxref\n{xref_offset}\n%%EOF\n"
    )
    return pdf.encode("ascii")


def main() -> None:
    token = os.environ["DOCUMENT_WORKER_TOKEN"]
    callback_secret = os.environ["DOCUMENT_WORKER_CALLBACK_SECRET"]
    worker_url = os.environ.get("DOCUMENT_WORKER_VERIFY_URL", "http://127.0.0.1:8080")
    marker = f"MRX LIVE DIGITAL PDF {uuid.uuid4().hex[:12]}"
    payload = text_pdf([marker, "Dawson County, Texas", "Net revenue 873.21"])
    eicar_payload = (
        b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$"
        b"EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
    )
    callback: dict[str, object] = {}
    callback_ready = threading.Event()

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:
            if self.path == "/digital.pdf":
                body = payload
                content_type = "application/pdf"
            elif self.path == "/eicar.png":
                body = eicar_payload
                content_type = "image/png"
            else:
                self.send_error(404)
                return
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self) -> None:
            if self.path != "/callback":
                self.send_error(404)
                return
            raw = self.rfile.read(int(self.headers.get("Content-Length", "0")))
            timestamp = self.headers.get("X-MRX-Timestamp", "")
            nonce = self.headers.get("X-MRX-Nonce", "")
            supplied = self.headers.get("X-MRX-Signature", "")
            expected = hmac.new(
                callback_secret.encode(),
                f"{timestamp}.{nonce}.".encode() + raw,
                hashlib.sha256,
            ).hexdigest()
            if not hmac.compare_digest(expected, supplied):
                self.send_error(401)
                return
            callback.update(json.loads(raw))
            callback_ready.set()
            self.send_response(204)
            self.end_headers()

        def log_message(self, _format: str, *_args: object) -> None:
            return

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    def submit_job(
        *,
        download_url: str,
        callback_url: str,
        mime_type: str,
        original_name: str,
    ) -> tuple[str, str]:
        job_id = str(uuid.uuid4())
        idempotency_key = str(uuid.uuid4())
        attachment_id = str(uuid.uuid4())
        request_body = json.dumps(
            {
                "jobId": job_id,
                "attachmentId": attachment_id,
                "downloadUrl": download_url,
                "mimeType": mime_type,
                "originalName": original_name,
                "callbackUrl": callback_url,
            }
        ).encode()
        request = urllib.request.Request(
            f"{worker_url}/jobs",
            data=request_body,
            method="POST",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Idempotency-Key": idempotency_key,
                "User-Agent": "MRX-Live-Worker-Validation/1.0",
            },
        )
        with urllib.request.urlopen(request, timeout=10) as response:
            if response.status != 202:
                raise RuntimeError(f"unexpected_job_status:{response.status}")
        return job_id, idempotency_key

    try:
        host_url = f"http://127.0.0.1:{server.server_port}"
        callback_url = f"{host_url}/callback"
        job_id, idempotency_key = submit_job(
            download_url=f"{host_url}/digital.pdf",
            callback_url=callback_url,
            mime_type="application/pdf",
            original_name="live-digital-validation.pdf",
        )
        if not callback_ready.wait(90):
            raise RuntimeError("live_callback_timeout")
        raw_text = str(callback.get("rawText", ""))
        if (
            callback.get("jobId") != job_id
            or callback.get("idempotencyKey") != idempotency_key
            or callback.get("status") != "ready"
            or marker.lower() not in raw_text.lower()
        ):
            raise RuntimeError(f"live_digital_pdf_failed:{callback.get('status')}")
        digital_text_status = callback.get("status")
        digital_text_pages = callback.get("pageCount")
        callback.clear()
        callback_ready.clear()
        malware_job_id, malware_idempotency_key = submit_job(
            download_url=f"{host_url}/eicar.png",
            callback_url=callback_url,
            mime_type="image/png",
            original_name="eicar.png",
        )
        if not callback_ready.wait(90):
            raise RuntimeError("live_eicar_callback_timeout")
        if (
            callback.get("jobId") != malware_job_id
            or callback.get("idempotencyKey") != malware_idempotency_key
            or callback.get("status") != "rejected"
            or callback.get("reason") != "malware_detected"
        ):
            raise RuntimeError(
                f"live_eicar_rejection_failed:{callback.get('status')}:{callback.get('reason')}"
            )
        print(
            json.dumps(
                {
                    "ok": True,
                    "jobAccepted": True,
                    "signedCallback": True,
                    "digitalTextPdf": digital_text_status,
                    "markerRecovered": True,
                    "pageCount": digital_text_pages,
                    "eicar": "malware_detected",
                    "idempotencyKeysPreserved": True,
                }
            )
        )
    finally:
        server.shutdown()
        server.server_close()
        server_thread.join(timeout=5)


if __name__ == "__main__":
    main()
