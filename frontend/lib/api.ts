// lib/api.ts — all backend communication lives here

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Subject {
  name: string
  importance: "high" | "medium" | "low"
  deadline: string
  min_hours_required: number
}

export interface StudyPlanRequest {
  subjects: { name: string; min_hours_required: number; deadline: string }[]
  weekday_hours: number
  weekend_hours: number
  start_date: string
}

export interface PlannerResponse {
  success: boolean
  plan?: string
  base_allocation?: Record<string, Record<string, number>[]>
  error?: string
  details?: {
    subject: string
    required_hours: number
    available_hours: number
    shortage: number
  }
}

export interface Flashcard {
  question: string
  answer: string
}

export interface QuizQuestion {
  question: string
  options: [string, string, string, string]
  correctAnswer: number
}

// ── Helper ────────────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init)
  if (!res.ok) {
    let msg = `Server error ${res.status}`
    try {
      const body = await res.json()
      msg = body.detail ?? msg
    } catch {}
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

// ── Endpoints ─────────────────────────────────────────────────────────────────
export async function explainTopic(topic: string, detailed = false) {
  return apiFetch<{ explanation: string }>(
    detailed ? "/api/explain/detailed" : "/api/explain",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    }
  )
}

export async function summarizePdf(file: File) {
  const fd = new FormData()
  fd.append("pdf", file)
  return apiFetch<{ summary: string }>("/api/summarize", { method: "POST", body: fd })
}

export async function generateFlashcards(file: File) {
  const fd = new FormData()
  fd.append("pdf", file)
  return apiFetch<{ flashcards: Flashcard[] }>("/api/flashcards", { method: "POST", body: fd })
}

export async function generateQuiz(file: File) {
  const fd = new FormData()
  fd.append("pdf", file)
  return apiFetch<{ quiz: QuizQuestion[] }>("/api/quiz", { method: "POST", body: fd })
}

export async function generateStudyPlan(payload: StudyPlanRequest) {
  return apiFetch<PlannerResponse>("/api/planner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}
