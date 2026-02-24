"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

interface AuthUser {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async() => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.replace("/login");
          return;
        }
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await axios.post("/api/auth/logout");
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#e8ff47] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-56 border-r border-white/10 flex flex-col p-6 z-10">
        {/* Logo */}
        <div className="mb-10">
          <span className="text-[#e8ff47] text-lg font-bold tracking-tight">
            AUTH<span className="text-white">FORGE</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {[
            { label: "Dashboard", href: "/dashboard", active: true, icon: "▣" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all ${
                item.active
                  ? "bg-[#e8ff47] text-black font-bold"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-xs">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="text-xs text-white/40 mb-1 truncate">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="cursor-pointer text-xs text-white/40 hover:text-red-400 transition-colors mt-1"
          >
            → logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-56 p-10">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-white/30 text-xs uppercase tracking-widest mb-1">
              Welcome back
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              {user?.username}
              <span className="text-[#e8ff47]">.</span>
            </h1>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/30 uppercase tracking-widest">Status</div>
            <div className="flex items-center gap-2 justify-end mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e8ff47] inline-block animate-pulse" />
              <span className="text-xs text-[#e8ff47]">Active</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Account Status", value: "Verified", sub: "Active session" },
            { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—", sub: "Registration date" },
            { label: "Auth Method", value: "JWT", sub: "httpOnly cookie" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="border border-white/10 rounded-lg p-5 hover:border-[#e8ff47]/30 transition-colors"
            >
              <div className="text-white/30 text-xs uppercase tracking-widest mb-2">
                {stat.label}
              </div>
              <div className="text-xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-white/30">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Info block */}
        <div className="border border-white/10 rounded-lg p-6 mb-6">
          <div className="text-xs text-white/30 uppercase tracking-widest mb-4">
            Account Details
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: "Username", value: user?.username },
              { label: "Email", value: user?.email },
              { label: "User ID", value: user?._id },
              { label: "Token Expiry", value: "1 day" },
            ].map((row) => (
              <div key={row.label}>
                <div className="text-xs text-white/30 mb-1">{row.label}</div>
                <div className="text-sm text-white font-medium truncate">{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dev note */}
        <div className="border border-dashed border-[#e8ff47]/20 rounded-lg p-5 bg-[#e8ff47]/5">
          <div className="text-xs text-[#e8ff47]/60 uppercase tracking-widest mb-1">
            ◈ Developer Note
          </div>
          <p className="text-xs text-white/40 leading-relaxed">
            This is your scaffolded dashboard. Replace the stats, cards, and content below with your application's actual data and features. The sidebar, auth logic, and user state are production-ready.
          </p>
        </div>
      </div>
    </div>
  );
}