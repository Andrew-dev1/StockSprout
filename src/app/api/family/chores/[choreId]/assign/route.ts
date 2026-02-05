import { NextResponse } from "next/server";
import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const assignSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ choreId: string }> }
) {
  try {
    const parent = await requireParent();
    const { choreId } = await params;

    const body = await request.json();
    const parsed = assignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const chore = await prisma.chore.findUnique({
      where: { id: choreId },
    });

    if (!chore || chore.familyId !== parent.familyId) {
      return NextResponse.json({ error: "Chore not found" }, { status: 404 });
    }

    const child = await prisma.user.findUnique({
      where: { id: parsed.data.childId },
    });

    if (!child || child.role !== "CHILD" || child.familyId !== parent.familyId) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    const assignment = await prisma.choreAssignment.create({
      data: {
        choreId: chore.id,
        assignedToId: child.id,
        status: "PENDING",
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
