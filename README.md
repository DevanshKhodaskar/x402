# AgentPay — AI Agent Marketplace Powered by x402

> **"Pay per request. Build without boundaries."**

AgentPay is a decentralized-style marketplace and HTTP-native payment gateway where developers can publish paid APIs and autonomous AI agents can discover, purchase, and consume those APIs using the **x402 Payment Protocol (v2)**.

Instead of requiring subscriptions, API keys, or monthly invoices for every micro-service, internet services can charge for individual HTTP requests using cryptographic authorizations settled on EVM networks (Base Sepolia).

---

## 1. Features

- **x402 Protocol v2 Native**: Fully compliant header transport (`PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE`, `PAYMENT-RESPONSE`) adhering to the official x402 Foundation RFC specification.
- **Gasless Off-Chain Signing**: Uses **EIP-3009 `TransferWithAuthorization`** on Base Sepolia for micro-metered token transfers.
- **Three Real Demonstration Services**:
  1. **Global Weather Intelligence**: `GET /api/paid/weather?city=Tokyo` ($0.01 USDC)
  2. **Neural Text & Sentiment NLP**: `POST /api/paid/text-analysis` ($0.02 USDC)
  3. **Autonomous Agent Benchmark Corpus**: `GET /api/paid/premium-data` ($0.05 USDC)
- **Interactive 5-Stage x402 Console**: Live request console visually stepping through HTTP 402 negotiation, requirement extraction, wallet authorization, facilitator settlement, and resource delivery.
- **Authoritative Server Pricing**: Client-submitted pricing is never trusted; prices, recipients, and tokens are enforced strictly from authoritative server records.
- **Client Spending Controls**: Configurable per-payment and monthly spending caps enforced server-side.
- **Two Execution Modes**:
  - **Mode A (Local / Simulated)**: Deterministic mock facilitator for development and unit testing with zero gas needed.
  - **Mode B (Testnet)**: Live Base Sepolia on-chain broadcast producing verified Basescan transaction hashes.
- **Comprehensive Management Suite**:
  - Public Landing Page (`/`)
  - API Marketplace with Search & Filters (`/marketplace`)
  - Service Details & Interactive Tester (`/marketplace/[serviceId]`)
  - Consumer Dashboard & Usage Analytics (`/dashboard`)
  - Auditable Transaction Explorer (`/transactions`)
  - Provider Dashboard & Settlement Revenue (`/provider`)
  - Service Catalog Management & SSRF Protection (`/provider/services`)
  - Developer Integration Guide with cURL & TypeScript (`/developer/docs`)
  - Account & Spending Limit Settings (`/settings`)
  - Platform Governance & Moderation (`/admin`)

---

## 2. Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (Strict), Tailwind CSS v4, Lucide Icons, Recharts, TanStack Query v5.
- **Backend & Middleware**: Node.js, Next.js Server Route Handlers, Zod v3 validation, `withX402Paywall` higher-order interceptor.
- **Protocol & Web3**: `@x402/core` (v2.28.0), `@x402/evm` (v2.28.0), `viem` (v2.23+), Base Sepolia (`eip155:84532`).
- **Persistence**: Prisma ORM, PostgreSQL schema, with self-contained in-memory fallback for zero-dependency local runs.
- **Testing**: Vitest, automated end-to-end live endpoint verification scripts (`scripts/verify-live.mjs`).

---

## 3. Architecture & Protocol Flow

```
1. Client Request (Unpaid)
   GET /api/paid/weather?city=Tokyo
            |
            v
2. Paywall Interceptor
   Authoritative DB lookup -> Computes requirements: 10000 atomic units ($0.01 USDC)
   Returns HTTP 402 Payment Required + Header PAYMENT-REQUIRED: <base64>
            |
            v
3. Client Wallet Authorization
   Client parses PAYMENT-REQUIRED -> Checks spend controls -> Signs EIP-3009 permit
            |
            v
4. Client Request (Bearing Payment)
   GET /api/paid/weather?city=Tokyo
   Header: PAYMENT-SIGNATURE: <base64(PaymentPayload)>
            |
            v
5. Facilitator Verification & Settlement
   Verifies signature, recipient, amount, non-expired validity window, and unused nonce.
   Mode A: Settles in-memory with pseudo-hash 0xsim_...
   Mode B: Broadcasts on-chain to Base Sepolia USDC contract.
            |
            v
6. Resource Delivery & Response
   Executes weather handler -> Persists transaction -> Returns HTTP 200 OK
   Header: PAYMENT-RESPONSE: <base64(SettlementResponse)>
```

---

## 4. Getting Started

### Prerequisites
- Node.js v20+ or v22+
- `pnpm` v10+ (or `npm`)

### Installation & Setup

```bash
# 1. Clone repository and navigate to workspace
cd c:\Users\manty\Desktop\X402

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env.local

# 4. Generate Prisma types
pnpm db:generate

# 5. Run tests
pnpm test

# 6. Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 5. Seeded Test Credentials

AgentPay comes preloaded with demonstration accounts for immediate evaluation:

| Role | Email | Password | Preconfigured Identity |
|---|---|---|---|
| **Consumer** | `consumer@agentpay.xyz` | `consumer123` | `$100.00` spending cap, wallet `0x90F7...` |
| **Provider** | `provider@agentpay.xyz` | `provider123` | Owns 3 demo services, wallet `0x7099...` |
| **Admin** | `admin@agentpay.xyz` | `admin123` | Platform governance & service moderation |

*Note: You can also use the 1-click test login buttons on the `/login` page.*

---

## 6. Execution Modes

### Mode A: Local Simulation (Default)
In `.env.local`:
```env
X402_MODE=simulated
```
- No real cryptocurrency or faucet tokens required.
- Cryptographic signature structure and EIP-3009 parameters are verified.
- Replay attacks are prevented via in-memory nonce cache.
- Generates simulated transaction hashes (`0xsim_...`) clearly labeled in UI.

### Mode B: Real Base Sepolia Testnet
In `.env.local`:
```env
X402_MODE=testnet
BASE_SEPOLIA_RPC=https://sepolia.base.org
PAYMENT_TOKEN_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
FACILITATOR_PRIVATE_KEY=your_facilitator_private_key_here
```
1. Obtain Base Sepolia ETH from [faucets.chain.link](https://faucets.chain.link) or [base.org](https://www.base.org).
2. Obtain Base Sepolia USDC from Circle's official testnet faucet.
3. Supply facilitator private key to broadcast settlement transactions.

---

## 7. Testing & Verification Commands

```bash
# Run unit & integration test suite (Vitest)
pnpm test

# Run production build
pnpm build

# Run automated end-to-end live endpoint probe (tests 402 paywall & paid delivery)
pnpm test:e2e
```

---

## 8. cURL Developer Example

```bash
# 1. Unpaid request receives HTTP 402
curl -i http://localhost:3000/api/paid/weather?city=Tokyo

# 2. Extract PAYMENT-REQUIRED base64 header

# 3. Retry with PAYMENT-SIGNATURE base64 header
curl -i http://localhost:3000/api/paid/weather?city=Tokyo \
  -H "PAYMENT-SIGNATURE: eyJ4NDAyVmVyc2lvbiI6MiwiYWNjZXB0ZWQiOnsic2NoZW1lIjoiZXhhY3Qi...}"
```

---

## 9. Security & Compliance Notes

- **Non-Custodial**: Private keys and seed phrases are never collected or stored.
- **Replay Protection**: Expired timestamps and reused nonces are rejected.
- **SSRF Hardening**: Providers may only register internal `/api/paid/*` routes.
- **Precision**: Token amounts use integer atomic units (`10000` = `0.01` USDC) to avoid floating-point errors.

---

## 10. License

Licensed under the [Apache-2.0 License](LICENSE).
