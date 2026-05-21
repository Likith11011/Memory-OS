import os
import logging
from functools import lru_cache
from typing import List

os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

for noisy in ["httpx","httpcore","sentence_transformers","huggingface_hub","transformers","filelock"]:
    logging.getLogger(noisy).setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

HF_TOKEN = os.getenv("HF_TOKEN", "")
if HF_TOKEN:
    os.environ["HF_TOKEN"] = HF_TOKEN
    os.environ["HUGGINGFACE_TOKEN"] = HF_TOKEN

from sentence_transformers import SentenceTransformer

try:
    model = SentenceTransformer(
        "all-MiniLM-L6-v2",
        cache_folder="./model_cache",
    )
    logger.info("Embedding model loaded successfully")
except Exception as e:
    raise RuntimeError(f"Failed to load embedding model: {str(e)}")


def get_embedding(text: str) -> List[float]:
    if not text or not text.strip():
        raise ValueError("Cannot embed empty text")
    text = text.strip()
    if len(text) > 10000:
        text = text[:10000]
    try:
        embedding = model.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        result = embedding.tolist()
        if not result or len(result) == 0:
            raise ValueError("Embedding model returned empty vector")
        return result
    except ValueError:
        raise
    except Exception as e:
        raise RuntimeError(f"Embedding generation failed: {str(e)}")


@lru_cache(maxsize=200)
def get_cached_embedding(text: str) -> tuple:
    return tuple(get_embedding(text))


def get_search_embedding(text: str) -> List[float]:
    try:
        return list(get_cached_embedding(text.strip()[:500]))
    except Exception:
        return get_embedding(text)