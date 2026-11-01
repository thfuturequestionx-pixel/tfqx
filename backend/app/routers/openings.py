from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pymongo.errors import DuplicateKeyError

from ..auth import require_host
from ..models import (
    ApplicationCreate,
    OpeningBase,
    OpeningList,
    OpeningManageList,
    OpeningManageOut,
    OpeningOut,
)
from ..ratelimit import VisitorLimiter

router = APIRouter(prefix="/api/openings", tags=["openings"])

# A visitor may submit at most 5 applications an hour
_apply_limiter = VisitorLimiter(window_seconds=60 * 60, max_events=5)


def get_db(request: Request):
    return request.app.state.db


def _oid(opening_id: str) -> ObjectId:
    try:
        return ObjectId(opening_id)
    except (InvalidId, TypeError):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opening not found")


def _to_out(doc: dict) -> OpeningOut:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return OpeningOut(**doc)


_ORDER = [("order", 1), ("created_at", 1)]  # the host's order first, then oldest first


# ---------- Public ----------


@router.get("", response_model=OpeningList)
async def list_open_positions(db=Depends(get_db)):
    """Only positions that are currently open."""
    docs = await db.openings.find({"status": "open"}).sort(_ORDER).limit(100).to_list(length=100)
    return OpeningList(items=[_to_out(d) for d in docs])


# ---------- Host only (declared before "/{opening_id}" so "manage" is not read as an id) ----------


@router.get("/manage", response_model=OpeningManageList)
async def list_all_openings(db=Depends(get_db), _: str = Depends(require_host)):
    docs = await db.openings.find({}).sort(_ORDER).limit(100).to_list(length=100)
    items = []
    for doc in docs:
        opening_id = str(doc["_id"])
        total = await db.applications.count_documents({"opening_id": opening_id})
        new = await db.applications.count_documents({"opening_id": opening_id, "status": "new"})
        items.append(OpeningManageOut(**_to_out(doc).model_dump(), applications=total, new_applications=new))
    return OpeningManageList(items=items)


@router.post("", response_model=OpeningOut, status_code=status.HTTP_201_CREATED)
async def create_opening(payload: OpeningBase, db=Depends(get_db), _: str = Depends(require_host)):
    now = datetime.now(timezone.utc)
    doc = payload.model_dump() | {"created_at": now, "updated_at": now}
    result = await db.openings.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_out(doc)


@router.put("/{opening_id}", response_model=OpeningOut)
async def update_opening(
    opening_id: str, payload: OpeningBase, db=Depends(get_db), _: str = Depends(require_host)
):
    oid = _oid(opening_id)
    existing = await db.openings.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opening not found")
    data = payload.model_dump() | {"updated_at": datetime.now(timezone.utc)}
    await db.openings.update_one({"_id": oid}, {"$set": data})
    return _to_out(existing | data)


@router.delete("/{opening_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_opening(opening_id: str, db=Depends(get_db), _: str = Depends(require_host)):
    """Removes the opening. Applications already received are kept (they remember the title)."""
    oid = _oid(opening_id)
    if not await db.openings.find_one({"_id": oid}):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opening not found")
    await db.openings.delete_one({"_id": oid})
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Public (continued) ----------


@router.get("/{opening_id}", response_model=OpeningOut)
async def get_opening(opening_id: str, db=Depends(get_db)):
    """Also returns closed openings, so a shared link can say "applications are closed"."""
    doc = await db.openings.find_one({"_id": _oid(opening_id)})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opening not found")
    return _to_out(doc)


@router.post("/{opening_id}/apply", status_code=status.HTTP_201_CREATED)
async def apply(opening_id: str, payload: ApplicationCreate, request: Request, db=Depends(get_db)):
    oid = _oid(opening_id)

    if payload.website.strip():
        # Honeypot filled in: a bot. Say it worked, store nothing.
        return {"ok": True}

    opening = await db.openings.find_one({"_id": oid})
    if not opening:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opening not found")
    if opening["status"] != "open":
        raise HTTPException(status.HTTP_409_CONFLICT, "Applications for this position are closed.")

    key = VisitorLimiter.key(request)
    if _apply_limiter.exceeded(key):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "You have sent several applications recently. Please try again later.",
        )

    duplicate = HTTPException(status.HTTP_409_CONFLICT, "You have already applied for this position.")
    if await db.applications.find_one({"opening_id": opening_id, "email": payload.email}):
        raise duplicate

    doc = payload.model_dump(exclude={"website"}) | {
        "opening_id": opening_id,
        "opening_title": opening["title"],
        "status": "new",
        "created_at": datetime.now(timezone.utc),
    }
    try:
        await db.applications.insert_one(doc)
    except DuplicateKeyError:  # two submissions at the same moment
        raise duplicate

    _apply_limiter.record(key)
    return {"ok": True}