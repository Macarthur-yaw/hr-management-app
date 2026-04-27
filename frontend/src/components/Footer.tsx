import Logo from "./Logo";
import {
  FaTwitter as Twitter,
  FaLinkedin as Linkedin,
  FaFacebook as Facebook,
  FaInstagram as Instagram,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#F5FAFC] px-5 py-16 text-slate-700">
      <div className="mx-auto max-w-6xl">
        
        <div className="grid gap-10 md:grid-cols-4">
          
          {/* LOGO + SOCIALS */}
          <div>
            <Logo />

            <div className="mt-4 flex gap-3 text-slate-500">
              <Twitter size={18} />
              <Linkedin size={18} />
              <Facebook size={18} />
              <Instagram size={18} />
            </div>
          </div>

          {/* LINKS */}
          <div className="space-y-3 text-sm">
            <p className="font-bold text-slate-900">Product</p>
            <a href="#features" className="block hover:text-[#049FA7]">
              Features
            </a>
            <a href="#benefits" className="block hover:text-[#049FA7]">
              Benefits
            </a>
            <a href="#faq" className="block hover:text-[#049FA7]">
              FAQ
            </a>
          </div>

          <div className="space-y-3 text-sm">
            <p className="font-bold text-slate-900">Company</p>
            <a href="#" className="block hover:text-[#049FA7]">
              About Us
            </a>
            <a href="#" className="block hover:text-[#049FA7]">
              Contact
            </a>
            <a href="#" className="block hover:text-[#049FA7]">
              Careers
            </a>
          </div>

          <div className="space-y-3 text-sm">
            <p className="font-bold text-slate-900">Legal</p>
            <a href="#" className="block hover:text-[#049FA7]">
              Privacy Policy
            </a>
            <a href="#" className="block hover:text-[#049FA7]">
              Terms of Service
            </a>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-12 border-t border-slate-200 pt-6 text-center text-sm text-slate-500 md:text-left">
          © {new Date().getFullYear()} HQ Staff Management. All rights reserved.
        </div>
      </div>
    </footer>
  );
}