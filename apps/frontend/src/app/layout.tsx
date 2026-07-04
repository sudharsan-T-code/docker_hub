"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Inter } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sun, Moon, Bell, Menu, X, Check, Award, ShieldAlert, LogOut, Terminal, User as UserIcon, Settings as SettingsIcon } from "lucide-react";
import "./globals.css";

// Shared API URL config
export const API_URL = "http://localhost:5000";
export const WS_URL = "ws://localhost:5000/ws";

// Shared Interfaces
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  createdAt: string;
}

// Auth & App Context
interface AppContextType {
  user: User | null;
  token: string | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  login: (token: string, userData: User) => void;
  logout: () => void;
  notifications: Notification[];
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  liveActivity: any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [liveActivity, setLiveActivity] = useState<any[]>([]);

  // UI state
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedTheme = localStorage.getItem("theme");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    if (savedTheme === "light") {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Sync token to fetch notifications
  useEffect(() => {
    if (token) {
      refreshNotifications();
    } else {
      setNotifications([]);
    }
  }, [token]);

  // Set up WebSocket for real-time streaming activity feed
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: any;

    function connect() {
      ws = new WebSocket(WS_URL);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "ACTIVITY") {
            setLiveActivity((prev) => [payload.data, ...prev.slice(0, 19)]);
            
            // Auto add notification for our pushes
            if (user && payload.data.namespace === user.username && payload.data.action === "PUSH_COMPLETE") {
              refreshNotifications();
            }
          }
        } catch (err) {
          console.error("WS parse error", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WS connection error", err);
      };

      ws.onclose = () => {
        // Try reconnecting in 5s
        reconnectTimeout = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, [user]);

  const login = (accessToken: string, userData: User) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setShowUserDropdown(false);
    router.push("/");
  };

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  const refreshNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <html lang="en" className="dark">
      <body className="flex flex-col min-h-screen selection:bg-docker-blue selection:text-white transition-colors duration-200">
        <AppContext.Provider
          value={{
            user,
            token,
            darkMode,
            setDarkMode: toggleTheme,
            login,
            logout,
            notifications,
            refreshNotifications,
            markAsRead,
            markAllAsRead,
            liveActivity,
          }}
        >
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              
              {/* Logo & Links */}
              <div className="flex items-center space-x-8">
                <Link href="/" className="flex items-center space-x-2">
                  <svg className="w-8 h-8 text-docker-blue" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.983 11.078h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186h-2.119c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.909 0h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186h-2.119c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.913 0h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186H8.161c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.91 0h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186H5.251c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.911 0h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186H2.34c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm2.911-2.912h2.119c.102 0 .186-.084.186-.186V5.862c0-.102-.084-.186-.186-.186H5.251c-.102 0-.186.084-.186.186v2.118c0 .102.084.186.186.186zm2.91 0h2.119c.102 0 .186-.084.186-.186V5.862c0-.102-.084-.186-.186-.186H8.161c-.102 0-.186.084-.186.186v2.118c0 .102.084.186.186.186zm2.913 0h2.119c.102 0 .186-.084.186-.186V5.862c0-.102-.084-.186-.186-.186h-2.119c-.102 0-.186.084-.186.186v2.118c0 .102.084.186.186.186zm-8.733-2.91h2.119c.102 0 .186-.084.186-.186V2.95c0-.102-.084-.186-.186-.186H8.161c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.913 24.3c-2.483 0-4.043-1.62-4.043-3.502 0-3.324 3.738-3.324 4.542-3.324h12.922c1.782 0 3.013-.807 3.864-2.222.186-.31.39-.757.51-1.047l.116-.279c.148-.352.487-.568.878-.568h2.091c.069 0 .12.078.082.138-.682 1.077-1.391 1.956-2.292 2.766-1.125 1.005-2.73 1.512-4.72 1.512H5.064c-.818 0-1.846.126-1.846.924 0 .546.613.61 1.026.61H20.73c.484 0 .902.327.994.795.143.743.208 1.488.208 2.215 0 2.215-2.484 3.712-4.966 3.712H5.21z"/>
                  </svg>
                  <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    docker <span className="font-light text-docker-blue">hub</span>
                  </span>
                </Link>
                <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <Link href="/explore" className="hover:text-docker-blue transition-colors">Explore</Link>
                  <Link href="/pricing" className="hover:text-docker-blue transition-colors">Pricing</Link>
                  <a href="https://docs.docker.com" target="_blank" rel="noopener noreferrer" className="hover:text-docker-blue transition-colors">Docs</a>
                </nav>
              </div>

              {/* Utility Panel */}
              <div className="flex items-center space-x-4">
                
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                  aria-label="Toggle Theme"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Notifications Bell */}
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                    >
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                          <span className="font-bold text-xs">Notifications</span>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-[10px] text-docker-blue hover:underline font-semibold"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                          ) : (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                onClick={() => markAsRead(n.id)}
                                className={`p-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                  !n.read ? "bg-blue-50/50 dark:bg-blue-950/10" : ""
                                }`}
                              >
                                <div className="flex items-center space-x-1.5 font-bold mb-0.5">
                                  {n.type === "SUCCESS" && <Check size={12} className="text-green-500" />}
                                  {n.type === "WARNING" && <Award size={12} className="text-amber-500" />}
                                  {n.type === "ERROR" && <ShieldAlert size={12} className="text-red-500" />}
                                  <span className={!n.read ? "text-slate-950 dark:text-white" : "text-slate-500"}>{n.title}</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* User Session Buttons */}
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center space-x-2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all focus:outline-none"
                    >
                      <img
                        src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
                        alt={user.username}
                        className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800"
                      />
                      <span className="hidden sm:inline text-xs font-semibold">{user.username}</span>
                    </button>

                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                        <div className="p-3">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.fullName || user.username}</p>
                          <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/dashboard"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center space-x-2 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <UserIcon size={14} />
                            <span>My Dashboard</span>
                          </Link>
                          <Link
                            href="/settings"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center space-x-2 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <SettingsIcon size={14} />
                            <span>Account Settings</span>
                          </Link>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={logout}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-red-600 dark:text-red-400 text-left transition-colors"
                          >
                            <LogOut size={14} />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center space-x-3 text-xs font-semibold">
                    <Link
                      href="/login"
                      className="px-3 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="px-4 py-2 rounded-lg bg-docker-blue text-white hover:bg-blue-600 shadow-sm transition-all"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}

                {/* Mobile Menu Icon */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {showMobileMenu && (
              <div className="md:hidden border-t border-slate-100 dark:border-slate-900 px-4 py-4 space-y-3 bg-white dark:bg-slate-950">
                <Link
                  href="/explore"
                  onClick={() => setShowMobileMenu(false)}
                  className="block text-sm font-medium hover:text-docker-blue"
                >
                  Explore
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setShowMobileMenu(false)}
                  className="block text-sm font-medium hover:text-docker-blue"
                >
                  Pricing
                </Link>
                <a
                  href="https://docs.docker.com"
                  onClick={() => setShowMobileMenu(false)}
                  className="block text-sm font-medium hover:text-docker-blue"
                >
                  Docs
                </a>
                {!user && (
                  <div className="pt-2 flex flex-col space-y-2">
                    <Link
                      href="/login"
                      onClick={() => setShowMobileMenu(false)}
                      className="text-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setShowMobileMenu(false)}
                      className="text-center px-4 py-2 bg-docker-blue text-white rounded-lg text-sm hover:bg-blue-600"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            )}
          </header>

          {/* Page Body */}
          <main className="flex-grow flex flex-col">{children}</main>

          {/* Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-12 text-slate-500 dark:text-slate-400 text-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
              <div className="col-span-2 space-y-3">
                <div className="flex items-center space-x-2 text-slate-800 dark:text-white">
                  <svg className="w-6 h-6 text-docker-blue" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.983 11.078h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186h-2.119c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.909 0h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186h-2.119c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.913 0h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186H8.161c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.91 0h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186H5.251c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.91 0h2.119c.102 0 .186-.084.186-.186V8.775c0-.102-.084-.186-.186-.186H2.34c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm2.911-2.912h2.119c.102 0 .186-.084.186-.186V5.862c0-.102-.084-.186-.186-.186H5.251c-.102 0-.186.084-.186.186v2.118c0 .102.084.186.186.186zm2.91 0h2.119c.102 0 .186-.084.186-.186V5.862c0-.102-.084-.186-.186-.186H8.161c-.102 0-.186.084-.186.186v2.118c0 .102.084.186.186.186zm2.913 0h2.119c.102 0 .186-.084.186-.186V5.862c0-.102-.084-.186-.186-.186h-2.119c-.102 0-.186.084-.186.186v2.118c0 .102.084.186.186.186zm-8.733-2.91h2.119c.102 0 .186-.084.186-.186V2.95c0-.102-.084-.186-.186-.186H8.161c-.102 0-.186.084-.186.186v2.117c0 .102.084.186.186.186zm-2.913 24.3c-2.483 0-4.043-1.62-4.043-3.502 0-3.324 3.738-3.324 4.542-3.324h12.922c1.782 0 3.013-.807 3.864-2.222.186-.31.39-.757.51-1.047l.116-.279c.148-.352.487-.568.878-.568h2.091c.069 0 .12.078.082.138-.682 1.077-1.391 1.956-2.292 2.766-1.125 1.005-2.73 1.512-4.72 1.512H5.064c-.818 0-1.846.126-1.846.924 0 .546.613.61 1.026.61H20.73c.484 0 .902.327.994.795.143.743.208 1.488.208 2.215 0 2.215-2.484 3.712-4.966 3.712H5.21z"/>
                  </svg>
                  <span className="font-extrabold text-sm tracking-tight">docker hub clone</span>
                </div>
                <p className="max-w-sm text-slate-400">
                  Replicating the world's leading container registry with pixel-perfect modern SaaS layouts and fully simulated OCI pipelines.
                </p>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg max-w-[240px]">
                  <Terminal size={14} className="text-docker-blue shrink-0" />
                  <span className="truncate">docker login localhost:5000</span>
                </div>
              </div>
              <div className="space-y-2">
                <span className="font-bold text-slate-900 dark:text-white text-xs">Products</span>
                <ul className="space-y-1.5">
                  <li><Link href="/explore" className="hover:text-docker-blue">Container Registry</Link></li>
                  <li><a href="#" className="hover:text-docker-blue">Security Scanning</a></li>
                  <li><a href="#" className="hover:text-docker-blue">Docker Desktop</a></li>
                  <li><Link href="/pricing" className="hover:text-docker-blue">Pricing plans</Link></li>
                </ul>
              </div>
              <div className="space-y-2">
                <span className="font-bold text-slate-900 dark:text-white text-xs">Developers</span>
                <ul className="space-y-1.5">
                  <li><a href="https://docs.docker.com" className="hover:text-docker-blue">Documentation</a></li>
                  <li><a href="#" className="hover:text-docker-blue">API Reference</a></li>
                  <li><a href="#" className="hover:text-docker-blue">System Status</a></li>
                  <li><a href="#" className="hover:text-docker-blue">Github Repository</a></li>
                </ul>
              </div>
              <div className="space-y-2">
                <span className="font-bold text-slate-900 dark:text-white text-xs">Company</span>
                <ul className="space-y-1.5">
                  <li><a href="#" className="hover:text-docker-blue">About Us</a></li>
                  <li><a href="#" className="hover:text-docker-blue">Careers</a></li>
                  <li><a href="#" className="hover:text-docker-blue">Press Room</a></li>
                  <li><a href="#" className="hover:text-docker-blue">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-slate-100 dark:border-slate-900 text-center text-slate-400">
              <p>&copy; {new Date().getFullYear()} Docker Hub Clone. All rights reserved. Created for demonstration purposes.</p>
            </div>
          </footer>
        </AppContext.Provider>
      </body>
    </html>
  );
}
