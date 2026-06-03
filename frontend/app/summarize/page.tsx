"use client";

import { useState } from "react";
import { summarizePdf } from "@/lib/api";
import { markdownToHtml } from "@/lib/format";

export default function SummarizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSummarize = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setHtml("");

    try {
      const data = await summarizePdf(file);
      setHtml(markdownToHtml(data.summary));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to summarize");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">NoteSynth</h1>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full border rounded-lg p-3 bg-white text-black"
      />

      <button
        onClick={handleSummarize}
        disabled={!file || loading}
        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg"
      >
        {loading ? "Summarizing..." : "Summarize PDF"}
      </button>

      {error && (
        <div className="mt-4 text-red-500">
          {error}
        </div>
      )}

      {html && (
        <div
          className="mt-6 border rounded-lg p-4 bg-white text-black"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </main>
  );
}