"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AuthShell, buttonClass, inputClass, labelClass } from "../_components/AuthShell";
import { errorMessage } from "../_components/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  // undefined = not read yet, null = no token in the URL
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("token");
    setToken(value);
    // Keep the secret token out of the address bar, history and Referer headers.
    if (value) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { token, password, confirmPassword });
      toast.success("Password updated. Please sign in.");
      router.replace("/login");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (token === undefined) return <AuthShell title="Reset password">{null}</AuthShell>;

  if (token === null) {
    return (
      <AuthShell title="Reset link missing">
        <p className="text-sm text-white/60 mb-6">
          This page needs the link from your reset email. You can request a new one.
        </p>
        <Link href="/forgot-password" className="text-xs text-[#e8ff47]/60 hover:text-[#e8ff47] transition-colors">
          Request a new link →
        </Link>
      </AuthShell>
    );
  }

  const enabled = password.length > 0 && confirmPassword.length > 0 && !loading;

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>New password</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Confirm password</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat the password"
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={!enabled} className={buttonClass(enabled)}>
          {loading ? "Saving..." : "Set new password →"}
        </button>
      </form>
    </AuthShell>
  );
}
