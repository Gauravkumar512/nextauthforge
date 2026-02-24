"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();

  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDisabled =
    !accepted ||
    user.username.length === 0 ||
    user.email.length === 0 ||
    user.password.length === 0 ||
    user.confirmPassword.length === 0 ||
    loading;

  const onSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (user.password !== user.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/signup", user);
      toast.success("Account created!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono flex flex-col relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#e8ff47 1px, transparent 1px), linear-gradient(90deg, #e8ff47 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-[#e8ff47] opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-white/5">
        <Link href="/" className="text-[#e8ff47] text-lg font-black tracking-tight">
          AUTH<span className="text-white">FORGE</span>
        </Link>
        <span className="text-xs text-white/20">
          Have an account?{" "}
          <Link href="/login" className="text-[#e8ff47]/60 hover:text-[#e8ff47] transition-colors">
            Sign in
          </Link>
        </span>
      </nav>

      {/* Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">
              Get started
            </p>
            <h1 className="text-3xl font-black tracking-tight">
              Create account<span className="text-[#e8ff47]">.</span>
            </h1>
          </div>

          {/* Card */}
          <div className="border border-white/10 rounded-lg p-6 bg-white/2">
            <form onSubmit={onSignUp} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                  Username
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={user.username}
                  onChange={(e) => setUser({ ...user, username: e.target.value })}
                  placeholder="johndoe"
                  className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#e8ff47]/50 focus:bg-white/[0.07] transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#e8ff47]/50 focus:bg-white/[0.07] transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={user.password}
                  onChange={(e) => setUser({ ...user, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#e8ff47]/50 focus:bg-white/[0.07] transition-all"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={user.confirmPassword}
                  onChange={(e) => setUser({ ...user, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className={`w-full bg-white/5 border rounded px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:bg-white/[0.07] ${
                    user.confirmPassword.length > 0 &&
                    user.password !== user.confirmPassword
                      ? "border-red-500/50 focus:border-red-500/70"
                      : "border-white/10 focus:border-[#e8ff47]/50"
                  }`}
                />
                {/* Inline mismatch warning */}
                {user.confirmPassword.length > 0 &&
                  user.password !== user.confirmPassword && (
                    <p className="text-xs text-red-400/70 mt-1.5">
                      Passwords don't match
                    </p>
                  )}
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start gap-3 pt-1">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={accepted}
                    onChange={() => setAccepted((prev) => !prev)}
                    className="sr-only"
                  />
                  <div
                    onClick={() => setAccepted((prev) => !prev)}
                    className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition-all ${
                      accepted
                        ? "bg-[#e8ff47] border-[#e8ff47]"
                        : "border-white/20 bg-white/5"
                    }`}
                  >
                    {accepted && (
                      <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <label
                  htmlFor="terms"
                  className="text-xs text-white/30 leading-relaxed cursor-pointer"
                  onClick={() => setAccepted((prev) => !prev)}
                >
                  I agree to the{" "}
                  <a
                    href="/terms"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#e8ff47]/50 hover:text-[#e8ff47] transition-colors"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#e8ff47]/50 hover:text-[#e8ff47] transition-colors"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isDisabled}
                className={`w-full py-3 rounded font-black text-sm tracking-tight transition-all ${
                  !isDisabled
                    ? "bg-[#e8ff47] text-black hover:bg-white cursor-pointer"
                    : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  "Create account →"
                )}
              </button>
            </form>
          </div>

          {/* Footer link */}
          <p className="mt-5 text-center text-xs text-white/20">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#e8ff47]/50 hover:text-[#e8ff47] transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom credit */}
      <footer className="relative z-10 text-center py-5 border-t border-white/5">
        <span className="text-xs text-white/10">
          Scaffolded with{" "}
          <span className="text-[#e8ff47]/30 font-bold">AuthForge</span>
        </span>
      </footer>
    </div>
  );
}