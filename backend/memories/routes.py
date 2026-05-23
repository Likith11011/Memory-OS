import uuid
import logging
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from auth.utils import get_current_user
from auth.models import User
from memories.models import Memory
from memories.extractor import extract_text, detect_language
from memories.embedder import get_embedding, get_search_embedding
from vector_store.chroma import add_to_chroma, search_chroma, delete_from_chroma
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/memories", tags=["memories"])

ALLOWED_FILE_TYPES = [
    "text", "pdf", "docx", "pptx", "image",
    "url", "txt", "md", "code"
]
IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "bmp", "tiff"]
CODE_EXTENSIONS = [
    "py", "js", "ts", "jsx", "tsx", "java", "cpp", "c",
    "cs", "go", "rs", "rb", "php", "swift", "kt", "sql",
    "sh", "html", "css", "json", "yaml", "r"
]


def format_memory(memory: Memory, similarity: Optional[float] = None) -> dict:
    return {
        "id": memory.id,
        "title": memory.title or "Untitled",
        "content": (memory.content or "")[:300],
        "file_type": memory.file_type or "text",
        "tags": memory.tags or "",
        "created_at": memory.created_at,
        "similarity": similarity,
        "memory_category": memory.memory_category or "general",
        "language": memory.language or "",
        "project_status": memory.project_status or "",
        "difficulty": memory.difficulty or "",
        "subject": memory.subject or "",
        "explanation": getattr(memory, "explanation", "") or "",
        "review_count": memory.review_count or 0,
        "last_reviewed": memory.last_reviewed,
    }


def generate_tags_with_groq(
    title: str, file_type: str, content: str, category: str = "general"
) -> str:
    try:
        from groq import Groq
        if not settings.GROQ_API_KEY:
            return ""
        groq_client = Groq(api_key=settings.GROQ_API_KEY)
        category_hints = {
            "code": "This is a code snippet.",
            "research": "This is a research document.",
            "exam": "This is exam study material.",
            "project": "This is a project idea.",
            "general": "This is a general memory.",
        }
        tag_prompt = f"""Generate 3-5 short relevant tags for this memory.

{category_hints.get(category, category_hints["general"])}
Title: {title}
Type: {file_type}
Content preview: {content[:500]}

Rules:
- Tags must be single words or short phrases (max 2 words)
- Include abbreviations if relevant
- Return ONLY comma-separated tags, nothing else

Tags:"""
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": tag_prompt}],
            temperature=0.2,
            max_tokens=80,
        )
        if not response.choices or not response.choices[0].message.content:
            return ""
        raw = response.choices[0].message.content.strip().split("\n")[0]
        tag_list = [t.strip().lower() for t in raw.split(",") if t.strip()]
        tag_list = [t for t in tag_list if 0 < len(t) <= 30][:5]
        return ", ".join(tag_list)
    except Exception as e:
        logger.warning(f"Tag generation failed: {str(e)}")
        return ""


def generate_explanation_with_groq(
    title: str, content: str, difficulty: str
) -> str:
    try:
        from groq import Groq
        if not settings.GROQ_API_KEY or not difficulty:
            return ""
        groq_client = Groq(api_key=settings.GROQ_API_KEY)
        style_map = {
            "easy": "Explain in very simple layman terms.",
            "medium": "Explain at undergraduate level.",
            "hard": "Explain at advanced textbook level.",
        }
        prompt = f"""Generate a concise explanation for this study material.

Title: {title}
Content: {content[:1000]}
Style: {style_map.get(difficulty, style_map["medium"])}

Generate a clear explanation in 3-5 sentences. Start directly.

Explanation:"""
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=200,
        )
        if not response.choices or not response.choices[0].message.content:
            return ""
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"Explanation generation failed: {str(e)}")
        return ""


def process_memory_async(
    memory_id: int, title: str, file_type: str,
    content: str, category: str, difficulty: str,
    db_url: str
):
    try:
        from database import SessionLocal
        db = SessionLocal()
        memory = db.query(Memory).filter(Memory.id == memory_id).first()
        if not memory:
            return

        tags = generate_tags_with_groq(title, file_type, content, category)

        extra_tags = []
        if category == "code" and memory.language:
            extra_tags.append(memory.language)
        if category == "exam" and memory.subject:
            extra_tags.append(memory.subject.lower())
        if category in ["project", "research"]:
            extra_tags.append(category)

        if extra_tags:
            existing = [t.strip() for t in tags.split(",") if t.strip()]
            for et in extra_tags:
                if et not in existing:
                    existing.append(et)
            tags = ", ".join(existing[:6])

        memory.tags = tags

        if category == "exam" and difficulty:
            explanation = generate_explanation_with_groq(title, content, difficulty)
            if hasattr(memory, "explanation"):
                memory.explanation = explanation

        db.commit()
        logger.info(f"Background processing complete for memory {memory_id}")
        db.close()
    except Exception as e:
        logger.error(f"Background processing failed for memory {memory_id}: {str(e)}")


@router.post("/upload")
def upload_memory(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    file_type: str = Form("text"),
    file: UploadFile = File(None),
    text_content: str = Form(None),
    url_content: str = Form(None),
    memory_category: str = Form("general"),
    language: str = Form(""),
    project_status: str = Form(""),
    difficulty: str = Form(""),
    subject: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not title or not title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")

    title = title.strip()
    file_type = file_type.strip().lower()
    memory_category = memory_category.strip().lower() or "general"

    # Block youtube explicitly
    if file_type == "youtube":
        raise HTTPException(
            status_code=400,
            detail="YouTube upload is not supported. Use URL type for web articles instead."
        )

    if file_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_type}")

    content = ""
    detected_language = language.strip().lower()

    try:
        if file_type == "url":
            url = url_content or (text_content or "").strip()
            if not url:
                raise HTTPException(status_code=400, detail="URL cannot be empty")
            # Block YouTube URLs in URL type too
            if "youtube.com" in url or "youtu.be" in url:
                raise HTTPException(
                    status_code=400,
                    detail="YouTube URLs are not supported. Please use a regular webpage URL."
                )
            content = extract_text(b"", "url", url=url)

        elif file_type == "text":
            if not text_content or not text_content.strip():
                raise HTTPException(status_code=400, detail="Text content cannot be empty")
            content = text_content.strip()

        elif file_type == "code":
            if text_content and text_content.strip():
                content = text_content.strip()
                if not detected_language:
                    detected_language = detect_language(content)
            elif file:
                file_bytes = file.file.read()
                if not file_bytes:
                    raise HTTPException(status_code=400, detail="Code file is empty")
                filename = file.filename or ""
                content = extract_text(file_bytes, "code")
                if not detected_language:
                    detected_language = detect_language(content, filename)
            else:
                raise HTTPException(status_code=400, detail="No code content provided")
            content = f"Language: {detected_language}\n\n{content}"
            memory_category = "code"

        elif file_type in ["pdf", "docx", "pptx"] + IMAGE_EXTENSIONS + ["image"]:
            if not file:
                raise HTTPException(status_code=400, detail=f"File is required for {file_type}")
            file_bytes = file.file.read()
            if not file_bytes:
                raise HTTPException(status_code=400, detail="Uploaded file is empty")
            if len(file_bytes) > 20 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="File must be under 20MB")

            actual_type = file_type
            if file and file.filename:
                ext = file.filename.rsplit(".", 1)[-1].lower()
                if ext in IMAGE_EXTENSIONS:
                    actual_type = "image"
                elif ext == "docx":
                    actual_type = "docx"
                elif ext == "pptx":
                    actual_type = "pptx"
                elif ext == "pdf":
                    actual_type = "pdf"
                elif ext in CODE_EXTENSIONS:
                    actual_type = "code"
                    file_type = "code"
                    memory_category = "code"

            content = extract_text(file_bytes, actual_type)

            if actual_type == "pdf" and memory_category == "general":
                research_keywords = [
                    "abstract", "introduction", "methodology",
                    "conclusion", "references", "doi", "arxiv", "journal"
                ]
                content_lower = content.lower()
                if sum(1 for kw in research_keywords if kw in content_lower) >= 3:
                    memory_category = "research"

        elif file_type in ["txt", "md", "markdown"]:
            if file:
                file_bytes = file.file.read()
                content = extract_text(file_bytes, "text")
            elif text_content:
                content = text_content.strip()
            else:
                raise HTTPException(status_code=400, detail="No content provided")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported type: {file_type}")

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Content extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

    if not content or not content.strip():
        raise HTTPException(status_code=422, detail="Could not extract any text")

    if len(content) > 100000:
        content = content[:100000]

    try:
        embedding = get_embedding(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

    chroma_id = str(uuid.uuid4())

    try:
        memory = Memory(
            user_id=current_user.id,
            title=title,
            content=content[:5000],
            file_type=file_type,
            chroma_id=chroma_id,
            tags="",
            memory_category=memory_category,
            language=detected_language,
            project_status=project_status.strip().lower() or "idea",
            difficulty=difficulty.strip().lower(),
            subject=subject.strip(),
            review_count=0,
        )
        if hasattr(Memory, "explanation"):
            memory.explanation = ""
        db.add(memory)
        db.commit()
        db.refresh(memory)
        logger.info(f"Memory {memory.id} saved for user {current_user.id}")
    except Exception as e:
        db.rollback()
        logger.error(f"DB save failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database save failed: {str(e)}")

    try:
        add_to_chroma(
            chroma_id=chroma_id,
            embedding=embedding,
            metadata={"user_id": current_user.id, "memory_id": memory.id},
        )
    except Exception as e:
        db.delete(memory)
        db.commit()
        logger.error(f"ChromaDB save failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Vector store failed: {str(e)}")

    background_tasks.add_task(
        process_memory_async,
        memory.id, title, file_type, content,
        memory_category, difficulty, settings.DATABASE_URL
    )

    return {
        "message": "Memory uploaded successfully",
        "id": memory.id,
        "category": memory_category,
    }


@router.get("/search")
def search_memories(
    q: str,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not q or not q.strip():
        return {"results": [], "search_type": "none"}

    q = q.strip()

    if len(q) > 500:
        raise HTTPException(status_code=400, detail="Query too long")

    base_query = db.query(Memory).filter(Memory.user_id == current_user.id)
    if category:
        base_query = base_query.filter(Memory.memory_category == category)

    total_memories = base_query.count()
    if total_memories == 0:
        return {"results": [], "search_type": "none"}

    memories = []
    search_type = "semantic"
    is_short_query = len(q.split()) <= 1 and len(q) <= 4

    try:
        query_embedding = get_search_embedding(q)
        n = min(10, total_memories)
        results = search_chroma(query_embedding, current_user.id, n_results=n)

        if results and results.get("ids") and results["ids"][0]:
            distances = results["distances"][0]

            if distances:
                best_distance = min(distances)

                if is_short_query:
                    threshold = min(best_distance + 0.2, 0.5)
                elif len(q.split()) == 2:
                    threshold = min(best_distance + 0.3, 0.7)
                elif best_distance < 0.2:
                    threshold = best_distance + 0.35
                elif best_distance < 0.4:
                    threshold = best_distance + 0.3
                elif best_distance < 0.6:
                    threshold = best_distance + 0.2
                else:
                    threshold = min(best_distance + 0.1, 0.75)

                memory_ids = []
                distance_map = {}
                for i, meta in enumerate(results["metadatas"][0]):
                    try:
                        if meta and "memory_id" in meta:
                            mid = meta["memory_id"]
                            dist = distances[i]
                            if dist <= threshold:
                                memory_ids.append(mid)
                                distance_map[mid] = dist
                    except (IndexError, KeyError, TypeError):
                        continue

                if memory_ids:
                    db_memories = db.query(Memory).filter(
                        Memory.id.in_(memory_ids),
                        Memory.user_id == current_user.id,
                    ).all()
                    memory_map = {m.id: m for m in db_memories}

                    for mid in memory_ids:
                        memory = memory_map.get(mid)
                        if not memory:
                            continue
                        if category and memory.memory_category != category:
                            continue
                        distance = distance_map[mid]
                        similarity = round((1 - distance / 2) * 100, 1)
                        similarity = max(0.0, min(100.0, similarity))
                        memories.append(format_memory(memory, similarity))

    except Exception as e:
        logger.warning(f"Semantic search failed: {str(e)}")
        memories = []

    try:
        seen_ids = {m["id"] for m in memories}
        keyword_added = 0

        if is_short_query:
            filter_conditions = [
                Memory.title.ilike(f"%{q}%"),
                Memory.tags.ilike(f"%{q}%"),
            ]
        else:
            filter_conditions = [
                Memory.title.ilike(f"%{q}%"),
                Memory.content.ilike(f"%{q}%"),
                Memory.tags.ilike(f"%{q}%"),
            ]

        kw_query = db.query(Memory).filter(
            Memory.user_id == current_user.id,
            or_(*filter_conditions),
        )
        if category:
            kw_query = kw_query.filter(Memory.memory_category == category)

        keyword_results = kw_query.order_by(Memory.created_at.desc()).limit(5).all()

        for memory in keyword_results:
            if memory.id not in seen_ids:
                memories.append(format_memory(memory, None))
                keyword_added += 1
                seen_ids.add(memory.id)

        if memories and keyword_added > 0:
            search_type = "hybrid"
        elif not memories and keyword_results:
            search_type = "keyword"

    except Exception as e:
        logger.warning(f"Keyword search failed: {str(e)}")

    if not memories and len(q) <= 5 and q.isupper():
        try:
            abbr_results = db.query(Memory).filter(
                Memory.user_id == current_user.id,
                or_(
                    Memory.title.ilike(f"%{q}%"),
                    Memory.tags.ilike(f"%{q}%"),
                )
            ).limit(5).all()
            seen_ids = {m["id"] for m in memories}
            for memory in abbr_results:
                if memory.id not in seen_ids:
                    memories.append(format_memory(memory, None))
            if memories:
                search_type = "keyword"
        except Exception as e:
            logger.warning(f"Abbreviation search failed: {str(e)}")

    memories.sort(
        key=lambda x: x["similarity"] if x["similarity"] is not None else -1,
        reverse=True,
    )

    seen = set()
    unique_memories = []
    for m in memories:
        if m["id"] not in seen:
            seen.add(m["id"])
            unique_memories.append(m)

    return {"results": unique_memories, "search_type": search_type}


@router.get("/")
def list_memories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        memories = db.query(Memory).filter(
            Memory.user_id == current_user.id
        ).order_by(Memory.created_at.desc()).all()
        return {"memories": [format_memory(m) for m in memories]}
    except Exception as e:
        logger.error(f"List memories failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch memories")


@router.delete("/{memory_id}")
def delete_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not memory_id or memory_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid memory ID")

    memory = db.query(Memory).filter(
        Memory.id == memory_id,
        Memory.user_id == current_user.id,
    ).first()

    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    if memory.chroma_id:
        delete_from_chroma(memory.chroma_id)

    try:
        db.delete(memory)
        db.commit()
        logger.info(f"Memory {memory_id} deleted")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

    return {"message": "Memory deleted successfully"}


@router.get("/category/{category}")
def get_by_category(
    category: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    valid_categories = ["general", "code", "research", "exam", "project"]
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail="Invalid category")

    memories = db.query(Memory).filter(
        Memory.user_id == current_user.id,
        Memory.memory_category == category,
    ).order_by(Memory.created_at.desc()).all()

    return {"memories": [format_memory(m) for m in memories], "category": category}


@router.get("/exam/revision")
def get_exam_revision(
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Memory).filter(
        Memory.user_id == current_user.id,
        Memory.memory_category == "exam",
    )
    if subject:
        query = query.filter(Memory.subject.ilike(f"%{subject}%"))

    memories = query.order_by(
        Memory.last_reviewed.asc().nullsfirst(),
        Memory.review_count.asc(),
        Memory.created_at.desc(),
    ).all()

    return {"memories": [format_memory(m) for m in memories]}


@router.get("/projects/all")
def get_projects(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Memory).filter(
        Memory.user_id == current_user.id,
        Memory.memory_category == "project",
    )
    if status:
        query = query.filter(Memory.project_status == status)

    memories = query.order_by(Memory.created_at.desc()).all()
    return {"memories": [format_memory(m) for m in memories]}


@router.post("/{memory_id}/review")
def mark_reviewed(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memory = db.query(Memory).filter(
        Memory.id == memory_id,
        Memory.user_id == current_user.id,
    ).first()

    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    memory.last_reviewed = datetime.now(timezone.utc)
    memory.review_count = (memory.review_count or 0) + 1
    db.commit()

    return {"message": "Marked as reviewed", "review_count": memory.review_count}


@router.patch("/{memory_id}/project-status")
def update_project_status(
    memory_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    valid_statuses = ["idea", "in-progress", "done", "abandoned"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    memory = db.query(Memory).filter(
        Memory.id == memory_id,
        Memory.user_id == current_user.id,
    ).first()

    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    memory.project_status = status
    db.commit()
    return {"message": "Status updated", "status": status}


@router.get("/{memory_id}")
def get_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not memory_id or memory_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid memory ID")

    memory = db.query(Memory).filter(
        Memory.id == memory_id,
        Memory.user_id == current_user.id,
    ).first()

    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    return format_memory(memory)