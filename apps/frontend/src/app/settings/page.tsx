"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, API_URL } from "../layout";
import { Key, Copy, Check, Trash, Plus, Terminal, Settings as SettingsIcon } from "lucide-react";

interface CLIKey {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { token, user } = useApp();

  const [activeTab, setActiveTab] = useState<string>("tokens");
  const [tokensList, setTokensList] = useState<CLIKey[]>([]);
  const [loading, setLoading] = useState(true);

  // New Token Generation State
  const [newTokenName, setNewTokenName] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchSettingsData();
  }, [token]);

  const fetchSettingsData = async () => {
    setLoading(true);
    try {
      // Mock fetching generated access tokens from the token table
      // To simulate CLI token management, we fetch or mock data
      const mockTokens: CLIKey[] = [
        {
          id: "tok_1",
          token: "dckr_pat_a9f521bca95a8f14e8a71bca45210984",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 362).toISOString(),
          revoked: false
        }
      ];
      setTokensList(mockTokens);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    // Generate a random mock PAT
    const patVal = `dckr_pat_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setGeneratedToken(patVal);

    const newKey: CLIKey = {
      id: `tok_${Math.random().toString(36).substring(2, 8)}`,
      token: patVal,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      revoked: false
    };

    setTokensList(prev => [newKey, ...prev]);
    setNewTokenName("");
  };

  const handleRevokeToken = (id: string) => {
    if (!confirm("Are you sure you want to revoke this CLI access token?")) return;
    setTokensList(prev => prev.filter(t => t.id !== id));
  };

  const copyToken = () => {
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8 flex-grow">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
      
      {/* Welcome header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-8 flex items-center space-x-3">
        <SettingsIcon className="text-docker-blue" size={24} />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Account Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure access credentials, CLI auth tokens, and security profile parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="md:col-span-1 flex flex-col space-y-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab("tokens")}
            className={`px-4 py-2.5 rounded-xl text-left transition-colors ${
              activeTab === "tokens"
                ? "bg-slate-100 dark:bg-slate-900 text-docker-blue"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Personal Access Tokens
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2.5 rounded-xl text-left transition-colors ${
              activeTab === "profile"
                ? "bg-slate-100 dark:bg-slate-900 text-docker-blue"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Profile Information
          </button>
        </aside>

        {/* Content Box */}
        <section className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          
          {/* TAB 1: CLI Access Tokens */}
          {activeTab === "tokens" && (
            <div className="space-y-6">
              
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Personal Access Tokens</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Use Personal Access Tokens (PATs) as a replacement password for authentication in docker commands (e.g. <code>docker login</code>).
                </p>
              </div>

              {/* Generate form */}
              <form onSubmit={handleCreateToken} className="flex gap-3 text-xs font-semibold max-w-md">
                <input
                  type="text"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder="Token Description (e.g. CI runner, Laptop)..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker-blue/40 text-slate-800 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-docker-blue text-white rounded-xl hover:bg-blue-600 transition-all inline-flex items-center space-x-1 shadow-sm shrink-0"
                >
                  <Plus size={14} />
                  <span>Generate</span>
                </button>
              </form>

              {/* Display generated key */}
              {generatedToken && (
                <div className="p-4.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Copy your new Personal Access Token:</p>
                  <div className="flex items-center justify-between font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg select-all">
                    <span className="text-green-600 dark:text-green-400 truncate pr-4">{generatedToken}</span>
                    <button
                      onClick={copyToken}
                      className="p-1 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded transition-colors shrink-0"
                    >
                      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-red-500/80 leading-relaxed font-semibold">
                    Warning: Make sure you copy the token now! It won't be shown again for security reasons.
                  </p>
                </div>
              )}

              {/* Tokens Table */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Tokens ({tokensList.length})</span>
                
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tokensList.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No active Personal Access Tokens created.</p>
                  ) : (
                    tokensList.map(t => (
                      <div key={t.id} className="py-4 flex items-center justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <p className="font-bold font-mono text-slate-700 dark:text-slate-300">
                            {t.token.substring(0, 12)}••••••••••••••••
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                            <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>Expires {new Date(t.expiresAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevokeToken(t.id)}
                          className="p-2 border border-slate-200 dark:border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                          title="Revoke Token"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Profile Settings */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Profile Information</h3>
                <p className="text-xs text-slate-400 mt-1">Modify basic account parameters displayed on public repositories.</p>
              </div>

              <div className="space-y-4 max-w-md text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Username (Namespace)</label>
                  <input
                    type="text"
                    disabled
                    value={user?.username || ""}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.fullName || ""}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker-blue/40 text-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  className="px-5 py-2.5 bg-docker-blue text-white rounded-xl hover:bg-blue-600 transition-all shadow-sm"
                >
                  Save Changes
                </button>
              </div>

            </div>
          )}

        </section>

      </div>

    </div>
  );
}
