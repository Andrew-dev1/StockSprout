import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { childLoginSchema } from "@/lib/validations";
import { createChildSession } from "@/lib/child-auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = childLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { firstName, familyName, pin } = parsed.data;

    const family = await prisma.family.findFirst({
      where: { name: { equals: familyName, mode: "insensitive" } },
    });

    if (!family) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const child = await prisma.user.findFirst({
      where: {
        familyId: family.id,
        firstName: { equals: firstName, mode: "insensitive" },
        role: "CHILD",
      },
    });

    if (!child || !child.pin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const pinMatch = await bcrypt.compare(pin, child.pin);
    if (!pinMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    await createChildSession(child.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
