import { NextRequest, NextResponse } from "next/server";
import { withX402Paywall } from "@/lib/x402/server";

export const dynamic = "force-dynamic";

// Deterministic realistic weather models for demo cities
const WEATHER_DATABASE: Record<
  string,
  { condition: string; tempC: number; humidity: number; windKph: number }
> = {
  tokyo: { condition: "Clear", tempC: 18, humidity: 55, windKph: 12 },
  nagpur: { condition: "Sunny", tempC: 31, humidity: 40, windKph: 8 },
  london: { condition: "Partly Cloudy", tempC: 14, humidity: 72, windKph: 16 },
  newyork: { condition: "Rain Showers", tempC: 12, humidity: 80, windKph: 20 },
  singapore: { condition: "Tropical Humid", tempC: 29, humidity: 85, windKph: 10 },
  berlin: { condition: "Overcast", tempC: 11, humidity: 68, windKph: 14 },
  sanfrancisco: { condition: "Breezy", tempC: 16, humidity: 65, windKph: 22 },
};

export const GET = withX402Paywall(
  {
    serviceSlug: "weather-api",
    endpointPath: "/api/paid/weather",
  },
  async (req: NextRequest, paymentContext) => {
    const searchParams = req.nextUrl.searchParams;
    const requestedCity = searchParams.get("city") || "Nagpur";
    const normalizedKey = requestedCity.toLowerCase().replace(/[^a-z]/g, "");

    const baseData = WEATHER_DATABASE[normalizedKey] || {
      condition: "Clear",
      tempC: 22,
      humidity: 50,
      windKph: 10,
    };

    return NextResponse.json({
      success: true,
      service: "weather-api",
      timestamp: new Date().toISOString(),
      data: {
        city: requestedCity,
        condition: baseData.condition,
        temperatureCelsius: baseData.tempC,
        temperatureFahrenheit: Math.round((baseData.tempC * 9) / 5 + 32),
        humidityPercent: baseData.humidity,
        windSpeedKph: baseData.windKph,
        source: "AgentPay Meteorological Core (Demo Data)",
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
