import { NextResponse } from "next/server";
import { requireChild } from "@/lib/child-auth";
import { prisma } from "@/lib/db";
import { buyStockSchema } from "@/lib/validations";
import { Prisma } from "@/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const child = await requireChild();
    const body = await request.json();
    const parsed = buyStockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { ticker, amount } = parsed.data;

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

    if (!stock || !stock.isActive) {
      return NextResponse.json(
        { error: "Stock not found or not available for trading" },
        { status: 404 }
      );
    }

    if (stock.prices.length === 0) {
      return NextResponse.json(
        { error: "No price data available for this stock" },
        { status: 400 }
      );
    }

    const price = Number(stock.prices[0].price);

    // Check child has sufficient balance
    const currentBalance = Number(child.balance);
    if (currentBalance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Calculate shares (round down to 6 decimals)
    const shares = Math.floor((amount / price) * 1000000) / 1000000;

    if (shares <= 0) {
      return NextResponse.json(
        { error: "Amount too small to purchase any shares" },
        { status: 400 }
      );
    }

    // Execute trade in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Decrement user balance
      const updatedUser = await tx.user.update({
        where: { id: child.id },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      // Upsert holding (add shares and cost basis)
      const existingHolding = await tx.holding.findUnique({
        where: {
          userId_stockId: {
            userId: child.id,
            stockId: stock.id,
          },
        },
      });

      let holding;
      if (existingHolding) {
        holding = await tx.holding.update({
          where: { id: existingHolding.id },
          data: {
            shares: {
              increment: shares,
            },
            costBasis: {
              increment: amount,
            },
          },
        });
      } else {
        holding = await tx.holding.create({
          data: {
            userId: child.id,
            stockId: stock.id,
            shares: shares,
            costBasis: amount,
          },
        });
      }

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          type: "STOCK_BUY",
          amount: amount,
          shares: shares,
          pricePerShare: price,
          description: `Bought ${shares.toFixed(6)} shares of ${ticker}`,
          userId: child.id,
          stockId: stock.id,
        },
      });

      return {
        balance: Number(updatedUser.balance),
        holding: {
          id: holding.id,
          shares: Number(holding.shares),
          costBasis: Number(holding.costBasis),
        },
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
    console.error("Buy stock error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
