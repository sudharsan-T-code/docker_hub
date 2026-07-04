"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, API_URL } from "../layout";
import { Plus, Database, Download, Star, Shield, Lock, Globe, PlusCircle, Trash, RefreshCw, Clipboard } from "lucide-react";
import Link from "next/link";

interface MyRepo {
  id: string;
  namespace: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  pullCount: number;
  starCount: number;
  lastUpdated: string;
}

interface MyOrg {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  avatarUrl: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, user } = useApp();

  const [myRepos, setMyRepos] = useState<MyRepo[]>([]);
  const [myOrgs, setMyOrgs] = useState<MyOrg[]>([]);
  const [loading, setLoading] = useState(true);

  // Repository Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDesc, setNewRepoDesc] = useState("");
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  const [newRepoNamespace, setNewRepoNamespace] = useState("");
  const [createError, setCreateError] = useState("");

  // Org Creation Modal State
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDesc, setNewOrgDesc] = useState("");

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchDashboardData();
  }, [token]);

  useEffect(() => {
    if (user) {
      setNewRepoNamespace(user.username);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch personal repositories (we can use search filters q=username namespace)
      if (user) {
        const repoRes = await fetch(`${API_URL}/api/repositories?q=${user.username}`);
        if (repoRes.ok) {
          const repoData = await repoRes.json();
          // Filter to double-check namespace matching
          setMyRepos(repoData.repositories.filter((r: MyRepo) => r.namespace === user.username));
        }

        // 2. Fetch user's organizations
        const orgRes = await fetch(`${API_URL}/api/orgs/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          setMyOrgs(orgData);
        }
      }
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!newRepoName.trim()) {
      setCreateError("Repository name is required.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/repositories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newRepoName.trim().toLowerCase(),
          namespace: newRepoNamespace,
          description: newRepoDesc,
          isPrivate: newRepoPrivate
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewRepoName("");
        setNewRepoDesc("");
        setNewRepoPrivate(false);
        fetchDashboardData();
      } else {
        const errData = await res.json();
        setCreateError(errData.error || "Failed to create repository");
      }
    } catch (err: any) {
      setCreateError(err.message);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/orgs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newOrgName.trim().toLowerCase(),
          displayName: newOrgName,
          description: newOrgDesc
        })
      });

      if (res.ok) {
        setShowOrgModal(false);
        setNewOrgName("");
        setNewOrgDesc("");
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRepo = async (namespace: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${namespace}/${name}?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/repositories/${namespace}/${name}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalPulls = myRepos.reduce((acc, r) => acc + r.pullCount, 0);
  const totalStars = myRepos.reduce((acc, r) => acc + r.starCount, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8 flex-grow">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Developer Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your personal containers, team workflows and organizations.
          </p>
        </div>

        <div className="flex space-x-3 text-xs font-semibold">
          <button
            onClick={() => setShowOrgModal(true)}
            className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all"
          >
            Create Organization
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-docker-blue text-white hover:bg-blue-600 rounded-xl transition-all inline-flex items-center space-x-1.5 shadow-sm"
          >
            <Plus size={14} />
            <span>Create Repository</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-docker-blue">
            <Database size={20} />
          </div>
          <div>
            <p className="text-lg font-extrabold text-slate-800 dark:text-white">{myRepos.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">My Repositories</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Download size={20} />
          </div>
          <div>
            <p className="text-lg font-extrabold text-slate-800 dark:text-white">{totalPulls.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Total Pulls</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Star size={20} />
          </div>
          <div>
            <p className="text-lg font-extrabold text-slate-800 dark:text-white">{totalStars}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Stars Received</p>
          </div>
        </div>
      </div>

      {/* Main Grid: My Repos + My Orgs lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Personal repositories list */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-400">Repositories</h2>
          
          {myRepos.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <p className="text-xs text-slate-400">You don't have any repositories yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-xs font-bold text-docker-blue hover:underline"
              >
                Create your first repository
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-6"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/repository/${repo.namespace}/${repo.name}`}
                        className="font-extrabold text-xs sm:text-sm hover:text-docker-blue truncate"
                      >
                        {repo.namespace}/{repo.name}
                      </Link>
                      {repo.isPrivate ? (
                        <span className="inline-flex items-center space-x-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                          <Lock size={8} />
                          <span>Private</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-0.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">
                          <Globe size={8} />
                          <span>Public</span>
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-400 truncate max-w-lg">{repo.description || "No description provided."}</p>
                    
                    <div className="flex items-center space-x-4 text-[9px] text-slate-400">
                      <span>Pulls: <b className="text-slate-600 dark:text-slate-300">{repo.pullCount}</b></span>
                      <span>Stars: <b className="text-slate-600 dark:text-slate-300">{repo.starCount}</b></span>
                      <span>Updated {new Date(repo.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center space-x-2">
                    <button
                      onClick={() => handleDeleteRepo(repo.namespace, repo.name)}
                      className="p-2 border border-slate-200 dark:border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/20 dark:hover:bg-red-950/20 rounded-xl transition-all"
                      title="Delete Repository"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Organizations sidebar list */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-400">My Organizations</h2>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            {myOrgs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Not a member of any organizations.</p>
            ) : (
              <div className="space-y-3.5">
                {myOrgs.map(org => (
                  <div key={org.id} className="flex items-center space-x-3 text-xs">
                    <img
                      src={org.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${org.name}`}
                      alt={org.name}
                      className="w-8 h-8 rounded-lg bg-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-white truncate">{org.displayName || org.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">namespace: {org.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={() => setShowOrgModal(true)}
              className="w-full py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all inline-flex items-center justify-center space-x-1"
            >
              <PlusCircle size={14} className="text-docker-blue" />
              <span>Create Organization</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modal: Create Repository */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Create Repository</h3>
              <p className="text-[11px] text-slate-400">Docker repositories group tags and coordinate automated pushes.</p>
            </div>

            <form onSubmit={handleCreateRepo} className="space-y-4 text-xs font-medium">
              {createError && (
                <p className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-[11px]">{createError}</p>
              )}

              <div className="grid grid-cols-3 gap-2 items-center">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Namespace</label>
                  <select
                    value={newRepoNamespace}
                    onChange={(e) => setNewRepoNamespace(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value={user?.username}>{user?.username}</option>
                    {myOrgs.map(org => (
                      <option key={org.id} value={org.name}>{org.name}</option>
                    ))}
                  </select>
                </div>
                <span className="text-center font-bold text-slate-400 pt-5">/</span>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Repository Name</label>
                  <input
                    type="text"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    placeholder="e.g. my-app"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg focus:outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Short Description</label>
                <textarea
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                  placeholder="Summarize your container utility..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg focus:outline-none text-slate-800 dark:text-white h-20 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Visibility</label>
                <div className="flex gap-4 pt-1.5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={!newRepoPrivate}
                      onChange={() => setNewRepoPrivate(false)}
                      className="text-docker-blue focus:ring-docker-blue border-slate-300 dark:border-slate-800 bg-transparent"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Public</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={newRepoPrivate}
                      onChange={() => setNewRepoPrivate(true)}
                      className="text-docker-blue focus:ring-docker-blue border-slate-300 dark:border-slate-800 bg-transparent"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Private</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-docker-blue text-white hover:bg-blue-600 rounded-lg text-center shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Org */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-2xl">
            <div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Create Organization</h3>
              <p className="text-[11px] text-slate-400">Share registry namespaces with teammates.</p>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Org Namespace</label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. acmecorp"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg focus:outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                <textarea
                  value={newOrgDesc}
                  onChange={(e) => setNewOrgDesc(e.target.value)}
                  placeholder="Summary..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg focus:outline-none text-slate-800 dark:text-white h-16 resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-docker-blue text-white hover:bg-blue-600 rounded-lg text-center shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
