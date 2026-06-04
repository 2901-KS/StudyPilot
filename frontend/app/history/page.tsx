"use client";

import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("studyPlanHistory") || "[]"
    );

    setPlans(saved);
  }, []);

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">
        📚 Study Plan History
      </h1>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white text-black rounded-xl p-4 shadow"
          >
            <h2 className="font-bold text-xl">
              Plan #{plan.id}
            </h2>

            <p className="text-gray-500">
              {plan.createdAt}
            </p>

            <div className="mt-2">
              {plan.subjects?.map(
                (s: any, idx: number) => (
                  <span
                    key={idx}
                    className="mr-2"
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