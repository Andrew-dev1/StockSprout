import { NextResponse } from "next/server";
import { requireChild } from "@/lib/child-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const child = await requireChild();

    // Calculate date 2 months ago
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: child.id,
        createdAt: {
          gte: twoMonthsAgo,
        },
      },
      include: {
        stock: {
          select: {
            ticker: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform for client
    const result = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount),
      shares: tx.shares ? Number(tx.shares) : null,
      pricePerShare: tx.pricePerShare ? Number(tx.pricePerShare) : null,
      description: tx.description,
      createdAt: tx.createdAt.toISOString(),
      stock: tx.stock
        ? {
            ticker: tx.stock.ticker,
            name: tx.stock.name,
          }
        : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Transactions error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
