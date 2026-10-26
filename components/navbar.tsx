"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { WalletConnectModal } from "./wallet-connect-modal";
import { useWallet } from "./providers";
import { formatAddress } from "@/lib/utils";
import {
  Zap,
  Layers,
  LayoutDashboard,
  Code2,
  Settings,
  Shield,
  ArrowRight,
  LogOut,
  User,
  ExternalLink,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { isConnected, address } = useWallet();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setSessionUser(data.user);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSessionUser(null);
    window.location.href = "/";
  };

  const navLinks = [
    { name: "Marketplace", href: "/marketplace" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Explorer", href: "/transactions" },
    { name: "Provider", href: "/provider" },
    { name: "Docs", href: "/developer/docs" },
  ];

  if (sessionUser?.role === "ADMIN") {
    navLinks.push({ name: "Admin", href: "/admin" });
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5 text-white fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  AgentPay
                  <span className="text-[10px] font-mono font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-1 rounded">
                    x402
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline -mt-0.5">Pay-per-request API Commerce</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-slate-800/80 text-white"
                        : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Network pill */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs font-mono text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              Base Sepolia
            </div>

            {/* Wallet button */}
            <Button
              variant={isConnected ? "outline" : "default"}
              size="sm"
              onClick={() => setIsWalletModalOpen(true)}
              className="font-mono text-xs"
            >
              {isConnected ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {formatAddress(address)}
                </span>
              ) : (
                "Connect Wallet"
              )}
            </Button>

            {/* User Session Action */}
            {sessionUser ? (
              <div className="flex items-center gap-2">
                <Link href="/settings">
                  <Button variant="ghost" size="icon" title="Settings" className="text-slate-400 hover:text-white">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" size="sm" className="text-xs hidden sm:inline-flex">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}
