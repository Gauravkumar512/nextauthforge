"use client";

import axios from "axios";
import Link from "next/link";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { AuthShell, buttonClass, inputClass, labelClass } from "../_components/AuthShell";
import { errorMessage } from "../_components/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell title="Check your email">
        <p className="text-sm text-white/60 mb-6">
          If an account exists for <span className="text-white">{email}</span>, we sent a link to
          reset the password. It is valid for a limited time.
        </p>
        <Link href="/login" className="text-xs text-[#e8ff47]/60 hover:text-[#e8ff47] transition-colors">
          ← Back to sign in
        </Link>
      </AuthShell>
    );
  }

  const enabled = email.length > 0 && !loading;

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we will send you a reset link.">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={!enabled} className={buttonClass(enabled)}>
          {loading ? "Sending..." : "Send reset link →"}
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-white/20">
        <Link href="/login" className="text-[#e8ff47]/50 hover:text-[#e8ff47] transition-colors">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
