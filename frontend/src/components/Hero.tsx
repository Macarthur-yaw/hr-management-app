import { Mouse } from "lucide-react";
import hero from "@/assets/hero-dashboard.webp";
import trust from "@/assets/trust-logos.webp";
import { Button } from "./ui/button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white px-5 pb-20 pt-32 text-center">
      <div className="pointer-events-none absolute left-[10%] top-40 size-10 rounded-lg bg-[#F8F4D9]" />
      <div className="pointer-events-none absolute right-[12%] top-36 size-8 rounded-lg bg-[#EAF8FB]" />
      <div className="pointer-events-none absolute right-[18%] top-56 size-4 rounded bg-[#F8F4D9]" />

      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold text-[#0E5961]">
          Smarter. Faster. Stress-Free
        </p>

        <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-extrabold leading-tight text-slate-950 md:text-6xl">
          One Dashboard. Total{" "}
          <span className="text-[#049FA7]">HR Control</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
          HQ HR Management helps growing teams manage employees, attendance,
          payroll, and performance with speed, security, and clarity.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <a href="/register">
            <Button className="h-11 rounded-xl bg-[#049FA7] px-6 text-sm font-semibold text-white hover:bg-[#038891]">
              Start free trial
            </Button>
          </a>

          <a href="/register">
            <Button className="h-11 rounded-xl bg-[#F8F4D9] px-6 text-sm font-semibold text-slate-900 hover:bg-[#efe8bd]">
              Request a demo
            </Button>
          </a>
        </div>

        <div className="mt-8 flex justify-center">
          <Mouse className="size-6 text-slate-800" />
        </div>

        <div className="relative mx-auto mt-10 max-w-4xl">
          <div className="absolute inset-x-10 top-8 h-64 rounded-[40px] bg-gradient-to-b from-[#EAF8FB] via-[#F8F4D9]/70 to-transparent blur-2xl" />

          <img
            src={hero}
            alt="HQ HR Management dashboard"
            className="relative z-10 mx-auto w-full max-w-3xl rounded-2xl shadow-2xl"
          />
        </div>

        <div className="mx-auto mt-14 flex max-w-4xl items-center gap-6">
          <div className="h-px flex-1 bg-slate-300" />
          <p className="shrink-0 text-xs font-medium text-slate-600">
            Trusted by 120+ Company
          </p>
          <div className="h-px flex-1 bg-slate-300" />
        </div>

        <img
          src={trust}
          alt="Trusted company logos"
          className="mx-auto mt-8 max-h-12 w-full max-w-5xl object-contain"
        />
      </div>
    </section>
  );
}
