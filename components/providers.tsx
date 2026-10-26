"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, createContext, useContext, useEffect } from "react";

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  network: string;
  isConnecting: boolean;
  connect: (address?: string) => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState>({
  address: null,
  isConnected: false,
  network: "eip155:84532",
  isConnecting: false,
  connect: () => {},
  disconnect: () => {},
});

export const useWallet = () => useContext(WalletContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 30,
      },
    },
  }));

  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>("eip155:84532");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Restore wallet from localStorage if available
    const saved = localStorage.getItem("agentpay_wallet");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.address) {
          setAddress(parsed.address);
          if (parsed.network) setNetwork(parsed.network);
        }
      } catch {}
    }
  }, []);

  const connect = (customAddress?: string) => {
    setIsConnecting(true);
    // Use demo consumer address or custom passed address
    const targetAddress = customAddress || "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
    setAddress(targetAddress);
    setIsConnecting(false);
    localStorage.setItem(
      "agentpay_wallet",
      JSON.stringify({ address: targetAddress, network })
    );
  };

  const disconnect = () => {
    setAddress(null);
    localStorage.removeItem("agentpay_wallet");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <WalletContext.Provider
        value={{
          address,
          isConnected: !!address,
          network,
          isConnecting,
          connect,
          disconnect,
        }}
      >
        {children}
      </WalletContext.Provider>
    </QueryClientProvider>
  );
}
