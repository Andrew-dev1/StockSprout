"use client";

import { useState } from "react";
import { useChildrenOverview } from "./family-overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ChildrenOverview() {
  const { data, isLoading, error } = useChildrenOverview();
  const [expandedChild, setExpandedChild] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Children Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Children Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">Failed to load</p>
        </CardContent>
      </Card>
    );
  }

  if (data.children.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Children Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No children added yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Children Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.children.map((child) => {
          const isExpanded = expandedChild === child.id;
          const gainIsPositive = child.unrealizedGain >= 0;

          return (
            <div
              key={child.id}
              className="border rounded-lg overflow-hidden"
            >
              {/* Summary Row */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                onClick={() =>
                  setExpandedChild(isExpanded ? null : child.id)
                }
              >
                <div>
                  <p className="font-medium">
                    {child.firstName} {child.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total: ${child.totalValue.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-medium ${
                      gainIsPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {gainIsPositive ? "+" : ""}${child.unrealizedGain.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {child.pendingChores > 0 && (
                      <span className="text-orange-600">
                        {child.pendingChores} pending
                      </span>
                    )}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  {isExpanded ? "▲" : "▼"}
                </Button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t bg-muted/30 p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Cash Balance</p>
                      <p className="font-medium">
                        ${child.cashBalance.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Portfolio Value</p>
                      <p className="font-medium">
                        ${child.portfolioValue.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cost Basis</p>
                      <p className="font-medium">
                        ${child.totalCostBasis.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unrealized Gain</p>
                      <p
                        className={`font-medium ${
                          gainIsPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {gainIsPositive ? "+" : ""}
                        ${child.unrealizedGain.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Real Money Owed</p>
                      <p className="font-medium text-amber-600">
                        ${child.realMoneyOwed.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pending Actions</p>
                      <p className="font-medium">
                        {child.pendingChores} chores, {child.pendingCashOuts} cash-outs
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
