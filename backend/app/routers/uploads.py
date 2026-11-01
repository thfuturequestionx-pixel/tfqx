import re
from pathlib import Path
from uuid import uuid4

import anyio
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from ..auth import require_host
from ..config import Settings, get_settings

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

_CHUNK = 1024 * 1024

def _sniff_extension(head: bytes) -> str | None:
    """Decide the file type from its actual bytes, not the client-supplied type.
    SVG/HTML are deliberately not allowed (they can carry scripts)."""
    if head.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return ".webp"
    if head.startswith(b"%PDF-"):
        return ".pdf"
    return None

@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile,
    settings: Settings = Depends(get_settings),
    _: str = Depends(require_host),
):
    head = await file.read(16)
    ext = _sniff_extension(head)
    if ext is None:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Only JPG, PNG, WebP images and PDFs are allowed"
        )

    max_bytes = settings.max_upload_mb * 1024 * 1024
    target = Path(settings.upload_dir) / f"{uuid4().hex}{ext}"
    size = 0
    try:
        with open(target, "wb") as out:
            chunk = head
            while chunk:
                size += len(chunk)
                if size > max_bytes:
                    raise HTTPException(
                        413,
                        f"File is larger than {settings.max_upload_mb} MB",
                    )
                await anyio.to_thread.run_sync(out.write, chunk)
                chunk = await file.read(_CHUNK)
    except Exception:
        target.unlink(missing_ok=True)
        raise

    original = re.sub(r"[^\w.\- ]", "", Path(file.filename or "file").name)[:80] or "file"
    return {"url": f"/files/{target.name}", "filename": original, "size": size}