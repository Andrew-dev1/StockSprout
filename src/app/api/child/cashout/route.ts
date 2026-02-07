import { NextResponse } from "next/server";
import { requireChild } from "@/lib/child-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Calculate eligible cash-out amount (gains only, minus previous cash-outs, rounded to $5)
async function calculateEligibleAmount(childId: string): Promise<number> {
  // Get holdings to calculate current gains
  const holdings = await prisma.holding.findMany({
    where: { userId: childId },
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

  let totalValue = 0;
  let totalCostBasis = 0;

  for (const holding of holdings) {
    const shares = Number(holding.shares);
    const costBasis = Number(holding.costBasis);
    const currentPrice =
      holding.stock.prices.length > 0
        ? Number(holding.stock.prices[0].price)
        : 0;

    totalValue += shares * currentPrice;
    totalCostBasis += costBasis;
  }

  // Unrealized gains only
  const gains = Math.max(0, totalValue - totalCostBasis);

  // Subtract previously approved cash-outs
  const previousCashouts = await prisma.cashOutRequest.aggregate({
    where: {
      requestedById: childId,
      status: "APPROVED",
    },
    _sum: {
      amount: true,
    },
  });

  const previousTotal = Number(previousCashouts._sum.amount || 0);
  const remainingGains = Math.max(0, gains - previousTotal);

  // Round down to nearest $5
  return Math.floor(remainingGains / 5) * 5;
}

// GET: Check eligible amount
export async function GET() {
  try {
    const child = await requireChild();
    const eligibleAmount = await calculateEligibleAmount(child.id);

    // Check for pending requests
    const pendingRequest = await prisma.cashOutRequest.findFirst({
      where: {
        requestedById: child.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      eligibleAmount,
      hasPendingRequest: !!pendingRequest,
      pendingAmount: pendingRequest ? Number(pendingRequest.amount) : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Cashout eligible error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

const cashoutSchema = z.object({
  amount: z.coerce.number().min(5, "Minimum cash-out is $5.00"),
});

// POST: Request cash-out
export async function POST(request: Request) {
  try {
    const child = await requireChild();
    const body = await request.json();
    const parsed = cashoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { amount } = parsed.data;

    // Verify amount is multiple of $5
    if (amount % 5 !== 0) {
      return NextResponse.json(
        { error: "Amount must be a multiple of $5" },
        { status: 400 }
      );
    }

    // Check eligible amount
    const eligibleAmount = await calculateEligibleAmount(child.id);
    if (amount > eligibleAmount) {
      return NextResponse.json(
        { error: `Maximum eligible amount is $${eligibleAmount.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Check for existing pending request
    const existingRequest = await prisma.cashOutRequest.findFirst({
      where: {
        requestedById: child.id,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending cash-out request" },
        { status: 400 }
      );
    }

    // Create cash-out request
    const cashOutRequest = await prisma.cashOutRequest.create({
      data: {
        amount,
        requestedById: child.id,
      },
    });

    return NextResponse.json({
      id: cashOutRequest.id,
      amount: Number(cashOutRequest.amount),
      status: cashOutRequest.status,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Cashout request error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
