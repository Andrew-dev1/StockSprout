import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent } from "@/lib/auth";
import { addChildSchema } from "@/lib/validations";
import { randomUUID } from "crypto";

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

  const children = await prisma.user.findMany({
    where: { familyId: parent.familyId, role: "CHILD" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      balance: true,
      createdAt: true,
    },
  });

  const serialized = children.map((c) => ({
    ...c,
    balance: c.balance.toString(),
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
  const parsed = addChildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { firstName, lastName } = parsed.data;
  const uuid = randomUUID();

  const child = await prisma.user.create({
    data: {
      clerkId: `child_${uuid}`,
      email: `child_${uuid}@family.local`,
      firstName,
      lastName,
      role: "CHILD",
      familyId: parent.familyId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      balance: true,
      createdAt: true,
    },
  });

  return NextResponse.json(child, { status: 201 });
}
