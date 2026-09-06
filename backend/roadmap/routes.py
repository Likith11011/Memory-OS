import logging
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from auth.utils import get_current_user
from auth.models import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/roadmap", tags=["roadmap"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


class RoadmapRequest(BaseModel):
    job_title: str
    experience_level: str = "fresher"  # fresher, junior, mid, senior


class RoadmapResponse(BaseModel):
    job_title: str
    experience_level: str
    overview: str
    phases: list
    timeline: str
    resources: list
    salary_range: str


@router.post("/generate", response_model=RoadmapResponse)
def generate_roadmap(
    request: RoadmapRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not request.job_title or not request.job_title.strip():
        raise HTTPException(status_code=400, detail="Job title cannot be empty")

    if len(request.job_title) > 100:
        raise HTTPException(status_code=400, detail="Job title too long")

    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Groq API key not configured")

    try:
        from groq import Groq
        import json

        client = Groq(api_key=GROQ_API_KEY)

        prompt = f"""You are a career guidance expert. Generate a detailed learning roadmap for someone who wants to become a {request.job_title} at the {request.experience_level} level.

Return ONLY a valid JSON object. No other text. No markdown. No backticks. Use this exact format:

{{
  "overview": "2-3 sentence description of this career path and why it is valuable",
  "timeline": "e.g. 6-8 months for a fresher",
  "salary_range": "e.g. 4-8 LPA for fresher in India",
  "phases": [
    {{
      "phase": 1,
      "title": "Phase title",
      "duration": "e.g. 4-6 weeks",
      "description": "What this phase covers",
      "topics": [
        {{
          "name": "Topic name",
          "importance": "high/medium/low",
          "description": "Why this topic matters for the role",
          "subtopics": ["subtopic1", "subtopic2", "subtopic3"]
        }}
      ]
    }}
  ],
  "resources": [
    {{
      "title": "Resource name",
      "type": "course/book/platform/youtube",
      "description": "Why this resource",
      "free": true
    }}
  ]
}}

Make it practical, specific, and realistic for the Indian job market at {request.experience_level} level.
Include 3-4 phases with 3-4 topics each.
Include 5-6 resources."""

        response = client.chat.completions.create(
            model="qwen-qwq-32b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=3000,
        )

        raw = response.choices[0].message.content.strip()

        # Clean JSON
        raw = raw.replace("```json", "").replace("```", "").strip()
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            raw = raw[start:end]

        data = json.loads(raw)

        return RoadmapResponse(
            job_title=request.job_title,
            experience_level=request.experience_level,
            overview=data.get("overview", ""),
            phases=data.get("phases", []),
            timeline=data.get("timeline", ""),
            resources=data.get("resources", []),
            salary_range=data.get("salary_range", ""),
        )

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error in roadmap: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse roadmap. Try again.")
    except Exception as e:
        logger.error(f"Roadmap generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")


@router.get("/popular-jobs")
def get_popular_jobs(current_user: User = Depends(get_current_user)):
    """Return popular job titles for suggestions"""
    return {
        "jobs": [
            "Machine Learning Engineer",
            "Backend Developer",
            "Full Stack Developer",
            "Data Scientist",
            "Data Analyst",
            "DevOps Engineer",
            "Frontend Developer",
            "AI Research Engineer",
            "Cloud Engineer",
            "Cybersecurity Analyst",
            "Product Manager",
            "Android Developer",
            "iOS Developer",
            "Blockchain Developer",
            "MLOps Engineer",
        ]
    }