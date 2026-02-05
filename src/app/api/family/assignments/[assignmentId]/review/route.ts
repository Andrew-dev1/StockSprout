import { NextResponse } from "next/server";
import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const parent = await requireParent();
    const { assignmentId } = await params;

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const assignment = await prisma.choreAssignment.findUnique({
      where: { id: assignmentId },
      include: { chore: true, assignedTo: true },
    });

    if (!assignment || assignment.chore.familyId !== parent.familyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (assignment.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Assignment is not in a reviewable state" },
        { status: 400 }
      );
    }

    if (parsed.data.action === "reject") {
      const updated = await prisma.choreAssignment.update({
        where: { id: assignmentId },
        data: { status: "REJECTED" },
      });
      return NextResponse.json(updated);
    }

    // Approve: update assignment, credit balance, create transaction — all in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedAssignment = await tx.choreAssignment.update({
        where: { id: assignmentId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedById: parent.id,
        },
      });

      await tx.user.update({
        where: { id: assignment.assignedToId },
        data: {
          balance: {
            increment: assignment.chore.reward,
          },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          type: "CHORE_EARNING",
          amount: assignment.chore.reward,
          description: `Completed chore: ${assignment.chore.title}`,
          userId: assignment.assignedToId,
          choreAssignmentId: assignmentId,
        },
      });

      return { assignment: updatedAssignment, transaction };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
