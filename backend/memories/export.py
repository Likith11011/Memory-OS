import io
import json
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from memories.models import Memory

logger = logging.getLogger(__name__)


def export_as_json(user_id: int, db: Session) -> bytes:
    memories = db.query(Memory).filter(
        Memory.user_id == user_id
    ).order_by(Memory.created_at.desc()).all()

    data = {
        "export_date": datetime.now(timezone.utc).isoformat(),
        "total_memories": len(memories),
        "memories": [
            {
                "id": m.id,
                "title": m.title,
                "content": m.content,
                "file_type": m.file_type,
                "tags": m.tags,
                "memory_category": m.memory_category,
                "language": m.language,
                "project_status": m.project_status,
                "difficulty": m.difficulty,
                "subject": m.subject,
                "review_count": m.review_count,
                "created_at": str(m.created_at),
            }
            for m in memories
        ],
    }
    return json.dumps(data, indent=2, default=str).encode("utf-8")


def export_as_markdown(user_id: int, db: Session) -> bytes:
    memories = db.query(Memory).filter(
        Memory.user_id == user_id
    ).order_by(Memory.memory_category, Memory.created_at.desc()).all()

    lines = [
        "# MemoryOS Export",
        f"> Exported on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        f"> Total memories: {len(memories)}",
        "",
        "---",
        "",
    ]

    current_category = None
    for m in memories:
        cat = m.memory_category or "general"
        if cat != current_category:
            current_category = cat
            lines.append(f"## {cat.upper()}")
            lines.append("")

        lines.append(f"### {m.title or 'Untitled'}")
        lines.append(f"**Type:** {m.file_type or 'text'}  ")
        if m.tags:
            lines.append(f"**Tags:** {m.tags}  ")
        if m.subject:
            lines.append(f"**Subject:** {m.subject}  ")
        if m.difficulty:
            lines.append(f"**Difficulty:** {m.difficulty}  ")
        lines.append(f"**Date:** {str(m.created_at)[:10]}  ")
        lines.append("")
        lines.append(m.content or "")
        lines.append("")
        lines.append("---")
        lines.append("")

    return "\n".join(lines).encode("utf-8")