import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChildrenList } from "./children-list";
import { AddChildDialog } from "./add-child-dialog";
import { ChoresList } from "./chores-list";
import { AddChoreDialog } from "./add-chore-dialog";

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

  const children = parent.familyId
    ? await prisma.user.findMany({
        where: { familyId: parent.familyId, role: "CHILD" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          balance: true,
          createdAt: true,
        },
      })
    : [];

  const chores = parent.familyId
    ? await prisma.chore.findMany({
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
      })
    : [];

  // Serialize Decimal/Date to string for client components
  const serializedChildren = children.map((c) => ({
    ...c,
    balance: c.balance.toString(),
    createdAt: c.createdAt.toISOString(),
  }));

  const serializedChores = chores.map((c) => ({
    ...c,
    reward: c.reward.toString(),
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {family?.name ?? "Dashboard"}
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {parent.firstName}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Children</CardTitle>
            <AddChildDialog />
          </CardHeader>
          <CardContent>
            <ChildrenList children={serializedChildren} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Chores</CardTitle>
            <AddChoreDialog />
          </CardHeader>
          <CardContent>
            <ChoresList chores={serializedChores} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
