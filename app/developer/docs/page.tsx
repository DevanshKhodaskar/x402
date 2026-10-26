"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Terminal,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  ExternalLink,
  BookOpen,
} from "lucide-react";

export default function DeveloperDocsPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const curlExample = `# 1. Initial request to payment-protected service (receives HTTP 402)
curl -i http://localhost:3000/api/paid/weather?city=Tokyo

# 2. Extract PAYMENT-REQUIRED base64 header from response
# Inspect: scheme=exact, network=eip155:84532, amount=10000 ($0.01 USDC), payTo=0x...

# 3. Retry request with PAYMENT-SIGNATURE header containing signed EIP-3009 authorization
curl -i http://localhost:3000/api/paid/weather?city=Tokyo \\
  -H "PAYMENT-SIGNATURE: eyJ4NDAyVmVyc2lvbiI6MiwiYWNjZXB0ZWQiOnsic2NoZW1lIjoiZXhhY3Qi...&#125;"`;

  const tsClientExample = `import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { createWalletClient, custom } from "viem";
import { baseSepolia } from "viem/chains";

// Initialize client with EVM signer & spend controls
const client = x402Client.fromConfig({
  schemes: [
    { network: "eip155:84532", client: new ExactEvmScheme(walletSigner) },
  ],
  spendControls: {
    maxAmountPerPayment: "$1.00", // Enforce maximum per-request ceiling
  },
});

// Step 1: Initial unauthenticated request returns HTTP 402
const res = await fetch("http://localhost:3000/api/paid/weather?city=Tokyo");

if (res.status === 402) {
  // Step 2: Extract payment requirements from PAYMENT-REQUIRED header
  const reqs = client.getPaymentRequiredResponse(
    (name) => res.headers.get(name)
  );

  // Step 3: Authorize payment via wallet
  const paymentPayload = await client.createPaymentPayload(reqs);

  // Step 4: Retry with PAYMENT-SIGNATURE header
  const paidResponse = await fetch("http://localhost:3000/api/paid/weather?city=Tokyo", {
    headers: client.encodePaymentSignatureHeader(paymentPayload),
  });

  const data = await paidResponse.json();
  console.log("Protected data:", data);
}`;

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-12">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <Badge variant="cyan" className="mb-2 font-mono">
          Developer Integration Guide
        </Badge>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          x402 Protocol Documentation
        </h1>
        <p className="mt-1 text-sm text-slate-400 max-w-2xl">
          Complete reference for integrating payment-protected APIs into autonomous AI agents, LLM tool-calling pipelines, and web applications.
        </p>
      </div>

      {/* Grid: Main Content & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2 text-xs font-mono">
          <span className="text-slate-500 font-bold uppercase tracking-wider block mb-2">Sections</span>
          <a href="#overview" className="block p-2 rounded-lg text-slate-300 hover:bg-slate-900">
            1. Protocol Overview
          </a>
          <a href="#headers" className="block p-2 rounded-lg text-slate-300 hover:bg-slate-900">
            2. x402 V2 Transport Headers
          </a>
          <a href="#curl" className="block p-2 rounded-lg text-slate-300 hover:bg-slate-900">
            3. cURL Integration
          </a>
          <a href="#typescript" className="block p-2 rounded-lg text-slate-300 hover:bg-slate-900">
            4. TypeScript SDK Example
          </a>
          <a href="#errors" className="block p-2 rounded-lg text-slate-300 hover:bg-slate-900">
            5. Error Codes & Paywalls
          </a>
          <a href="#testing" className="block p-2 rounded-lg text-slate-300 hover:bg-slate-900">
            6. Execution Modes (A vs B)
          </a>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-10 text-sm leading-relaxed text-slate-300">
          {/* Section 1: Overview */}
          <section id="overview" className="space-y-3">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-400" />
              1. Protocol Overview
            </h2>
            <p>
              The <strong>x402 payment protocol</strong> connects internet HTTP requests directly with cryptographic payment authorization and settlement. It repurposes the standard HTTP <code className="text-amber-400">402 Payment Required</code> status code to enable machine-to-machine, pay-per-request commerce without subscription logins or manual checkout flows.
            </p>
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/10 text-xs text-blue-200">
              <strong>Core Distinction:</strong> x402 is not a cryptocurrency or blockchain. It is an open protocol standard governed under the x402 Foundation that specifies how resource servers and clients negotiate payment requirements, authorizations, and settlements over HTTP headers.
            </div>
          </section>

          {/* Section 2: Headers */}
          <section id="headers" className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Terminal className="h-5 w-5 text-indigo-400" />
              2. Official x402 V2 HTTP Headers
            </h2>
            <p>
              In version 2 of the x402 protocol, all payment negotiations take place strictly in HTTP headers encoded as Base64 JSON strings:
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span>PAYMENT-REQUIRED</span>
                  <span className="text-[10px] text-slate-500">Server → Client (with HTTP 402)</span>
                </div>
                <p className="text-slate-400 font-sans text-xs">
                  Carries the accepted payment options: scheme (<code className="text-amber-300">exact</code>), network CAIP-2 (<code className="text-amber-300">eip155:84532</code>), asset address (USDC), amount in atomic units, and recipient wallet address.
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                <div className="flex items-center justify-between text-indigo-400 font-bold">
                  <span>PAYMENT-SIGNATURE</span>
                  <span className="text-[10px] text-slate-500">Client → Server (on Retry)</span>
                </div>
                <p className="text-slate-400 font-sans text-xs">
                  Carries the cryptographic proof authorizing payment. For EVM chains, this contains an EIP-3009 <code className="text-indigo-300">transferWithAuthorization</code> signature matching the accepted requirement.
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>PAYMENT-RESPONSE</span>
                  <span className="text-[10px] text-slate-500">Server → Client (with HTTP 200)</span>
                </div>
                <p className="text-slate-400 font-sans text-xs">
                  Attached to the final delivered resource upon verified settlement, reporting transaction hash, settlement timestamp, payer, and confirmation status.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: cURL Example */}
          <section id="curl" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Code2 className="h-5 w-5 text-cyan-400" />
                3. cURL Integration
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(curlExample, 1)}
                className="h-7 text-xs"
              >
                {copiedIndex === 1 ? <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copiedIndex === 1 ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800">
              {curlExample}
            </pre>
          </section>

          {/* Section 4: TypeScript Example */}
          <section id="typescript" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Code2 className="h-5 w-5 text-blue-400" />
                4. TypeScript SDK Client Example
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(tsClientExample, 2)}
                className="h-7 text-xs"
              >
                {copiedIndex === 2 ? <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copiedIndex === 2 ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800">
              {tsClientExample}
            </pre>
          </section>

          {/* Section 5: Errors */}
          <section id="errors" className="space-y-3">
            <h2 className="text-xl font-bold text-white tracking-tight">
              5. Standard Application Error Codes
            </h2>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-amber-400">PAYMENT_REQUIRED</span>
                <span className="text-slate-400 font-sans">Initial unauthenticated request (HTTP 402)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-rose-400">PAYMENT_EXPIRED</span>
                <span className="text-slate-400 font-sans">Authorization validBefore timestamp elapsed</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-rose-400">INSUFFICIENT_AMOUNT</span>
                <span className="text-slate-400 font-sans">Signed amount is less than service price</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-rose-400">RECIPIENT_MISMATCH</span>
                <span className="text-slate-400 font-sans">Recipient does not match service payTo</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-rose-400">NONCE_REUSED</span>
                <span className="text-slate-400 font-sans">Replay protection triggered on used nonce</span>
              </div>
            </div>
          </section>

          {/* Section 6: Execution Modes */}
          <section id="testing" className="space-y-3">
            <h2 className="text-xl font-bold text-white tracking-tight">
              6. Execution Modes (Mode A vs Mode B)
            </h2>
            <p>
              AgentPay strictly differentiates between local test execution and live testnet broadcast:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <h3 className="font-bold text-blue-400">Mode A: Local Dev & Automated Tests</h3>
                <p className="text-slate-400">
                  Operates using an in-process mock facilitator. Verifies signature structure without transferring real assets. Produces deterministic pseudo-hashes (<code className="text-slate-300">0xsim_...</code>) clearly flagged as simulated.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <h3 className="font-bold text-emerald-400">Mode B: Real Base Sepolia Testnet</h3>
                <p className="text-slate-400">
                  Connects to the Base Sepolia RPC (<code className="text-slate-300">eip155:84532</code>). Settles on-chain via the official USDC contract with facilitator wallet broadcast, producing live Basescan transaction hashes.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
