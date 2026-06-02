import Link from "next/link";

const features = [
  {
    title: "AI Planner",
    description: "Generate personalized study schedules based on deadlines and available time.",
    href: "/planner",
  },
  {
    title: "ExplainIt",
    description: "Understand difficult concepts with AI-powered explanations.",
    href: "/explain",
  },
  {
    title: "NoteSynth",
    description: "Convert PDFs into concise and structured study notes.",
    href: "/summarize",
  },
  {
    title: "FlashForge",
    description: "Create smart flashcards instantly from your study material.",
    href: "/flashcards",
  },
  {
    title: "QuizMaster",
    description: "Practice with AI-generated quizzes and test your understanding.",
    href: "/quiz",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          StudyPilot
        </h1>

        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
          Your AI-powered learning companion for planning, understanding,
          summarizing, revising, and testing knowledge.
        </p>

        <Link
          href="/planner"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 transition"
        >
          Get Started
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center mb-10">
          Features
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-blue-500 transition"
            >
              <h3 className="text-xl font-semibold mb-3">
                {feature.title}
              </h3>

              <p className="text-slate-400">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}