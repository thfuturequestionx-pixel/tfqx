from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from ..auth import require_host
from ..models import ApplicationList, ApplicationOut, ApplicationStatus, ApplicationStatusUpdate

# Everything here is host only: applications contain personal details.
router = APIRouter(prefix="/api/applications", tags=["applications"])


def get_db(request: Request):
    return request.app.state.db


def _oid(application_id: str) -> ObjectId:
    try:
        return ObjectId(application_id)
    except (InvalidId, TypeError):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")


def _to_out(doc: dict) -> ApplicationOut:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return ApplicationOut(**doc)


@router.get("", response_model=ApplicationList)
async def list_applications(
    opening_id: str | None = Query(None, max_length=40),
    status_filter: ApplicationStatus | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db=Depends(get_db),
    _: str = Depends(require_host),
):
    query: dict = {}
    if opening_id:
        query["opening_id"] = opening_id
    if status_filter:
        query["status"] = status_filter
    total = await db.applications.count_documents(query)
    new_count = await db.applications.count_documents({"status": "new"})
    cursor = db.applications.find(query).sort([("created_at", -1)]).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return ApplicationList(items=[_to_out(d) for d in docs], total=total, new_count=new_count)


@router.patch("/{application_id}", response_model=ApplicationOut)
async def set_application_status(
    application_id: str,
    body: ApplicationStatusUpdate,
    db=Depends(get_db),
    _: str = Depends(require_host),
):
    oid = _oid(application_id)
    existing = await db.applications.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    await db.applications.update_one({"_id": oid}, {"$set": {"status": body.status}})
    return _to_out(existing | {"status": body.status})


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(application_id: str, db=Depends(get_db), _: str = Depends(require_host)):
    oid = _oid(application_id)
    if not await db.applications.find_one({"_id": oid}):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    await db.applications.delete_one({"_id": oid})
    return Response(status_code=status.HTTP_204_NO_CONTENT)