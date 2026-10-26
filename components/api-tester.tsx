"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { useWallet } from "./providers";
import { formatAddress, formatAtomicToUsd, getExplorerUrl } from "@/lib/utils";
import {
  HEADER_PAYMENT_REQUIRED,
  HEADER_PAYMENT_SIGNATURE,
  HEADER_PAYMENT_RESPONSE,
  decodeHeaderData,
  encodeHeaderData,
} from "@/lib/x402/headers";
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Shield,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Code2,
  Lock,
  Unlock,
} from "lucide-react";

export interface ApiTesterProps {
  service: {
    id: string;
    slug: string;
    name: string;
    endpointPath: string;
    price: string;
    tokenAddress: string;
    network: string;
    recipientAddress: string;
    isDemo?: boolean;
  };
  defaultInput?: Record<string, any>;
}

export function ApiTester({ service, defaultInput }: ApiTesterProps) {
  const { address, isConnected, connect } = useWallet();

  // Inputs state
  const isPost = service.endpointPath.includes("text-analysis");
  const [cityInput, setCityInput] = useState("Tokyo");
  const [textInput, setTextInput] = useState(
    "AgentPay enables autonomous AI agents to negotiate micro-settlements over HTTP in real time."
  );

  // Execution state
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"IDLE" | "CHALLENGED_402" | "AUTHORIZING" | "SETTLING" | "DELIVERED" | "FAILED">("IDLE");
  const [initialStatus, setInitialStatus] = useState<number | null>(null);
  const [finalStatus, setFinalStatus] = useState<number | null>(null);
  const [paymentRequirements, setPaymentRequirements] = useState<any | null>(null);
  const [settlementInfo, setSettlementInfo] = useState<any | null>(null);
  const [responseData, setResponseData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"response" | "headers" | "lifecycle">("lifecycle");

  // Step 1: Send Initial Request (Unpaid -> triggers 402)
  const executeInitialRequest = async () => {
    setLoading(true);
    setErrorMessage(null);
    setInitialStatus(null);
    setFinalStatus(null);
    setPaymentRequirements(null);
    setSettlementInfo(null);
    setResponseData(null);
    setStep("IDLE");

    let url = service.endpointPath;
    let options: RequestInit = { method: isPost ? "POST" : "GET" };

    if (!isPost && service.endpointPath.includes("weather")) {
      url = `${service.endpointPath}?city=${encodeURIComponent(cityInput)}`;
    } else if (isPost) {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify({ text: textInput });
    }

    try {
      const res = await fetch(url, options);
      setInitialStatus(res.status);

      if (res.status === 402) {
        // Extract PAYMENT-REQUIRED header
        const rawReqHeader =
          res.headers.get(HEADER_PAYMENT_REQUIRED) ||
          res.headers.get(HEADER_PAYMENT_REQUIRED.toLowerCase()) ||
          res.headers.get("X-Payment-Required");

        let decodedReq = decodeHeaderData<any>(rawReqHeader);
        if (!decodedReq) {
          const body = await res.json();
          decodedReq = body.x402;
        }

        setPaymentRequirements(decodedReq);
        setStep("CHALLENGED_402");
      } else {
        // If unexpectedly not 402
        const body = await res.json();
        setResponseData(body);
        setFinalStatus(res.status);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to make request");
      setStep("FAILED");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Authorize Payment & Resend with PAYMENT-SIGNATURE
  const authorizeAndPay = async () => {
    if (!paymentRequirements || !paymentRequirements.accepts?.length) {
      setErrorMessage("No payment requirements available to satisfy.");
      return;
    }

    const payer = address || "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
    if (!address) {
      connect(payer);
    }

    setStep("AUTHORIZING");
    setLoading(true);

    try {
      const req = paymentRequirements.accepts[0];
      const nowSeconds = Math.floor(Date.now() / 1000);
      const nonce = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

      // Simulate client wallet signing EIP-3009 TransferWithAuthorization
      // In real injected wallet, would trigger window.ethereum.request(eth_signTypedData_v4)
      let signature = "0x";
      if (typeof window !== "undefined" && (window as any).ethereum && address && address !== "0x90F79bf6EB2c4f870365E785982E1f101E93b906") {
        try {
          const domain = {
            name: "USD Coin",
            version: "2",
            chainId: 84532,
            verifyingContract: req.asset,
          };
          const types = {
            EIP712Domain: [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" },
            ],
            TransferWithAuthorization: [
              { name: "from", type: "address" },
              { name: "to", type: "address" },
              { name: "value", type: "uint256" },
              { name: "validAfter", type: "uint256" },
              { name: "validBefore", type: "uint256" },
              { name: "nonce", type: "bytes32" },
            ],
          };
          const message = {
            from: payer,
            to: req.payTo,
            value: req.amount,
            validAfter: 0,
            validBefore: nowSeconds + 300,
            nonce,
          };

          signature = await (window as any).ethereum.request({
            method: "eth_signTypedData_v4",
            params: [payer, JSON.stringify({ domain, types, primaryType: "TransferWithAuthorization", message })],
          });
        } catch {
          // If user rejects or injected signer fails, fallback to simulated deterministic test signature
          signature = `0x${Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
        }
      } else {
        // Deterministic simulated signature for testing
        signature = `0x${Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
      }

      const paymentPayload = {
        x402Version: 2,
        accepted: req,
        payload: {
          authorization: {
            from: payer,
            to: req.payTo,
            value: req.amount,
            validAfter: 0,
            validBefore: nowSeconds + 300,
            nonce,
          },
          signature,
          payerAddress: payer,
        },
      };

      setStep("SETTLING");

      // Resend original request with PAYMENT-SIGNATURE header
      const encodedHeader = encodeHeaderData(paymentPayload);
      let url = service.endpointPath;
      let options: RequestInit = {
        method: isPost ? "POST" : "GET",
        headers: {
          [HEADER_PAYMENT_SIGNATURE]: encodedHeader,
          "X-Payment": encodedHeader,
        },
      };

      if (!isPost && service.endpointPath.includes("weather")) {
        url = `${service.endpointPath}?city=${encodeURIComponent(cityInput)}`;
      } else if (isPost) {
        options.headers = {
          ...options.headers,
          "Content-Type": "application/json",
        };
        options.body = JSON.stringify({ text: textInput });
      }

      const res = await fetch(url, options);
      setFinalStatus(res.status);

      const rawSettlementHeader =
        res.headers.get(HEADER_PAYMENT_RESPONSE) ||
        res.headers.get(HEADER_PAYMENT_RESPONSE.toLowerCase()) ||
        res.headers.get("X-Payment-Response");

      const settlement = decodeHeaderData<any>(rawSettlementHeader);
      setSettlementInfo(settlement);

      const body = await res.json();
      setResponseData(body);

      if (res.ok) {
        setStep("DELIVERED");
      } else {
        setStep("FAILED");
        setErrorMessage(body.error || "Payment verification or settlement failed");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authorization failed");
      setStep("FAILED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Parameter Configuration & Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="h-4 w-4 text-blue-400" />
              API Request Console
            </CardTitle>
            <Badge variant="cyan" className="font-mono">
              {isPost ? "POST" : "GET"} {service.endpointPath}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inputs */}
          {service.endpointPath.includes("weather") && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Target City Query</label>
              <div className="flex gap-2">
                {["Nagpur", "Tokyo", "London", "San Francisco"].map((city) => (
                  <button
                    key={city}
                    onClick={() => setCityInput(city)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                      cityInput === city
                        ? "border-blue-500 bg-blue-500/10 text-blue-300"
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isPost && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Input Payload (JSON: text)</label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Pricing Confirmation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500 block">Unit Price:</span>
                <span className="font-semibold text-white">{formatAtomicToUsd(service.price)}</span>
                <span className="text-slate-400 font-mono text-[10px] ml-1">({service.price} atomic)</span>
              </div>
              <div>
                <span className="text-slate-500 block">Accepted Token:</span>
                <span className="font-mono text-cyan-400">USDC (Base Sepolia)</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-slate-500 block">Recipient:</span>
                <span className="font-mono text-slate-300">{formatAddress(service.recipientAddress)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={step === "CHALLENGED_402" ? "secondary" : "default"}
                size="sm"
                onClick={executeInitialRequest}
                disabled={loading}
              >
                <Play className="h-3.5 w-3.5 mr-1" />
                {step === "IDLE" ? "Send Request (Test 402)" : "Reset Request"}
              </Button>

              {step === "CHALLENGED_402" && (
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={authorizeAndPay}
                  disabled={loading}
                >
                  <Unlock className="h-3.5 w-3.5 mr-1" />
                  Authorize & Settle x402 ({formatAtomicToUsd(service.price)})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Lifecycle Stepper & Inspector */}
      {(step !== "IDLE" || initialStatus) && (
        <Card className="border-slate-800 bg-slate-950/80">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">x402 Protocol Flow State</span>
                {initialStatus && (
                  <Badge variant={initialStatus === 402 ? "warning" : "default"} className="font-mono">
                    Initial HTTP {initialStatus}
                  </Badge>
                )}
                {finalStatus && (
                  <Badge variant={finalStatus === 200 ? "success" : "destructive"} className="font-mono">
                    Final HTTP {finalStatus}
                  </Badge>
                )}
              </div>

              {/* View Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                <button
                  onClick={() => setActiveTab("lifecycle")}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === "lifecycle" ? "bg-slate-800 text-white font-medium" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Lifecycle
                </button>
                <button
                  onClick={() => setActiveTab("response")}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === "response" ? "bg-slate-800 text-white font-medium" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Resource Data
                </button>
                <button
                  onClick={() => setActiveTab("headers")}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === "headers" ? "bg-slate-800 text-white font-medium" : "text-slate-400 hover:text-white"
                  }`}
                >
                  x402 Headers
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {activeTab === "lifecycle" && (
              <div className="space-y-4">
                {/* 5-Stage Visual Timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
                  {/* Step 1 */}
                  <div className={`p-2.5 rounded-lg border ${
                    initialStatus === 402 ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-slate-800 bg-slate-900/40 text-slate-500"
                  }`}>
                    <div className="font-semibold mb-0.5">1. Intercepted</div>
                    <div className="text-[10px]">HTTP 402 Returned</div>
                  </div>

                  {/* Step 2 */}
                  <div className={`p-2.5 rounded-lg border ${
                    paymentRequirements ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : "border-slate-800 bg-slate-900/40 text-slate-500"
                  }`}>
                    <div className="font-semibold mb-0.5">2. Terms Read</div>
                    <div className="text-[10px]">{formatAtomicToUsd(service.price)} USDC req</div>
                  </div>

                  {/* Step 3 */}
                  <div className={`p-2.5 rounded-lg border ${
                    step === "AUTHORIZING" || step === "SETTLING" || step === "DELIVERED"
                      ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                      : "border-slate-800 bg-slate-900/40 text-slate-500"
                  }`}>
                    <div className="font-semibold mb-0.5">3. Authorized</div>
                    <div className="text-[10px]">EIP-3009 Signed</div>
                  </div>

                  {/* Step 4 */}
                  <div className={`p-2.5 rounded-lg border ${
                    settlementInfo?.success
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : step === "SETTLING"
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-300 animate-pulse"
                      : "border-slate-800 bg-slate-900/40 text-slate-500"
                  }`}>
                    <div className="font-semibold mb-0.5">4. Settled</div>
                    <div className="text-[10px]">Facilitator verified</div>
                  </div>

                  {/* Step 5 */}
                  <div className={`p-2.5 rounded-lg border ${
                    step === "DELIVERED"
                      ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-200"
                      : "border-slate-800 bg-slate-900/40 text-slate-500"
                  }`}>
                    <div className="font-semibold mb-0.5">5. Delivered</div>
                    <div className="text-[10px]">200 OK Body</div>
                  </div>
                </div>

                {/* Prompt & Requirements Details Box */}
                {paymentRequirements && (
                  <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-semibold">
                      <span>Server Payment Terms (PAYMENT-REQUIRED header)</span>
                      <span className="font-mono text-amber-400">Status 402</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-400 pt-1">
                      <div>
                        <span className="block text-slate-500 text-[10px]">Scheme</span>
                        <span className="font-mono text-white">{paymentRequirements.accepts?.[0]?.scheme || "exact"}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 text-[10px]">Network (CAIP-2)</span>
                        <span className="font-mono text-white">{paymentRequirements.accepts?.[0]?.network || "eip155:84532"}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 text-[10px]">Required Amount</span>
                        <span className="font-mono text-emerald-400 font-bold">{formatAtomicToUsd(service.price)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 text-[10px]">Recipient (PayTo)</span>
                        <span className="font-mono text-slate-200">{formatAddress(paymentRequirements.accepts?.[0]?.payTo)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settlement Confirmation Box */}
                {settlementInfo && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-emerald-400 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Settlement Confirmed (PAYMENT-RESPONSE header)
                      </span>
                      {settlementInfo.isSimulated && (
                        <Badge variant="secondary" className="text-[10px]">
                          Simulated Test Settlement
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300 pt-1 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Transaction Hash</span>
                        <span className="break-all text-white">{settlementInfo.transaction}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Payer</span>
                        <span>{formatAddress(settlementInfo.payer)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Settled At</span>
                        <span>{new Date(settlementInfo.settledAt || Date.now()).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "response" && (
              <div>
                {responseData ? (
                  <pre className="p-4 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-80 border border-slate-800">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-slate-500 p-4 text-center">
                    Protected data is locked behind x402 paywall. Trigger authorization to unlock.
                  </p>
                )}
              </div>
            )}

            {activeTab === "headers" && (
              <div className="space-y-3 font-mono text-[11px]">
                {paymentRequirements && (
                  <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 space-y-1">
                    <span className="text-amber-400 font-semibold block">PAYMENT-REQUIRED (Server Response):</span>
                    <pre className="text-slate-400 overflow-x-auto">
                      {JSON.stringify(paymentRequirements, null, 2)}
                    </pre>
                  </div>
                )}
                {settlementInfo && (
                  <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 space-y-1">
                    <span className="text-emerald-400 font-semibold block">PAYMENT-RESPONSE (Settlement Header):</span>
                    <pre className="text-slate-400 overflow-x-auto">
                      {JSON.stringify(settlementInfo, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
