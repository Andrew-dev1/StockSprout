"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CashoutRequest {
  id: string;
  amount: number;
  status: string;
  requestedAt: string;
  child: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

async function fetchCashouts(): Promise<CashoutRequest[]> {
  const res = await fetch("/api/family/cashouts");
  if (!res.ok) throw new Error("Failed to fetch cash-outs");
  return res.json();
}

async function reviewCashout({
  id,
  action,
}: {
  id: string;
  action: "approve" | "reject";
}) {
  const res = await fetch(`/api/family/cashouts/${id}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to process");
  }
  return res.json();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PendingCashouts() {
  const queryClient = useQueryClient();

  const { data: cashouts, isLoading, error } = useQuery({
    queryKey: ["pendingCashouts"],
    queryFn: fetchCashouts,
    refetchInterval: 30000,
  });

  const mutation = useMutation({
    mutationFn: reviewCashout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingCashouts"] });
      queryClient.invalidateQueries({ queryKey: ["familyOverview"] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Cash-Outs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Cash-Outs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">Failed to load</p>
        </CardContent>
      </Card>
    );
  }

  if (!cashouts || cashouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Cash-Outs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No pending cash-out requests.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Cash-Outs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mutation.isError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{mutation.error.message}</p>
          </div>
        )}
        {cashouts.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <p className="font-medium">
                {request.child.firstName} {request.child.lastName}
              </p>
              <p className="text-lg font-bold text-green-600">
                ${request.amount.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Requested {formatDate(request.requestedAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  mutation.mutate({ id: request.id, action: "reject" })
                }
                disabled={mutation.isPending}
              >
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  mutation.mutate({ id: request.id, action: "approve" })
                }
                disabled={mutation.isPending}
              >
                Approve
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
