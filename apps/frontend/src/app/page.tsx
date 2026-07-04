"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Shield, Zap, RefreshCw, Layers, Award, Terminal as TermIcon, ArrowRight, Activity } from "lucide-react";
import { useApp } from "./layout";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const { liveActivity } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/explore");
    }
  };

  // Card Animation settings
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="relative overflow-hidden min-h-screen">
      
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px] dark:bg-blue-600/5 -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/10 blur-[120px] dark:bg-cyan-600/5 -z-10 pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 px-3.5 py-1.5 rounded-full text-xs font-semibold text-docker-blue">
              <Award size={14} />
              <span>Docker Hub Enterprise Clone</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none">
              Find and Share <br />
              <span className="bg-gradient-to-r from-docker-blue to-cyan-500 bg-clip-text text-transparent">
                Container Images
              </span> <br />
              Globally
            </h1>
            
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl leading-relaxed">
              The world's leading community registry for developers. Search, build, secure, and deploy images across public clouds, Kubernetes clusters, and local machines.
            </p>

            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="max-w-2xl">
              <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-2 focus-within:ring-2 focus-within:ring-docker-blue/40 transition-all">
                <Search className="absolute left-4 text-slate-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search millions of images (e.g. ubuntu, nginx, redis)..."
                  className="w-full bg-transparent pl-12 pr-4 py-3 text-sm focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-docker-blue text-white text-sm font-semibold hover:bg-blue-600 transition-all shadow-md shrink-0"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="flex items-center space-x-6 text-xs text-slate-400 font-medium">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                <span>Docker API V2 Active</span>
              </span>
              <span>•</span>
              <span>12.5B+ Container Pulls</span>
              <span>•</span>
              <span>5.4M+ Repositories Hosted</span>
            </div>
          </div>

          {/* Hero Right: 3D Rotating Cube Graphic & Live Activity Log */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-10">
            
            {/* 3D Cube animation wrapper */}
            <div className="cube-wrapper h-44 flex items-center justify-center">
              <div className="cube">
                <div className="cube-face cube-face-front">ubuntu</div>
                <div className="cube-face cube-face-back">nginx</div>
                <div className="cube-face cube-face-left">redis</div>
                <div className="cube-face cube-face-right">alpine</div>
                <div className="cube-face cube-face-top">postgres</div>
                <div className="cube-face cube-face-bottom">node</div>
              </div>
            </div>

            {/* Live Terminal Activity Stream */}
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-docker-blue to-cyan-500" />
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center space-x-2">
                  <TermIcon size={14} className="text-docker-blue" />
                  <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Activity Pipeline</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-red-500/80" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                  <div className="w-2 h-2 rounded-full bg-green-500/80" />
                </div>
              </div>
              <div className="h-44 overflow-y-auto space-y-2.5 font-mono text-[10px] leading-relaxed text-slate-300 pr-1 select-none">
                {liveActivity.length === 0 ? (
                  <p className="text-slate-500 text-center pt-10">Awaiting container events from docker daemon...</p>
                ) : (
                  liveActivity.map((activity, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start space-x-1.5"
                    >
                      <span className="text-blue-500">$</span>
                      <div className="flex-1">
                        <span className="text-green-400">[{activity.action}]</span>{" "}
                        <span className="font-semibold text-slate-100">{activity.namespace}/{activity.image}:{activity.tag}</span>
                        <p className="text-slate-400 pl-4">{activity.message}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Section Grid */}
      <section className="bg-slate-50/50 dark:bg-slate-900/30 py-20 border-y border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Enterprise Infrastructure Ecosystem</h2>
            <p className="text-slate-500 dark:text-slate-400">
              Docker Hub provides standard developer operations pipelines out of the box to share, distribute, and test containers securely.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Card 1 */}
            <motion.div
              variants={itemVariants}
              className="glass-panel p-6 rounded-2xl shadow-sm hover:shadow-lg hover:border-docker-blue/40 transition-all flex flex-col space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-docker-blue">
                <Award size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Docker Official Images</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Curated set of secure, base infrastructure configurations like Ubuntu, Alpine, Nginx, PostgreSQL, Node, Redis, and Python.
              </p>
              <Link href="/explore?type=official" className="text-xs font-semibold text-docker-blue inline-flex items-center hover:underline mt-auto">
                Explore Official Images <ArrowRight size={14} className="ml-1" />
              </Link>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              variants={itemVariants}
              className="glass-panel p-6 rounded-2xl shadow-sm hover:shadow-lg hover:border-docker-blue/40 transition-all flex flex-col space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Verified Publishers</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Container images packaged and signed by trusted application developers like Bitnami, Red Hat, Oracle, MongoDB, and CircleCI.
              </p>
              <Link href="/explore?type=verified" className="text-xs font-semibold text-docker-blue inline-flex items-center hover:underline mt-auto">
                Explore Verified Banners <ArrowRight size={14} className="ml-1" />
              </Link>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              variants={itemVariants}
              className="glass-panel p-6 rounded-2xl shadow-sm hover:shadow-lg hover:border-docker-blue/40 transition-all flex flex-col space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Continuous Delivery & Hooks</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Automatically build images from GitHub triggers, deploy testing sequences, run vulnerability alerts, and integrate with Kubernetes webhooks.
              </p>
              <a href="#" className="text-xs font-semibold text-docker-blue inline-flex items-center hover:underline mt-auto">
                Read Integration Docs <ArrowRight size={14} className="ml-1" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Numerical Metrics Section */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-docker-blue/10 blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <p className="text-4xl sm:text-5xl font-extrabold text-docker-blue">4.5B+</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Nginx Pulls</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl sm:text-5xl font-extrabold text-cyan-400">15.4K</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Ubuntu Stars</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl sm:text-5xl font-extrabold text-emerald-400">250K+</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Active Developers</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl sm:text-5xl font-extrabold text-violet-400">20M+</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Docker Builds/Day</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold">Ready to distribute your container images?</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Create an account to host public registry builds for free, or secure private image pipelines for your engineering team.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Link
            href="/register"
            className="px-6 py-3 rounded-xl bg-docker-blue text-white text-sm font-semibold hover:bg-blue-600 transition-all shadow-md"
          >
            Get Started for Free
          </Link>
          <Link
            href="/explore"
            className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
          >
            Explore Public Hub
          </Link>
        </div>
      </section>

    </div>
  );
}
