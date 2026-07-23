# MRX private document worker

This service is the only component allowed to download quarantined owner files. It checks file signatures, runs ClamAV, performs OCR, and creates both raw and redacted text. The signed callback returns both versions to the MRX server. The server encrypts raw OCR in Supabase and uses redacted OCR for AI extraction and approved operational summaries. Raw OCR is never copied to GoHighLevel.

Required worker environment:

- `DOCUMENT_WORKER_TOKEN`
- `DOCUMENT_WORKER_CALLBACK_SECRET`

The web application keeps uploads disabled until its worker URL, bearer token, callback secret, and document-encryption key are configured **and** `DOCUMENT_UPLOADS_ENABLED=true`. The image seeds ClamAV definitions during the build, and `/health` returns 503 if the scanner database or OCR commands are unavailable. Before enabling uploads, refresh/rebuild the image, run the clean-file and EICAR rejection tests, and deploy behind TLS with no public document storage.
