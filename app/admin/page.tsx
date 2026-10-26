"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAtomicToUsd, formatAddress } from "@/lib/utils";
import {
  ShieldAlert,
  Users,
  Server,
  Activity,
  Coins,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
} from "lucide-react";

export default function AdminPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Administrator authorization required");
      return res.json();
    },
  });

  const { data: servicesData } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const res = await fetch("/api/admin/services");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to moderate service");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          This portal is restricted to authorized platform administrators. Please sign in with an administrative account.
        </p>
        <Link href="/login">
          <Button variant="default">Sign In as Admin</Button>
        </Link>
      </div>
    );
  }

  const metrics = data?.metrics;

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <Badge variant="destructive" className="mb-2 font-mono">
            Platform Administration
          </Badge>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Governance & Moderation</h1>
          <p className="mt-1 text-sm text-slate-400">
            System health surveillance, service moderation, payment attempt tracking, and audit log analysis.
          </p>
        </div>
        <Badge variant="success" className="font-mono text-xs">
          System: {metrics?.systemHealth || "ONLINE"}
        </Badge>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Registered Users</span>
              <Users className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {isLoading ? "..." : metrics?.totalUsers || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Consumers and API Providers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Catalog Services</span>
              <Server className="h-4 w-4 text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {isLoading ? "..." : metrics?.totalServices || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Published API listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Settled Volume</span>
              <Coins className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {isLoading ? "..." : formatAtomicToUsd(metrics?.totalVolumeAtomic || "0")}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Total on-chain settled USDC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Payment Failures</span>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {isLoading ? "..." : metrics?.failedPaymentAttempts || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Rejected or invalid attempts</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Moderation Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-400" />
            Service Moderation & Listing Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Network</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {servicesData?.services?.map((svc: any) => (
                  <tr key={svc.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 text-white font-sans font-medium">{svc.name}</td>
                    <td className="py-3 px-4 text-slate-400">{svc.slug}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">{formatAtomicToUsd(svc.price)}</td>
                    <td className="py-3 px-4 text-slate-400">{svc.network}</td>
                    <td className="py-3 px-4">
                      <Badge variant={svc.status === "PUBLISHED" ? "success" : "secondary"}>
                        {svc.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {svc.status === "PUBLISHED" ? (
                        <Button
                          variant="danger"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={() =>
                            moderateMutation.mutate({ id: svc.id, status: "SUSPENDED" })
                          }
                        >
                          Suspend Listing
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={() =>
                            moderateMutation.mutate({ id: svc.id, status: "PUBLISHED" })
                          }
                        >
                          Approve & Publish
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Stream */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            Platform Audit Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-xs">
            {data?.recentAuditLogs?.map((log: any) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-[10px]">
                    {log.action}
                  </Badge>
                  <span className="text-slate-300 font-sans text-xs">
                    Resource: {log.resourceType} ({log.resourceId})
                  </span>
                </div>
                <span className="text-slate-500 text-[11px]">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
