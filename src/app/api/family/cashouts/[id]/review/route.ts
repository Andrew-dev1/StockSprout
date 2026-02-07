import { NextResponse } from "next/server";
import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const parent = await requireParent();
    const { id } = await params;

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    // Get the cash-out request
    const cashOutRequest = await prisma.cashOutRequest.findUnique({
      where: { id },
      include: {
        requestedBy: true,
      },
    });

    if (!cashOutRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Verify child belongs to parent's family
    if (cashOutRequest.requestedBy.familyId !== parent.familyId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (cashOutRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request already processed" },
        { status: 400 }
      );
    }

    if (parsed.data.action === "reject") {
      const updated = await prisma.cashOutRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          processedAt: new Date(),
          approvedById: parent.id,
        },
      });

      return NextResponse.json({
        id: updated.id,
        status: updated.status,
      });
    }

    // Approve: record the cash-out (parent gives real money IRL)
    // Note: We don't deduct from balance - gains are in portfolio, not cash
    // The approved amount is tracked to reduce future eligible cash-out amounts
    const amount = Number(cashOutRequest.amount);

    const result = await prisma.$transaction(async (tx) => {
      // Update cash-out request
      const updatedRequest = await tx.cashOutRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          processedAt: new Date(),
          approvedById: parent.id,
        },
      });

      // Create transaction record for history
      const transaction = await tx.transaction.create({
        data: {
          type: "CASH_OUT",
          amount: amount,
          description: `Cash out: $${amount.toFixed(2)}`,
          userId: cashOutRequest.requestedById,
          cashOutRequestId: id,
        },
      });

      return {
        request: updatedRequest,
        transaction,
      };
    });

    return NextResponse.json({
      id: result.request.id,
      status: result.request.status,
      amount,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Cashout review error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
