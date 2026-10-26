"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatAtomicToUsd, formatAddress, getExplorerUrl } from "@/lib/utils";
import {
  Search,
  ExternalLink,
  Shield,
  Clock,
  Layers,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function TransactionsExplorerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", searchTerm, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: searchTerm,
        status: statusFilter,
        page: page.toString(),
        limit: "15",
      });
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load transactions");
      return res.json();
    },
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <Badge variant="cyan" className="mb-2 font-mono">
            Settlement Ledger
          </Badge>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Transaction Explorer</h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time auditable record of x402 payment authorizations, verifications, and on-chain settlements.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by Tx ID, wallet, or txHash..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SETTLED">SETTLED</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                  <th className="py-3 px-4">Internal Tx ID</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payer</th>
                  <th className="py-3 px-4">Network</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Settlement TxHash</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : data?.transactions?.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No matching transactions found.
                    </td>
                  </tr>
                ) : (
                  data?.transactions?.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-slate-200 font-semibold">
                        {tx.id.slice(0, 16)}...
                      </td>
                      <td className="py-3 px-4 text-white font-sans font-medium">
                        {tx.serviceName}
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">
                        {formatAtomicToUsd(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {formatAddress(tx.payerAddress)}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">{tx.network}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={tx.status === "SETTLED" ? "success" : "secondary"}
                          className="text-[10px]"
                        >
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {tx.transactionHash ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 truncate max-w-[120px]">
                              {tx.transactionHash}
                            </span>
                            {tx.explorerUrl && (
                              <a
                                href={tx.explorerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(tx.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTx(tx)}
                          className="h-7 px-2 text-[11px]"
                        >
                          Inspect
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

      {/* Transaction Details Modal / Drawer */}
      <Modal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Transaction Details"
        description="Comprehensive cryptographic settlement and audit payload."
      >
        {selectedTx && (
          <div className="space-y-4 text-xs font-mono">
            <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>Internal Transaction ID:</span>
                <span className="text-white font-bold">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Service:</span>
                <span className="text-white font-sans">{selectedTx.serviceName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Settled Amount:</span>
                <span className="text-emerald-400 font-bold">{formatAtomicToUsd(selectedTx.amount)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Network:</span>
                <span className="text-cyan-400">{selectedTx.network}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Status:</span>
                <Badge variant={selectedTx.status === "SETTLED" ? "success" : "secondary"}>
                  {selectedTx.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Execution Mode:</span>
                <span className="text-slate-300">
                  {selectedTx.isSimulated ? "Simulated Test Settlement" : "Live On-Chain Settlement"}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-800 space-y-2">
              <div>
                <span className="text-slate-500 block text-[10px]">Payer Address:</span>
                <span className="text-slate-200 break-all">{selectedTx.payerAddress}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Recipient Wallet:</span>
                <span className="text-slate-200 break-all">{selectedTx.recipientAddress}</span>
              </div>
              {selectedTx.transactionHash && (
                <div>
                  <span className="text-slate-500 block text-[10px]">Blockchain Tx Hash:</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-blue-400 break-all">{selectedTx.transactionHash}</span>
                    {selectedTx.explorerUrl && (
                      <a
                        href={selectedTx.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:underline shrink-0"
                      >
                        Basescan ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedTx(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
