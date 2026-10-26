"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatAtomicToUsd, formatAddress } from "@/lib/utils";
import {
  Plus,
  Server,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { DEMO_PROVIDER_WALLET } from "@/lib/seed-data";

export default function ServiceManagementPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("AI_INFERENCE");
  const [endpointPath, setEndpointPath] = useState("/api/paid/custom-agent");
  const [priceAtomic, setPriceAtomic] = useState("15000"); // $0.015
  const [recipientAddress, setRecipientAddress] = useState(DEMO_PROVIDER_WALLET);

  const { data, isLoading } = useQuery({
    queryKey: ["provider-services"],
    queryFn: async () => {
      const res = await fetch("/api/provider/services");
      if (!res.ok) throw new Error("Failed to load services");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/provider/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to create service");
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-services"] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setErrorMsg(err.message);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const res = await fetch(`/api/provider/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update service status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-services"] });
    },
  });

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setErrorMsg("");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    createMutation.mutate({
      name,
      slug,
      description,
      category,
      endpointPath,
      price: priceAtomic,
      recipientAddress,
      network: "eip155:84532",
    });
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <Badge variant="cyan" className="mb-2 font-mono">
            Service Catalog Management
          </Badge>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Registered Services</h1>
          <p className="mt-1 text-sm text-slate-400">
            Publish, configure, and manage payment-protected endpoints for agent consumption.
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Register New Service
        </Button>
      </div>

      {/* Services Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                  <th className="py-3 px-4">Service Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading services...
                    </td>
                  </tr>
                ) : data?.services?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No services registered yet. Click &quot;Register New Service&quot; above.
                    </td>
                  </tr>
                ) : (
                  data?.services?.map((svc: any) => (
                    <tr key={svc.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 text-white font-sans font-medium">
                        {svc.name}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{svc.slug}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {svc.category.replace("_", " ")}
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">
                        {formatAtomicToUsd(svc.price)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {formatAddress(svc.recipientAddress)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={svc.status === "PUBLISHED" ? "success" : "secondary"}
                        >
                          {svc.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link href={`/marketplace/${svc.slug}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-[11px]">
                            Test
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: svc.id,
                              newStatus: svc.status === "PUBLISHED" ? "SUSPENDED" : "PUBLISHED",
                            })
                          }
                        >
                          {svc.status === "PUBLISHED" ? "Suspend" : "Publish"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Register Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New API Service"
        description="Publish a payment-protected endpoint to the AgentPay marketplace."
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs font-sans">
          <div>
            <label className="text-slate-400 font-medium block mb-1">Service Display Name</label>
            <Input
              placeholder="e.g., Autonomous Financial Sentiment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Unique URL Slug</label>
            <Input
              placeholder="e.g., financial-sentiment-api"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              required
            />
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Description</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              placeholder="Detailed description of input/output data for consumers and AI agents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-xs text-slate-100"
              >
                <option value="AI_INFERENCE">AI Inference</option>
                <option value="DATA_FEEDS">Data Feeds</option>
                <option value="FINANCIAL">Financial</option>
                <option value="UTILITY">Utility</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Price (atomic USDC units)</label>
              <Input
                placeholder="10000 = $0.01 USDC"
                value={priceAtomic}
                onChange={(e) => setPriceAtomic(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Recipient EVM Wallet Address</label>
            <Input
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Endpoint Path (SSRF Protected)</label>
            <Input
              value={endpointPath}
              onChange={(e) => setEndpointPath(e.target.value)}
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Protected endpoints must begin with /api/paid/ to adhere to platform safety boundaries.
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Publish Service"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
