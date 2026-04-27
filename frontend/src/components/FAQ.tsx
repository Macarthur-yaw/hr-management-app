import { useState } from "react";
import birds from "@/assets/faq-birds.webp";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is HQ only for large companies?",
    a: "Not at all. HQ is designed to support teams of any size — from small startups to large enterprises. Many of our happiest customers started small and appreciated how HQ grew with them.",
  },
  {
    q: "Does it replace my current payroll/benefits tools?",
    a: "HQ can work alongside your current tools or help you centralize HR processes depending on your team’s workflow.",
  },
  {
    q: "How secure is employee data?",
    a: "HQ is built with security in mind, helping protect employee records, payroll data, and sensitive HR information.",
  },
  {
    q: "Is it hard to set up HQ?",
    a: "No. HQ is designed to be simple to set up, with a smooth onboarding process for your HR team.",
  },
  {
    q: "Do we offer support and training?",
    a: "Yes. We provide support and training to help your team get comfortable using HQ confidently.",
  },
  {
    q: "What makes HQ different from other HR platforms?",
    a: "HQ combines essential HR tools into one simple, scalable platform built for modern teams.",
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="faq" className="bg-[#EAF8FB] py-20">
      <div className="relative mx-auto max-w-6xl px-5">
        <img
          src={birds}
          alt=""
          className="absolute right-5 top-0 w-20 md:w-28"
        />

        <p className="text-sm font-bold text-[#F28C28]">Have a question?</p>

        <h2 className="mt-3 text-3xl font-extrabold text-slate-950 md:text-5xl">
          Frequently asked questions
        </h2>

        <div className="mt-10 max-w-4xl space-y-4">
          {faqs.map((item, index) => {
            const isActive = activeIndex === index;

            return (
              <button
                key={item.q}
                type="button"
                onClick={() => setActiveIndex(isActive ? -1 : index)}
                className={`w-full rounded-2xl border bg-white px-6 py-5 text-left shadow-[4px_4px_0_rgba(0,0,0,0.14)] transition ${
                  isActive ? "border-[#E9B949]" : "border-slate-900"
                }`}
              >
                <div className="flex items-center justify-between gap-6">
                  <h3 className="text-sm font-extrabold text-slate-900 md:text-base">
                    {item.q}
                  </h3>

                  <ChevronDown
                    className={`size-5 shrink-0 text-slate-700 transition ${
                      isActive ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {isActive && (
                  <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
                    {item.a}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}