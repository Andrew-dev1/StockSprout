import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent } from "@/lib/auth";
import { createChoreSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ choreId: string }> }
) {
  let parent;
  try {
    parent = await requireParent();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!parent.familyId) {
    return NextResponse.json({ error: "No family found" }, { status: 404 });
  }

  const { choreId } = await params;

  // Verify chore belongs to this family
  const existing = await prisma.chore.findUnique({ where: { id: choreId } });
  if (!existing || existing.familyId !== parent.familyId) {
    return NextResponse.json({ error: "Chore not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createChoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, reward, isRecurring } = parsed.data;

  const chore = await prisma.chore.update({
    where: { id: choreId },
    data: {
      title,
      description: description || null,
      reward,
      isRecurring,
    },
    select: {
      id: true,
      title: true,
      description: true,
      reward: true,
      isRecurring: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    ...chore,
    reward: chore.reward.toString(),
    createdAt: chore.createdAt.toISOString(),
  });
}
