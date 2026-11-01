import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pymongo import AsyncMongoClient

from .config import get_settings
from .routers import applications, auth, enquiries, openings, projects, uploads

logger = logging.getLogger("tfqx")
settings = get_settings()
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = AsyncMongoClient(settings.mongodb_uri, tz_aware=True, serverSelectionTimeoutMS=5000)
    try:
        await client.admin.command("ping")
    except Exception:
        logger.error(
            "Could not connect to MongoDB. Check MONGODB_URI, and that your current IP "
            "address is allowed under Network Access in MongoDB Atlas."
        )
        raise
    app.state.db = client[settings.mongodb_db]
    await app.state.db.projects.create_index([("featured", -1), ("created_at", -1)])
    await app.state.db.projects.create_index([("views", -1), ("created_at", -1)])
    await app.state.db.projects.create_index("category")
    await app.state.db.projects.create_index("author_type")
    await app.state.db.enquiries.create_index([("created_at", -1)])
    await app.state.db.enquiries.create_index("status")
    await app.state.db.openings.create_index([("status", 1), ("order", 1), ("created_at", 1)])
    # One application per email per position, enforced by the database itself
    await app.state.db.applications.create_index([("opening_id", 1), ("email", 1)], unique=True)
    await app.state.db.applications.create_index([("created_at", -1)])
    await app.state.db.applications.create_index("status")
    yield
    await client.close()


app = FastAPI(title="TFQX API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def nosniff(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(enquiries.router)
app.include_router(openings.router)
app.include_router(applications.router)
app.include_router(uploads.router)
app.mount("/files", StaticFiles(directory=settings.upload_dir), name="files")


@app.get("/api/health")
async def health():
    return {"status": "ok"}