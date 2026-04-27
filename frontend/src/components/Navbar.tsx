import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { Button } from "./ui/button";

const links = ["Challenges", "Features", "Benefits", "FAQ", "Contact Us"];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-5 py-5">
      <nav className="relative mx-auto flex h-16 max-w-6xl items-center justify-between rounded-[22px] border border-slate-200 bg-white/95 px-6 shadow-sm backdrop-blur">
        <Logo />

        <div className="hidden items-center gap-10 text-sm font-medium lg:flex">
          {links.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replaceAll(" ", "-")}`}
              className="relative text-slate-700 transition-colors hover:text-[#049FA7]"
            >
              {link}
              {link === "Challenges" && (
                <span className="absolute -bottom-2 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-[#049FA7]" />
              )}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a href="/signin">
            <Button className="h-10 rounded-xl bg-[#049FA7] px-5 text-sm font-semibold text-white hover:bg-[#038891]">
              Sign In
            </Button>
          </a>

          <a href="/register">
            <Button className="h-10 rounded-xl bg-[#F8F4D9] px-5 text-sm font-semibold text-slate-900 hover:bg-[#efe8bd]">
              Get Started
            </Button>
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 lg:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-20 rounded-[22px] border border-slate-200 bg-white p-5 shadow-xl lg:hidden">
            <div className="flex flex-col gap-4">
              {links.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replaceAll(" ", "-")}`}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#EAF8FB] hover:text-[#049FA7]"
                >
                  {link}
                </a>
              ))}

              <div className="mt-2 grid gap-3 border-t border-slate-100 pt-4">
                <a href="/signin" onClick={() => setOpen(false)}>
                  <Button className="w-full rounded-xl bg-[#049FA7] text-white hover:bg-[#038891]">
                    Sign In
                  </Button>
                </a>

                <a href="/register" onClick={() => setOpen(false)}>
                  <Button className="w-full rounded-xl bg-[#F8F4D9] text-slate-900 hover:bg-[#efe8bd]">
                    Get Started
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
