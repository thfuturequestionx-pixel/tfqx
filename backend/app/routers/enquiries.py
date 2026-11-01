import time
from collections import defaultdict, deque
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from ..auth import require_host
from ..models import (
    EnquiryCreate,
    EnquiryList,
    EnquiryOut,
    EnquiryStatus,
    EnquiryStatusUpdate,
)

router = APIRouter(prefix="/api/enquiries", tags=["enquiries"])

_WINDOW_SECONDS = 60 * 60
_MAX_PER_WINDOW = 5
_sent: dict[tuple[str, str], deque[float]] = defaultdict(deque)

def get_db(request: Request):
    return request.app.state.db

def _visitor_key(request: Request) -> tuple[str, str]:
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    ip = forwarded or (request.client.host if request.client else "unknown")
    return (ip, request.headers.get("user-agent", "")[:200])

def _prune(key: tuple[str, str]) -> deque[float]:
    now = time.monotonic()
    sent = _sent[key]
    while sent and now - sent[0] > _WINDOW_SECONDS:
        sent.popleft()
    return sent

def _oid(enquiry_id: str) -> ObjectId:
    try:
        return ObjectId(enquiry_id)
    except (InvalidId, TypeError):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Enquiry not found")

def _to_out(doc: dict) -> EnquiryOut:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return EnquiryOut(**doc)

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_enquiry(payload: EnquiryCreate, request: Request, db=Depends(get_db)):
    if payload.website.strip():
        # Honeypot filled in: a bot. Say it worked, store nothing.
        return {"ok": True}

    key = _visitor_key(request)
    if len(_prune(key)) >= _MAX_PER_WINDOW:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "You have sent several messages recently. Please try again later.",
        )

    doc = payload.model_dump(exclude={"website"}) | {
        "status": "new",
        "created_at": datetime.now(timezone.utc),
    }
    await db.enquiries.insert_one(doc)

    if len(_sent) > 5000:  # keep memory bounded
        for k in [k for k in _sent if not _prune(k)]:
            del _sent[k]
    _sent[key].append(time.monotonic())
    return {"ok": True}

@router.get("", response_model=EnquiryList)
async def list_enquiries(
    status_filter: EnquiryStatus | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db=Depends(get_db),
    _: str = Depends(require_host),
):
    query = {"status": status_filter} if status_filter else {}
    total = await db.enquiries.count_documents(query)
    new_count = await db.enquiries.count_documents({"status": "new"})
    cursor = db.enquiries.find(query).sort([("created_at", -1)]).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return EnquiryList(items=[_to_out(d) for d in docs], total=total, new_count=new_count)

@router.patch("/{enquiry_id}", response_model=EnquiryOut)
async def set_enquiry_status(
    enquiry_id: str,
    body: EnquiryStatusUpdate,
    db=Depends(get_db),
    _: str = Depends(require_host),
):
    oid = _oid(enquiry_id)
    existing = await db.enquiries.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Enquiry not found")
    await db.enquiries.update_one({"_id": oid}, {"$set": {"status": body.status}})
    return _to_out(existing | {"status": body.status})


@router.delete("/{enquiry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_enquiry(enquiry_id: str, db=Depends(get_db), _: str = Depends(require_host)):
    oid = _oid(enquiry_id)
    if not await db.enquiries.find_one({"_id": oid}):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Enquiry not found")
    await db.enquiries.delete_one({"_id": oid})
    return Response(status_code=status.HTTP_204_NO_CONTENT)