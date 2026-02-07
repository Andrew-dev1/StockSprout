import { NextResponse } from "next/server";
import { requireChild } from "@/lib/child-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const child = await requireChild();

    // Get snapshots from last 2 months
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: {
        userId: child.id,
        date: {
          gte: twoMonthsAgo,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Transform for client
    const result = snapshots.map((snapshot) => ({
      date: snapshot.date.toISOString().split("T")[0], // YYYY-MM-DD
      portfolioValue: Number(snapshot.portfolioValue),
      cashBalance: Number(snapshot.cashBalance),
      totalValue: Number(snapshot.totalValue),
    }));

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Portfolio history error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
