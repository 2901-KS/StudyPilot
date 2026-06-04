"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateStudyPlan } from "@/lib/api";

export default function PlannerPage() {
  const router = useRouter();

  const [subjects, setSubjects] = useState([
    {
      name: "",
      deadline: "",
      min_hours_required: "",
      importance: "medium",
    },
  ]);

  const [weekdayHours, setWeekdayHours] = useState("5");
  const [weekendHours, setWeekendHours] = useState("8");
  const [subjectsPerDay, setSubjectsPerDay] = useState("2");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addSubject = () => {
    setSubjects([
      ...subjects,
      {
        name: "",
        deadline: "",
        min_hours_required: "",
        importance: "medium",
      },
    ]);
  };


  const updateSubject = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...subjects];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSubjects(updated);
  };
  const removeSubject = (index: number) => {
  setSubjects(
    subjects.filter((_, i) => i !== index)
  );
};

  const handleGenerate = async () => {
    const validSubjects = subjects.filter(
      (s) =>
        s.name.trim() &&
        s.deadline &&
        s.min_hours_required
    );

    if (validSubjects.length === 0) {
      setError("Please add at least one subject.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payloadSubjects = validSubjects.map((s) => ({
        name: s.name,
        deadline: s.deadline,
        importance: s.importance,
        min_hours_required: Number(s.min_hours_required),
      }));

      const data = await generateStudyPlan({
        subjects: payloadSubjects,
        weekday_hours: Number(weekdayHours),
        weekend_hours: Number(weekendHours),
        subjects_per_day: Number(subjectsPerDay),
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
          subjects: payloadSubjects,
          weekday_hours: Number(weekdayHours),
          weekend_hours: Number(weekendHours),
          generatedAt: new Date().toISOString(),
        })
      );
      const existingPlans = JSON.parse(
  localStorage.getItem("studyPlanHistory") || "[]"
);

existingPlans.unshift({
  id: Date.now(),
  createdAt: new Date().toLocaleString(),
  subjects,
  plan: data.plan,
  allocation: data.base_allocation,
});

localStorage.setItem(
  "studyPlanHistory",
  JSON.stringify(existingPlans)
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
      <h1 className="text-4xl font-bold mb-6">
        AI Planner
      </h1>

      <div className="space-y-6">

        {subjects.map((subject, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
  <h2 className="font-semibold">
    Subject {index + 1}
  </h2>

  {subjects.length > 1 && (
    <button
      onClick={() => removeSubject(index)}
      className="text-red-500 font-medium hover:text-red-700"
    >
      Remove
    </button>
  )}
</div>

            <input
              type="text"
              placeholder="Subject Name"
              value={subject.name}
              onChange={(e) =>
                updateSubject(
                  index,
                  "name",
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3 bg-white text-black"
            />

            <input
              type="date"
              value={subject.deadline}
              onChange={(e) =>
                updateSubject(
                  index,
                  "deadline",
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3 bg-white text-black"
            />

            <input
              type="number"
              placeholder="Required Hours"
              value={subject.min_hours_required}
              onChange={(e) =>
                updateSubject(
                  index,
                  "min_hours_required",
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3 bg-white text-black"
            />

            <select
              value={subject.importance}
              onChange={(e) =>
                updateSubject(
                  index,
                  "importance",
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3 bg-white text-black"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        ))}

        <button
          onClick={addSubject}
          className="w-full bg-gray-700 text-white rounded-lg p-3"
        >
          + Add Another Subject
        </button>

        <input
          type="number"
          placeholder="Weekday Study Hours"
          value={weekdayHours}
          onChange={(e) =>
            setWeekdayHours(e.target.value)
          }
          className="w-full border rounded-lg p-3 bg-white text-black"
        />

        <input
          type="number"
          placeholder="Weekend Study Hours"
          value={weekendHours}
          onChange={(e) =>
            setWeekendHours(e.target.value)
          }
          className="w-full border rounded-lg p-3 bg-white text-black"
        />
        <select
  value={subjectsPerDay}
  onChange={(e) =>
    setSubjectsPerDay(e.target.value)
  }
  className="w-full border rounded-lg p-3 bg-white text-black"
>
  <option value="1">1 Subject Per Day</option>
  <option value="2">2 Subjects Per Day</option>
  <option value="3">3 Subjects Per Day</option>
  <option value="4">4 Subjects Per Day</option>
  <option value="5">5 Subjects Per Day</option>
</select>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg p-3"
        >
          {loading
            ? "Generating..."
            : "Generate Study Plan"}
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