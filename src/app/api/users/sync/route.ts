import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { onboardingSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });
  if (existing) {
    return NextResponse.json({ error: "User already onboarded" }, { status: 409 });
  }

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { familyName, firstName, lastName } = parsed.data;

  // Create family and user in a transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: { name: familyName },
      });

      const user = await tx.user.create({
        data: {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
          firstName,
          lastName,
          role: "PARENT",
          avatarUrl: clerkUser.imageUrl,
          familyId: family.id,
        },
      });

      return { user, family };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    // Handle race condition: concurrent onboarding submissions hit unique constraint
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "User already onboarded" },
        { status: 409 }
      );
    }
    throw err;
  }
}
