import { NextResponse } from "next/server";
import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Only parents can access health check
    await requireParent();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all stocks with their latest price
    const stocks = await prisma.stock.findMany({
      orderBy: { ticker: "asc" },
      include: {
        prices: {
          orderBy: { date: "desc" },
          take: 1,
        },
        _count: {
          select: { prices: true },
        },
      },
    });

    // Calculate date threshold for "recent" (last 3 trading days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 5); // 5 calendar days to account for weekends

    const activeStocks = stocks.filter((s) => s.isActive);
    const stocksWithRecentPrices = activeStocks.filter((s) => {
      if (s.prices.length === 0) return false;
      const latestPriceDate = new Date(s.prices[0].date);
      return latestPriceDate >= threeDaysAgo;
    });

    const stocksMissingPrices = activeStocks
      .filter((s) => {
        if (s.prices.length === 0) return true;
        const latestPriceDate = new Date(s.prices[0].date);
        return latestPriceDate < threeDaysAgo;
      })
      .map((s) => s.ticker);

    // Get the most recent price date across all stocks
    const latestPrice = await prisma.stockPrice.findFirst({
      orderBy: { date: "desc" },
    });

    const formattedStocks = stocks.map((s) => ({
      id: s.id,
      ticker: s.ticker,
      name: s.name,
      isActive: s.isActive,
      latestPrice:
        s.prices.length > 0
          ? {
              price: s.prices[0].price.toString(),
              date: s.prices[0].date.toISOString(),
            }
          : null,
      priceCount: s._count.prices,
    }));

    return NextResponse.json({
      totalStocks: stocks.length,
      activeStocks: activeStocks.length,
      stocksWithRecentPrices: stocksWithRecentPrices.length,
      stocksMissingPrices,
      latestPriceDate: latestPrice?.date.toISOString() ?? null,
      stocks: formattedStocks,
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
