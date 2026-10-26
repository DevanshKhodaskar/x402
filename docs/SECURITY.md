# AgentPay Security Architecture

AgentPay is designed with developer-fintech security standards to protect users, providers, and autonomous agents from unauthorized transactions, replay attacks, and systemic exploits.

---

## 1. Wallet & Cryptographic Security

- **Non-Custodial Design**: AgentPay **never** collects, transmits, or stores private keys or seed phrases from users or browser wallets.
- **Challenge-Response Wallet Association**: Wallet linking uses EIP-191 message signatures with single-use, 5-minute expiring server nonces:
  ```
  Welcome to AgentPay!
  Please sign this message to verify wallet ownership.
  Address: 0x...
  Nonce: agentpay-nonce-179300...
  Domain: http://localhost:3000
  ```
- **Domain & Chain Binding**: EIP-712 / EIP-3009 domain separators explicitly bind signatures to `chainId: 84532` (Base Sepolia) and the authoritative USDC contract address, preventing cross-chain signature replay.

---

## 2. Payment Protocol Security

- **Authoritative Server Pricing**: The resource server **never** trusts client-submitted amounts, token addresses, or recipients. All payment requirements are constructed strictly from authoritative database records.
- **Replay & Double-Spend Protection**: Every EIP-3009 payment authorization contains a cryptographic 32-byte `nonce`. The facilitator records used nonces and rejects any subsequent request presenting an identical nonce.
- **Expiration Enforcement**: Payment authorizations enforce a strict `validBefore` timestamp window (default: 300 seconds). Authorizations submitted after this window are rejected with `PAYMENT_EXPIRED`.
- **Spending Controls**: Users can configure single-payment and monthly spending caps. These caps are enforced server-side before signature verification or facilitator dispatch.

---

## 3. Web & Application Security

- **Input Validation**: All API inputs, query parameters, and request payloads are validated server-side using strict Zod schemas.
- **SSRF Prevention**: Providers cannot register arbitrary external URLs as payable endpoints. Only platform-controlled, approved internal paths (beginning with `/api/paid/`) can be monetized.
- **Cookie Security**: Session cookies use `httpOnly`, `sameSite: "lax"`, and conditional `secure` flags in production.
- **Integer Arithmetic for Tokens**: To avoid IEEE 754 floating-point rounding errors, all financial token values are parsed, calculated, and persisted as integer strings representing atomic units (10⁻⁶ for USDC).
- **Audit Logging**: Sensitive operations (service creation, moderation, wallet linking, status modifications) are immutably appended to the `AuditLog` table with actor IDs and timestamps.
