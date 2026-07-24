import logging
from sqlalchemy.orm import Session
from memories.models import Memory
from vector_store.chroma import search_chroma
from memories.embedder import get_embedding

logger = logging.getLogger(__name__)


def get_memory_graph(user_id: int, db: Session, similarity_threshold: float = 0.75) -> dict:
    memories = db.query(Memory).filter(
        Memory.user_id == user_id
    ).order_by(Memory.created_at.desc()).limit(50).all()

    if not memories:
        return {"nodes": [], "edges": []}

    category_colors = {
        "general": "#6366f1",
        "code": "#10b981",
        "research": "#3b82f6",
        "exam": "#f59e0b",
        "project": "#8b5cf6",
    }

    nodes = []
    for m in memories:
        nodes.append({
            "id": m.id,
            "title": m.title or "Untitled",
            "category": m.memory_category or "general",
            "file_type": m.file_type or "text",
            "color": category_colors.get(m.memory_category or "general", "#6366f1"),
            "tags": m.tags or "",
            "created_at": str(m.created_at),
        })

    # Find edges by comparing embeddings
    edges = []
    seen_pairs = set()

    for memory in memories[:30]:
        try:
            embedding = get_embedding((memory.content or "")[:500])
            results = search_chroma(embedding, user_id, n_results=6)

            if not results or not results.get("ids") or not results["ids"][0]:
                continue

            for i, meta in enumerate(results["metadatas"][0]):
                if not meta or "memory_id" not in meta:
                    continue

                other_id = meta["memory_id"]
                if other_id == memory.id:
                    continue

                distance = results["distances"][0][i]
                similarity = round((1 - distance / 2) * 100, 1)

                if similarity < similarity_threshold * 100:
                    continue

                pair = tuple(sorted([memory.id, other_id]))
                if pair in seen_pairs:
                    continue
                seen_pairs.add(pair)

                edges.append({
                    "source": memory.id,
                    "target": other_id,
                    "similarity": similarity,
                    "strength": min(1.0, (similarity - 70) / 30),
                })

        except Exception as e:
            logger.warning(f"Graph edge computation failed for memory {memory.id}: {e}")
            continue

    return {"nodes": nodes, "edges": edges}