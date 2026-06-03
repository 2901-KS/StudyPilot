"use client";

import { useState } from "react";
import { explainTopic } from "@/lib/api";
import { markdownToHtml } from "@/lib/format";

export default function ExplainPage() {
  const [topic, setTopic] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExplain = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError("");
    setHtml("");

    try {
      const data = await explainTopic(topic, false);
      setHtml(markdownToHtml(data.explanation));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">ExplainIt</h1>

      <input
        type="text"
        placeholder="Enter a topic..."
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="w-full border rounded-lg p-3 bg-white text-black"
      />

      <button
        onClick={handleExplain}
        disabled={loading}
        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg"
      >
        {loading ? "Explaining..." : "Explain"}
      </button>

      {error && (
        <div className="mt-4 text-red-500">
          {error}
        </div>
      )}
      {html && (
        <div className="mt-6 border rounded-lg p-4 bg-white text-black"
    dangerouslySetInnerHTML={{ __html: html }}
        />
     )}
    </main>
  );
}