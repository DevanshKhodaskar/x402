export interface DemoUser {
  id: string;
  email: string;
  passwordHash: string; // bcrypt hash or plain for seeded test accounts
  displayName: string;
  role: "CONSUMER" | "PROVIDER" | "ADMIN";
  spendingLimit: number;
  wallets: Array<{ id: string; address: string; network: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DemoService {
  id: string;
  providerId: string;
  name: string;
  slug: string;
  description: string;
  category: "AI_INFERENCE" | "DATA_FEEDS" | "FINANCIAL" | "UTILITY";
  endpointPath: string;
  price: string;          // in atomic units (e.g. "10000" = 0.01 USDC)
  tokenAddress: string;   // Base Sepolia USDC contract
  network: string;        // CAIP-2 e.g. "eip155:84532"
  recipientAddress: string;
  status: "DRAFT" | "PUBLISHED" | "SUSPENDED";
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const DEFAULT_NETWORK = "eip155:84532";
export const DEMO_PROVIDER_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
export const DEMO_CONSUMER_WALLET = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

export const INITIAL_USERS: DemoUser[] = [
  {
    id: "user-consumer-01",
    email: "consumer@agentpay.xyz",
    // bcrypt hash of "consumer123"
    passwordHash: "$2a$10$O9wRkn2jBwM8QW8z5hS2qO6V8W5c7H6v3g3a7J2c4E8m6H5c9G5hK",
    displayName: "Agent Builder Alpha",
    role: "CONSUMER",
    spendingLimit: 100.0,
    wallets: [
      {
        id: "wallet-01",
        address: DEMO_CONSUMER_WALLET,
        network: DEFAULT_NETWORK,
      },
    ],
    createdAt: new Date("2026-01-15T00:00:00Z"),
    updatedAt: new Date("2026-01-15T00:00:00Z"),
  },
  {
    id: "user-provider-02",
    email: "provider@agentpay.xyz",
    // bcrypt hash of "provider123"
    passwordHash: "$2a$10$tZ2c6N4V0H2J8k4L8s2g.Oe3W1k7C2v4g8b2A1b3D4f5H6j7K8l9M",
    displayName: "Nexus API Labs",
    role: "PROVIDER",
    spendingLimit: 500.0,
    wallets: [
      {
        id: "wallet-02",
        address: DEMO_PROVIDER_WALLET,
        network: DEFAULT_NETWORK,
      },
    ],
    createdAt: new Date("2026-01-10T00:00:00Z"),
    updatedAt: new Date("2026-01-10T00:00:00Z"),
  },
  {
    id: "user-admin-03",
    email: "admin@agentpay.xyz",
    // bcrypt hash of "admin123"
    passwordHash: "$2a$10$9Y1x3C5v7B9n1M3k5L7j.O4W2e6R8t0y2U4i6O8p0A2s4D6f8G0hJ",
    displayName: "Platform Governance",
    role: "ADMIN",
    spendingLimit: 1000.0,
    wallets: [],
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  },
];

export const INITIAL_SERVICES: DemoService[] = [
  {
    id: "svc-weather-001",
    providerId: "user-provider-02",
    name: "Global Weather Intelligence",
    slug: "weather-api",
    description:
      "Real-time meteorological insights, atmospheric conditions, and microclimate feeds designed for automated agent decisions.",
    category: "DATA_FEEDS",
    endpointPath: "/api/paid/weather",
    price: "10000", // 0.01 USDC
    tokenAddress: BASE_SEPOLIA_USDC,
    network: DEFAULT_NETWORK,
    recipientAddress: DEMO_PROVIDER_WALLET,
    status: "PUBLISHED",
    isDemo: true,
    createdAt: new Date("2026-01-12T00:00:00Z"),
    updatedAt: new Date("2026-01-12T00:00:00Z"),
  },
  {
    id: "svc-text-002",
    providerId: "user-provider-02",
    name: "Neural Text & Sentiment Engine",
    slug: "text-analysis-api",
    description:
      "High-throughput NLP linguistic parsing, sentence complexity metrics, word statistics, and sentiment scoring for autonomous agent pipelines.",
    category: "AI_INFERENCE",
    endpointPath: "/api/paid/text-analysis",
    price: "20000", // 0.02 USDC
    tokenAddress: BASE_SEPOLIA_USDC,
    network: DEFAULT_NETWORK,
    recipientAddress: DEMO_PROVIDER_WALLET,
    status: "PUBLISHED",
    isDemo: true,
    createdAt: new Date("2026-01-14T00:00:00Z"),
    updatedAt: new Date("2026-01-14T00:00:00Z"),
  },
  {
    id: "svc-dataset-003",
    providerId: "user-provider-02",
    name: "Autonomous Agent Benchmark Corpus",
    slug: "premium-dataset-api",
    description:
      "Curated multi-modal benchmarks, algorithmic evaluation metrics, and verified execution datasets for LLM evaluation and validation.",
    category: "FINANCIAL",
    endpointPath: "/api/paid/premium-data",
    price: "50000", // 0.05 USDC
    tokenAddress: BASE_SEPOLIA_USDC,
    network: DEFAULT_NETWORK,
    recipientAddress: DEMO_PROVIDER_WALLET,
    status: "PUBLISHED",
    isDemo: true,
    createdAt: new Date("2026-01-18T00:00:00Z"),
    updatedAt: new Date("2026-01-18T00:00:00Z"),
  },
];
