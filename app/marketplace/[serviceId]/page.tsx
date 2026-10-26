"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ApiTester } from "@/components/api-tester";
import { formatAtomicToUsd, formatAddress } from "@/lib/utils";
import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  Clock,
  Layers,
  Code2,
  ExternalLink,
  Coins,
  Server,
} from "lucide-react";

export default function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = use(params);

  // Fetch service details
  const { data: serviceData, isLoading, error } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: async () => {
      const res = await fetch(`/api/services/${serviceId}`);
      if (!res.ok) throw new Error("Service not found");
      return res.json();
    },
  });

  // Fetch usage metrics
  const { data: usageData } = useQuery({
    queryKey: ["service-usage", serviceId],
    queryFn: async () => {
      const res = await fetch(`/api/services/${serviceId}/usage`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!serviceData?.service?.id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="h-96 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse" />
      </div>
    );
  }

  if (error || !serviceData?.service) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Service Not Found</h2>
        <p className="text-sm text-slate-400">The requested API service listing could not be found or has been suspended.</p>
        <Link href="/marketplace">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  const service = serviceData.service;
  const isPost = service.endpointPath.includes("text-analysis");

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/marketplace"
          className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to Marketplace
        </Link>
      </div>

      {/* Header Info Banner */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-800/80 pb-8">
        <div className="space-y-3 max-w-3xl">
          <div className="flex items-center gap-2">
            <Badge variant="cyan" className="font-mono text-xs uppercase">
              {service.category.replace("_", " ")}
            </Badge>
            {service.isDemo && (
              <Badge variant="secondary" className="text-xs">
                Demo Service
              </Badge>
            )}
            <Badge variant="success" className="text-xs">
              x402 V2 Enabled
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{service.name}</h1>
          <p className="text-sm text-slate-300 leading-relaxed">{service.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <span>Provider: <strong className="text-white">{service.providerName}</strong></span>
            <span>Recipient: <code className="font-mono text-slate-300">{formatAddress(service.recipientAddress)}</code></span>
            <span>Network: <strong className="font-mono text-blue-400">{service.network}</strong></span>
          </div>
        </div>

        {/* Price Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 md:w-72 shrink-0 space-y-3">
          <span className="text-xs text-slate-400 block">Unit Cost Per Request</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white font-mono">{formatAtomicToUsd(service.price)}</span>
            <span className="text-xs text-slate-400 font-mono">USDC</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {service.price} atomic units (10⁻⁶)
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Scheme</span>
            <span className="font-mono text-cyan-400">exact (EIP-3009)</span>
          </div>
        </div>
      </div>

      {/* Grid: Interactive Tester & Technical Spec */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Interactive Tester (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Live Endpoint Execution</h2>
          </div>

          <ApiTester service={service} />

          {/* Usage Metrics Card */}
          {usageData?.metrics && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Service Telemetry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Total Calls</span>
                    <span className="text-base font-bold text-white">{usageData.metrics.totalRequests}</span>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Settled Txs</span>
                    <span className="text-base font-bold text-emerald-400">{usageData.metrics.totalSettledTransactions}</span>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Avg Latency</span>
                    <span className="text-base font-bold text-cyan-400">{usageData.metrics.averageLatencyMs} ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: API Reference Documentation (1 col) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Endpoint Specification</h2>
          </div>

          <Card className="border-slate-800 bg-slate-900/40 space-y-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Protocol Headers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold block">1. 402 Paywall Response</span>
                <p className="text-[11px] text-slate-500">Includes Base64 requirement object:</p>
                <div className="rounded bg-slate-950 p-2 text-amber-300 border border-slate-800 text-[11px]">
                  PAYMENT-REQUIRED: &lt;base64&gt;
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold block">2. Client Retry Request</span>
                <p className="text-[11px] text-slate-500">Includes Base64 signed authorization:</p>
                <div className="rounded bg-slate-950 p-2 text-indigo-300 border border-slate-800 text-[11px]">
                  PAYMENT-SIGNATURE: &lt;base64&gt;
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold block">3. Final Settlement Header</span>
                <p className="text-[11px] text-slate-500">Attached to HTTP 200 response:</p>
                <div className="rounded bg-slate-950 p-2 text-emerald-300 border border-slate-800 text-[11px]">
                  PAYMENT-RESPONSE: &lt;base64&gt;
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integration Curl Example */}
          <Card className="border-slate-800 bg-slate-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Raw HTTP Request</CardTitle>
            </CardHeader>
            <CardContent className="text-xs font-mono">
              <pre className="p-3 rounded-lg bg-slate-950 text-slate-300 overflow-x-auto border border-slate-800 text-[11px]">
                {isPost
                  ? `curl -i -X POST http://localhost:3000${service.endpointPath} \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Sample"}'`
                  : `curl -i http://localhost:3000${service.endpointPath}`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
