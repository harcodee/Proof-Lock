import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base
import models  # noqa: ensure models are registered before create_all

from routes.register import router as register_router
from routes.credential import router as credential_router
from routes.proof import router as proof_router
from routes.verify import router as verify_router

# Create all DB tables on startup
Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="Digital Identity Platform",
    description="Privacy-preserving digital identity verification using AI + Zero-Knowledge Proofs",
    version="1.0.0",
)

# CORS — allow frontend (port 5173) and any other origins in dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images as static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register all API routes under /api prefix
app.include_router(register_router, prefix="/api")
app.include_router(credential_router, prefix="/api")
app.include_router(proof_router, prefix="/api")
app.include_router(verify_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Digital Identity Platform API",
        "docs": "/docs",
        "version": "1.0.0",
    }

@app.get("/health")
def health():
    return {"status": "ok"}
