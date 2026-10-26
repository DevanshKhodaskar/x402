"use client";

import { useState } from "react";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useWallet } from "./providers";
import { Wallet, ShieldCheck, Zap, ExternalLink } from "lucide-react";
import { DEMO_CONSUMER_WALLET } from "@/lib/seed-data";

export function WalletConnectModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { connect, isConnected, address, disconnect } = useWallet();
  const [customAddress, setCustomAddress] = useState("");
  const [error, setError] = useState("");

  const handleConnectSimulated = () => {
    connect(DEMO_CONSUMER_WALLET);
    onClose();
  };

  const handleConnectInjected = async () => {
    setError("");
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts && accounts[0]) {
          connect(accounts[0]);
          onClose();
        }
      } catch (err: any) {
        setError(err.message || "Failed to connect browser wallet");
      }
    } else {
      setError("No EVM browser wallet detected. You can use the Simulated Agent Wallet.");
    }
  };

  const handleConnectCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddress.startsWith("0x") || customAddress.length !== 42) {
      setError("Please enter a valid 42-character 0x EVM address");
      return;
    }
    connect(customAddress);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect EVM Wallet"
      description="Connect a wallet to authorize x402 micropayments on Base Sepolia."
    >
      <div className="space-y-4">
        {isConnected ? (
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Connected Address</span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Base Sepolia
              </span>
            </div>
            <p className="font-mono text-sm text-white break-all">{address}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                disconnect();
                onClose();
              }}
              className="w-full text-rose-400 hover:text-rose-300 hover:border-rose-500/40"
            >
              Disconnect Wallet
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handleConnectSimulated}
                className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-left hover:bg-blue-500/20 transition-all cursor-pointer group"
              >
                <div className="rounded-lg bg-blue-500/20 p-2.5 text-blue-400 group-hover:scale-105 transition-transform">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    Simulated Agent Wallet
                    <span className="text-[10px] uppercase font-semibold bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Preloaded test identity with zero gas required. Ideal for exploring and executing local x402 payments.
                  </p>
                </div>
              </button>

              <button
                onClick={handleConnectInjected}
                className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left hover:border-slate-700 hover:bg-slate-800/40 transition-all cursor-pointer group"
              >
                <div className="rounded-lg bg-slate-800 p-2.5 text-slate-300 group-hover:scale-105 transition-transform">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Browser Wallet (MetaMask / Coinbase)</div>
                  <p className="text-xs text-slate-400 mt-1">
                    Sign EIP-3009 TransferWithAuthorization directly from your browser extension on Base Sepolia.
                  </p>
                </div>
              </button>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">Or specify address</span>
              </div>
            </div>

            <form onSubmit={handleConnectCustom} className="space-y-3">
              <Input
                placeholder="0x..."
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
              />
              <Button type="submit" variant="secondary" className="w-full">
                Set Public Address
              </Button>
            </form>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                {error}
              </p>
            )}
          </>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-800">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>Non-custodial. Private keys and seed phrases are never stored or transmitted.</span>
        </div>
      </div>
    </Modal>
  );
}
