import os
import logging
import chromadb
from typing import List, Optional

logger = logging.getLogger(__name__)

IS_PRODUCTION = bool(os.getenv("RENDER", False))

try:
    if IS_PRODUCTION:
        client = chromadb.EphemeralClient()
        logger.info("ChromaDB running in ephemeral mode (production)")
    else:
        client = chromadb.PersistentClient(path="./chroma_db")
        logger.info("ChromaDB running in persistent mode (development)")

    collection = client.get_or_create_collection(
        name="memories",
        metadata={"hnsw:space": "cosine"}
    )
    logger.info("ChromaDB initialized successfully")
except Exception as e:
    raise RuntimeError(f"Failed to initialize ChromaDB: {str(e)}")


def add_to_chroma(chroma_id: str, embedding: List[float], metadata: dict) -> None:
    if not chroma_id or not embedding or not metadata:
        raise ValueError("Invalid parameters for ChromaDB add")
    clean_metadata = {
        "user_id": int(metadata["user_id"]),
        "memory_id": int(metadata["memory_id"]),
    }
    try:
        collection.add(
            ids=[chroma_id],
            embeddings=[embedding],
            metadatas=[clean_metadata]
        )
    except Exception as e:
        raise RuntimeError(f"ChromaDB add failed: {str(e)}")


def search_chroma(
    query_embedding: List[float],
    user_id: int,
    n_results: int = 10
) -> Optional[dict]:
    if not query_embedding or not user_id:
        return None
    try:
        total = collection.count()
        if total == 0:
            return None
        safe_n = max(1, min(n_results, total))
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=safe_n,
            where={"user_id": int(user_id)},
            include=["metadatas", "distances"]
        )
        return results
    except Exception as e:
        logger.warning(f"ChromaDB search failed: {str(e)}")
        return None


def delete_from_chroma(chroma_id: str) -> bool:
    if not chroma_id:
        return False
    try:
        collection.delete(ids=[chroma_id])
        return True
    except Exception as e:
        logger.warning(f"ChromaDB delete failed: {str(e)}")
        return False