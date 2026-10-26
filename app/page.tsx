import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Code2,
  Lock,
  Coins,
  CheckCircle2,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { INITIAL_SERVICES } from "@/lib/seed-data";
import { formatAtomicToUsd } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Glow Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-300 mb-6">
          <Zap className="h-3.5 w-3.5 text-blue-400" />
          <span>Powered by x402 Protocol V2 on Base Sepolia</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
          Turn Every API Request Into a{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400">
            Payment.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Discover services, monetize APIs, and let autonomous AI agents pay for exactly what they use with HTTP-native micro-settlements.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/marketplace">
            <Button variant="gradient" size="lg" className="shadow-lg shadow-blue-500/20">
              Explore Marketplace
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/provider/services">
            <Button variant="secondary" size="lg">
              Publish an API
            </Button>
          </Link>
          <Link href="/developer/docs">
            <Button variant="outline" size="lg">
              View x402 Docs
            </Button>
          </Link>
        </div>

        {/* Hero Code Snippet / Protocol Demo */}
        <div className="mt-14 max-w-3xl mx-auto rounded-xl border border-slate-800 bg-slate-950/90 shadow-2xl overflow-hidden text-left font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/70" />
              <span className="h-3 w-3 rounded-full bg-amber-500/70" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
              <span className="ml-2 text-slate-400 text-[11px]">HTTP Payment Negotiation Flow</span>
            </div>
            <span className="text-slate-500 text-[11px]">x402 RFC Specification</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <span className="text-slate-500"># 1. AI Agent queries protected service (Unpaid)</span>
              <p className="text-blue-400">GET /api/paid/weather?city=Tokyo HTTP/1.1</p>
            </div>
            <div>
              <span className="text-slate-500"># 2. Server intercepts & returns HTTP 402 with terms</span>
              <p className="text-amber-400">HTTP/1.1 402 Payment Required</p>
              <p className="text-slate-400 truncate">PAYMENT-REQUIRED: eyJ4NDAyVmVyc2lvbiI6MiwiYWNjZXB0cyI6W3sic2NoZW1lIjoiZXhhY3QiLCJuZXR3b3JrIjoiZWlwMTU1Ojg0NTMyIi...&#125;</p>
            </div>
            <div>
              <span className="text-slate-500"># 3. Agent wallet cryptographically signs EIP-3009 transfer & retries</span>
              <p className="text-blue-400">GET /api/paid/weather?city=Tokyo HTTP/1.1</p>
              <p className="text-indigo-400 truncate">PAYMENT-SIGNATURE: eyJ4NDAyVmVyc2lvbiI6MiwiYWNjZXB0ZWQiOnsic2NoZW1lIjoiZXhhY3QiLCJuZXR3b3JrIjoiZWlwMTU1Ojg0NTMyIi...&#125;</p>
            </div>
            <div>
              <span className="text-slate-500"># 4. Facilitator settles transaction; resource returned</span>
              <p className="text-emerald-400">HTTP/1.1 200 OK</p>
              <p className="text-emerald-400/90 truncate">PAYMENT-RESPONSE: eyJzdWNjZXNzIjp0cnVlLCJuZXR3b3JrIjoiZWlwMTU1Ojg0NTMyIiwidHJhbnNhY3Rpb24iOiIweDY4Zj...&#125;</p>
              <p className="text-slate-300">&#123; &quot;city&quot;: &quot;Tokyo&quot;, &quot;condition&quot;: &quot;Clear&quot;, &quot;temperatureCelsius&quot;: 18 &#125;</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-slate-800/60 bg-slate-950/40 py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              How AgentPay x402 Works
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              No subscription tiers, no monthly invoices, no API keys to revoke. Individual requests settle via cryptographic transfer authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 relative group hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm mb-4 border border-blue-500/20">
                01
              </div>
              <h3 className="font-semibold text-white text-base mb-2">Publish or Discover</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Providers register API endpoints with exact per-request pricing. AI agents discover endpoints programmatically or via marketplace tags.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 relative group hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm mb-4 border border-amber-500/20">
                02
              </div>
              <h3 className="font-semibold text-white text-base mb-2">402 Negotiation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unpaid requests return HTTP 402 with structured <code className="text-amber-300">PAYMENT-REQUIRED</code> headers outlining asset, amount, and recipient.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 relative group hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm mb-4 border border-indigo-500/20">
                03
              </div>
              <h3 className="font-semibold text-white text-base mb-2">Wallet Authorization</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The agent wallet enforces client spending limits, builds an EIP-3009 transfer authorization, and signs it cryptographically.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 relative group hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm mb-4 border border-emerald-500/20">
                04
              </div>
              <h3 className="font-semibold text-white text-base mb-2">Settlement & Delivery</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The facilitator verifies and settles the payment on-chain. The resource handler executes and delivers the protected response.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Demonstration Services */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <Badge variant="cyan" className="mb-2">Demonstration Endpoints</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Real Locally Executable Paid Services
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Test live HTTP 402 paywalls and cryptographic settlement right now.
            </p>
          </div>
          <Link href="/marketplace">
            <Button variant="outline" size="sm">
              View All Services
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INITIAL_SERVICES.map((service) => (
            <Card key={service.id} className="flex flex-col justify-between hover:border-slate-700 transition-colors group">
              <CardHeader>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {service.category.replace("_", " ")}
                  </Badge>
                  <span className="text-xs font-semibold text-emerald-400 font-mono">
                    {formatAtomicToUsd(service.price)}
                  </span>
                </div>
                <CardTitle className="text-base group-hover:text-blue-400 transition-colors">
                  {service.name}
                </CardTitle>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  {service.description}
                </p>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="rounded-lg bg-slate-950 p-2.5 font-mono text-[11px] text-slate-400 flex items-center justify-between border border-slate-800">
                  <span className="text-blue-400">{service.endpointPath}</span>
                  <span className="text-slate-500">USDC</span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/marketplace/${service.slug}`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full">
                      Try with x402
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Security Architecture Section */}
      <section className="border-t border-slate-800/60 bg-slate-950/60 py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="success" className="mb-3">Security & Trust Architecture</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                Designed for Autonomous Agent Security and Financial Safety
              </h2>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                AgentPay enforces strict payment security boundaries. Private keys never touch our servers or frontend bundles. Every transfer requires explicit cryptographic authorization with domain and nonce bindings.
              </p>

              <div className="mt-6 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Authoritative Server Pricing:</strong> Prices and recipients are verified strictly against authoritative server databases; client-submitted amounts are never trusted.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Replay & Nonce Protection:</strong> EIP-3009 single-use nonces and short expiration windows prevent duplicate charging or replay attacks.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Client Spending Limits:</strong> Configurable monthly and per-request caps safeguard agent budgets from unexpected consumption.</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>Protocol Verification Checklist</span>
              </div>
              <div className="space-y-2 text-xs font-mono text-slate-300">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 flex justify-between">
                  <span>x402 Protocol Version:</span>
                  <span className="text-cyan-400">2.0 (Header Transport)</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 flex justify-between">
                  <span>EVM Payment Scheme:</span>
                  <span className="text-cyan-400">exact (EIP-3009 / viem)</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 flex justify-between">
                  <span>Default Network:</span>
                  <span className="text-cyan-400">eip155:84532 (Base Sepolia)</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 flex justify-between">
                  <span>Facilitator Settlement:</span>
                  <span className="text-cyan-400">Deterministic / Verified Broadcast</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
