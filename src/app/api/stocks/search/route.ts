import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchSymbols } from "@/lib/finnhub";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  // First, search our cached stocks (fast)
  const cachedStocks = await prisma.stock.findMany({
    where: {
      isActive: true,
      OR: [
        { ticker: { contains: query.toUpperCase() } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      ticker: true,
      name: true,
      logoUrl: true,
    },
    take: 10,
  });

  // If we have enough cached results, return them
  if (cachedStocks.length >= 5) {
    return NextResponse.json({
      results: cachedStocks.map((s) => ({
        symbol: s.ticker,
        name: s.name,
        logo: s.logoUrl,
        cached: true,
      })),
      source: "cache",
    });
  }

  // Otherwise, also search Finnhub API
  const finnhubResults = await searchSymbols(query);

  if (!finnhubResults) {
    // Return cached results if API fails
    return NextResponse.json({
      results: cachedStocks.map((s) => ({
        symbol: s.ticker,
        name: s.name,
        logo: s.logoUrl,
        cached: true,
      })),
      source: "cache",
    });
  }

  // Filter to common stock types and US exchanges
  const filteredResults = finnhubResults.result
    .filter(
      (r) =>
        r.type === "Common Stock" &&
        !r.symbol.includes(".") // Exclude foreign exchanges like AAPL.L
    )
    .slice(0, 10);

  // Merge cached and API results, prioritizing cached
  const cachedTickers = new Set(cachedStocks.map((s) => s.ticker));
  const mergedResults = [
    ...cachedStocks.map((s) => ({
      symbol: s.ticker,
      name: s.name,
      logo: s.logoUrl,
      cached: true,
    })),
    ...filteredResults
      .filter((r) => !cachedTickers.has(r.symbol))
      .map((r) => ({
        symbol: r.symbol,
        name: r.description,
        logo: null,
        cached: false,
      })),
  ].slice(0, 10);

  return NextResponse.json({
    results: mergedResults,
    source: "mixed",
  });
}
