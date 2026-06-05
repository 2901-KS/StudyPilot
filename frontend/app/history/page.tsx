"use client";

import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const deletePlan = (id: number) => {
  const updatedPlans = plans.filter(
    (plan) => plan.id !== id
  );

  setPlans(updatedPlans);

  localStorage.setItem(
    "studyPlanHistory",
    JSON.stringify(updatedPlans)
  );
};

  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("studyPlanHistory") || "[]"
    );

    setPlans(saved);
  }, []);
 ;
 const getProgress = (plan: any) => {
  const savedProgress = JSON.parse(
    localStorage.getItem(
      `progress_${plan.id}`
    ) || "{}"
  );

  const savedTasks = JSON.parse(
    localStorage.getItem(
      `tasks_${plan.id}`
    ) || "{}"
  );

  let completedHours = 0;
  let requiredHours = 0;

  let totalTasks = 0;
  let completedTasks = 0;

  plan.subjects?.forEach((s: any) => {

    completedHours +=
      savedProgress[s.name] || 0;

    requiredHours +=
      Number(
        s.min_hours_required
      );

    const subjectTasks =
      savedTasks[s.name] || [];

    totalTasks +=
      subjectTasks.length;

    completedTasks +=
      subjectTasks.filter(
        (t: any) => t.done
      ).length;
  });

  const hoursPercent =
    requiredHours === 0
      ? 0
      : (
          completedHours /
          requiredHours
        ) * 100;

  const taskPercent =
    totalTasks === 0
      ? 0
      : (
          completedTasks /
          totalTasks
        ) * 100;

  return Math.round(
    (hoursPercent +
      taskPercent) / 2
  );
};

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">
        📚 Study Plan History
      </h1>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div
  key={plan.id}
  onClick={() => {
    sessionStorage.setItem(
      "studyPlanData",
      JSON.stringify(plan)
    );

    window.location.href =
      "/planner-result";
  }}
  className="bg-white text-black rounded-xl p-4 shadow cursor-pointer hover:shadow-lg transition"
>
            <div className="flex justify-between items-start">
  <h2 className="font-bold text-xl">
    {plan.subjects
      ?.map((s: any) => s.name)
      .join(", ")}
  </h2>

  <div className="flex gap-2">

  <button
    onClick={(e) => {
      e.stopPropagation();

      sessionStorage.setItem(
        "currentProgressPlan",
        JSON.stringify(plan)
      );

      window.location.href =
        "/progress";
    }}
    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
  >
    Progress
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation();

      if (
        confirm(
          "Delete this study plan?"
        )
      )
        deletePlan(plan.id);
    }}
    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
  >
    Delete
  </button>

  </div>
</div>

            <p className="text-gray-500">
              {plan.createdAt}
            </p>
            <div className="mt-3">

  <p className="font-semibold mb-2">
    Progress: {getProgress(plan)}%
  </p>

  <div className="w-full bg-gray-200 rounded-full h-3">
    <div
      className="bg-green-500 h-3 rounded-full"
      style={{
        width: `${getProgress(plan)}%`,
      }}
    />
  </div>

</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {plan.subjects?.map(
                (s: any, idx: number) => (
                 <span
  key={idx}
  className="px-2 py-1 bg-gray-200 rounded text-sm"
>
  {s.name}
</span> 
                )
            
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}