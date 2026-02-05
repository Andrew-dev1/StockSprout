"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
}

export function AssignChoreDialog({
  choreId,
  choreTitle,
  children,
}: {
  choreId: string;
  choreTitle: string;
  children: Child[];
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleAssign(childId: string) {
    setError("");
    setLoading(childId);

    try {
      const res = await fetch(`/api/family/chores/${choreId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.[0]?.message ?? "Something went wrong");
        return;
      }

      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["pendingApprovals"] });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign &quot;{choreTitle}&quot;</DialogTitle>
          <DialogDescription>
            Pick a child to assign this chore to.
          </DialogDescription>
        </DialogHeader>
        {children.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No children in your family yet. Add a child first.
          </p>
        ) : (
          <div className="space-y-2">
            {children.map((child) => (
              <Button
                key={child.id}
                variant="outline"
                className="w-full justify-start"
                disabled={loading !== null}
                onClick={() => handleAssign(child.id)}
              >
                {loading === child.id
                  ? "Assigning..."
                  : `${child.firstName} ${child.lastName}`}
              </Button>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
