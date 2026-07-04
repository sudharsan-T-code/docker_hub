"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, API_URL } from "../layout";
import Link from "next/link";
import { Shield, Key, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useApp();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        login(data.accessToken, data.user);
        router.push("/dashboard");
      } else {
        const errData = await res.json();
        setError(errData.error || "Authentication failed.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-8 rounded-2xl shadow-xl space-y-6 z-10">
        <div className="text-center space-y-2">
          <svg className="w-10 h-10 text-docker-blue mx-auto" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.983 11.078h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186h-2.119c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.909 0h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186h-2.119c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.913 0h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186H8.161c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.91 0h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186H5.251c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.91 0h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186H2.34c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm2.911-2.912h2.119c.102 0 .186-.084.186-.186V5.862c0-.102-.084-.186-.186-.186H5.251c-.102 0-.186.084-.186.186v2.118c0 .102.084.186.186.186zm2.91 0h2.119c.102 0 .186-.084.186-.186V5.862c0-.102-.084-.186-.186-.186H8.161c-.102 0-.186.084-.186.186v2.118c0 .102.084.186.186.186zm2.913 0h2.119c.102 0 .186-.084.186-.186V5.862c0-.102-.084-.186-.186-.186h-2.119c-.102 0-.186.084-.186.186v2.118c0 .102.084.186.186.186zm-8.733-2.91h2.119c.102 0 .186-.084.186-.186V2.95c0-.102-.084-.186-.186-.186H8.161c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.913 24.3c-2.483 0-4.043-1.62-4.043-3.502 0-3.324 3.738-3.324 4.542-3.324h12.922c1.782 0 3.013-.807 3.864-2.222.186-.31.39-.757.51-1.047l.116-.279c.148-.352.487-.568.878-.568h2.091c.069 0 .12.078.082.138-.682 1.077-1.391 1.956-2.292 2.766-1.125 1.005-2.73 1.512-4.72 1.512H5.064c-.818 0-1.846.126-1.846.924 0 .546.613.61 1.026.61H20.73c.484 0 .902.327.994.795.143.743.208 1.488.208 2.215 0 2.215-2.484 3.712-4.966 3.712H5.21z"/>
          </svg>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Sign In to Docker Hub</h2>
          <p className="text-xs text-slate-400">Enter your container namespace credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex items-center space-x-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. john_doe"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker-blue/40 text-slate-800 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
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
            disabled={loading}
            className="w-full py-3.5 bg-docker-blue text-white rounded-xl hover:bg-blue-600 shadow-md font-bold transition-all disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="text-center pt-2 text-[11px] text-slate-400 font-medium">
          Don't have an account?{" "}
          <Link href="/register" className="text-docker-blue hover:underline font-bold">
            Sign Up
          </Link>
        </div>

      </div>
    </div>
  );
}
