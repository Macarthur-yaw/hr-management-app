import { useState } from "react";
import dash from "@/assets/feature-dashboard.webp";
import sticker from "@/assets/feature-sticker.webp";
import { Button } from "./ui/button";

const features = [
  {
    title: "Employee Management",
    desc: "Centralize employee records, roles, departments, onboarding, and HR profiles in one simple workspace.",
    image: dash,
  },
  {
    title: "Time & Attendance",
    desc: "Track attendance, shifts, leave requests, working hours, lateness, and absence records with ease.",
    image: dash,
  },
  {
    title: "Payroll & Benefits",
    desc: "Simplify payroll processing, deductions, benefits, compensation, and employee payment records.",
    image: dash,
  },
  {
    title: "Talent & Performance",
    desc: "Manage goals, appraisals, employee growth, reviews, and performance conversations in one place.",
    image: dash,
  },
  {
    title: "Analytics & Insights",
    desc: "Get clear HR reports and real-time insights to support better people decisions.",
    image: dash,
  },
];

export default function Features() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFeature = features[activeIndex];

  return (
    <section id="features" className="overflow-hidden bg-white py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-bold text-[#F28C28]">Features</p>

          <h2 className="mt-3 max-w-xl text-3xl font-extrabold leading-tight text-slate-950 md:text-5xl">
            Get all the features in one place. Be amazed!
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
            HQ centralizes HR operations: modules, onboarding, every HR need —
            so you can focus on people, not processes.
          </p>

          <div className="mt-8 max-w-md space-y-4">
            {features.map((item, index) => {
              const isActive = activeIndex === index;

              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`w-full rounded-xl border bg-white px-5 py-4 text-left shadow-sm transition ${
                    isActive
                      ? "border-l-[5px] border-l-[#F28C28]"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex size-9 items-center justify-center rounded bg-[#F8F1EA] text-sm text-[#0A9FA7]">
                      ▣
                    </span>

                    <p className="text-sm font-bold text-slate-800">
                      {item.title}
                    </p>
                  </div>

                  {isActive && (
                    <p className="mt-4 pl-[52px] text-sm leading-relaxed text-slate-500">
                      {item.desc}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          <a href="/register">
            <Button className="mt-8 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800">
              Be HQ? Check it
            </Button>
          </a>
        </div>

        <div className="relative min-h-[430px]">
          <img
            src={sticker}
            alt="37 features sticker"
            className="absolute right-8 top-0 z-20 w-24 rotate-12 md:w-32"
          />

          <div className="absolute left-0 right-0 top-28 h-72 rounded-[40px] bg-[#079EA7] [clip-path:polygon(0_34%,100%_0,100%_100%,0_100%)]" />

          <img
            src={activeFeature.image}
            alt={activeFeature.title}
            className="absolute right-[-80px] top-36 z-10 w-[720px] max-w-none rounded-2xl shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}
