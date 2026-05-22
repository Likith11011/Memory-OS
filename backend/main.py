import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from backend.database import Base, engine
from backend.auth.routes import router as auth_router
from backend.memories.routes import router as memories_router
from backend.chat.routes import router as chat_router

# -----------------------------
# Logging
# -----------------------------
for noisy in ["httpx","httpcore","sentence_transformers","huggingface_hub",
              "transformers","filelock","urllib3","chromadb","uvicorn.access"]:
    logging.getLogger(noisy).setLevel(logging.WARNING)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# -----------------------------
# Environment variables
# -----------------------------
os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000"
)

# -----------------------------
# FastAPI app
# -----------------------------
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="MemoryOS Lite API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        FRONTEND_URL,
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Include routers
# -----------------------------
app.include_router(auth_router, prefix="/auth")
app.include_router(memories_router)
app.include_router(chat_router)

# -----------------------------
# Lazy-loaded embedding model
# -----------------------------
_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        try:
            from backend.memories.embedder import model
            _embedding_model = model
            logger.info("Embedding model loaded")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise RuntimeError("Embedding model not available")
    return _embedding_model

# -----------------------------
# Database
# -----------------------------
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully")
except Exception as e:
    logger.error(f"Database initialization failed: {e}")

# -----------------------------
# Startup event
# -----------------------------
@app.on_event("startup")
async def startup_event():
    logger.info("MemoryOS API starting...")
    if os.getenv("IS_PRODUCTION") == "true":
        logger.info("Production mode: lightweight embeddings active")
    else:
        try:
            from backend.memories.embedder import model
            logger.info("Embedding model ready (dev)")
        except Exception as e:
            logger.error(f"Model load failed: {e}")

# -----------------------------
# Global exception handler
# -----------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# -----------------------------
# Health check
# -----------------------------
@app.get("/")
def root():
    return {"message": "MemoryOS API is running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}