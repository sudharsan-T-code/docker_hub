"use client";

import React from "react";
import { Check, Star } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const plans = [
    {
      name: "Personal",
      price: "0",
      desc: "Great for individual developers, open source contributors, and learners.",
      features: [
        "Unlimited Public Repositories",
        "1 Private Repository",
        "200 pulls per 6 hours rate limit",
        "Community Support",
        "Local Docker CLI login"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "5",
      desc: "For professional developers who need private registry environments and automated builds.",
      features: [
        "Everything in Personal",
        "Unlimited Private Repositories",
        "5000 pulls per day rate limit",
        "Advanced vulnerability scanning alerts",
        "Repository analytics & trends",
        "Standard Email Support"
      ],
      cta: "Upgrade to Pro",
      popular: true
    },
    {
      name: "Team",
      price: "25",
      desc: "Perfect for growing teams and startups coordinating multi-developer pipelines.",
      features: [
        "Everything in Pro",
        "Unlimited organization members",
        "Custom role-based access control (RBAC)",
        "5 parallel automated build queues",
        "Premium SLA support response times"
      ],
      cta: "Choose Team Plan",
      popular: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex-grow relative">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Docker Hub Pricing Plans</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
          Choose the right plan to distribute, scan, and deploy your containerized applications. Free tier available for open source projects.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`glass-panel rounded-3xl p-8 flex flex-col justify-between shadow-sm relative transition-all ${
              plan.popular
                ? "border-2 border-docker-blue ring-4 ring-docker-blue/10 scale-105"
                : "border border-slate-200 dark:border-slate-800"
            }`}
          >
            {plan.popular && (
              <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-docker-blue text-white px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center space-x-1">
                <Star size={10} className="fill-current" />
                <span>Most Popular</span>
              </span>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{plan.desc}</p>
              </div>

              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold tracking-tight">${plan.price}</span>
                <span className="text-slate-400 text-xs ml-2">/ month</span>
              </div>

              <ul className="space-y-3.5 border-t border-slate-100 dark:border-slate-800 pt-6 text-xs">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start space-x-2.5 text-slate-600 dark:text-slate-300">
                    <Check size={14} className="text-docker-blue shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8 mt-auto">
              <Link
                href="/register"
                className={`block w-full py-3.5 rounded-xl text-center text-xs font-bold transition-all ${
                  plan.popular
                    ? "bg-docker-blue text-white hover:bg-blue-600 shadow-md"
                    : "border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                {plan.cta}
              </Link>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
