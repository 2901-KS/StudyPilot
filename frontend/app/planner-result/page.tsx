"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { markdownToHtml } from "@/lib/format";

export default function PlannerResultPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("studyPlanData");

    if (!saved) {
      router.push("/planner");
      return;
    }

    setData(JSON.parse(saved));
  }, [router]);

  if (!data) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold">Loading...</h1>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">Your Study Plan</h1>

      <div className="mb-6 border rounded-lg p-4 bg-white text-black">
        <h2 className="text-xl font-bold mb-2">Subjects</h2>

        {data.subjects?.map((s: any, i: number) => (
          <div key={i} className="mb-2">
            <strong>{s.name}</strong> — {s.min_hours_required}h
          </div>
        ))}
      </div>

      <div
        className="border rounded-lg p-4 bg-white text-black"
        dangerouslySetInnerHTML={{
          __html: markdownToHtml(data.plan || ""),
        }}
      />
    </main>
  );
}