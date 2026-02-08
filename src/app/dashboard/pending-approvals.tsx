"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Approval {
  id: string;
  choreTitle: string;
  reward: string;
  childName: string;
}

export function PendingApprovals({ approvals }: { approvals: Approval[] }) {
  if (approvals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pending approvals.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {approvals.map((approval) => (
        <ApprovalCard key={approval.id} approval={approval} />
      ))}
    </div>
  );
}

function ApprovalCard({ approval }: { approval: Approval }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReview(action: "approve" | "reject") {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(
        `/api/family/assignments/${approval.id}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["pendingApprovals"] });
        queryClient.invalidateQueries({ queryKey: ["children"] });
      } else {
        setError("Failed to process. Try again.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{approval.choreTitle}</p>
            <p className="text-sm text-muted-foreground">
              {approval.childName}
            </p>
            <p className="text-sm font-medium text-green-600">
              ${Number(approval.reward).toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleReview("approve")}
            disabled={loading !== null}
          >
            {loading === "approve" ? "..." : "Approve"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReview("reject")}
            disabled={loading !== null}
          >
            {loading === "reject" ? "..." : "Reject"}
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
      </CardContent>
    </Card>
  );
}
