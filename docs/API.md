# AgentPay REST API Reference

All requests and responses use standard JSON formatting unless communicating binary headers. Protected endpoints require the **x402 HTTP Payment Protocol**.

---

## 1. System & Health Endpoints

### `GET /api/health`
Returns system heartbeat and protocol version.
- **Authentication**: None
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "version": "1.0.0",
    "protocol": "x402-v2",
    "timestamp": "2026-10-26T15:00:00.000Z",
    "uptimeSeconds": 142
  }
  ```

### `GET /api/ready`
Verifies database connectivity and registered catalog readiness.
- **Authentication**: None
- **Response `200 OK`**:
  ```json
  {
    "status": "ready",
    "database": "connected",
    "registeredServices": 3,
    "timestamp": "2026-10-26T15:00:00.000Z"
  }
  ```

---

## 2. Authentication Endpoints

### `POST /api/auth/register`
Creates a new user profile with password hashing and returns a signed session cookie.
- **Request Body**:
  ```json
  {
    "email": "agent@example.com",
    "password": "securePassword123",
    "displayName": "Autonomous Agent",
    "role": "CONSUMER" // or "PROVIDER"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "user": {
      "id": "user-uuid",
      "email": "agent@example.com",
      "displayName": "Autonomous Agent",
      "role": "CONSUMER",
      "spendingLimit": 100.0
    },
    "token": "jwt-token-string"
  }
  ```

### `POST /api/auth/login`
Authenticates with email and password.
- **Request Body**: `{ "email": "...", "password": "..." }`
- **Response `200 OK`**: `{ "success": true, "user": { ... }, "token": "..." }`

### `POST /api/auth/logout`
Clears the session cookie.
- **Response `200 OK`**: `{ "success": true, "message": "Logged out" }`

### `GET /api/auth/session`
Returns the active session user and associated wallets.
- **Authentication**: Cookie or `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "authenticated": true,
    "user": {
      "id": "user-uuid",
      "email": "agent@example.com",
      "displayName": "Autonomous Agent",
      "role": "CONSUMER",
      "spendingLimit": 100.0,
      "wallets": [{ "id": "wallet-1", "address": "0x...", "network": "eip155:84532" }]
    }
  }
  ```

---

## 3. Marketplace & Services Endpoints

### `GET /api/services`
Retrieves paginated catalog of published APIs.
- **Query Parameters**:
  - `q`: Search keyword (name, description, slug)
  - `category`: `ALL`, `AI_INFERENCE`, `DATA_FEEDS`, `FINANCIAL`, `UTILITY`
  - `network`: Target network identifier (e.g., `eip155:84532`)
  - `sort`: `newest`, `price_asc`, `price_desc`
  - `page`: Integer page number (default: 1)
  - `limit`: Results per page (default: 12)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "services": [ ... ],
    "pagination": { "page": 1, "limit": 12, "total": 3, "totalPages": 1 }
  }
  ```

### `GET /api/services/:id`
Retrieves service metadata by UUID or URL slug.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "service": {
      "id": "svc-weather-001",
      "name": "Global Weather Intelligence",
      "slug": "weather-api",
      "endpointPath": "/api/paid/weather",
      "price": "10000",
      "tokenAddress": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      "network": "eip155:84532",
      "recipientAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "providerName": "Nexus API Labs"
    }
  }
  ```

### `GET /api/services/:id/usage`
Aggregated telemetry, request volumes, and latency stats for an endpoint.

---

## 4. x402 Payment-Protected Endpoints

### `GET /api/paid/weather`
- **Protected by**: `withX402Paywall`
- **Unit Price**: 10,000 atomic units ($0.01 USDC)
- **Query Parameter**: `city` (e.g., `Tokyo`, `Nagpur`, `London`)
- **Unpaid Response `402 Payment Required`**:
  - Header: `PAYMENT-REQUIRED: <base64>`
  - Body: `{ "error": "Payment Required", "code": "PAYMENT_REQUIRED", "x402": { ... } }`
- **Paid Response `200 OK`**:
  - Header: `PAYMENT-RESPONSE: <base64>`
  - Body:
    ```json
    {
      "success": true,
      "service": "weather-api",
      "data": {
        "city": "Tokyo",
        "condition": "Clear",
        "temperatureCelsius": 18,
        "temperatureFahrenheit": 64,
        "humidityPercent": 55,
        "windSpeedKph": 12,
        "source": "AgentPay Meteorological Core (Demo Data)"
      },
      "payment": {
        "status": "settled",
        "network": "eip155:84532",
        "amount": "10000",
        "payer": "0x...",
        "transactionId": "tx-...",
        "transactionHash": "0xsim_...",
        "isSimulated": true
      }
    }
    ```

### `POST /api/paid/text-analysis`
- **Protected by**: `withX402Paywall`
- **Unit Price**: 20,000 atomic units ($0.02 USDC)
- **Request Body**: `{ "text": "String of natural text to analyze..." }`
- **Paid Response `200 OK`**:
  ```json
  {
    "success": true,
    "service": "text-analysis-api",
    "analytics": {
      "wordCount": 12,
      "characterCount": 85,
      "sentenceCount": 1,
      "averageWordLength": 5.4,
      "averageSentenceLength": 12,
      "estimatedReadingTimeMinutes": 0.06,
      "lexicalDiversity": 1.0,
      "sentiment": "POSITIVE"
    },
    "payment": { ... }
  }
  ```

### `GET /api/paid/premium-data`
- **Protected by**: `withX402Paywall`
- **Unit Price**: 50,000 atomic units ($0.05 USDC)
- **Paid Response `200 OK`**:
  Returns curated AI Agent Benchmark Corpus metrics, task success rates, and latency vectors.

---

## 5. Provider Endpoints

- `GET /api/provider/services`: Lists all services published by the authenticated provider.
- `POST /api/provider/services`: Registers a new service with validated pricing, recipient, and slug.
- `PATCH /api/provider/services/:id`: Updates pricing, description, or status (`PUBLISHED`, `SUSPENDED`, `DRAFT`).
- `DELETE /api/provider/services/:id`: Suspends an active listing.
- `GET /api/provider/analytics`: Computes gross revenue (settled only), call volumes, and failure rates.

---

## 6. Transactions & Admin Endpoints

- `GET /api/transactions`: Searchable and filterable ledger of transactions.
- `GET /api/transactions/:id`: Single transaction audit record with explorer link.
- `GET /api/admin/overview`: Platform-wide metrics (users, services, total volume, failure rate).
- `GET /api/admin/services`: Full service catalog for administrative moderation.
- `PATCH /api/admin/services/:id`: Administrative suspension or reactivation of a listing.
- `GET /api/admin/audit-logs`: Chronological log of critical administrative and security events.
