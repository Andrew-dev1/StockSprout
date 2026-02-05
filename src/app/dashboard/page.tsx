import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  let parent;
  try {
    parent = await requireParent();
  } catch {
    redirect("/");
  }

  const family = parent.familyId
    ? await prisma.family.findUnique({ where: { id: parent.familyId } })
    : null;

  return (
    <DashboardContent
      familyName={family?.name ?? null}
      parentFirstName={parent.firstName}
    />
  );
}
