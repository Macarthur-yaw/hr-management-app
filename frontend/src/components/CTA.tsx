import { Button } from "./ui/button";
import ctaImage from "@/assets/cta-illustration.webp";

export default function CTA() {
  return (
    <section className="bg-[#EAF8FB] pb-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="relative overflow-hidden rounded-2xl bg-[#125F68] px-6 py-8 text-white shadow-[5px_5px_0_rgba(0,0,0,0.15)] md:px-10">
          <div className="grid items-center gap-8 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="max-w-2xl text-xl font-extrabold leading-tight md:text-2xl">
                Be Part Of The Movement To Redefine HR — Smarter, More
                Efficient, And Truly Focused On Your People With HQ.
              </h2>

              <a href="/register">
                <Button className="mt-6 rounded-full bg-slate-950 px-5 text-sm text-white hover:bg-slate-800">
                  Get Price Consultation
                </Button>
              </a>

              <p className="mt-6 text-2xl font-black">Hø</p>
            </div>

            <div className="relative flex justify-center md:justify-end">
              <div className="absolute right-8 top-4 h-28 w-32 rounded-xl bg-[#B982FF]" />

              <img
                src={ctaImage}
                alt="HQ HR illustration"
                className="relative z-10 w-52 object-contain md:w-64"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
