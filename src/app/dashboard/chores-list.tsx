"use client";

import { Card, CardContent } from "@/components/ui/card";
import { EditChoreDialog } from "./edit-chore-dialog";

interface Chore {
  id: string;
  title: string;
  description: string | null;
  reward: string;
  isRecurring: boolean;
  createdAt: string;
}

export function ChoresList({ chores }: { chores: Chore[] }) {
  if (chores.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No chores yet. Click &quot;Create Chore&quot; to get started.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {chores.map((chore) => (
        <Card key={chore.id}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium">{chore.title}</p>
                {chore.isRecurring && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Recurring
                  </span>
                )}
              </div>
              <EditChoreDialog chore={chore} />
            </div>
            {chore.description && (
              <p className="text-sm text-muted-foreground">
                {chore.description}
              </p>
            )}
            <p className="text-sm font-medium text-green-600">
              ${Number(chore.reward).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
