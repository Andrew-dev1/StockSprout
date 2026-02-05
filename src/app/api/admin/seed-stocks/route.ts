import { NextResponse } from "next/server";
import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchCompanyProfile } from "@/lib/finnhub";

// Initial set of kid-friendly, recognizable stocks
const INITIAL_STOCKS = [
  { ticker: "AAPL", name: "Apple Inc." },
  { ticker: "DIS", name: "The Walt Disney Company" },
  { ticker: "GOOGL", name: "Alphabet Inc." },
  { ticker: "MSFT", name: "Microsoft Corporation" },
  { ticker: "NFLX", name: "Netflix, Inc." },
  { ticker: "NKE", name: "Nike, Inc." },
  { ticker: "SBUX", name: "Starbucks Corporation" },
  { ticker: "TSLA", name: "Tesla, Inc." },
  { ticker: "MCD", name: "McDonald's Corporation" },
  { ticker: "KO", name: "The Coca-Cola Company" },
];

export async function POST() {
  try {
    // Only parents can seed stocks
    await requireParent();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { ticker: string; status: string; name?: string }[] = [];

  for (const stock of INITIAL_STOCKS) {
    try {
      // Check if stock already exists
      const existing = await prisma.stock.findUnique({
        where: { ticker: stock.ticker },
      });

      if (existing) {
        results.push({ ticker: stock.ticker, status: "exists", name: existing.name });
        continue;
      }

      // Try to fetch details from Finnhub for accurate name and logo
      let name = stock.name;
      let logoUrl: string | null = null;
      try {
        const profile = await fetchCompanyProfile(stock.ticker);
        if (profile?.name) {
          name = profile.name;
          logoUrl = profile.logo || null;
        }
      } catch {
        // Use fallback name if API fails
      }

      // Create the stock
      await prisma.stock.create({
        data: {
          ticker: stock.ticker,
          name,
          logoUrl,
          isActive: true,
        },
      });

      results.push({ ticker: stock.ticker, status: "created", name });

      // Small delay to avoid rate limiting (60 req/min on Finnhub free tier)
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      results.push({
        ticker: stock.ticker,
        status: `error: ${error instanceof Error ? error.message : "unknown"}`,
      });
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const existing = results.filter((r) => r.status === "exists").length;

  return NextResponse.json({
    success: true,
    message: `Created ${created} stocks, ${existing} already existed`,
    results,
  });
}
