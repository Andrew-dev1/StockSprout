import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchStockQuote, getTradeDate } from "@/lib/finnhub";

// Vercel cron jobs send a secret to verify the request
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify cron secret in production
  if (process.env.NODE_ENV === "production" && CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startTime = Date.now();
  const results: {
    ticker: string;
    status: "updated" | "skipped" | "error";
    price?: number;
    error?: string;
  }[] = [];

  try {
    // Get all active stocks from database
    const stocks = await prisma.stock.findMany({
      where: { isActive: true },
      select: { id: true, ticker: true },
    });

    if (stocks.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active stocks to update",
        stocksProcessed: 0,
        duration: Date.now() - startTime,
      });
    }

    // Process each stock
    for (const stock of stocks) {
      try {
        // Fetch quote from Finnhub
        const quote = await fetchStockQuote(stock.ticker);

        if (!quote) {
          results.push({
            ticker: stock.ticker,
            status: "error",
            error: "No quote data available",
          });
          continue;
        }

        // Use the previous close price (pc) for consistency
        // This is the official closing price from the last trading day
        const price = quote.pc;
        const tradeDate = getTradeDate(quote.t);

        // Check if we already have a price for this date
        const existingPrice = await prisma.stockPrice.findUnique({
          where: {
            stockId_date: {
              stockId: stock.id,
              date: tradeDate,
            },
          },
        });

        if (existingPrice) {
          results.push({
            ticker: stock.ticker,
            status: "skipped",
            price: Number(existingPrice.price),
          });
          continue;
        }

        // Insert the new price
        await prisma.stockPrice.create({
          data: {
            stockId: stock.id,
            price,
            date: tradeDate,
          },
        });

        results.push({
          ticker: stock.ticker,
          status: "updated",
          price,
        });

        // Finnhub free tier: 60 requests/minute, so 1 second delay is safe
        await new Promise((resolve) => setTimeout(resolve, 250));
      } catch (error) {
        results.push({
          ticker: stock.ticker,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const duration = Date.now() - startTime;
    const updated = results.filter((r) => r.status === "updated").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const errors = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      success: true,
      stocksProcessed: stocks.length,
      updated,
      skipped,
      errors,
      duration,
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
