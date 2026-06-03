"use client";

import { useState } from "react";
import { generateQuiz } from "@/lib/api";

export default function QuizPage() {
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");

  const startQuiz = async () => {
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const data = await generateQuiz(file);
      setQuestions(data.quiz);
      setAnswers(new Array(data.quiz.length).fill(null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (idx: number) => {
    const updated = [...answers];
    updated[current] = idx;
    setAnswers(updated);
  };

  if (questions.length === 0) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-6">MindMapGenie</h1>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full border rounded-lg p-3 bg-white text-black"
        />

        <button
          onClick={startQuiz}
          disabled={!file || loading}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          {loading ? "Generating Quiz..." : "Generate Quiz"}
        </button>

        {error && (
          <div className="mt-4 text-red-500">
            {error}
          </div>
        )}
      </main>
    );
  }

  const q = questions[current];

  if (finished) {
    const score = answers.filter(
      (a, i) => a === questions[i].correctAnswer
    ).length;

    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-6">Quiz Results</h1>

        <div className="border rounded-lg p-6 bg-white text-black">
          <h2 className="text-2xl font-bold">
            Score: {score}/{questions.length}
          </h2>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Question {current + 1} / {questions.length}
      </h1>

      <div className="border rounded-lg p-6 bg-white text-black">
        <p className="font-bold mb-4">{q.question}</p>

        <div className="space-y-2">
          {q.options.map((opt: string, idx: number) => (
            <button
              key={idx}
              onClick={() => selectAnswer(idx)}
              className={`block w-full text-left border rounded p-3 ${
                answers[current] === idx
                  ? "bg-blue-100"
                  : ""
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setCurrent(current - 1)}
          disabled={current === 0}
          className="px-4 py-2 bg-gray-700 rounded"
        >
          Previous
        </button>

        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent(current + 1)}
            className="px-4 py-2 bg-blue-600 rounded"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => setFinished(true)}
            className="px-4 py-2 bg-green-600 rounded"
          >
            Finish Quiz
          </button>
        )}
      </div>
    </main>
  );
}