"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SetPinDialog } from "./set-pin-dialog";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  balance: string;
  createdAt: string;
}

export function ChildrenList({ children }: { children: Child[] }) {
  if (children.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No children yet. Click &quot;Add Child&quot; to get started.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {children.map((child) => (
        <Card key={child.id}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {child.firstName} {child.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Balance: ${Number(child.balance).toFixed(2)}
                </p>
              </div>
              <SetPinDialog childId={child.id} childName={child.firstName} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
