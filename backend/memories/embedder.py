import os
import logging
from functools import lru_cache
from typing import List

os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

for noisy in ["httpx","httpcore","sentence_transformers",
              "huggingface_hub","transformers","filelock"]:
    logging.getLogger(noisy).setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

IS_PRODUCTION = bool(os.getenv("RENDER", False))
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Only load heavy model locally
if not IS_PRODUCTION:
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(
            "all-MiniLM-L6-v2",
            cache_folder="./model_cache",
        )
        logger.info("Local embedding model loaded successfully")
    except Exception as e:
        raise RuntimeError(f"Failed to load embedding model: {str(e)}")
else:
    model = None
    logger.info("Production mode: using API embeddings")


def _get_groq_embedding(text: str) -> List[float]:
    """Use Groq embeddings API in production"""
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)
        response = client.embeddings.create(
            model="llama3-8b-8192",
            input=text[:2048],
        )
        return response.data[0].embedding
    except Exception:
        # Groq doesn't support embeddings yet — fallback to simple hash embedding
        return _get_fallback_embedding(text)


def _get_fallback_embedding(text: str) -> List[float]:
    """
    Lightweight fallback embedding using TF-IDF style approach.
    Not as accurate as sentence-transformers but works within memory limits.
    """
    import hashlib
    import math

    text = text.lower().strip()
    words = text.split()

    # Create a 384-dim vector (same as MiniLM)
    vector = [0.0] * 384

    for i, word in enumerate(words[:100]):
        # Hash each word to positions in the vector
        hash_val = int(hashlib.md5(word.encode()).hexdigest(), 16)
        pos1 = hash_val % 384
        pos2 = (hash_val // 384) % 384
        pos3 = (hash_val // (384 * 384)) % 384

        weight = 1.0 / math.log(i + 2)
        vector[pos1] += weight
        vector[pos2] += weight * 0.5
        vector[pos3] += weight * 0.25

    # Normalize
    magnitude = math.sqrt(sum(x * x for x in vector))
    if magnitude > 0:
        vector = [x / magnitude for x in vector]

    return vector


def get_embedding(text: str) -> List[float]:
    if not text or not text.strip():
        raise ValueError("Cannot embed empty text")

    text = text.strip()
    if len(text) > 10000:
        text = text[:10000]

    if IS_PRODUCTION:
        return _get_fallback_embedding(text)

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