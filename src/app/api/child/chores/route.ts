import { NextResponse } from "next/server";
import { requireChild } from "@/lib/child-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const child = await requireChild();

    const assignments = await prisma.choreAssignment.findMany({
      where: { assignedToId: child.id },
      include: {
        chore: {
          select: { id: true, title: true, reward: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = assignments.map((a) => ({
      id: a.id,
      status: a.status,
      dueDate: a.dueDate?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      chore: {
        id: a.chore.id,
        title: a.chore.title,
        reward: a.chore.reward.toString(),
      },
    }));

    return NextResponse.json(serialized);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
