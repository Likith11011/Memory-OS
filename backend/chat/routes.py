import os
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from  database import get_db
from auth.utils import get_current_user
from auth.models import User
from memories.models import Memory
from memories.embedder import get_search_embedding
from vector_store.chroma import search_chroma
from groq import Groq

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


class ChatRequest(BaseModel):
    message: str
    n_memories: int = 5


class ChatResponse(BaseModel):
    answer: str
    sources: list
    memories_used: int
    query: str


def get_groq_client():
    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Groq API key not configured.")
    try:
        return Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to initialize Groq: {str(e)}")


def build_system_prompt() -> str:
    return """You are MemoryOS, a highly intelligent personal AI assistant with access to the user's memory bank.

Your role:
- Answer questions accurately and completely using the provided memories
- Synthesize information from multiple memories when relevant
- Be specific and cite which memory you used (e.g. "Based on your note 'Title'...")
- If memories partially answer the question, share what you found and note what is missing
- Never fabricate information not present in the memories
- Give complete detailed answers, never cut off mid-sentence
- Use simple markdown: **bold** for emphasis, - for bullets, ## for headers
- Never use special Unicode characters or non-ASCII symbols
- Write in plain English with standard ASCII characters only
- Always complete your sentences fully before ending"""


def build_user_prompt(question: str, memories: list) -> str:
    if not memories:
        return question
    context_parts = []
    for i, mem in enumerate(memories, 1):
        context_parts.append(
            f"---\n"
            f"MEMORY {i}: {mem['title']}\n"
            f"Type: {mem['file_type']} | Relevance: {mem['similarity']:.1f}%\n"
            f"Content:\n{mem['content']}\n"
        )
    context = "\n".join(context_parts)
    return f"""Here are the relevant memories from my personal knowledge base:

{context}

---

Based on the memories above, please answer this question completely and thoroughly:

{question}

Important: Give a complete answer. Do not cut off. Mention the memory title when referencing it."""


@router.post("/", response_model=ChatResponse)
def chat_with_memories(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    message = request.message.strip()
    if len(message) > 1000:
        raise HTTPException(status_code=400, detail="Message too long")

    n_memories = max(1, min(10, request.n_memories))

    total = db.query(Memory).filter(Memory.user_id == current_user.id).count()
    if total == 0:
        return ChatResponse(
            answer="You have not uploaded any memories yet. Upload some notes, PDFs, or other content first!",
            sources=[], memories_used=0, query=message
        )

    try:
        query_embedding = get_search_embedding(message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process query: {str(e)}")

    relevant_memories = []

    try:
        n = min(n_memories, total)
        results = search_chroma(query_embedding, current_user.id, n_results=n)

        if results and results.get("ids") and results["ids"][0]:
            memory_ids = []
            distance_map = {}
            for i, meta in enumerate(results["metadatas"][0]):
                try:
                    if meta and "memory_id" in meta:
                        mid = meta["memory_id"]
                        memory_ids.append(mid)
                        distance_map[mid] = results["distances"][0][i]
                except (IndexError, KeyError, TypeError):
                    continue

            if memory_ids:
                db_memories = db.query(Memory).filter(
                    Memory.id.in_(memory_ids),
                    Memory.user_id == current_user.id
                ).all()
                memory_map = {m.id: m for m in db_memories}

                for mid in memory_ids:
                    memory = memory_map.get(mid)
                    if not memory:
                        continue
                    distance = distance_map[mid]
                    similarity = round((1 - distance / 2) * 100, 1)
                    similarity = max(0.0, min(100.0, similarity))
                    relevant_memories.append({
                        "id": memory.id,
                        "title": memory.title or "Untitled",
                        "content": (memory.content or "")[:3000],
                        "file_type": memory.file_type or "text",
                        "similarity": similarity,
                    })

    except Exception as e:
        logger.warning(f"Chat semantic search failed: {str(e)}")
        relevant_memories = []

    if not relevant_memories:
        try:
            keyword_results = db.query(Memory).filter(
                Memory.user_id == current_user.id,
                or_(
                    Memory.title.ilike(f"%{message}%"),
                    Memory.content.ilike(f"%{message}%"),
                    Memory.tags.ilike(f"%{message}%"),
                )
            ).limit(n_memories).all()
            for memory in keyword_results:
                relevant_memories.append({
                    "id": memory.id,
                    "title": memory.title or "Untitled",
                    "content": (memory.content or "")[:3000],
                    "file_type": memory.file_type or "text",
                    "similarity": 50.0,
                })
        except Exception as e:
            logger.warning(f"Chat keyword fallback failed: {str(e)}")

    if not relevant_memories:
        return ChatResponse(
            answer="I could not find any memories relevant to your question. Try uploading more content or rephrasing.",
            sources=[], memories_used=0, query=message
        )

    relevant_memories.sort(key=lambda x: x["similarity"], reverse=True)

    try:
        client = get_groq_client()
        response = client.chat.completions.create(
           model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": build_system_prompt()},
                {"role": "user", "content": build_user_prompt(message, relevant_memories)}
            ],
            temperature=0.2,
            max_tokens=2048,
            top_p=0.9,
        )
        if not response or not response.choices or not response.choices[0].message.content:
            raise ValueError("Empty response from Groq")
        answer = response.choices[0].message.content.strip()

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        if "quota" in error_msg or "rate" in error_msg or "429" in error_msg:
            try:
                client = get_groq_client()
                response = client.chat.completions.create(
                    model="openai/gpt-oss-20b",
                    messages=[
                        {"role": "system", "content": build_system_prompt()},
                        {"role": "user", "content": build_user_prompt(message, relevant_memories)}
                    ],
                    temperature=0.2,
                    max_tokens=1024,
                )
                answer = response.choices[0].message.content.strip()
            except Exception:
                raise HTTPException(status_code=429, detail="Rate limit reached. Please wait.")
        elif "api key" in error_msg or "401" in error_msg:
            raise HTTPException(status_code=503, detail="Invalid Groq API key.")
        else:
            raise HTTPException(status_code=500, detail=f"AI response failed: {str(e)}")

    sources = [
        {
            "id": m["id"],
            "title": m["title"],
            "file_type": m["file_type"],
            "similarity": m["similarity"],
            "content_preview": m["content"][:200] + "..." if len(m["content"]) > 200 else m["content"],
        }
        for m in relevant_memories
    ]

    return ChatResponse(
        answer=answer,
        sources=sources,
        memories_used=len(relevant_memories),
        query=message
    )


@router.get("/history")
def get_chat_history(current_user: User = Depends(get_current_user)):
    return {"history": [], "message": "Chat history coming soon"}