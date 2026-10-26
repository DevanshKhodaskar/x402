import { NextRequest, NextResponse } from "next/server";
import { withX402Paywall } from "@/lib/x402/server";

export const dynamic = "force-dynamic";

const CURATED_AGENT_BENCHMARKS = [
  {
    benchmarkId: "bench-crypto-micro-01",
    model: "claude-3-5-sonnet",
    scenario: "x402 Micropayment Negotiation",
    taskSuccessRate: 0.984,
    avgLatencyMs: 312,
    gasCostEfficiencyRating: "A+",
    protocolCompliance: "100%",
  },
  {
    benchmarkId: "bench-crypto-micro-02",
    model: "gpt-4o",
    scenario: "x402 Dynamic Payment Negotiation",
    taskSuccessRate: 0.971,
    avgLatencyMs: 345,
    gasCostEfficiencyRating: "A",
    protocolCompliance: "100%",
  },
  {
    benchmarkId: "bench-crypto-micro-03",
    model: "gemini-1-5-pro",
    scenario: "Automated Multi-Service Orchestration",
    taskSuccessRate: 0.965,
    avgLatencyMs: 290,
    gasCostEfficiencyRating: "A+",
    protocolCompliance: "99.8%",
  },
  {
    benchmarkId: "bench-crypto-micro-04",
    model: "deepseek-r1",
    scenario: "Zero-Shot Tool Settlement",
    taskSuccessRate: 0.958,
    avgLatencyMs: 410,
    gasCostEfficiencyRating: "B+",
    protocolCompliance: "99.2%",
  },
];

export const GET = withX402Paywall(
  {
    serviceSlug: "premium-dataset-api",
    endpointPath: "/api/paid/premium-data",
  },
  async (req: NextRequest, paymentContext) => {
    return NextResponse.json({
      success: true,
      service: "premium-dataset-api",
      timestamp: new Date().toISOString(),
      dataset: {
        id: "corpus-agent-v2-eval",
        name: "Autonomous Agent Micropayment Benchmark Corpus 2026",
        version: "2.4.0",
        recordsCount: CURATED_AGENT_BENCHMARKS.length,
        schema: {
          benchmarkId: "string (unique test run identifier)",
          model: "string (target foundation model)",
          scenario: "string (eval task testbed)",
          taskSuccessRate: "float (0.0 to 1.0)",
          avgLatencyMs: "integer (latency in milliseconds)",
          gasCostEfficiencyRating: "string (categorical efficiency grade)",
          protocolCompliance: "string (x402 RFC adherence percentage)",
        },
        records: CURATED_AGENT_BENCHMARKS,
      },
      payment: {
        status: "settled",
        network: paymentContext.network,
        amount: paymentContext.amount,
        payer: paymentContext.payerAddress,
        transactionId: paymentContext.transactionId,
        transactionHash: paymentContext.transactionHash,
        isSimulated: paymentContext.isSimulated,
      },
    });
  }
);
