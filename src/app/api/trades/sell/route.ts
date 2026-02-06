import { NextResponse } from "next/server";
import { requireChild } from "@/lib/child-auth";
import { prisma } from "@/lib/db";
import { sellStockSchema } from "@/lib/validations";
import { Prisma } from "@/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const child = await requireChild();
    const body = await request.json();
    const parsed = sellStockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { ticker, shares: sharesToSell } = parsed.data;

    // Get the stock and its latest price
    const stock = await prisma.stock.findUnique({
      where: { ticker },
      include: {
        prices: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });

    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    if (stock.prices.length === 0) {
      return NextResponse.json(
        { error: "No price data available for this stock" },
        { status: 400 }
      );
    }

    const price = Number(stock.prices[0].price);

    // Get user's holding
    const holding = await prisma.holding.findUnique({
      where: {
        userId_stockId: {
          userId: child.id,
          stockId: stock.id,
        },
      },
    });

    if (!holding) {
      return NextResponse.json(
        { error: "You do not own any shares of this stock" },
        { status: 400 }
      );
    }

    const currentShares = Number(holding.shares);
    if (currentShares < sharesToSell) {
      return NextResponse.json(
        { error: `Insufficient shares. You own ${currentShares.toFixed(6)} shares.` },
        { status: 400 }
      );
    }

    // Calculate proceeds
    const proceeds = sharesToSell * price;

    // Calculate proportional cost basis to remove
    const costBasisPerShare = Number(holding.costBasis) / currentShares;
    const costBasisToRemove = costBasisPerShare * sharesToSell;

    // Execute trade in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Increment user balance
      const updatedUser = await tx.user.update({
        where: { id: child.id },
        data: {
          balance: {
            increment: proceeds,
          },
        },
      });

      // Update or delete holding
      const remainingShares = currentShares - sharesToSell;
      let updatedHolding = null;

      if (remainingShares > 0.000001) {
        // Keep holding with reduced shares
        updatedHolding = await tx.holding.update({
          where: { id: holding.id },
          data: {
            shares: remainingShares,
            costBasis: {
              decrement: costBasisToRemove,
            },
          },
        });
      } else {
        // Delete holding if no shares left
        await tx.holding.delete({
          where: { id: holding.id },
        });
      }

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          type: "STOCK_SELL",
          amount: proceeds,
          shares: sharesToSell,
          pricePerShare: price,
          description: `Sold ${sharesToSell.toFixed(6)} shares of ${ticker}`,
          userId: child.id,
          stockId: stock.id,
        },
      });

      return {
        balance: Number(updatedUser.balance),
        holding: updatedHolding
          ? {
              id: updatedHolding.id,
              shares: Number(updatedHolding.shares),
              costBasis: Number(updatedHolding.costBasis),
            }
          : null,
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: Number(transaction.amount),
          shares: Number(transaction.shares),
          pricePerShare: Number(transaction.pricePerShare),
        },
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
    console.error("Sell stock error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
