import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
IS_PRODUCTION = bool(os.getenv("RENDER", False))
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database import Base, engine
from auth.routes import router as auth_router
from memories.routes import router as memories_router
from chat.routes import router as chat_router
IS_PRODUCTION = bool(os.getenv("RENDER", False))
# ------------------------------
# Logging setup
# ------------------------------
for noisy in ["httpx","httpcore","sentence_transformers","huggingface_hub",
              "transformers","filelock","urllib3","chromadb","uvicorn.access"]:
    logging.getLogger(noisy).setLevel(logging.WARNING)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ------------------------------
# Environment variables
# ------------------------------
os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://memory-os-4pyc.vercel.app")

# ------------------------------
# Database initialization
# ------------------------------
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully")
except Exception as e:
    logger.error(f"Database initialization failed: {e}")

# ------------------------------
# FastAPI initialization
# ------------------------------
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="MemoryOS API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        FRONTEND_URL,
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------
# Routers
# ------------------------------
app.include_router(auth_router, prefix="/auth")
app.include_router(memories_router)
app.include_router(chat_router)

# ------------------------------
# Lazy-loaded embedding model
# ------------------------------
_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        try:
            from memories.embedder import model
            _embedding_model = model
            logger.info("Embedding model loaded")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise RuntimeError("Embedding model not available")
    return _embedding_model

# Example usage inside endpoint
# model = get_embedding_model()

# ------------------------------
# Startup event
# ------------------------------
@app.on_event("startup")
async def startup_event():
    logger.info("MemoryOS API starting...")
    if not IS_PRODUCTION:
        try:
            from memories.embedder import model
            logger.info("Embedding model ready")
        except Exception as e:
            logger.error(f"Model load failed: {e}")
    else:
        logger.info("Production mode: lightweight embeddings active")
    # Do NOT load model here to save memory

# ------------------------------
# Global exception handler
# ------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# ------------------------------
# Health & root endpoints
# ------------------------------
@app.get("/")
def root():
    return {"message": "MemoryOS API is running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}

# ------------------------------
# OpenAPI customization
# ------------------------------
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title="MemoryOS API",
        version="1.0.0",
        routes=app.routes,
    )
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    for path in schema["paths"].values():
        for method in path.values():
            method["security"] = [{"BearerAuth": []}]
    app.openapi_schema = schema
    return schema

app.openapi = custom_openapi