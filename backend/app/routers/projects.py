import re
import time
from datetime import datetime, timezone
from typing import Literal

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from ..auth import require_host
from ..config import Settings, get_settings
from ..files import cleanup_orphans
from ..models import AuthorType, Category, ProjectBase, ProjectList, ProjectOut

router = APIRouter(prefix="/api/projects", tags=["projects"])

_VIEW_WINDOW_SECONDS = 30 * 60
_recent_views: dict[tuple[str, str, str], float] = {}

def _view_key(request: Request, project_id: str) -> tuple[str, str, str]:
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    ip = forwarded or (request.client.host if request.client else "unknown")
    return (ip, request.headers.get("user-agent", "")[:200], project_id)

def _counted_recently(key: tuple[str, str, str]) -> bool:
    last = _recent_views.get(key)
    return last is not None and time.monotonic() - last < _VIEW_WINDOW_SECONDS

def _remember_view(key: tuple[str, str, str]) -> None:
    now = time.monotonic()
    if len(_recent_views) > 5000:  # keep memory bounded
        for k, seen in list(_recent_views.items()):
            if now - seen > _VIEW_WINDOW_SECONDS:
                del _recent_views[k]
    _recent_views[key] = now

def get_db(request: Request):
    return request.app.state.db

def _oid(project_id: str) -> ObjectId:
    try:
        return ObjectId(project_id)
    except (InvalidId, TypeError):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")

def _to_out(doc: dict) -> ProjectOut:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return ProjectOut(**doc)

def _file_refs(data: dict) -> set[str]:
    refs = {data.get("cover_image")} | {link["url"] for link in data.get("links", [])}
    return {r for r in refs if r and r.startswith("/files/")}

@router.get("", response_model=ProjectList)
async def list_projects(
    category: Category | None = None,
    author_type: AuthorType | None = None,
    q: str | None = Query(None, max_length=100),
    featured: bool | None = None,
    sort: Literal["recent", "views"] = "recent",
    limit: int = Query(12, ge=1, le=50),
    skip: int = Query(0, ge=0),
    db=Depends(get_db),
):
    query: dict = {}
    if category:
        query["category"] = category
    if author_type:
        query["author_type"] = author_type
    if featured is not None:
        query["featured"] = featured
    if q and q.strip():
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}
        query["$or"] = [{"title": rx}, {"summary": rx}, {"tags": rx}, {"author_name": rx}, {"members": rx}]

    # "recent": featured first, then newest. "views": most viewed first, ties newest first.
    order = (
        [("views", -1), ("created_at", -1)]
        if sort == "views"
        else [("featured", -1), ("created_at", -1)]
    )
    total = await db.projects.count_documents(query)
    cursor = db.projects.find(query).sort(order).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return ProjectList(items=[_to_out(d) for d in docs], total=total)

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str, db=Depends(get_db)):
    doc = await db.projects.find_one({"_id": _oid(project_id)})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return _to_out(doc)

@router.post("/{project_id}/view", status_code=status.HTTP_204_NO_CONTENT)
async def record_view(project_id: str, request: Request, db=Depends(get_db)):
    """Called by the project page when someone opens it. Public."""
    oid = _oid(project_id)
    key = _view_key(request, project_id)
    if not _counted_recently(key):
        result = await db.projects.update_one({"_id": oid}, {"$inc": {"views": 1}})
        if result.matched_count == 0:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
        _remember_view(key)  # only remembered for real projects
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectBase, db=Depends(get_db), _: str = Depends(require_host)):
    now = datetime.now(timezone.utc)
    doc = payload.model_dump(mode="json") | {"created_at": now, "updated_at": now, "views": 0}
    result = await db.projects.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_out(doc)

@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: str,
    payload: ProjectBase,
    db=Depends(get_db),
    settings: Settings = Depends(get_settings),
    _: str = Depends(require_host),
):
    oid = _oid(project_id)
    existing = await db.projects.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")

    data = payload.model_dump(mode="json") | {"updated_at": datetime.now(timezone.utc)}
    await db.projects.update_one({"_id": oid}, {"$set": data})

    # Files the host removed from this project are deleted from disk
    await cleanup_orphans(db, settings, _file_refs(existing) - _file_refs(data), oid)
    return _to_out(existing | data)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db=Depends(get_db),
    settings: Settings = Depends(get_settings),
    _: str = Depends(require_host),
):
    oid = _oid(project_id)
    existing = await db.projects.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    await db.projects.delete_one({"_id": oid})
    await cleanup_orphans(db, settings, _file_refs(existing), oid)
    return Response(status_code=status.HTTP_204_NO_CONTENT)