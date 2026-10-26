import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address?: string | null): string {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAtomicToUsd(atomicUnits: string | number, decimals: number = 6): string {
  try {
    const val = typeof atomicUnits === "string" ? BigInt(atomicUnits) : BigInt(Math.floor(atomicUnits));
    const factor = BigInt(10 ** decimals);
    const whole = val / factor;
    const remainder = val % factor;
    const paddedRemainder = remainder.toString().padStart(decimals, "0").slice(0, 4);
    const formatted = `${whole}.${paddedRemainder}`;
    // Trim trailing zeroes but keep at least 2 decimals
    const num = parseFloat(formatted);
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  } catch {
    return `$0.00`;
  }
}

export function formatAtomicToUsdc(atomicUnits: string | number, decimals: number = 6): string {
  try {
    const val = typeof atomicUnits === "string" ? BigInt(atomicUnits) : BigInt(Math.floor(atomicUnits));
    const factor = BigInt(10 ** decimals);
    const whole = val / factor;
    const remainder = val % factor;
    const paddedRemainder = remainder.toString().padStart(decimals, "0");
    const formatted = `${whole}.${paddedRemainder}`.replace(/0+$/, "").replace(/\.$/, "");
    return `${formatted} USDC`;
  } catch {
    return `0 USDC`;
  }
}

export function parseUsdToAtomic(usdStr: string, decimals: number = 6): string {
  const clean = usdStr.replace(/[^0-9.]/g, "");
  const [whole = "0", fraction = ""] = clean.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  const bigIntVal = BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction);
  return bigIntVal.toString();
}

export function getExplorerUrl(network: string, txHash?: string | null): string | null {
  if (!txHash) return null;
  if (txHash.startsWith("0xsim_")) {
    return null; // Simulated transaction - do not link to real explorer
  }
  if (network === "eip155:84532" || network === "base-sepolia") {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  }
  if (network === "eip155:8453" || network === "base") {
    return `https://basescan.org/tx/${txHash}`;
  }
  if (network === "eip155:1" || network === "ethereum") {
    return `https://etherscan.io/tx/${txHash}`;
  }
  return null;
}
