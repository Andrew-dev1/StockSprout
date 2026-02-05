import { NextResponse } from "next/server";
import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const parent = await requireParent();

    if (!parent.familyId) {
      return NextResponse.json([]);
    }

    const pendingAssignments = await prisma.choreAssignment.findMany({
      where: {
        status: "SUBMITTED",
        chore: { familyId: parent.familyId },
      },
      include: {
        chore: { select: { title: true, reward: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
      orderBy: { completedAt: "asc" },
    });

    const serialized = pendingAssignments.map((a) => ({
      id: a.id,
      choreTitle: a.chore.title,
      reward: a.chore.reward.toString(),
      childName: `${a.assignedTo.firstName} ${a.assignedTo.lastName}`,
    }));

    return NextResponse.json(serialized);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
