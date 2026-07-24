import logging
import os

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {
    "en": "English", "hi": "Hindi", "kn": "Kannada",
    "ta": "Tamil", "te": "Telugu", "ml": "Malayalam",
    "mr": "Marathi", "bn": "Bengali", "gu": "Gujarati",
    "fr": "French", "de": "German", "es": "Spanish",
    "zh": "Chinese", "ja": "Japanese", "ar": "Arabic",
}

IS_PRODUCTION = bool(os.getenv("RENDER", False))

if not IS_PRODUCTION:
    try:
        from langdetect import detect as _detect_lang
        HAS_LANGDETECT = True
    except ImportError:
        HAS_LANGDETECT = False
else:
    HAS_LANGDETECT = False


def detect_content_language(text: str) -> str:
    if not text or len(text.strip()) < 20:
        return "en"

    if not HAS_LANGDETECT:
        return _heuristic_detect(text)

    try:
        lang = _detect_lang(text[:500])
        return lang if lang in SUPPORTED_LANGUAGES else "en"
    except Exception:
        return _heuristic_detect(text)


def _heuristic_detect(text: str) -> str:
    sample = text[:200]
    devanagari = sum(1 for c in sample if "\u0900" <= c <= "\u097F")
    kannada = sum(1 for c in sample if "\u0C80" <= c <= "\u0CFF")
    tamil = sum(1 for c in sample if "\u0B80" <= c <= "\u0BFF")
    telugu = sum(1 for c in sample if "\u0C00" <= c <= "\u0C7F")

    if devanagari > 10:
        return "hi"
    if kannada > 10:
        return "kn"
    if tamil > 10:
        return "ta"
    if telugu > 10:
        return "te"

    return "en"


def get_multilingual_embedding(text: str, lang: str = "en"):
    IS_PROD = bool(os.getenv("RENDER", False))

    if IS_PROD:
        from memories.embedder import _get_fallback_embedding
        return _get_fallback_embedding(text)

    if lang == "en":
        from memories.embedder import get_embedding
        return get_embedding(text)

    try:
        from sentence_transformers import SentenceTransformer
        _MULTILANG_MODEL = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
        embedding = _MULTILANG_MODEL.encode(
            text[:5000],
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embedding.tolist()
    except Exception:
        from memories.embedder import get_embedding
        return get_embedding(text)