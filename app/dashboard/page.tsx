"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAtomicToUsd, formatAddress, getExplorerUrl } from "@/lib/utils";
import {
  Wallet,
  Coins,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  PieChart,
  Layers,
  ExternalLink,
} from "lucide-react";

export default function ConsumerDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["consumer-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/consumer");
      if (!res.ok) throw new Error("Failed to load dashboard data");
      return res.json();
    },
  });

  const dashboard = data?.data;

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <Badge variant="cyan" className="mb-2 font-mono">
            Consumer Analytics
          </Badge>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Agent Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor API micro-payments, spending limits, and settled request history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/transactions">
            <Button variant="outline" size="sm">
              All Transactions
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="default" size="sm">
              Explore APIs
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Micro-Purchases</span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {isLoading ? "..." : dashboard?.totalPurchases || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Successfully settled x402 requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Spending</span>
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <Coins className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {isLoading ? "..." : formatAtomicToUsd(dashboard?.totalSpentAtomic || "0")}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Verified on Base Sepolia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Configured Spend Limit</span>
              <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              ${dashboard?.spendingLimitUsd || 100}
            </div>
            <Link href="/settings" className="text-[11px] text-blue-400 hover:underline mt-1 inline-block">
              Adjust spending rules →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Spending by Service & Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spending by Service */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              Spending by API Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.spendingByService?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.spendingByService.map((item: any) => (
                  <div
                    key={item.serviceId}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">{item.serviceName}</span>
                      <span className="text-slate-500 text-[10px]">{item.count} settled requests</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatAtomicToUsd(item.amountAtomic)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No purchases recorded yet. Visit the marketplace to make your first paid request.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4 text-violet-400" />
              Payment Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.statusDistribution ? (
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(dashboard.statusDistribution).map(([status, count]) => (
                  <div
                    key={status}
                    className="rounded-lg bg-slate-950/60 p-3 border border-slate-800 flex items-center justify-between"
                  >
                    <span className="text-slate-400 font-mono text-[11px]">{status}</span>
                    <span className="font-bold text-white font-mono">{count as number}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No activity distribution available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              Recent Paid Transactions
            </CardTitle>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="text-xs">
                View All →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {dashboard?.recentTransactions?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2">Tx Identifier</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Network</th>
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {dashboard.recentTransactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 font-semibold text-slate-200">
                        {tx.id.slice(0, 16)}...
                      </td>
                      <td className="py-2.5 text-emerald-400 font-bold">
                        {formatAtomicToUsd(tx.amount)}
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant={tx.status === "SETTLED" ? "success" : "secondary"}
                          className="text-[10px]"
                        >
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-slate-400 text-[11px]">{tx.network}</td>
                      <td className="py-2.5 text-slate-500 text-[11px]">
                        {new Date(tx.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link href={`/transactions?q=${tx.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
                            Inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              No transactions recorded for this wallet or account.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
