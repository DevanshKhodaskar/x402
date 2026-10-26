import { spawn } from "child_process";
import http from "http";

async function makeRequest(path, method = "GET", headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path,
        method,
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log("🚀 Starting Next.js production server for live HTTP verification...");
  const server = spawn("node", ["./node_modules/next/dist/bin/next", "start", "-p", "3000"], {
    stdio: "inherit",
  });

  // Wait 4 seconds for server startup
  await new Promise((r) => setTimeout(r, 4000));

  try {
    // 1. Health check
    console.log("➡️ Testing GET /api/health...");
    const health = await makeRequest("/api/health");
    console.log(`[Health] Status: ${health.statusCode}, Body: ${health.body}`);
    if (health.statusCode !== 200) throw new Error("Health check failed");

    // 2. Unpaid Weather (Expect 402)
    console.log("➡️ Testing Unpaid GET /api/paid/weather?city=Tokyo...");
    const unpaidWeather = await makeRequest("/api/paid/weather?city=Tokyo");
    console.log(`[Weather Unpaid] Status: ${unpaidWeather.statusCode}`);
    console.log(`[Weather Unpaid] PAYMENT-REQUIRED header present: ${!!unpaidWeather.headers["payment-required"]}`);
    if (unpaidWeather.statusCode !== 402) throw new Error(`Expected 402, got ${unpaidWeather.statusCode}`);
    if (!unpaidWeather.headers["payment-required"]) throw new Error("Missing PAYMENT-REQUIRED header");

    // 3. Unpaid Text Analysis (Expect 402 with POST)
    console.log("➡️ Testing Unpaid POST /api/paid/text-analysis...");
    const unpaidText = await makeRequest("/api/paid/text-analysis", "POST", { "Content-Type": "application/json" }, JSON.stringify({ text: "Hello" }));
    console.log(`[Text Unpaid] Status: ${unpaidText.statusCode}`);
    if (unpaidText.statusCode !== 402) throw new Error(`Expected 402, got ${unpaidText.statusCode}`);

    // 4. Unpaid Premium Dataset (Expect 402)
    console.log("➡️ Testing Unpaid GET /api/paid/premium-data...");
    const unpaidData = await makeRequest("/api/paid/premium-data");
    console.log(`[Dataset Unpaid] Status: ${unpaidData.statusCode}`);
    if (unpaidData.statusCode !== 402) throw new Error(`Expected 402, got ${unpaidData.statusCode}`);

    // 5. Test Live Paid Request to Weather API with valid PAYMENT-SIGNATURE
    console.log("➡️ Testing Paid GET /api/paid/weather with PAYMENT-SIGNATURE...");
    const reqHeaderVal = unpaidWeather.headers["payment-required"];
    const paymentReq = JSON.parse(Buffer.from(reqHeaderVal, "base64").toString("utf-8"));
    const accept = paymentReq.accepts[0];

    const now = Math.floor(Date.now() / 1000);
    const nonce = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    const paymentPayload = {
      x402Version: 2,
      accepted: accept,
      payload: {
        authorization: {
          from: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
          to: accept.payTo,
          value: accept.amount,
          validAfter: 0,
          validBefore: now + 300,
          nonce,
        },
        signature: `0x${"c".repeat(130)}`,
        payerAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      },
    };

    const encodedSig = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
    const paidWeather = await makeRequest("/api/paid/weather?city=Tokyo", "GET", {
      "PAYMENT-SIGNATURE": encodedSig,
    });

    console.log(`[Weather Paid] Status: ${paidWeather.statusCode}`);
    console.log(`[Weather Paid] PAYMENT-RESPONSE header present: ${!!paidWeather.headers["payment-response"]}`);
    console.log(`[Weather Paid] Body: ${paidWeather.body}`);

    if (paidWeather.statusCode !== 200) throw new Error(`Expected 200, got ${paidWeather.statusCode}`);
    const weatherBody = JSON.parse(paidWeather.body);
    if (!weatherBody.data || weatherBody.data.city !== "Tokyo") throw new Error("Missing protected data in paid response");
    if (!paidWeather.headers["payment-response"]) throw new Error("Missing PAYMENT-RESPONSE header");

    console.log("🎉 ALL LIVE HTTP ENDPOINTS VERIFIED SUCCESSFULLY!");
  } finally {
    console.log("🛑 Stopping test server...");
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
