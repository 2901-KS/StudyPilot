from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv
from typing import Optional, List
import os
import io
import PyPDF2
from groq import Groq
import json
from datetime import datetime, timedelta
import uvicorn
import logging

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("studypilot")

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="StudyPilot API",
    description="AI-Powered Study Companion Backend",
    version="3.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS — restrict to your frontend domain in production ─────────────────────
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001"   # dev defaults
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Groq client ───────────────────────────────────────────────────────────────
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
print("KEY STARTS WITH:", GROQ_API_KEY[:12] if GROQ_API_KEY else "NONE")
if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY not set — AI features will fail!")
else:
    logger.info("Groq API key loaded from environment.")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

MAX_PDF_SIZE_MB = 15
MAX_PDF_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024
ALLOWED_MIME = "application/pdf"
PDF_MAGIC = b"%PDF"

# ── Models ────────────────────────────────────────────────────────────────────
class ExplainRequest(BaseModel):
    topic: str

    @field_validator("topic")
    def topic_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("topic cannot be empty")
        if len(v) > 500:
            raise ValueError("topic too long (max 500 chars)")
        return v


class Subject(BaseModel):
    name: str
    min_hours_required: float
    deadline: str  # YYYY-MM-DD

    @field_validator("name")
    def name_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("subject name cannot be empty")
        return v

    @field_validator("min_hours_required")
    def hours_positive(cls, v):
        if v <= 0:
            raise ValueError("hours must be positive")
        return v

    @field_validator("deadline")
    def valid_deadline(cls, v):
        try:
            d = datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("deadline must be YYYY-MM-DD")
        if d.date() < datetime.now().date():
            raise ValueError("deadline cannot be in the past")
        return v


class StudyPlanRequest(BaseModel):
    subjects: List[Subject]
    weekday_hours: float
    weekend_hours: float
    start_date: Optional[str] = None

    @field_validator("subjects")
    def at_least_one_subject(cls, v):
        if not v:
            raise ValueError("at least one subject required")
        if len(v) > 20:
            raise ValueError("max 20 subjects")
        return v

    @field_validator("weekday_hours", "weekend_hours")
    def hours_in_range(cls, v):
        if v < 0.5 or v > 16:
            raise ValueError("daily hours must be between 0.5 and 16")
        return v


# ── Helpers ───────────────────────────────────────────────────────────────────
def validate_pdf(content: bytes, filename: str) -> None:
    if len(content) > MAX_PDF_BYTES:
        raise HTTPException(400, f"PDF exceeds {MAX_PDF_SIZE_MB} MB limit")
    if not content.startswith(PDF_MAGIC):
        raise HTTPException(400, "File is not a valid PDF (magic bytes check failed)")
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only .pdf files are accepted")


def extract_text_from_pdf(content: bytes) -> str:
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = "\n".join(
            page.extract_text() or "" for page in reader.pages
        ).strip()
        if not text:
            raise HTTPException(400, "No extractable text found in PDF")
        return text
    except HTTPException:
        raise
    except Exception as e:
        logger.error("PDF extraction error: %s", e)
        raise HTTPException(400, "Could not read PDF — it may be scanned or encrypted")


async def call_groq(prompt: str, system: str = "", max_tokens: int = 3000) -> str:
    if not client:
        raise HTTPException(503, "AI service not configured — GROQ_API_KEY missing")
    try:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.7,
            max_tokens=max_tokens,
        )
        return resp.choices[0].message.content
    except Exception as e:
        logger.error("Groq error: %s", e)
        raise HTTPException(502, "AI service temporarily unavailable — please try again")


def extract_json(text: str):
    import re
    m = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
    if not m:
        raise ValueError("No JSON found in AI response")
    return json.loads(m.group(0))


def hours_available(start: datetime, end: datetime, wd: float, we: float) -> float:
    total = 0.0
    cur = start
    while cur <= end:
        total += we if cur.weekday() >= 5 else wd
        cur += timedelta(days=1)
    return total


# ── A* Scheduler ─────────────────────────────────────────────────────────────
def a_star_allocate(subjects, weekday_hours, weekend_hours, start_date):
    schedule = {}
    hours_left = {s.name: s.min_hours_required for s in subjects}
    deadlines = {s.name: datetime.strptime(s.deadline, "%Y-%m-%d") for s in subjects}
    final_deadline = max(deadlines.values())
    cur = start_date

    while cur <= final_deadline:
        daily_limit = weekend_hours if cur.weekday() >= 5 else weekday_hours
        urgency = {
            name: hours_left[name] / max(1, (deadlines[name] - cur).days)
            for name in hours_left
            if hours_left[name] > 0 and cur <= deadlines[name]
        }
        if not urgency:
            cur += timedelta(days=1)
            continue

        top = sorted(urgency.items(), key=lambda x: x[1], reverse=True)[:2]
        total_u = sum(s for _, s in top)
        day_plan = []

        for name, score in top:
            share = (score / total_u) * daily_limit if total_u else daily_limit / len(top)
            alloc = round(min(hours_left[name], share), 2)
            if alloc > 0:
                day_plan.append({name: float(alloc)})
                hours_left[name] -= alloc

        if day_plan:
            schedule[cur.strftime("%Y-%m-%d")] = day_plan
        cur += timedelta(days=1)

    return schedule


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "StudyPilot API v1", "docs": "/docs"}


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": "3.0.0",
        "ai": "configured" if client else "missing",
    }


# ExplainIt
@app.post("/api/explain")
@limiter.limit("20/minute")
async def explain(request: Request, body: ExplainRequest):
    result = await call_groq(
        f"Explain this topic clearly for a student: {body.topic}",
        "You are a helpful educational assistant. Be clear and concise.",
    )
    return {"explanation": result}


@app.post("/api/explain/detailed")
@limiter.limit("10/minute")
async def explain_detailed(request: Request, body: ExplainRequest):
    result = await call_groq(
        f"Give a detailed explanation with examples and real-world applications: {body.topic}",
        "You are an expert educator. Use examples, analogies, and structured sections.",
        max_tokens=4000,
    )
    return {"explanation": result}


# NoteSynth
@app.post("/api/summarize")
@limiter.limit("10/minute")
async def summarize(request: Request, pdf: UploadFile = File(...)):
    content = await pdf.read()
    validate_pdf(content, pdf.filename)
    text = extract_text_from_pdf(content)[:15000]
    result = await call_groq(
        f"Summarize this study material into clear, concise bullet-point notes:\n\n{text}",
        "You are an expert at creating concise, complete study notes.",
    )
    return {"summary": result}


# FlashForge+
@app.post("/api/flashcards")
@limiter.limit("10/minute")
async def flashcards(request: Request, pdf: UploadFile = File(...)):
    content = await pdf.read()
    validate_pdf(content, pdf.filename)
    text = extract_text_from_pdf(content)[:15000]
    try:
        raw = await call_groq(
            f"""Create 10-15 flashcards from this text covering the most important concepts.
Return ONLY a valid JSON array, no other text:
[{{"question": "What is X?", "answer": "X is..."}}]

Text:
{text}""",
        )
        cards = extract_json(raw)
        validated = [
            c for c in cards
            if isinstance(c, dict) and "question" in c and "answer" in c
            and isinstance(c["question"], str) and isinstance(c["answer"], str)
        ]
        if not validated:
            raise ValueError("No valid flashcards parsed")
        return {"flashcards": validated}
    except Exception as e:
        logger.error("Flashcard generation failed: %s", e)
        raise HTTPException(500, "Failed to generate flashcards — please try a different PDF")


# MindMapGenie
@app.post("/api/quiz")
@limiter.limit("10/minute")
async def quiz(request: Request, pdf: UploadFile = File(...)):
    content = await pdf.read()
    validate_pdf(content, pdf.filename)
    text = extract_text_from_pdf(content)[:15000]
    try:
        raw = await call_groq(
            f"""Create exactly 10 multiple-choice questions from this text.
Return ONLY a valid JSON array, no other text:
[{{"question": "What is X?", "options": ["A","B","C","D"], "correctAnswer": 0}}]

Text:
{text}""",
        )
        questions = extract_json(raw)
        validated = [
            q for q in questions
            if isinstance(q, dict)
            and "question" in q and "options" in q and "correctAnswer" in q
            and len(q["options"]) == 4
            and isinstance(q["correctAnswer"], int)
            and 0 <= q["correctAnswer"] <= 3
        ]
        if not validated:
            raise ValueError("No valid questions parsed")
        return {"quiz": validated}
    except Exception as e:
        logger.error("Quiz generation failed: %s", e)
        raise HTTPException(500, "Failed to generate quiz — please try a different PDF")


# Study Planner
@app.post("/api/planner")
@limiter.limit("5/minute")
async def planner(request: Request, body: StudyPlanRequest):
    try:
        start = datetime.strptime(body.start_date, "%Y-%m-%d") if body.start_date else datetime.now()

        # Feasibility check
        for subj in body.subjects:
            deadline = datetime.strptime(subj.deadline, "%Y-%m-%d")
            avail = hours_available(start, deadline, body.weekday_hours, body.weekend_hours)
            if subj.min_hours_required > avail:
                return {
                    "success": False,
                    "error": f"Not enough time for '{subj.name}'",
                    "details": {
                        "subject": subj.name,
                        "required_hours": subj.min_hours_required,
                        "available_hours": round(avail, 1),
                        "shortage": round(subj.min_hours_required - avail, 1),
                    },
                }

        base_schedule = a_star_allocate(
            body.subjects, body.weekday_hours, body.weekend_hours, start
        )

        plan = await call_groq(
            f"""Expand this hour allocation into a detailed human-friendly timetable.
Include specific time blocks (e.g. 9:00–11:00), short breaks, and activity labels
(Core Concepts, Practice Problems, Revision, etc).
Do not schedule any subject past its individual deadline.
Each day must mix at least 2 subjects where possible.

Allocation:
{json.dumps(base_schedule, indent=2)}""",
            "You are an expert academic study planner.",
            max_tokens=4000,
        )

        return {
            "success": True,
            "plan": plan,
            "base_allocation": base_schedule,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Planner error: %s", e)
        raise HTTPException(500, "Study plan generation failed")


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
