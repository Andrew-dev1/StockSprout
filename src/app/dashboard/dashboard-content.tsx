"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChildrenList } from "./children-list";
import { AddChildDialog } from "./add-child-dialog";
import { ChoresList } from "./chores-list";
import { AddChoreDialog } from "./add-chore-dialog";
import { PendingApprovals } from "./pending-approvals";
import { FamilyOverview } from "@/components/family-overview";
import { ChildrenOverview } from "@/components/children-overview";
import { PendingCashouts } from "@/components/pending-cashouts";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  balance: string;
  createdAt: string;
}

interface Chore {
  id: string;
  title: string;
  description: string | null;
  reward: string;
  isRecurring: boolean;
  createdAt: string;
}

interface Approval {
  id: string;
  choreTitle: string;
  reward: string;
  childName: string;
}

async function fetchChildren(): Promise<Child[]> {
  const res = await fetch("/api/family/children");
  if (!res.ok) throw new Error("Failed to fetch children");
  return res.json();
}

async function fetchChores(): Promise<Chore[]> {
  const res = await fetch("/api/family/chores");
  if (!res.ok) throw new Error("Failed to fetch chores");
  return res.json();
}

async function fetchPendingApprovals(): Promise<Approval[]> {
  const res = await fetch("/api/family/assignments");
  if (!res.ok) throw new Error("Failed to fetch approvals");
  return res.json();
}

export function DashboardContent({
  familyName,
  parentFirstName,
}: {
  familyName: string | null;
  parentFirstName: string;
}) {
  const {
    data: children = [],
    isLoading: childrenLoading,
  } = useQuery({
    queryKey: ["children"],
    queryFn: fetchChildren,
  });

  const {
    data: chores = [],
    isLoading: choresLoading,
  } = useQuery({
    queryKey: ["chores"],
    queryFn: fetchChores,
  });

  const {
    data: pendingApprovals = [],
    isLoading: approvalsLoading,
  } = useQuery({
    queryKey: ["pendingApprovals"],
    queryFn: fetchPendingApprovals,
    refetchInterval: 30000,
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{familyName ?? "Dashboard"}</h1>
        <p className="text-muted-foreground">Welcome back, {parentFirstName}</p>
      </div>

      <FamilyOverview />

      <div className="space-y-6">
        <ChildrenOverview />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Children</CardTitle>
            <AddChildDialog />
          </CardHeader>
          <CardContent>
            {childrenLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <ChildrenList children={children} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Chores</CardTitle>
            <AddChoreDialog />
          </CardHeader>
          <CardContent>
            {choresLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <ChoresList chores={chores} children={children} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {approvalsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <PendingApprovals approvals={pendingApprovals} />
            )}
          </CardContent>
        </Card>

        <PendingCashouts />
      </div>
    </div>
  );
}
