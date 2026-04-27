import { Button } from "./ui/button";

const benefits = [
  {
    title: "Save Time, Every Day",
    desc: "Automate repetitive tasks and reclaim hours for meaningful, strategic work.",
  },
  {
    title: "Engage Your People",
    desc: "Foster better communication, transparency, and satisfaction across the team.",
  },
  {
    title: "Lead with Confidence",
    desc: "Make decisions backed by real-time, accurate, actionable insights.",
  },
  {
    title: "Grow Without Stress",
    desc: "Add teams, departments, or users smoothly — no messy migration or growing pains.",
  },
];

export default function Benefits() {
  return (
    <section id="benefits" className="bg-[#F8F4D9] py-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2">
        
        {/* LEFT */}
        <div className="self-center">
          <p className="text-sm font-bold text-[#F28C28]">Benefits</p>

          <h2 className="mt-4 text-3xl font-extrabold leading-tight text-[#0E5961] md:text-5xl">
            Unlock up to 90% more efficiency in HR — and focus on what matters.
          </h2>

          <a href="/register">
            <Button className="mt-8 rounded-full bg-slate-900 px-6 text-white hover:bg-slate-800">
              Schedule for Demo
            </Button>
          </a>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {benefits.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm"
            >
              <h3 className="text-lg font-extrabold text-[#049FA7]">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
