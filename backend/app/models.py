import re
from datetime import date, datetime
from typing import Annotated, Literal
from urllib.parse import urlparse

from pydantic import AfterValidator, BaseModel, Field, StringConstraints

Category = Literal["Finance", "Analytics", "Strategy", "Market Intelligence", "Other"]
AuthorType = Literal["host", "group", "individual"]


def _check_url(value: str) -> str:
    """Accept http(s) URLs or paths of files uploaded through this API."""
    value = value.strip()
    if value.startswith("/files/"):
        if ".." in value or "\\" in value:
            raise ValueError("invalid file path")
        return value
    parsed = urlparse(value)
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return value
    raise ValueError("must be an http(s) URL or an uploaded file path")


Url = Annotated[str, StringConstraints(max_length=500), AfterValidator(_check_url)]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
Tag = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=30)]


class ProjectLink(BaseModel):
    label: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]
    url: Url


class ProjectBase(BaseModel):
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=120)]
    summary: Annotated[str, StringConstraints(strip_whitespace=True, min_length=10, max_length=300)]
    description: Annotated[str, StringConstraints(strip_whitespace=True, max_length=10000)] = ""
    category: Category
    # Who did the work: the host (TFQX itself), a group, or an individual
    author_type: AuthorType
    author_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    members: list[Name] = Field(default_factory=list, max_length=15)
    tags: list[Tag] = Field(default_factory=list, max_length=8)
    cover_image: Url | None = None
    links: list[ProjectLink] = Field(default_factory=list, max_length=8)
    completed_on: date | None = None
    featured: bool = False


class ProjectOut(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime
    views: int = 0  # counted by POST /api/projects/{id}/view; never set by the host


class ProjectList(BaseModel):
    items: list[ProjectOut]
    total: int


# ---------------------------------------------------------------- enquiries

EnquiryType = Literal["company", "student", "other"]
EnquiryStatus = Literal["new", "handled"]

_EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")


def _check_email(value: str) -> str:
    value = value.strip().lower()
    if not _EMAIL_RE.fullmatch(value):
        raise ValueError("enter a valid email address")
    return value


Email = Annotated[str, StringConstraints(strip_whitespace=True, max_length=254), AfterValidator(_check_email)]


class EnquiryCreate(BaseModel):
    type: EnquiryType
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
    email: Email
    # Company name, or college / university for students (optional)
    organization: Annotated[str, StringConstraints(strip_whitespace=True, max_length=150)] = ""
    message: Annotated[str, StringConstraints(strip_whitespace=True, min_length=10, max_length=3000)]
    # Honeypot: hidden on the page, so only bots fill it in. Never stored.
    website: str = Field(default="", max_length=200)


class EnquiryOut(BaseModel):
    id: str
    type: EnquiryType
    name: str
    email: str
    organization: str = ""
    message: str
    status: EnquiryStatus
    created_at: datetime


class EnquiryList(BaseModel):
    items: list[EnquiryOut]
    total: int
    new_count: int  # unread enquiries across the whole inbox, whatever the filter


class EnquiryStatusUpdate(BaseModel):
    status: EnquiryStatus


# ------------------------------------------------------- openings and applications

OpeningStatus = Literal["open", "closed"]
StudyYear = Literal["First year", "Second year", "Third year", "Fourth year", "Postgraduate", "Other"]
ApplicationStatus = Literal["new", "shortlisted", "declined"]


def _check_http_url(value: str) -> str:
    parsed = urlparse(value.strip())
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return value.strip()
    raise ValueError("must be a web address starting with http:// or https://")


HttpUrl = Annotated[str, StringConstraints(strip_whitespace=True, max_length=300), AfterValidator(_check_http_url)]
Line = Annotated[str, StringConstraints(strip_whitespace=True, max_length=80)]


class OpeningBase(BaseModel):
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=100)]
    # Team or vertical the role belongs to (optional): shown as a label and used for filtering
    group: Annotated[str, StringConstraints(strip_whitespace=True, max_length=60)] = ""
    summary: Annotated[str, StringConstraints(strip_whitespace=True, min_length=10, max_length=300)]
    description: Annotated[str, StringConstraints(strip_whitespace=True, max_length=5000)] = ""
    eligibility: Line = ""  # e.g. "First year students"
    commitment: Line = ""  # e.g. "Six to eight hours a week"
    duration: Line = ""  # e.g. "One academic year"
    order: int = Field(default=100, ge=0, le=10000)  # lower numbers are listed first
    status: OpeningStatus = "open"


class OpeningOut(OpeningBase):
    id: str
    created_at: datetime
    updated_at: datetime


class OpeningList(BaseModel):
    items: list[OpeningOut]


class OpeningManageOut(OpeningOut):
    applications: int = 0
    new_applications: int = 0


class OpeningManageList(BaseModel):
    items: list[OpeningManageOut]


class ApplicationCreate(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
    email: Email
    college: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=150)]
    year: StudyYear
    message: Annotated[str, StringConstraints(strip_whitespace=True, min_length=20, max_length=3000)]
    link: HttpUrl | None = None  # LinkedIn, résumé or portfolio (optional)
    website: str = Field(default="", max_length=200)  # honeypot: never stored


class ApplicationOut(BaseModel):
    id: str
    opening_id: str
    opening_title: str
    name: str
    email: str
    college: str
    year: StudyYear
    message: str
    link: str | None = None
    status: ApplicationStatus
    created_at: datetime


class ApplicationList(BaseModel):
    items: list[ApplicationOut]
    total: int
    new_count: int  # unread applications across all openings, whatever the filter


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus