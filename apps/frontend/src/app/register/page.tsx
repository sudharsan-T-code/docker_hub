"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../layout";
import Link from "next/link";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    if (!username || !email || !password) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          email: email.trim(),
          password,
          fullName
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        const errData = await res.json();
        setError(errData.error || "Registration failed.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to register. Make sure backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-8 rounded-2xl shadow-xl space-y-6 z-10">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Create Docker Account</h2>
          <p className="text-xs text-slate-400 font-medium">Get access to unlimited public container repositories.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex items-center space-x-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-xl flex items-center space-x-2">
              <CheckCircle size={16} className="shrink-0" />
              <span>Account created successfully! Redirecting to login...</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Namespace Username *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. john_doe"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker-blue/40 text-slate-800 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@company.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker-blue/40 text-slate-800 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name (Optional)</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker-blue/40 text-slate-800 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker-blue/40 text-slate-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3.5 bg-docker-blue text-white rounded-xl hover:bg-blue-600 shadow-md font-bold transition-all disabled:opacity-50"
          >
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>

        <div className="text-center pt-2 text-[11px] text-slate-400 font-medium">
          Already have an account?{" "}
          <Link href="/login" className="text-docker-blue hover:underline font-bold">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
