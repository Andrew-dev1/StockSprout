import { NextResponse } from "next/server";
import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const parent = await requireParent();

    if (!parent.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 404 });
    }

    // Get all children with holdings and pending items
    const children = await prisma.user.findMany({
      where: {
        familyId: parent.familyId,
        role: "CHILD",
      },
      include: {
        holdings: {
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
        },
        assignedChores: {
          where: { status: "SUBMITTED" },
          include: { chore: true },
        },
        cashOutRequests: {
          where: { status: "PENDING" },
        },
      },
    });

    // Calculate values for each child
    const childrenData = children.map((child) => {
      const cashBalance = Number(child.balance);

      // Calculate portfolio value and cost basis
      let portfolioValue = 0;
      let totalCostBasis = 0;

      for (const holding of child.holdings) {
        const shares = Number(holding.shares);
        const costBasis = Number(holding.costBasis);
        const currentPrice =
          holding.stock.prices.length > 0
            ? Number(holding.stock.prices[0].price)
            : 0;

        portfolioValue += shares * currentPrice;
        totalCostBasis += costBasis;
      }

      // Unrealized gain = current value - cost basis
      const unrealizedGain = portfolioValue - totalCostBasis;

      // Total value = cash + portfolio
      const totalValue = cashBalance + portfolioValue;

      // "Real money owed" = gains only (if positive)
      // This is the amount parent would owe if child cashed out gains
      const realMoneyOwed = Math.max(0, unrealizedGain);

      return {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        cashBalance,
        portfolioValue,
        totalCostBasis,
        unrealizedGain,
        totalValue,
        realMoneyOwed,
        pendingChores: child.assignedChores.length,
        pendingCashOuts: child.cashOutRequests.length,
      };
    });

    // Calculate totals
    const totals = {
      totalCashBalance: childrenData.reduce((sum, c) => sum + c.cashBalance, 0),
      totalPortfolioValue: childrenData.reduce(
        (sum, c) => sum + c.portfolioValue,
        0
      ),
      totalValue: childrenData.reduce((sum, c) => sum + c.totalValue, 0),
      totalUnrealizedGain: childrenData.reduce(
        (sum, c) => sum + c.unrealizedGain,
        0
      ),
      totalRealMoneyOwed: childrenData.reduce(
        (sum, c) => sum + c.realMoneyOwed,
        0
      ),
      totalPendingChores: childrenData.reduce(
        (sum, c) => sum + c.pendingChores,
        0
      ),
      totalPendingCashOuts: childrenData.reduce(
        (sum, c) => sum + c.pendingCashOuts,
        0
      ),
    };

    return NextResponse.json({
      children: childrenData,
      totals,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Family overview error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
