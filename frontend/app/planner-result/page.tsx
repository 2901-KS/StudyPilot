"use client";
import jsPDF from "jspdf";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { markdownToHtml } from "@/lib/format";

export default function PlannerResultPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [showPlan, setShowPlan] = useState(false);
  const downloadPdf = () => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("StudyPilot Study Plan", 20, 20);

  doc.setFontSize(12);

  let y = 35;

  data.subjects?.forEach((s: any) => {
    doc.text(
      `${s.name} | ${s.importance} | ${s.min_hours_required}h`,
      20,
      y
    );
    y += 8;
  });

  y += 10;

  const lines = doc.splitTextToSize(
    data.plan || "",
    170
  );

  doc.text(lines, 20, y);

  doc.save("study-plan.pdf");
};

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
      <div className="mb-6">
  <button
    onClick={downloadPdf}
    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
  >
    📄 Download PDF
  </button>
</div>
      <div className="grid md:grid-cols-4 gap-4 mb-8">

  <div className="bg-gradient-to-br from-white to-gray-100 text-black rounded-xl p-4 shadow-lg hover:shadow-xl transition-all">
    <p className="text-sm text-gray-500">
      Subjects
    </p>
    <p className="text-3xl font-bold">
      {data.subjects?.length || 0}
    </p>
  </div>

  <div className="bg-gradient-to-br from-white to-gray-100 text-black rounded-xl p-4 shadow-lg hover:shadow-xl transition-all">
    <p className="text-sm text-gray-500">
      Total Hours
    </p>
    <p className="text-3xl font-bold">
      {
        data.subjects?.reduce(
          (sum: number, s: any) =>
            sum + s.min_hours_required,
          0
        )
      }h
    </p>
  </div>

  <div className="bg-gradient-to-br from-white to-gray-100 text-black rounded-xl p-4 shadow-lg hover:shadow-xl transition-all">
    <p className="text-sm text-gray-500">
      Study Days
    </p>
    <p className="text-3xl font-bold">
      {
        Object.keys(
          data.base_allocation || {}
        ).length
      }
    </p>
  </div>

<div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-4 shadow-lg">
  <p className="text-sm opacity-80">
    Avg Hours / Day
  </p>

  <p className="text-2xl font-bold">
    {(
      data.subjects?.reduce(
        (sum: number, s: any) =>
          sum + s.min_hours_required,
        0
      ) /
      Math.max(
        Object.keys(data.base_allocation || {}).length,
        1
      )
    ).toFixed(1)}h
  </p>
</div>

<div className="mb-6 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl p-5 shadow-lg">
  <p className="text-sm opacity-80">
    Top Priority Subject
  </p>

  <h2 className="text-3xl font-bold capitalize mt-1">
    {
      data.subjects?.find(
        (s: any) => s.importance === "high"
      )?.name || "N/A"
    }
  </h2>

  <p className="mt-2 opacity-90">
    This subject receives the highest scheduling weight.
  </p>
</div>

</div>

      <div className="mb-6 border rounded-lg p-4 bg-white text-black">
        <h2 className="text-xl font-bold mb-2">Subjects</h2>

        <table className="w-full border-collapse">
  <thead>
    <tr className="border-b">
      <th className="text-left p-2">Subject</th>
      <th className="text-left p-2">Priority</th>
      <th className="text-left p-2">Hours</th>
    </tr>
  </thead>

  <tbody>
    {data.subjects?.map((s: any, i: number) => (
      <tr key={i} className="border-b">
        <td className="p-2 capitalize">
          {s.name}
        </td>

        <td className="p-2">
          <span
            className={`px-2 py-1 rounded text-white text-sm ${
              s.importance === "high"
                ? "bg-red-500"
                : s.importance === "medium"
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
          >
            {s.importance}
          </span>
        </td>

        <td className="p-2">
          {s.min_hours_required}h
        </td>
      </tr>
    ))}
  </tbody>
</table>
      </div>
      <div className="mb-8">
  <h2 className="text-2xl font-bold mb-1">
  📅 Daily Allocation
</h2>

<p className="text-gray-400 mb-4">
  AI scheduler distributed your study hours based on
  priority, deadlines and workload.
</p>

  <div className="grid gap-4">
    {Object.entries(data.base_allocation || {}).map(
      ([date, allocations]: any) => (
        <div
          key={date}
          className="border rounded-xl p-4 shadow-sm bg-white text-black"
        >
          <h3 className="font-bold text-lg mb-3">
            {date}
          </h3>

          <div className="space-y-2">
            {allocations.map(
              (item: any, idx: number) => {
                const subject = Object.keys(item)[0];
                const hours = item[subject];

                return (
                  <div
                    key={idx}
                    className="flex justify-between items-center"
                  >
                    <span className="font-medium capitalize">
                      {subject}
                    </span>

                    <div className="flex items-center gap-3">
                      <div className="w-40 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full"
                          style={{
                            width: `${Math.min(
                              hours * 20,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="font-semibold">
                        {hours}h
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )
    )}
  </div>
</div>

      <div className="mt-8">

  <button
    onClick={() => setShowPlan(!showPlan)}
    className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold"
  >
    {showPlan
      ? "Hide Detailed Timetable ▲"
      : "Show Detailed Timetable ▼"}
  </button>

  {showPlan && (
    <div
      className="mt-4 border rounded-lg p-4 bg-white text-black"
      dangerouslySetInnerHTML={{
        __html: markdownToHtml(data.plan || ""),
      }}
    />
  )}

</div>
    </main>
  );
}