# AgentPay Architecture Documentation

AgentPay is a decentralized-style marketplace and payment gateway designed for autonomous AI agents and web services, powered by the **x402 HTTP Payment Protocol (v2)**.

---

## 1. System Topology

```
+-----------------------------------------------------------------------+
|                             CLIENT TIER                               |
|                                                                       |
|   +-----------------------+              +------------------------+   |
|   | Autonomous AI Agent   |              | Web Browser Consumer   |   |
|   | (LLM Tool Calling)    |              | (Next.js Dashboard)    |   |
|   +-----------+-----------+              +-----------+------------+   |
|               |                                      |                |
|               |      EIP-3009 Transfer Authorization |                |
|               +-------------------+------------------+                |
|                                   |                                   |
+-----------------------------------|-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                    AGENTPAY APPLICATION GATEWAY                       |
|                       (Next.js App Router)                            |
|                                                                       |
|   +---------------------------------------------------------------+   |
|   |               x402 Paywall Middleware Interceptor             |   |
|   |                                                               |   |
|   |  * Intercepts incoming requests to /api/paid/*                |   |
|   |  * Unpaid -> Returns HTTP 402 + PAYMENT-REQUIRED header       |   |
|   |  * Paid   -> Extracts PAYMENT-SIGNATURE header                |   |
|   |  * Validates authoritative service price, network, and token  |   |
|   |  * Enforces client spending limits server-side                |   |
|   +-------------------------------+-------------------------------+   |
|                                   |                                   |
|                                   v                                   |
|   +---------------------------------------------------------------+   |
|   |                     x402 Facilitator Engine                   |   |
|   |                                                               |   |
|   |  * Mode A (Simulated): In-memory deterministic settlement     |   |
|   |  * Mode B (Testnet):   Base Sepolia USDC transfer broadcast   |   |
|   |  * Replay protection: Nonce deduplication & expiration window |   |
|   +-------------------------------+-------------------------------+   |
|                                   |                                   |
|                                   v                                   |
|   +---------------------------------------------------------------+   |
|   |                Protected Resource Execution                   |   |
|   |  * Weather API (/api/paid/weather)                            |   |
|   |  * Text Analysis NLP (/api/paid/text-analysis)                |   |
|   |  * Premium Benchmark Dataset (/api/paid/premium-data)         |   |
|   +---------------------------------------------------------------+   |
+-----------------------------------|-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                         PERSISTENCE TIER                              |
|                                                                       |
|   +---------------------------------------------------------------+   |
|   | Prisma ORM & Database Layer (PostgreSQL / In-Memory Fallback) |   |
|   |                                                               |   |
|   |  * Users, Wallets, Services, PaymentTransactions,             |   |
|   |    PaymentAttempts, ApiUsage, AuditLogs                       |   |
|   +---------------------------------------------------------------+   |
+-----------------------------------------------------------------------+
```

---

## 2. Core Architectural Separation of Concerns

AgentPay strictly demarcates:
1. **Marketplace Discovery & Identity**:
   - Centralized registry of metadata, descriptions, schemas, categories, and ratings.
   - Non-custodial wallet linking via cryptographic signature challenge.
2. **HTTP Payment Protocol (x402 v2)**:
   - Header-only transport (`PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE`, `PAYMENT-RESPONSE`).
   - Standardized CAIP-2 network identifiers (`eip155:84532` for Base Sepolia).
   - EIP-3009 gasless transfer authorizations.
3. **Facilitation & Settlement**:
   - Verification of signatures, recipients, amounts, and validity timestamps.
   - Idempotent nonce recording to prevent replay attacks.
   - Distinct lifecycle statuses: `PENDING`, `AUTHORIZED`, `VERIFIED`, `SETTLED`, `FAILED`, `EXPIRED`.
4. **Authoritative Server Pricing**:
   - Client-submitted pricing or tokens are **never** trusted.
   - Paywall middleware queries authoritative database records for price in atomic integer units.

---

## 3. Directory Structure

```
c:\Users\manty\Desktop\X402\
├── app/
│   ├── layout.tsx                      # Root layout, theme, and providers
│   ├── page.tsx                        # Page 1: Public Landing Page
│   ├── globals.css                     # Dark-mode Tailwind CSS styles
│   ├── marketplace/
│   │   ├── page.tsx                    # Page 2: Service Marketplace
│   │   └── [serviceId]/
│   │       └── page.tsx                # Page 3: Service Details & Live x402 Tester
│   ├── dashboard/
│   │   └── page.tsx                    # Page 4: Consumer Dashboard
│   ├── transactions/
│   │   └── page.tsx                    # Page 5: Transaction Explorer
│   ├── provider/
│   │   ├── page.tsx                    # Page 6: Provider Dashboard
│   │   └── services/
│   │       └── page.tsx                # Page 7: Provider Service Management
│   ├── developer/
│   │   └── docs/
│   │       └── page.tsx                # Page 8: Developer Documentation
│   ├── settings/
│   │   └── page.tsx                    # Page 9: Account & Spending Limit Settings
│   ├── admin/
│   │   └── page.tsx                    # Page 10: Administration & Moderation
│   ├── login/
│   │   └── page.tsx                    # User authentication (Login)
│   ├── register/
│   │   └── page.tsx                    # User registration
│   └── api/                            # Next.js Server REST API Routes
│       ├── health/route.ts             # Health check probe
│       ├── ready/route.ts              # Database readiness check
│       ├── auth/                       # Register, login, session, wallet-challenge
│       ├── services/                   # Marketplace services & telemetry
│       ├── provider/                   # Provider service publishing & analytics
│       ├── dashboard/                  # Consumer dashboard aggregations
│       ├── transactions/               # Auditable transaction explorer
│       ├── settings/                   # Spending limits and profile preferences
│       ├── admin/                      # Moderation and audit log queries
│       └── paid/                       # x402 Payment-Protected Demonstration Services
│           ├── weather/route.ts        # Service A: Weather API
│           ├── text-analysis/route.ts  # Service B: NLP Text Analysis
│           └── premium-data/route.ts   # Service C: AI Agent Benchmarks Dataset
├── components/
│   ├── ui/                             # Accessible reusable UI primitives (Card, Button, Badge, Modal, Input)
│   ├── navbar.tsx                      # Navigation bar with wallet status and role links
│   ├── footer.tsx                      # Protocol and documentation footer
│   ├── providers.tsx                   # React Query & Web3 Wallet context provider
│   ├── wallet-connect-modal.tsx        # Simulated agent wallet & injected browser wallet connector
│   └── api-tester.tsx                  # Interactive 5-step x402 payment lifecycle simulator
├── lib/
│   ├── utils.ts                        # Financial conversions, address formatters, explorer URL helpers
│   ├── auth.ts                         # Password hashing, JWT sessions, role verification, wallet challenges
│   ├── db.ts                           # Dual-engine database adapter (PostgreSQL + In-Memory Fallback)
│   ├── seed-data.ts                    # Demo services, users, wallets, and mock analytics
│   └── x402/
│       ├── types.ts                    # x402 V2 TypeScript type definitions
│       ├── headers.ts                  # Header encoders and decoders (Base64 JSON)
│       ├── facilitator.ts              # Verification, replay prevention, and settlement engine
│       ├── server.ts                   # withX402Paywall higher-order route middleware
│       └── client.ts                   # Client-side requirement inspector and EIP-3009 signer
├── prisma/
│   └── schema.prisma                   # PostgreSQL relational schema definition
├── scripts/
│   ├── seed.mjs                        # Database seeding CLI script
│   └── verify-live.mjs                 # Automated live HTTP endpoint probe script
├── tests/
│   ├── auth.test.ts                    # Authentication & session unit tests
│   ├── x402-protocol.test.ts           # Protocol encoding, validation, and settlement tests
│   └── services.test.ts                # Paywall integration and resource protection tests
├── docs/                               # Engineering documentation suite
├── Dockerfile                          # Multi-stage production container build
├── docker-compose.yml                  # Local PostgreSQL + Web deployment
├── .env.example                        # Documented environment variables
└── README.md                           # Master setup and reference guide
```
