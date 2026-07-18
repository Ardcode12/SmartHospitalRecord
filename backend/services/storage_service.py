from __future__ import annotations

import uuid
from fastapi import UploadFile, HTTPException
from database import supabase_admin

BUCKET_NAME = "medical-records"


async def upload_file_to_storage(file: UploadFile, patient_id: str) -> str:
    """
    Upload a file to Supabase Storage and return its signed URL (1 year).
    Raises HTTPException on failure.
    """
    ext = file.filename.rsplit(".", 1)[-1] if file.filename else "bin"
    storage_path = f"{patient_id}/{uuid.uuid4()}.{ext}"

    contents = await file.read()

    try:
        supabase_admin.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": file.content_type or "application/octet-stream"},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"File upload failed: {exc}")

    # Create a signed URL valid for 1 year
    signed = supabase_admin.storage.from_(BUCKET_NAME).create_signed_url(
        storage_path, expires_in=365 * 24 * 3600
    )
    url = signed.get("signedURL") or signed.get("signed_url") or ""
    return url
