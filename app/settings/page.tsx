"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/components/providers";
import { formatAddress } from "@/lib/utils";
import {
  Settings,
  ShieldCheck,
  Wallet,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { address, isConnected } = useWallet();

  const [displayName, setDisplayName] = useState("");
  const [spendingLimit, setSpendingLimit] = useState("100");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Please log in to manage settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.settings) {
      setDisplayName(data.settings.displayName || "");
      setSpendingLimit(data.settings.spendingLimit?.toString() || "100");
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to update settings");
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    updateMutation.mutate({
      displayName,
      spendingLimit: parseFloat(spendingLimit) || 100,
    });
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <Badge variant="cyan" className="mb-2 font-mono">
          Preferences & Controls
        </Badge>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Account & Spending Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure server-enforced agent spending controls, default network settings, and wallet associations.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-400" />
              Agent Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Nexus AI Agent Alpha"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Account Role</label>
                <Input
                  value={data?.settings?.role || "CONSUMER"}
                  disabled
                  className="text-slate-400 bg-slate-950"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spending Controls Card (Strict Requirement) */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Server-Side Spending Limit
              </CardTitle>
              <Badge variant="success">Enforced</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Maximum Single Payment Cap ($ USDC)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max="10000"
                value={spendingLimit}
                onChange={(e) => setSpendingLimit(e.target.value)}
                required
              />
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Any x402 payment request that exceeds this threshold is rejected server-side before signature verification or facilitator dispatch.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Association Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-cyan-400" />
              Connected EVM Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">Active Signer Address:</span>
                <span className="text-slate-200">{isConnected ? address : "No browser wallet connected"}</span>
              </div>
              <Badge variant={isConnected ? "success" : "secondary"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Wallet association uses challenge-response verification. Private keys are never requested.</span>
            </div>
          </CardContent>
        </Card>

        {/* Network Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-400" />
              Network Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Default Target Network:</span>
              <span className="text-blue-400 font-bold">eip155:84532 (Base Sepolia)</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Default Settlement Asset:</span>
              <span className="text-emerald-400 font-bold">0x036CbD53842c5426634e7929541eC2318f3dCF7e (USDC)</span>
            </div>
          </CardContent>
        </Card>

        {errorMsg && (
          <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Settings updated successfully!</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" variant="default" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </form>
    </div>
  );
}
