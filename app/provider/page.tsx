"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAtomicToUsd, formatAddress } from "@/lib/utils";
import {
  Coins,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  Server,
  Activity,
  Plus,
} from "lucide-react";

export default function ProviderDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["provider-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/provider/analytics");
      if (!res.ok) throw new Error("Failed to load provider analytics");
      return res.json();
    },
  });

  const analytics = data?.analytics;

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <Badge variant="cyan" className="mb-2 font-mono">
            Provider Monetization
          </Badge>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Provider Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Track micro-metered earnings, settled API calls, and service monetization performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/provider/services">
            <Button variant="default" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Manage Services
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Gross Revenue</span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Coins className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {isLoading ? "..." : formatAtomicToUsd(analytics?.grossRevenueAtomic || "0")}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Confirmed settled payments only</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Settled Requests</span>
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {isLoading ? "..." : analytics?.totalSettledPurchases || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Successful paid deliveries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Active Services</span>
              <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                <Server className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {isLoading ? "..." : analytics?.totalServices || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Monetized endpoints</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Failed Attempts</span>
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {isLoading ? "..." : analytics?.failedPaymentAttempts || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Rejected authorizations (not counted)</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Safety Notice */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400 flex items-start gap-3">
        <Activity className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Settlement Accountability:</strong> Only cryptographically verified and successfully settled payments are recognized as revenue. Unpaid requests, expired authorizations, or rejected attempts are logged for observability but are strictly excluded from balances. (Note: x402 on-chain micro-transfers are final; refund or chargeback reversal schemes are not supported by the base protocol).
        </div>
      </div>

      {/* Revenue Breakdown by Service */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            Revenue Breakdown by Registered Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.revenueByService?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2">Service Name</th>
                    <th className="pb-2">Endpoint Slug</th>
                    <th className="pb-2">Settled Calls</th>
                    <th className="pb-2 text-right">Settled Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analytics.revenueByService.map((item: any) => (
                    <tr key={item.serviceId} className="hover:bg-slate-900/40">
                      <td className="py-3 font-sans font-medium text-white">{item.serviceName}</td>
                      <td className="py-3 text-slate-400">{item.slug}</td>
                      <td className="py-3 text-slate-300">{item.settledTransactions}</td>
                      <td className="py-3 text-right text-emerald-400 font-bold">
                        {formatAtomicToUsd(item.revenueAtomic)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              No services registered yet. Click &quot;Manage Services&quot; to publish your first API.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
