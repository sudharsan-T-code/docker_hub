"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Star, Download, ShieldCheck, CheckCircle2, ChevronRight, SlidersHorizontal, RefreshCw } from "lucide-react";
import { API_URL } from "../layout";

interface RepoResult {
  id: string;
  namespace: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  isOfficial: boolean;
  isVerified: boolean;
  pullCount: number;
  starCount: number;
  lastUpdated: string;
  architectures: string[];
  operatingSystems: string[];
}

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Search state
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filterType, setFilterType] = useState<string>(searchParams.get("type") || "all");
  const [selectedOS, setSelectedOS] = useState<string[]>([]);
  const [selectedArch, setSelectedArch] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<string>("pulls");
  
  // Results
  const [repos, setRepos] = useState<RepoResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Standard filter categories
  const osOptions = ["linux", "windows"];
  const archOptions = ["amd64", "arm64", "arm32v7", "i386"];

  useEffect(() => {
    fetchRepositories();
  }, [searchParams, filterType, selectedOS, selectedArch, sortOrder]);

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      // Build API query parameters
      const params = new URLSearchParams();
      
      const qVal = searchParams.get("q") || "";
      if (qVal) params.append("q", qVal);
      
      if (filterType !== "all") {
        params.append("type", filterType);
      }
      
      selectedOS.forEach(os => params.append("operatingSystem", os));
      selectedArch.forEach(arch => params.append("architecture", arch));
      
      params.append("sort", sortOrder);

      const res = await fetch(`${API_URL}/api/repositories?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRepos(data.repositories);
        setTotalCount(data.pagination.total);
      }
    } catch (err) {
      console.error("Fetch repos failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (query.trim()) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    router.replace(`/explore?${params.toString()}`);
  };

  const handleOSChange = (os: string) => {
    setSelectedOS(prev => 
      prev.includes(os) ? prev.filter(x => x !== os) : [...prev, os]
    );
  };

  const handleArchChange = (arch: string) => {
    setSelectedArch(prev =>
      prev.includes(arch) ? prev.filter(x => x !== arch) : [...prev, arch]
    );
  };

  // Humanize pull counts e.g., 4.5B, 12M
  const formatNumber = (num: number) => {
    if (num >= 1e9) {
      return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    }
    if (num >= 1e6) {
      return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1e3) {
      return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
      
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Explore Containers</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {totalCount} public repositories matching filters
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
          <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-docker-blue/40 transition-all">
            <Search className="absolute left-3.5 text-slate-400" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search images, developers or namespaces..."
              className="w-full bg-transparent pl-10 pr-4 py-2.5 text-xs focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
            />
            <button type="submit" className="hidden" />
          </div>
        </form>
      </div>

      {/* Main Grid: Filters Sidebar + Results List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Filters */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-6">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <SlidersHorizontal size={16} className="text-docker-blue" />
              <span className="font-bold text-xs">Filter Repositories</span>
            </div>

            {/* Publisher Type */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Publisher Type</span>
              <div className="space-y-1.5 text-xs">
                {[
                  { id: "all", label: "All Publishers" },
                  { id: "official", label: "Docker Official Images" },
                  { id: "verified", label: "Verified Publishers" },
                  { id: "community", label: "Community Builders" },
                ].map(type => (
                  <label key={type.id} className="flex items-center space-x-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="filterType"
                      checked={filterType === type.id}
                      onChange={() => setFilterType(type.id)}
                      className="text-docker-blue focus:ring-docker-blue border-slate-300 dark:border-slate-800 bg-transparent"
                    />
                    <span className={filterType === type.id ? "text-slate-900 dark:text-white" : "text-slate-500"}>
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Operating System */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operating System</span>
              <div className="space-y-1.5 text-xs">
                {osOptions.map(os => (
                  <label key={os} className="flex items-center space-x-2 cursor-pointer font-medium capitalize">
                    <input
                      type="checkbox"
                      checked={selectedOS.includes(os)}
                      onChange={() => handleOSChange(os)}
                      className="rounded text-docker-blue focus:ring-docker-blue border-slate-300 dark:border-slate-800 bg-transparent"
                    />
                    <span className={selectedOS.includes(os) ? "text-slate-900 dark:text-white" : "text-slate-500"}>
                      {os}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Architecture */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Architecture</span>
              <div className="space-y-1.5 text-xs">
                {archOptions.map(arch => (
                  <label key={arch} className="flex items-center space-x-2 cursor-pointer font-medium uppercase">
                    <input
                      type="checkbox"
                      checked={selectedArch.includes(arch)}
                      onChange={() => handleArchChange(arch)}
                      className="rounded text-docker-blue focus:ring-docker-blue border-slate-300 dark:border-slate-800 bg-transparent"
                    />
                    <span className={selectedArch.includes(arch) ? "text-slate-900 dark:text-white" : "text-slate-500"}>
                      {arch}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results List */}
        <section className="lg:col-span-9 space-y-4">
          
          {/* Sorting Row */}
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs">
            <span className="text-slate-500 font-medium">Sorted by popularity</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-transparent font-bold text-docker-blue focus:outline-none cursor-pointer"
            >
              <option value="pulls">Most Pulls</option>
              <option value="stars">Most Stars</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>

          {/* Results Cards */}
          {loading ? (
            // Skeleton Loader
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                </div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
            ))
          ) : repos.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <SlidersHorizontal size={20} />
              </div>
              <h2 className="font-bold text-sm">No repositories found</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try widening your filters or modifying your text query string.
              </p>
            </div>
          ) : (
            repos.map((repo) => (
              <div
                key={repo.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md hover:border-docker-blue/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
              >
                {/* Details */}
                <div className="space-y-2.5 flex-1">
                  
                  {/* Name + Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/repository/${repo.namespace}/${repo.name}`}
                      className="font-extrabold text-sm text-slate-900 dark:text-white hover:text-docker-blue dark:hover:text-blue-400 transition-colors"
                    >
                      {repo.namespace}/{repo.name}
                    </Link>

                    {repo.isOfficial && (
                      <span className="inline-flex items-center space-x-1 bg-blue-500/10 text-docker-blue border border-blue-400/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 size={10} />
                        <span>Docker Official</span>
                      </span>
                    )}

                    {repo.isVerified && (
                      <span className="inline-flex items-center space-x-1 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-400/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        <ShieldCheck size={10} />
                        <span>Verified Publisher</span>
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl line-clamp-2">
                    {repo.description || "No description provided."}
                  </p>

                  {/* Meta Stats Row */}
                  <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center space-x-1">
                      <Download size={12} className="text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300 font-bold">{formatNumber(repo.pullCount)}</span>
                      <span>Pulls</span>
                    </span>
                    
                    <span className="flex items-center space-x-1">
                      <Star size={12} className="text-amber-500" />
                      <span className="text-slate-600 dark:text-slate-300 font-bold">{repo.starCount}</span>
                      <span>Stars</span>
                    </span>

                    <span>Updated {new Date(repo.lastUpdated).toLocaleDateString()}</span>
                  </div>

                  {/* Tech Specs (Arch/OS tags) */}
                  <div className="flex items-center space-x-1.5 pt-1">
                    {repo.operatingSystems.map(os => (
                      <span key={os} className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 uppercase">
                        {os}
                      </span>
                    ))}
                    {repo.architectures.map(arch => (
                      <span key={arch} className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 uppercase">
                        {arch}
                      </span>
                    ))}
                  </div>

                </div>

                {/* Call-to-action Arrow */}
                <div className="shrink-0 flex items-center justify-end">
                  <Link
                    href={`/repository/${repo.namespace}/${repo.name}`}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 group-hover:text-docker-blue group-hover:border-docker-blue/40 group-hover:bg-blue-50/20 dark:group-hover:bg-blue-950/20 transition-all"
                  >
                    <ChevronRight size={18} />
                  </Link>
                </div>

              </div>
            ))
          )}

        </section>

      </div>

    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-950 min-h-screen">Loading Explore...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
