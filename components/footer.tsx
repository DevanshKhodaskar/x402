import Link from "next/link";
import { Zap, Github, BookOpen, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Zap className="h-4 w-4" />
              </div>
              <span className="font-bold text-white text-base">AgentPay</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pay per request. Build without boundaries. An AI agent marketplace built natively on the x402 payment protocol.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Network: Base Sepolia (eip155:84532)
            </div>
          </div>

          {/* Protocol Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Protocol & Specs</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a
                  href="https://x402.org"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  Official x402 Foundation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  x402 V2 Specification
                </a>
              </li>
              <li>
                <Link href="/developer/docs" className="hover:text-blue-400 transition-colors">
                  Developer Integration Guide
                </Link>
              </li>
              <li>
                <Link href="/transactions" className="hover:text-blue-400 transition-colors">
                  Transaction Explorer
                </Link>
              </li>
            </ul>
          </div>

          {/* Marketplace */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Marketplace</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/marketplace" className="hover:text-blue-400 transition-colors">
                  Browse APIs
                </Link>
              </li>
              <li>
                <Link href="/marketplace/weather-api" className="hover:text-blue-400 transition-colors">
                  Global Weather Feed
                </Link>
              </li>
              <li>
                <Link href="/marketplace/text-analysis-api" className="hover:text-blue-400 transition-colors">
                  Text & Sentiment NLP
                </Link>
              </li>
              <li>
                <Link href="/marketplace/premium-dataset-api" className="hover:text-blue-400 transition-colors">
                  Agent Benchmark Corpus
                </Link>
              </li>
              <li>
                <Link href="/provider/services" className="hover:text-blue-400 transition-colors">
                  Monetize Your API
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Compliance */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Security & Trust</h4>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="h-4 w-4" />
                Non-Custodial x402 Architecture
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Never stores private keys or seed phrases. All micro-transfers execute via cryptographic EIP-3009 authorizations.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© 2026 AgentPay. Built with the open x402 standard.</div>
          <div className="flex items-center gap-4">
            <Link href="/developer/docs" className="hover:text-slate-300">
              API Docs
            </Link>
            <Link href="/settings" className="hover:text-slate-300">
              Spending Limits
            </Link>
            <Link href="/admin" className="hover:text-slate-300">
              Platform Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
