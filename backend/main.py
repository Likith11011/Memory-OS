import os
import logging

for noisy in ["httpx","httpcore","sentence_transformers","huggingface_hub",
               "transformers","filelock","urllib3","chromadb","uvicorn.access"]:
    logging.getLogger(noisy).setLevel(logging.WARNING)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

IS_PRODUCTION = bool(os.getenv("RENDER", False))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from database import Base, engine
from auth.routes import router as auth_router
from memories.routes import router as memories_router
from chat.routes import router as chat_router

try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully")
except Exception as e:
    logger.error(f"Database init failed: {e}")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="MemoryOS API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://memory-os-4pyc.vercel.app",
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")
app.include_router(memories_router)
app.include_router(chat_router)

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

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("MemoryOS API shutting down...")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

@app.get("/")
def root():
    return {"message": "MemoryOS API is running", "version": "1.0.0", "status": "healthy"}

@app.get("/health")
def health():
    return {"status": "ok", "production": IS_PRODUCTION}

@app.get("/ping")
def ping():
    return "pong"

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