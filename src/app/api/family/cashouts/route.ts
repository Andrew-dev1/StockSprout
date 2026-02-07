import { NextResponse } from "next/server";
import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const parent = await requireParent();

    if (!parent.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 404 });
    }

    // Get all pending cash-out requests from children in this family
    const requests = await prisma.cashOutRequest.findMany({
      where: {
        status: "PENDING",
        requestedBy: {
          familyId: parent.familyId,
          role: "CHILD",
        },
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    return NextResponse.json(
      requests.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        status: r.status,
        requestedAt: r.requestedAt.toISOString(),
        child: {
          id: r.requestedBy.id,
          firstName: r.requestedBy.firstName,
          lastName: r.requestedBy.lastName,
        },
      }))
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Cashouts list error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
