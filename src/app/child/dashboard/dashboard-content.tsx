"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChildChoresList } from "./chores-list";

interface Assignment {
  id: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  chore: {
    id: string;
    title: string;
    reward: string;
  };
}

interface SerializedAssignment {
  id: string;
  choreTitle: string;
  reward: string;
  dueDate: string | null;
  status: string;
}

async function fetchAssignments(): Promise<Assignment[]> {
  const res = await fetch("/api/child/chores");
  if (!res.ok) throw new Error("Failed to fetch assignments");
  return res.json();
}

function serializeAssignments(
  assignments: Assignment[],
  statuses: string[]
): SerializedAssignment[] {
  return assignments
    .filter((a) => statuses.includes(a.status))
    .map((a) => ({
      id: a.id,
      choreTitle: a.chore.title,
      reward: a.chore.reward.toString(),
      dueDate: a.dueDate,
      status: a.status,
    }));
}

export function ChildDashboardContent({ balance }: { balance: string }) {
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["childAssignments"],
    queryFn: fetchAssignments,
    refetchInterval: 30000,
  });

  const pending = serializeAssignments(assignments, ["PENDING"]);
  const submitted = serializeAssignments(assignments, ["SUBMITTED"]);
  const history = serializeAssignments(assignments, ["APPROVED", "REJECTED"]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card className="mb-6">
        <CardContent className="pt-4">
          <p className="text-lg font-medium">Your Balance</p>
          <p className="text-3xl font-bold text-green-600">
            ${Number(balance).toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Chores To Do</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <ChildChoresList assignments={pending} type="pending" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Waiting for Approval</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <ChildChoresList assignments={submitted} type="submitted" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <ChildChoresList assignments={history} type="history" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
