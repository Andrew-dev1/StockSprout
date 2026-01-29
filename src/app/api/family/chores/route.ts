import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent } from "@/lib/auth";
import { createChoreSchema } from "@/lib/validations";

export async function GET() {
  let parent;
  try {
    parent = await requireParent();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!parent.familyId) {
    return NextResponse.json({ error: "No family found" }, { status: 404 });
  }

  const chores = await prisma.chore.findMany({
    where: { familyId: parent.familyId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      reward: true,
      isRecurring: true,
      createdAt: true,
    },
  });

  const serialized = chores.map((c) => ({
    ...c,
    reward: c.reward.toString(),
    createdAt: c.createdAt.toISOString(),
  }));

  return NextResponse.json(serialized);
}

export async function POST(request: Request) {
  let parent;
  try {
    parent = await requireParent();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!parent.familyId) {
    return NextResponse.json({ error: "No family found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createChoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { title, description, reward, isRecurring } = parsed.data;

  const chore = await prisma.chore.create({
    data: {
      title,
      description: description || null,
      reward,
      isRecurring,
      familyId: parent.familyId,
      createdById: parent.id,
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

  return NextResponse.json(
    {
      ...chore,
      reward: chore.reward.toString(),
      createdAt: chore.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
