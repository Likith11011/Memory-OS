import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from memories.models import Memory
from config import settings

logger = logging.getLogger(__name__)


def get_memory_insights(user_id: int, db: Session) -> dict:
    memories = db.query(Memory).filter(Memory.user_id == user_id).all()

    if not memories:
        return {
            "total": 0, "by_type": {}, "by_category": {},
            "by_language": {}, "uploads_per_day": {},
            "most_used_tags": [], "review_stats": {},
            "knowledge_growth": [],
        }

    # By file type
    by_type = {}
    for m in memories:
        ft = m.file_type or "text"
        by_type[ft] = by_type.get(ft, 0) + 1

    # By category
    by_category = {}
    for m in memories:
        cat = m.memory_category or "general"
        by_category[cat] = by_category.get(cat, 0) + 1

    # By language (code)
    by_language = {}
    for m in memories:
        if m.language:
            by_language[m.language] = by_language.get(m.language, 0) + 1

    # Uploads per day (last 30 days)
    uploads_per_day = {}
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    for m in memories:
        if m.created_at and m.created_at >= cutoff:
            day = m.created_at.strftime("%Y-%m-%d")
            uploads_per_day[day] = uploads_per_day.get(day, 0) + 1

    # Tag frequency
    tag_freq = {}
    for m in memories:
        if m.tags:
            for tag in m.tags.split(","):
                tag = tag.strip().lower()
                if tag:
                    tag_freq[tag] = tag_freq.get(tag, 0) + 1
    most_used_tags = sorted(tag_freq.items(), key=lambda x: x[1], reverse=True)[:15]

    # Review stats
    reviewed = [m for m in memories if (m.review_count or 0) > 0]
    review_stats = {
        "total_reviewed": len(reviewed),
        "never_reviewed": len(memories) - len(reviewed),
        "avg_review_count": round(
            sum(m.review_count or 0 for m in memories) / len(memories), 1
        ),
        "most_reviewed": sorted(
            memories, key=lambda x: x.review_count or 0, reverse=True
        )[:3],
    }

    # Knowledge growth (cumulative by week)
    sorted_memories = sorted(memories, key=lambda x: x.created_at)
    growth = []
    count = 0
    current_week = None
    for m in sorted_memories:
        week = m.created_at.strftime("%Y-W%W")
        if week != current_week:
            if current_week:
                growth.append({"week": current_week, "total": count})
            current_week = week
        count += 1
    if current_week:
        growth.append({"week": current_week, "total": count})

    return {
        "total": len(memories),
        "by_type": by_type,
        "by_category": by_category,
        "by_language": by_language,
        "uploads_per_day": uploads_per_day,
        "most_used_tags": [{"tag": t, "count": c} for t, c in most_used_tags],
        "review_stats": {
            "total_reviewed": review_stats["total_reviewed"],
            "never_reviewed": review_stats["never_reviewed"],
            "avg_review_count": review_stats["avg_review_count"],
        },
        "knowledge_growth": growth,
    }


def get_weekly_summary(user_id: int, db: Session) -> dict:
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    recent = db.query(Memory).filter(
        Memory.user_id == user_id,
        Memory.created_at >= cutoff,
    ).order_by(Memory.created_at.desc()).all()

    if not recent:
        return {
            "summary": "You haven't uploaded any memories this week. Start by uploading your notes, PDFs, or code snippets.",
            "count": 0, "topics": [], "suggested_review": [],
        }

    content_blob = "\n\n".join(
        f"Title: {m.title}\nCategory: {m.memory_category}\nContent: {(m.content or '')[:300]}"
        for m in recent[:10]
    )

    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{
                "role": "user",
                "content": f"""Analyze these memories uploaded this week and write a brief weekly learning summary.

{content_blob}

Write in this exact format:
SUMMARY: [2-3 sentence summary of what was learned this week]
TOPICS: [comma separated list of main topics covered]
INSIGHT: [one actionable insight or suggestion for next week]

Be specific, encouraging, and concise."""
            }],
            temperature=0.4,
            max_tokens=300,
        )
        raw = response.choices[0].message.content.strip()

        summary = ""
        topics = []
        insight = ""
        for line in raw.split("\n"):
            if line.startswith("SUMMARY:"):
                summary = line.replace("SUMMARY:", "").strip()
            elif line.startswith("TOPICS:"):
                topics = [t.strip() for t in line.replace("TOPICS:", "").split(",") if t.strip()]
            elif line.startswith("INSIGHT:"):
                insight = line.replace("INSIGHT:", "").strip()

    except Exception as e:
        logger.warning(f"Weekly summary generation failed: {e}")
        summary = f"You uploaded {len(recent)} memories this week covering various topics."
        topics = list(set(m.memory_category for m in recent))
        insight = "Keep uploading consistently to build your knowledge base."

    # Suggest memories not reviewed in 7+ days
    stale_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    suggested = db.query(Memory).filter(
        Memory.user_id == user_id,
        Memory.memory_category == "exam",
    ).filter(
        (Memory.last_reviewed == None) |
        (Memory.last_reviewed < stale_cutoff)
    ).order_by(Memory.created_at.asc()).limit(3).all()

    return {
        "summary": summary,
        "insight": insight,
        "count": len(recent),
        "topics": topics,
        "suggested_review": [
            {"id": m.id, "title": m.title, "subject": m.subject or ""}
            for m in suggested
        ],
    }


def generate_quiz(memory_id: int, user_id: int, db: Session) -> dict:
    memory = db.query(Memory).filter(
        Memory.id == memory_id,
        Memory.user_id == user_id,
    ).first()

    if not memory:
        return {"error": "Memory not found"}

    try:
        from groq import Groq
        import json
        client = Groq(api_key=settings.GROQ_API_KEY)

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{
                "role": "user",
                "content": f"""Generate 5 multiple choice questions based on this content.

Title: {memory.title}
Content: {(memory.content or '')[:2000]}

Return ONLY a valid JSON array. No other text. Format:
[
  {{
    "question": "question text here",
    "options": {{"A": "option1", "B": "option2", "C": "option3", "D": "option4"}},
    "correct": "A",
    "explanation": "brief explanation why this is correct"
  }}
]

Make questions test understanding, not just memorization. Vary difficulty."""
            }],
            temperature=0.4,
            max_tokens=1500,
        )

        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()

        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start != -1 and end > start:
            raw = raw[start:end]

        questions = json.loads(raw)

        return {
            "memory_id": memory_id,
            "memory_title": memory.title,
            "questions": questions,
            "total": len(questions),
        }

    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        return {"error": f"Quiz generation failed: {str(e)}"}


def check_duplicate(content: str, user_id: int, db: Session, threshold: float = 0.92) -> dict:
    try:
        from memories.embedder import get_embedding
        from vector_store.chroma import search_chroma

        embedding = get_embedding(content[:2000])
        results = search_chroma(embedding, user_id, n_results=3)

        if not results or not results.get("ids") or not results["ids"][0]:
            return {"is_duplicate": False, "similar_memories": []}

        similar = []
        for i, meta in enumerate(results["metadatas"][0]):
            distance = results["distances"][0][i]
            similarity = round((1 - distance / 2) * 100, 1)

            if similarity >= threshold * 100:
                memory = db.query(Memory).filter(
                    Memory.id == meta.get("memory_id"),
                    Memory.user_id == user_id,
                ).first()
                if memory:
                    similar.append({
                        "id": memory.id,
                        "title": memory.title,
                        "similarity": similarity,
                        "created_at": str(memory.created_at),
                    })

        return {
            "is_duplicate": len(similar) > 0,
            "similar_memories": similar,
        }

    except Exception as e:
        logger.warning(f"Duplicate check failed: {e}")
        return {"is_duplicate": False, "similar_memories": []}