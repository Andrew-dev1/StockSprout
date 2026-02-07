import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  fetchStockQuote,
  fetchCompanyProfile,
  fetchStockCandles,
  fetchMarketStatus,
} from "@/lib/finnhub";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const upperTicker = ticker.toUpperCase();

  // Check if stock is in our database
  const cachedStock = await prisma.stock.findUnique({
    where: { ticker: upperTicker },
    include: {
      prices: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
  });

  // Fetch real-time quote from Finnhub
  const [quote, profile, candles, marketStatus] = await Promise.all([
    fetchStockQuote(upperTicker),
    cachedStock ? null : fetchCompanyProfile(upperTicker), // Only fetch if not cached
    fetchStockCandles(upperTicker, 30),
    fetchMarketStatus(),
  ]);

  if (!quote) {
    return NextResponse.json(
      { error: "Stock not found or invalid ticker" },
      { status: 404 }
    );
  }

  // Build price history from candles or cached prices
  let priceHistory: { date: string; price: number }[] = [];

  if (candles && candles.t.length > 0) {
    priceHistory = candles.t.map((timestamp, i) => ({
      date: new Date(timestamp * 1000).toISOString().split("T")[0],
      price: candles.c[i],
    }));
  } else if (cachedStock && cachedStock.prices.length > 0) {
    priceHistory = cachedStock.prices
      .map((p) => ({
        date: p.date.toISOString().split("T")[0],
        price: Number(p.price),
      }))
      .reverse();
  }

  // Use cached stock info or fetched profile
  const stockInfo = cachedStock
    ? {
        ticker: cachedStock.ticker,
        name: cachedStock.name,
        logo: cachedStock.logoUrl,
        isTracked: true,
      }
    : profile
    ? {
        ticker: profile.ticker,
        name: profile.name,
        logo: profile.logo,
        industry: profile.finnhubIndustry,
        exchange: profile.exchange,
        marketCap: profile.marketCapitalization,
        website: profile.weburl,
        isTracked: false,
      }
    : {
        ticker: upperTicker,
        name: upperTicker,
        logo: null,
        isTracked: false,
      };

  return NextResponse.json({
    ...stockInfo,
    quote: {
      current: quote.c,
      previousClose: quote.pc,
      open: quote.o,
      high: quote.h,
      low: quote.l,
      change: quote.d,
      changePercent: quote.dp,
      timestamp: quote.t,
    },
    priceHistory,
    market: marketStatus
      ? {
          isOpen: marketStatus.isOpen,
          session: marketStatus.session,
          holiday: marketStatus.holiday,
        }
      : null,
  });
}
