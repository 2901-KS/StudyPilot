"use client";

import { useEffect, useState } from "react";

export default function ProgressPage() {
  const [plan, setPlan] = useState<any>(null);
  const [progress, setProgress] = useState<any>({});
  const [tasks, setTasks] = useState<any>({});

  useEffect(() => {
    const saved = sessionStorage.getItem(
      "currentProgressPlan"
    );

    if (saved) {
  const parsed = JSON.parse(saved);

  setPlan(parsed);

  const savedProgress = JSON.parse(
    localStorage.getItem(
      `progress_${parsed.id}`
    ) || "{}"
  );

  setProgress(savedProgress);
  const savedTasks = JSON.parse(
  localStorage.getItem(
    `tasks_${parsed.id}`
  ) || "{}"
);

setTasks(savedTasks);
}
  }, []);

  if (!plan) {
    return (
      <main className="p-6">
        <h1 className="text-3xl font-bold">
          No Plan Selected
        </h1>
      </main>
    );
  }
  const totalRequiredHours =
  plan.subjects.reduce(
    (sum: number, s: any) =>
      sum + s.min_hours_required,
    0
  );

const totalCompletedHours =
  plan.subjects.reduce(
    (sum: number, s: any) =>
      sum +
      (progress[s.name] || 0),
    0
  );

let totalTasks = 0;
let completedTasks = 0;

plan.subjects.forEach(
  (s: any) => {
    const subjectTasks =
      tasks[s.name] || [];

    totalTasks +=
      subjectTasks.length;

    completedTasks +=
      subjectTasks.filter(
        (t: any) => t.done
      ).length;
  }
);

const hoursPercent =
  totalRequiredHours === 0
    ? 0
    : Math.round(
        (totalCompletedHours /
          totalRequiredHours) *
          100
      );

const taskPercent =
  totalTasks === 0
    ? 0
    : Math.round(
        (completedTasks /
          totalTasks) *
          100
      );

const overallProgress =
  Math.round(
    (hoursPercent +
      taskPercent) / 2
  );
  const updateHours = (
  subjectName: string,
  change: number
) => {
  const current =
    progress[subjectName] || 0;

  const maxHours =
  plan.subjects.find(
    (s: any) =>
      s.name === subjectName
  )?.min_hours_required || 0;

const updated = Math.min(
  maxHours,
  Math.max(
    0,
    current + change
  )
);

  const newProgress = {
    ...progress,
    [subjectName]: updated,
  };

  setProgress(newProgress);

  localStorage.setItem(
    `progress_${plan.id}`,
    JSON.stringify(newProgress)
  );
};
const addTask = (
  subjectName: string
) => {
  const task = prompt(
    "Enter task name"
  );

  if (!task) return;

  const updatedTasks = {
    ...tasks,

    [subjectName]: [
      ...(tasks[subjectName] || []),

      {
        text: task,
        done: false,
      },
    ],
  };

  setTasks(updatedTasks);

  localStorage.setItem(
    `tasks_${plan.id}`,
    JSON.stringify(updatedTasks)
  );
};
const toggleTask = (
  subjectName: string,
  index: number
) => {
  const updatedTasks = {
    ...tasks,
  };

  updatedTasks[subjectName][index].done =
    !updatedTasks[subjectName][index].done;

  setTasks(updatedTasks);

  localStorage.setItem(
    `tasks_${plan.id}`,
    JSON.stringify(updatedTasks)
  );
};


  return (
    <main className="max-w-5xl mx-auto p-6">

      <h1 className="text-4xl font-bold mb-6">
        📈 Progress Tracker
      </h1>
      <div className="grid md:grid-cols-4 gap-4 mb-8">

  <div className="bg-white text-black rounded-xl p-4 shadow">
    <p className="text-sm text-gray-500">
      Subjects
    </p>
    <p className="text-3xl font-bold">
      {plan.subjects.length}
    </p>
  </div>

  <div className="bg-white text-black rounded-xl p-4 shadow">
    <p className="text-sm text-gray-500">
      Hours
    </p>
    <p className="text-3xl font-bold">
      {totalCompletedHours}
      /
      {totalRequiredHours}
    </p>
  </div>

  <div className="bg-white text-black rounded-xl p-4 shadow">
    <p className="text-sm text-gray-500">
      Tasks
    </p>
    <p className="text-3xl font-bold">
      {completedTasks}
      /
      {totalTasks}
    </p>
  </div>

  <div className="bg-white text-black rounded-xl p-4 shadow">
    <p className="text-sm text-gray-500">
      Overall
    </p>
    <p className="text-3xl font-bold">
      {overallProgress}%
    </p>
  </div>

</div>

      <div className="space-y-4">

        {plan.subjects?.map(
          (subject: any, index: number) => (
            <div
              key={index}
              className="bg-white text-black rounded-xl p-4 shadow"
            >
              <h2 className="text-xl font-bold capitalize">
                {subject.name}
              </h2>

              <p>
                Required Hours:
                {" "}
                {subject.min_hours_required}
              </p>

              <div className="mt-4">
    <p className="font-bold text-lg mb-2">
  Progress:
  {" "}
  {Math.round(
    ((progress[subject.name] || 0) /
      subject.min_hours_required) *
      100
  )}
  %
</p>

  <p className="font-medium mb-2">
    Completed Hours:
    {" "}
    {progress[subject.name] || 0}
    {" / "}
    {subject.min_hours_required}
  </p>

  <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
    <div
      className="bg-green-500 h-4 rounded-full"
      style={{
        width: `${
          Math.min(
            (
              ((progress[subject.name] || 0) /
                subject.min_hours_required) *
              100
            ),
            100
          )
        }%`,
      }}
    />
  </div>

    <div className="mt-6">

  <h3 className="font-bold mb-3">
    Tasks
  </h3>

  <div className="space-y-2">

    {(tasks[subject.name] || []).map(
      (
        task: any,
        index: number
      ) => (
        <label
          key={index}
          className="flex items-center gap-2"
        >
          <input
            type="checkbox"
            checked={task.done}
            onChange={() =>
              toggleTask(
                subject.name,
                index
              )
            }
          />

          <span
            className={
              task.done
                ? "line-through text-gray-500"
                : ""
            }
          >
            {task.text}
          </span>
        </label>
      )
    )}

  </div>

  <button
    onClick={() =>
      addTask(subject.name)
    }
    className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
  >
    + Add Task
  </button>

    <button
      onClick={() =>
        updateHours(
          subject.name,
          -1
        )
      }
      className="bg-red-500 text-white px-4 py-2 rounded"
    >
      -1 Hour
    </button>

    <button
      onClick={() =>
        updateHours(
          subject.name,
          1
        )
      }
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      +1 Hour
    </button>

  </div>

</div>
            </div>
          )
        )}

      </div>

    </main>
  );
}