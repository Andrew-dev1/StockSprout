import { NextResponse } from "next/server";
import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setPinSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const parent = await requireParent();
    const { childId } = await params;

    const body = await request.json();
    const parsed = setPinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const child = await prisma.user.findUnique({
      where: { id: childId },
    });

    if (!child || child.role !== "CHILD" || child.familyId !== parent.familyId) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    const hashedPin = await bcrypt.hash(parsed.data.pin, 10);

    await prisma.user.update({
      where: { id: childId },
      data: { pin: hashedPin },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
