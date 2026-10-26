import { NextRequest, NextResponse } from "next/server";
import { withX402Paywall } from "@/lib/x402/server";

export const dynamic = "force-dynamic";

export const POST = withX402Paywall(
  {
    serviceSlug: "text-analysis-api",
    endpointPath: "/api/paid/text-analysis",
  },
  async (req: NextRequest, paymentContext) => {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body. Expected { text: string }", code: "INVALID_BODY" },
        { status: 400 }
      );
    }

    const text: string = body.text || "";
    if (typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or empty 'text' field", code: "EMPTY_TEXT" },
        { status: 400 }
      );
    }

    // Perform actual text processing
    const trimmed = text.trim();
    const charactersWithSpaces = trimmed.length;
    const charactersNoSpaces = trimmed.replace(/\s+/g, "").length;
    const words = trimmed.match(/\b\w+\b/g) || [];
    const wordCount = words.length;
    const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length || 1;
    const averageWordLength = wordCount > 0 ? Number((charactersNoSpaces / wordCount).toFixed(2)) : 0;
    const averageSentenceLength = Number((wordCount / sentenceCount).toFixed(2));
    const estimatedReadingTimeMinutes = Number((wordCount / 200).toFixed(2));

    // Basic sentiment scoring heuristic based on positive/negative lexical tokens
    const positiveTokens = ["good", "great", "excellent", "fast", "reliable", "smart", "secure", "best", "positive", "love", "profit", "win"];
    const negativeTokens = ["bad", "terrible", "slow", "broken", "risk", "fail", "failed", "error", "vulnerable", "loss", "hate", "issue"];

    let positiveScore = 0;
    let negativeScore = 0;
    for (const w of words) {
      const lower = w.toLowerCase();
      if (positiveTokens.includes(lower)) positiveScore++;
      if (negativeTokens.includes(lower)) negativeScore++;
    }

    let sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL" = "NEUTRAL";
    if (positiveScore > negativeScore) sentiment = "POSITIVE";
    else if (negativeScore > positiveScore) sentiment = "NEGATIVE";

    // Vocabulary uniqueness / lexical diversity
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    const lexicalDiversity = wordCount > 0 ? Number((uniqueWords.size / wordCount).toFixed(3)) : 0;

    return NextResponse.json({
      success: true,
      service: "text-analysis-api",
      timestamp: new Date().toISOString(),
      analytics: {
        wordCount,
        characterCount: charactersWithSpaces,
        characterCountNoSpaces: charactersNoSpaces,
        sentenceCount,
        averageWordLength,
        averageSentenceLength,
        estimatedReadingTimeMinutes,
        lexicalDiversity,
        sentiment,
        sentimentBreakdown: {
          positiveMatches: positiveScore,
          negativeMatches: negativeScore,
        },
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
