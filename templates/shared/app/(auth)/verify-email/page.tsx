"use client";

import axios from "axios";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AuthShell, buttonClass, inputClass, labelClass } from "../_components/AuthShell";
import { errorMessage } from "../_components/api";

type Status = "checking" | "verified" | "failed" | "waiting";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  // The verification link is single-use: make sure the effect only calls the API once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    setEmail(params.get("email") ?? "");

    if (!token) {
      setStatus("waiting");
      return;
    }

    // Keep the secret token out of the address bar, history and Referer headers.
    window.history.replaceState(null, "", window.location.pathname);

    axios
      .post("/api/auth/verify-email", { token })
      .then(() => setStatus("verified"))
      .catch(() => setStatus("failed"));
  }, []);

  const onResend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await axios.post("/api/auth/resend-verification", { email });
      toast.success(data.message ?? "If that account needs verification, a new email is on its way.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const resendForm = (
    <form onSubmit={onResend} className="space-y-5">
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
      <button type="submit" disabled={sending || email.length === 0} className={buttonClass(!sending && email.length > 0)}>
        {sending ? "Sending..." : "Send a new verification email →"}
      </button>
    </form>
  );

  if (status === "checking") {
    return (
      <AuthShell title="Verifying your email">
        <p className="text-sm text-white/60">One moment...</p>
      </AuthShell>
    );
  }

  if (status === "verified") {
    return (
      <AuthShell title="Email verified">
        <p className="text-sm text-white/60 mb-6">Thanks! Your email address is confirmed.</p>
        <Link href="/login" className="text-xs text-[#e8ff47]/60 hover:text-[#e8ff47] transition-colors">
          Continue to sign in →
        </Link>
      </AuthShell>
    );
  }

  if (status === "failed") {
    return (
      <AuthShell title="Link invalid or expired" subtitle="Verification links work once and expire. Request a new one below.">
        {resendForm}
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Check your email" subtitle="We sent you a link to verify your address. Didn't get it? Request another below.">
      {resendForm}
    </AuthShell>
  );
}
