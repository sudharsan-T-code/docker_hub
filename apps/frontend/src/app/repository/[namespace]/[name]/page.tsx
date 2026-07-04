"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp, API_URL } from "../../../layout";
import { Star, Download, Copy, Check, Terminal, FileCode, Shield, Activity, List, ChevronRight, Award, ShieldCheck, User, RefreshCw } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  digest: string;
  compressedSize: number;
  lastPushed: string;
  pushedBy: string | null;
  os: string;
  arch: string;
  layers: number;
}

interface PullMetric {
  id: string;
  timestamp: string;
  pullCount: number;
}

interface RepositoryDetail {
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
  readme: string | null;
  dockerfile: string | null;
  architectures: string[];
  operatingSystems: string[];
  tags: Tag[];
  pulls: PullMetric[];
}

export default function RepositoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useApp();
  
  const namespace = params.namespace as string;
  const name = params.name as string;

  const [repo, setRepo] = useState<RepositoryDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("general");
  const [isStarred, setIsStarred] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Vulnerability details mock state
  const vulnerabilities = [
    { id: "CVE-2024-22019", severity: "HIGH", pkg: "openssl", version: "3.0.2-0ubuntu1.10", fixed: "3.0.2-0ubuntu1.15", desc: "Resource exhaustion vulnerability in OpenSSL RSA signature validation." },
    { id: "CVE-2023-45853", severity: "MEDIUM", pkg: "zlib", version: "1.2.11.dfsg-2ubuntu9.2", fixed: "1.2.11.dfsg-2ubuntu9.3", desc: "Buffer overflow issue in zlib deflate algorithm." },
    { id: "CVE-2024-1023", severity: "LOW", pkg: "libc-bin", version: "2.35-0ubuntu3.4", fixed: null, desc: "Minor out-of-bounds read in dynamic loader configuration." }
  ];

  useEffect(() => {
    fetchRepoDetails();
    if (token) {
      checkStarStatus();
    }
  }, [namespace, name, token]);

  const fetchRepoDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/api/repositories/${namespace}/${name}`);
      if (res.ok) {
        const data = await res.json();
        setRepo(data);
      } else {
        router.push("/explore");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkStarStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/repositories/${namespace}/${name}/star-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsStarred(data.starred);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStar = async () => {
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/repositories/${namespace}/${name}/star`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsStarred(data.starred);
        if (repo) {
          setRepo({ ...repo, starCount: data.starCount });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = () => {
    const cmd = `docker pull ${namespace === "library" ? "" : namespace + "/"}${name}:latest`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8 flex-grow">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="lg:col-span-4 h-40 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (!repo) return null;

  // Custom SVG Graph points calculation
  const pullHistory = repo.pulls || [];
  const maxPullVal = Math.max(...pullHistory.map(p => p.pullCount), 100);
  const minPullVal = Math.min(...pullHistory.map(p => p.pullCount), 0);
  const chartHeight = 160;
  const chartWidth = 500;
  
  const svgPoints = pullHistory.map((p, idx) => {
    const x = (idx / (pullHistory.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((p.pullCount - minPullVal) / (maxPullVal - minPullVal || 1)) * chartHeight;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
      
      {/* Repo Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-slate-800 pb-6 mb-8 gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xl font-extrabold tracking-tight">
              {repo.namespace}/{repo.name}
            </span>
            {repo.isOfficial && (
              <span className="inline-flex items-center space-x-1.5 bg-blue-500/10 text-docker-blue border border-blue-400/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                <Award size={10} />
                <span>Docker Official</span>
              </span>
            )}
            {repo.isVerified && (
              <span className="inline-flex items-center space-x-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-400/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck size={10} />
                <span>Verified Publisher</span>
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            {repo.description || "No description provided."}
          </p>
          <div className="flex items-center space-x-4 text-[10px] text-slate-400 font-semibold">
            <span className="flex items-center space-x-1">
              <Download size={12} />
              <span className="text-slate-700 dark:text-slate-300">{(repo.pullCount).toLocaleString()}</span>
              <span>Pulls</span>
            </span>
            <span className="flex items-center space-x-1">
              <Star size={12} className="text-amber-500" />
              <span className="text-slate-700 dark:text-slate-300">{repo.starCount}</span>
              <span>Stars</span>
            </span>
            <span>Last Pushed {new Date(repo.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Button: Star */}
        <button
          onClick={toggleStar}
          className={`flex items-center space-x-2 px-4.5 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
            isStarred
              ? "bg-amber-500 border-amber-600 text-white hover:bg-amber-600"
              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
          }`}
        >
          <Star size={14} className={isStarred ? "fill-current text-white" : "text-amber-500"} />
          <span>{isStarred ? "Starred" : "Star"}</span>
        </button>
      </div>

      {/* Main Grid: Info Tabs + Sidebar Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Tabs Console */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
            {[
              { id: "general", label: "Readme", icon: List },
              { id: "tags", label: "Tags", icon: RefreshCw },
              { id: "dockerfile", label: "Dockerfile", icon: FileCode },
              { id: "security", label: "Security", icon: Shield },
              { id: "analytics", label: "Analytics", icon: Activity }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-4.5 py-3 border-b-2 -mb-[2px] transition-colors ${
                  activeTab === tab.id
                    ? "border-docker-blue text-docker-blue"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <tab.icon size={13} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 min-h-[300px]">
            
            {/* Readme Panel */}
            {activeTab === "general" && (
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <div className="space-y-4">
                  {repo.readme ? (
                    <div className="whitespace-pre-line">{repo.readme}</div>
                  ) : (
                    <p className="text-slate-400">No README documentation provided for this repository.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tags Panel */}
            {activeTab === "tags" && (
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Available Tags</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {repo.tags && repo.tags.length > 0 ? (
                    repo.tags.map((tag) => (
                      <div key={tag.id} className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="font-bold text-docker-blue dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-[10px]">
                            {tag.name}
                          </span>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                            <span>Pushed by {tag.pushedBy || "cli"}</span>
                            <span>•</span>
                            <span>{new Date(tag.lastPushed).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-[10px] text-slate-500 dark:text-slate-400">
                          <div>
                            <p className="font-bold text-slate-700 dark:text-slate-300">{formatSize(tag.compressedSize)}</p>
                            <p className="text-[9px] text-slate-400">Compressed Size</p>
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 dark:text-slate-300">{tag.layers} Layers</p>
                            <p className="text-[9px] text-slate-400">Image Layers</p>
                          </div>
                          <div className="hidden md:block">
                            <p className="font-mono text-slate-400 truncate max-w-[120px]">{tag.digest}</p>
                            <p className="text-[9px] text-slate-400">Digest</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-6">No tags uploaded yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Dockerfile Panel */}
            {activeTab === "dockerfile" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-xs">
                  <span className="font-semibold text-slate-400">Dockerfile instruction reference</span>
                </div>
                <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                  <code>{repo.dockerfile || "FROM scratch\n# Empty dockerfile"}</code>
                </pre>
              </div>
            )}

            {/* Security Panel */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Vulnerability scanning dashboard</h3>
                  <div className="flex items-center space-x-2 text-[10px]">
                    <span className="bg-red-500/15 border border-red-500/30 text-red-500 px-2 py-0.5 rounded font-bold">1 HIGH</span>
                    <span className="bg-amber-500/15 border border-amber-500/30 text-amber-500 px-2 py-0.5 rounded font-bold">1 MEDIUM</span>
                    <span className="bg-blue-500/15 border border-blue-500/30 text-blue-500 px-2 py-0.5 rounded font-bold">1 LOW</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {vulnerabilities.map(v => (
                    <div key={v.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-4 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                      <div className={`mt-0.5 shrink-0 px-2 py-0.5 rounded text-[9px] font-bold ${
                        v.severity === "HIGH" 
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20" 
                          : v.severity === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                      }`}>
                        {v.severity}
                      </div>
                      <div className="space-y-1.5 flex-grow">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{v.id}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 font-semibold">{v.pkg} (version {v.version})</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">{v.desc}</p>
                        {v.fixed && (
                          <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold">Fixed in version {v.fixed}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Panel */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Total pulls count metrics (Historical 10 days)</h3>
                  <p className="text-[10px] text-slate-400">Visualization of download spikes over docker registry connection pipelines.</p>
                </div>

                {pullHistory.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-center">
                      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                        {/* Grid Lines */}
                        <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1" />
                        <line x1="0" y1={chartHeight/2} x2={chartWidth} y2={chartHeight/2} stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1" />
                        <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1" />
                        
                        {/* Trend Area */}
                        <path
                          d={`M0,${chartHeight} L${svgPoints} L${chartWidth},${chartHeight} Z`}
                          fill="url(#gradient)"
                          opacity="0.15"
                        />
                        {/* Trend Line */}
                        <polyline
                          fill="none"
                          stroke="#1d63ed"
                          strokeWidth="2.5"
                          points={svgPoints}
                        />

                        {/* Defs for gradient */}
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#1d63ed" />
                            <stop offset="100%" stopColor="#1d63ed" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                        <p className="font-extrabold text-sm text-slate-800 dark:text-white">{(repo.pullCount).toLocaleString()}</p>
                        <p className="text-[9px] text-slate-400">Total Pulled</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                        <p className="font-extrabold text-sm text-slate-800 dark:text-white">{(maxPullVal).toLocaleString()}</p>
                        <p className="text-[9px] text-slate-400">Peak pulls/day</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-6">No historical pull data for this repository yet.</p>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Right Column - Pull Command Panel & Meta Information */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Pull Command copy component */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-sm space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Terminal size={12} className="text-docker-blue" />
              <span>Docker Pull Command</span>
            </span>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs select-all font-mono justify-between text-slate-200">
              <span className="truncate pr-4">
                docker pull {namespace === "library" ? "" : namespace + "/"}{name}:latest
              </span>
              <button
                onClick={copyToClipboard}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors shrink-0"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Repository Properties */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 text-xs">
            <h4 className="font-bold border-b border-slate-100 dark:border-slate-800 pb-2 text-[10px] uppercase tracking-wider text-slate-400">Properties</h4>
            
            <div className="space-y-4">
              {/* Maintainer Info */}
              <div>
                <p className="text-[10px] text-slate-400 font-semibold mb-1">Developer Namespace</p>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-docker-blue">
                    <User size={14} />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{repo.namespace}</span>
                </div>
              </div>

              {/* Supported Platforms */}
              <div>
                <p className="text-[10px] text-slate-400 font-semibold mb-1.5">Supported Architectures</p>
                <div className="flex flex-wrap gap-1.5">
                  {repo.architectures.map(arch => (
                    <span key={arch} className="bg-slate-100 dark:bg-slate-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase text-slate-500">
                      {arch}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-semibold mb-1.5">Supported OS Platforms</p>
                <div className="flex flex-wrap gap-1.5">
                  {repo.operatingSystems.map(os => (
                    <span key={os} className="bg-slate-100 dark:bg-slate-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase text-slate-500">
                      {os}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
