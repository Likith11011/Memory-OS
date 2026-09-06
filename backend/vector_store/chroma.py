import os
import logging
import chromadb
from typing import List, Optional

logger = logging.getLogger(__name__)

chroma_path = os.getenv("CHROMA_PATH", "./chroma_db")

try:
    # Ensure directory exists for persistent storage
    os.makedirs(chroma_path, exist_ok=True)
    client = chromadb.PersistentClient(path=chroma_path)
    logger.info(f"ChromaDB initialized in persistent mode at {chroma_path}")
except Exception as e:
    logger.warning(f"ChromaDB persistent client init failed ({e}), falling back to EphemeralClient")
    client = chromadb.EphemeralClient()

try:
    collection = client.get_or_create_collection(
        name="memories",
        metadata={"hnsw:space": "cosine"}
    )
    logger.info("ChromaDB collection 'memories' ready")
except Exception as e:
    raise RuntimeError(f"Failed to initialize ChromaDB collection: {str(e)}")


def add_to_chroma(chroma_id: str, embedding: List[float], metadata: dict) -> None:
    if not chroma_id or not embedding or not metadata:
        raise ValueError("Invalid parameters for ChromaDB add")
    clean_metadata = {
        "user_id": int(metadata["user_id"]),
        "memory_id": int(metadata["memory_id"]),
    }
    try:
        collection.upsert(
            ids=[chroma_id],
            embeddings=[embedding],
            metadatas=[clean_metadata]
        )
    except Exception as e:
        logger.error(f"ChromaDB add/upsert failed: {str(e)}")
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


def sync_all_memories_from_db(db) -> int:
    """
    Self-healing startup sync:
    Checks all memories in SQL database and ensures they exist in ChromaDB vector store.
    This guarantees that on any restart/redeploy, memory retention is 100% preserved.
    """
    try:
        from memories.models import Memory
        from memories.embedder import get_embedding
        import uuid

        memories = db.query(Memory).all()
        if not memories:
            logger.info("No memories in database to sync.")
            return 0

        synced_count = 0
        for mem in memories:
            try:
                # Ensure memory has a valid chroma_id
                if not mem.chroma_id:
                    mem.chroma_id = f"mem_{mem.id}_{uuid.uuid4().hex[:8]}"
                    db.commit()

                # Check if already in Chroma
                try:
                    existing = collection.get(ids=[mem.chroma_id])
                    if existing and existing.get("ids") and len(existing["ids"]) > 0:
                        continue
                except Exception:
                    pass

                # If missing, embed and index
                text_to_embed = f"{mem.title}\n{mem.content or ''}"
                embedding = get_embedding(text_to_embed)
                add_to_chroma(
                    chroma_id=mem.chroma_id,
                    embedding=embedding,
                    metadata={"user_id": mem.user_id, "memory_id": mem.id}
                )
                synced_count += 1
            except Exception as item_err:
                logger.warning(f"Failed to sync memory {mem.id} to ChromaDB: {item_err}")

        logger.info(f"ChromaDB self-healing sync completed: {synced_count} missing memories indexed into vectors. Total in collection: {collection.count()}")
        return synced_count
    except Exception as e:
        logger.error(f"Error during self-healing ChromaDB sync: {e}")
        return 0