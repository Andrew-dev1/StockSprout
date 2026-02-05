"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Assignment {
  id: string;
  choreTitle: string;
  reward: string;
  dueDate: string | null;
  status: string;
}

export function ChildChoresList({
  assignments,
  type,
}: {
  assignments: Assignment[];
  type: "pending" | "submitted" | "history";
}) {
  if (assignments.length === 0) {
    const messages = {
      pending: "No chores to do right now.",
      submitted: "Nothing waiting for approval.",
      history: "No completed chores yet.",
    };
    return (
      <p className="text-sm text-muted-foreground">{messages[type]}</p>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => (
        <AssignmentCard key={assignment.id} assignment={assignment} type={type} />
      ))}
    </div>
  );
}

function AssignmentCard({
  assignment,
  type,
}: {
  assignment: Assignment;
  type: "pending" | "submitted" | "history";
}) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch(`/api/child/chores/${assignment.id}/submit`, {
        method: "POST",
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["childAssignments"] });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-4">
        <div>
          <p className="font-medium">{assignment.choreTitle}</p>
          <p className="text-sm font-medium text-green-600">
            ${Number(assignment.reward).toFixed(2)}
          </p>
        </div>
        {type === "pending" && (
          <Button size="sm" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Mark Done"}
          </Button>
        )}
        {type === "submitted" && (
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
            Pending Review
          </span>
        )}
        {type === "history" && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              assignment.status === "APPROVED"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {assignment.status === "APPROVED" ? "Approved" : "Rejected"}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
