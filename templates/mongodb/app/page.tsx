"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono flex flex-col overflow-hidden relative">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#e8ff47 1px, transparent 1px), linear-gradient(90deg, #e8ff47 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-[#e8ff47] opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-white/5">
        <span className="text-[#e8ff47] text-lg font-black tracking-tight">
          AUTH<span className="text-white">FORGE</span>
        </span>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/Gauravkumar512"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/30 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Badge */}
        <div
          className={`mb-8 inline-flex items-center gap-2 border border-[#e8ff47]/20 bg-[#e8ff47]/5 rounded-full px-4 py-1.5 transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#e8ff47] animate-pulse" />
          <span className="text-xs text-[#e8ff47]/80 tracking-widest uppercase">
            Production Ready Auth
          </span>
        </div>

        {/* Headline */}
        <h1
          className={`text-6xl font-black tracking-tighter leading-none mb-6 transition-all duration-700 delay-100 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Your app.
          <br />
          <span className="text-[#e8ff47]">Secured.</span>
        </h1>

        {/* Subtext */}
        <p
          className={`text-white/30 text-sm max-w-sm leading-relaxed mb-12 transition-all duration-700 delay-200 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Replace this with your product's value proposition. Authentication is
          already handled — focus on what makes your app unique.
        </p>

        {/* CTA Buttons */}
        <div
          className={`flex items-center gap-4 transition-all duration-700 delay-300 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Link
            href="/signup"
            className="bg-[#e8ff47] text-black text-sm font-black px-8 py-3 rounded hover:bg-white transition-colors tracking-tight"
          >
            Get Started →
          </Link>
          <Link
            href="/login"
            className="border border-white/10 text-white/60 text-sm font-medium px-8 py-3 rounded hover:border-white/30 hover:text-white transition-all tracking-tight"
          >
            Sign In
          </Link>
        </div>

        {/* Tech stack pills */}
        <div
          className={`mt-16 flex items-center gap-3 flex-wrap justify-center transition-all duration-700 delay-500 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          {["Next.js 14+", "MongoDB", "JWT", "httpOnly Cookies", "proxy"].map(
            (tech) => (
              <span
                key={tech}
                className="text-xs text-white/20 border border-white/5 px-3 py-1 rounded-full"
              >
                {tech}
              </span>
            )
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-between px-10 py-5 border-t border-white/5">
        <span className="text-xs text-white/15">
          Scaffolded with{" "}
          <span className="text-[#e8ff47]/40 font-bold">AuthForge</span>
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs text-white/20 hover:text-white/50 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="text-xs text-white/20 hover:text-white/50 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </footer>
    </div>
  );
}