import { NextResponse } from "next/server";
import { requireChild } from "@/lib/child-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const child = await requireChild();

    // Get all holdings with stock info and latest prices
    const holdings = await prisma.holding.findMany({
      where: { userId: child.id },
      include: {
        stock: {
          include: {
            prices: {
              orderBy: { date: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    // Calculate values and gains for each holding
    const portfolioHoldings = holdings.map((holding) => {
      const shares = Number(holding.shares);
      const costBasis = Number(holding.costBasis);
      const currentPrice =
        holding.stock.prices.length > 0
          ? Number(holding.stock.prices[0].price)
          : 0;
      const currentValue = shares * currentPrice;
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      return {
        id: holding.id,
        stockId: holding.stockId,
        ticker: holding.stock.ticker,
        name: holding.stock.name,
        shares,
        costBasis,
        currentPrice,
        currentValue,
        gainLoss,
        gainLossPercent,
      };
    });

    // Calculate portfolio totals
    const totalValue = portfolioHoldings.reduce(
      (sum, h) => sum + h.currentValue,
      0
    );
    const totalCostBasis = portfolioHoldings.reduce(
      (sum, h) => sum + h.costBasis,
      0
    );
    const totalGainLoss = totalValue - totalCostBasis;
    const totalGainLossPercent =
      totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

    return NextResponse.json({
      holdings: portfolioHoldings,
      totals: {
        value: totalValue,
        costBasis: totalCostBasis,
        gainLoss: totalGainLoss,
        gainLossPercent: totalGainLossPercent,
      },
      balance: Number(child.balance),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Portfolio error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
