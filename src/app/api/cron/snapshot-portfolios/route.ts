import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Vercel cron jobs send a secret to verify the request
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify cron secret in production
  if (process.env.NODE_ENV === "production" && CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startTime = Date.now();
  const results: {
    userId: string;
    firstName: string;
    status: "created" | "skipped" | "error";
    totalValue?: number;
    error?: string;
  }[] = [];

  try {
    // Get today's date (normalized to midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all children with their holdings
    const children = await prisma.user.findMany({
      where: { role: "CHILD" },
      select: {
        id: true,
        firstName: true,
        balance: true,
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
      },
    });

    for (const child of children) {
      try {
        // Check if snapshot already exists for today
        const existingSnapshot = await prisma.portfolioSnapshot.findUnique({
          where: {
            userId_date: {
              userId: child.id,
              date: today,
            },
          },
        });

        if (existingSnapshot) {
          results.push({
            userId: child.id,
            firstName: child.firstName,
            status: "skipped",
            totalValue: Number(existingSnapshot.totalValue),
          });
          continue;
        }

        // Calculate portfolio value
        let portfolioValue = 0;
        for (const holding of child.holdings) {
          const shares = Number(holding.shares);
          const price =
            holding.stock.prices.length > 0
              ? Number(holding.stock.prices[0].price)
              : 0;
          portfolioValue += shares * price;
        }

        const cashBalance = Number(child.balance);
        const totalValue = portfolioValue + cashBalance;

        // Create snapshot
        await prisma.portfolioSnapshot.create({
          data: {
            userId: child.id,
            date: today,
            portfolioValue,
            cashBalance,
            totalValue,
          },
        });

        results.push({
          userId: child.id,
          firstName: child.firstName,
          status: "created",
          totalValue,
        });
      } catch (error) {
        results.push({
          userId: child.id,
          firstName: child.firstName,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const duration = Date.now() - startTime;
    const created = results.filter((r) => r.status === "created").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const errors = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      success: true,
      childrenProcessed: children.length,
      created,
      skipped,
      errors,
      duration,
      results,
    });
  } catch (error) {
    console.error("Portfolio snapshot cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
