from pathlib import Path

from bson import ObjectId

from .config import Settings

def delete_upload(settings: Settings, url: str) -> None:
    """Remove an uploaded file by its public /files/... path (no-op for other URLs)."""
    if not url.startswith("/files/"):
        return
    upload_dir = Path(settings.upload_dir).resolve()
    target = (upload_dir / Path(url).name).resolve()
    if target.parent == upload_dir and target.is_file():
        target.unlink(missing_ok=True)

async def cleanup_orphans(db, settings: Settings, urls: set[str], exclude_id: ObjectId) -> None:
    """Delete uploaded files that no other project still references."""
    for url in urls:
        still_used = await db.projects.count_documents(
            {"_id": {"$ne": exclude_id}, "$or": [{"cover_image": url}, {"links.url": url}]}
        )
        if not still_used:
            delete_upload(settings, url)