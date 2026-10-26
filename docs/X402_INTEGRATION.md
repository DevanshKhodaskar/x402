# x402 Protocol Integration Guide

This guide details the implementation of the **x402 HTTP Payment Protocol (v2)** in AgentPay, including data structures, transport headers, EIP-3009 transfer authorizations, and facilitator verification.

---

## 1. Protocol Architecture & Header Transport

In x402 V2, payment coordination occurs entirely within native HTTP headers encoded as Base64 JSON strings.

```
+--------+                    +--------------------+                    +---------------+
| Client |                    |  AgentPay Gateway  |                    |  Facilitator  |
+----+---+                    +---------+----------+                    +-------+-------+
     |                                  |                                       |
     | 1. GET /api/paid/weather         |                                       |
     |--------------------------------->|                                       |
     |                                  |                                       |
     | 2. HTTP 402 Payment Required     |                                       |
     |    PAYMENT-REQUIRED: <base64>    |                                       |
     |<---------------------------------|                                       |
     |                                  |                                       |
     | [Wallet signs EIP-3009 Auth]     |                                       |
     |                                  |                                       |
     | 3. GET /api/paid/weather         |                                       |
     |    PAYMENT-SIGNATURE: <base64>   |                                       |
     |--------------------------------->|                                       |
     |                                  | 4. verify(payload, requirements)      |
     |                                  |-------------------------------------->|
     |                                  |    isValid: true                      |
     |                                  |<--------------------------------------|
     |                                  |                                       |
     |                                  | 5. settle(payload, requirements)      |
     |                                  |-------------------------------------->|
     |                                  |    settled: true, txHash              |
     |                                  |<--------------------------------------|
     |                                  |                                       |
     | 6. HTTP 200 OK + Resource Body   | [Execute Weather Handler]             |
     |    PAYMENT-RESPONSE: <base64>    |                                       |
     |<---------------------------------|                                       |
```

---

## 2. Header Schemas

### A. `PAYMENT-REQUIRED` (Server → Client on HTTP 402)
Contains a serialized `PaymentRequired` object:
```json
{
  "x402Version": 2,
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:84532",
      "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      "amount": "10000",
      "payTo": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "maxTimeoutSeconds": 300,
      "extra": {
        "serviceId": "svc-weather-001",
        "serviceSlug": "weather-api"
      }
    }
  ],
  "resource": {
    "url": "/api/paid/weather",
    "description": "Real-time meteorological insights",
    "mimeType": "application/json"
  }
}
```

### B. `PAYMENT-SIGNATURE` (Client → Server on Retry)
Contains a serialized `PaymentPayload` object with an EIP-3009 TransferWithAuthorization signature:
```json
{
  "x402Version": 2,
  "accepted": {
    "scheme": "exact",
    "network": "eip155:84532",
    "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    "amount": "10000",
    "payTo": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "maxTimeoutSeconds": 300
  },
  "payload": {
    "authorization": {
      "from": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      "to": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "value": "10000",
      "validAfter": 0,
      "validBefore": 1793008000,
      "nonce": "0x4b7c10f8..."
    },
    "signature": "0x98f...",
    "payerAddress": "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
  }
}
```

### C. `PAYMENT-RESPONSE` (Server → Client on HTTP 200)
Contains a serialized `SettlementResponse` object:
```json
{
  "success": true,
  "network": "eip155:84532",
  "transaction": "0xsim_1793007484658_61e6c220",
  "payer": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  "recipient": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "amount": "10000",
  "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  "settledAt": "2026-10-26T15:00:00.000Z",
  "isSimulated": true
}
```

---

## 3. Cryptographic Authorization: EIP-3009

On EVM chains like Base Sepolia, AgentPay utilizes **EIP-3009 `TransferWithAuthorization`**. This standard allows a payer to sign a permit off-chain, which a relayer or facilitator can execute on-chain on the payer's behalf, providing a gasless experience for the client:

```typescript
const domain = {
  name: "USD Coin",
  version: "2",
  chainId: 84532, // Base Sepolia
  verifyingContract: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

const types = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};
```

---

## 4. Execution Modes: Mode A vs Mode B

| Feature | Mode A: Local Simulation | Mode B: Base Sepolia Testnet |
|---|---|---|
| **Environment Variable** | `X402_MODE=simulated` | `X402_MODE=testnet` |
| **Asset Transfer** | Zero-gas simulation | Live Base Sepolia USDC transfer |
| **Transaction Hash** | `0xsim_<timestamp>_<nonce>` | Live 32-byte hex hash on Basescan |
| **Facilitator Key** | None required | `FACILITATOR_PRIVATE_KEY` required |
| **Labeling** | Explicitly marked `isSimulated: true` | Marked `isSimulated: false` |
| **Replay Protection** | In-memory nonce cache | In-memory cache + on-chain nonce check |
