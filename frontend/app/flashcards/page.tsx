"use client";

import { useState } from "react";
import { generateFlashcards } from "@/lib/api";

export default function FlashcardsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [cards, setCards] = useState<{ question: string; answer: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setCards([]);

    try {
      const data = await generateFlashcards(file);
      setCards(data.flashcards);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate flashcards");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">FlashForge+</h1>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full border rounded-lg p-3 bg-white text-black"
      />

      <button
        onClick={handleGenerate}
        disabled={!file || loading}
        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg"
      >
        {loading ? "Generating..." : "Generate Flashcards"}
      </button>

      {error && (
        <div className="mt-4 text-red-500">
          {error}
        </div>
      )}

      {cards.length > 0 && (
        <div className="mt-6 space-y-4">
          {cards.map((card, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 bg-white text-black"
            >
              <p className="font-bold mb-2">
                Q{index + 1}. {card.question}
              </p>
              <p>{card.answer}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}