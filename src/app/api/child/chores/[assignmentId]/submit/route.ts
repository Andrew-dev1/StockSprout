import { NextResponse } from "next/server";
import { requireChild } from "@/lib/child-auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const child = await requireChild();
    const { assignmentId } = await params;

    const assignment = await prisma.choreAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.assignedToId !== child.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (assignment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Chore is not in a submittable state" },
        { status: 400 }
      );
    }

    const updated = await prisma.choreAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "SUBMITTED",
        completedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
