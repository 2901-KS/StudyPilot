"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateStudyPlan } from "@/lib/api";

export default function PlannerPage() {
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [hours, setHours] = useState("");
  const [weekdayHours, setWeekdayHours] = useState("5");
  const [weekendHours, setWeekendHours] = useState("8");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!subject || !deadline || !hours) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await generateStudyPlan({
        subjects: [
          {
            name: subject,
            min_hours_required: Number(hours),
            deadline,
          },
        ],
        weekday_hours: Number(weekdayHours),
        weekend_hours: Number(weekendHours),
        start_date: new Date().toISOString().split("T")[0],
      });

      if (!data.success) {
        setError(data.error || "Failed to generate plan");
        return;
      }

      sessionStorage.setItem(
        "studyPlanData",
        JSON.stringify({
          plan: data.plan,
          base_allocation: data.base_allocation,
          subjects: [
            {
              name: subject,
              importance: "medium",
              deadline,
              min_hours_required: Number(hours),
            },
          ],
          weekday_hours: Number(weekdayHours),
          weekend_hours: Number(weekendHours),
          timeSlot: "evening",
          generatedAt: new Date().toISOString(),
        })
      );

      router.push("/planner-result");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate study plan"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">AI Planner</h1>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border rounded-lg p-3 bg-white text-black"
        />

        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full border rounded-lg p-3 bg-white text-black"
        />

        <input
          type="number"
          placeholder="Required Hours"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="w-full border rounded-lg p-3 bg-white text-black"
        />

        <input
          type="number"
          placeholder="Weekday Study Hours"
          value={weekdayHours}
          onChange={(e) => setWeekdayHours(e.target.value)}
          className="w-full border rounded-lg p-3 bg-white text-black"
        />

        <input
          type="number"
          placeholder="Weekend Study Hours"
          value={weekendHours}
          onChange={(e) => setWeekendHours(e.target.value)}
          className="w-full border rounded-lg p-3 bg-white text-black"
        />

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg p-3"
        >
          {loading ? "Generating..." : "Generate Study Plan"}
        </button>

        {error && (
          <div className="text-red-500">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}