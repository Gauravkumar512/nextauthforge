import Link from "next/link";
import type { ReactNode } from "react";
import { authConfig } from "../../../lib/auth-config";

export const inputClass =
  "w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#e8ff47]/50 focus:bg-white/[0.07] transition-all";

export const labelClass = "block text-xs text-white/40 uppercase tracking-widest mb-2";

export function buttonClass(enabled: boolean): string {
  return `w-full py-3 rounded font-black text-sm tracking-tight transition-all ${
    enabled
      ? "bg-[#e8ff47] text-black hover:bg-white cursor-pointer"
      : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
  }`;
}

// Deliberately plain: Step 5 restyles the auth pages.
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#e8ff47 1px, transparent 1px), linear-gradient(90deg, #e8ff47 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <nav className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-white/5">
        <Link href="/" className="text-[#e8ff47] text-lg font-black tracking-tight">
          {authConfig.appName}
        </Link>
        <Link href="/login" className="text-xs text-[#e8ff47]/60 hover:text-[#e8ff47] transition-colors">
          Sign in
        </Link>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="border border-white/10 rounded-lg bg-white/[0.02] p-8">
            <h1 className="text-xl font-black tracking-tight mb-1">{title}</h1>
            {subtitle && <p className="text-xs text-white/40 mb-6">{subtitle}</p>}
            {!subtitle && <div className="mb-6" />}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
