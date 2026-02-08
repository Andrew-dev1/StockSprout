"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
  cashBalance: number;
  portfolioValue: number;
  totalCostBasis: number;
  unrealizedGain: number;
  totalValue: number;
  realMoneyOwed: number;
  pendingChores: number;
  pendingCashOuts: number;
}

interface OverviewData {
  children: ChildData[];
  totals: {
    totalCashBalance: number;
    totalPortfolioValue: number;
    totalValue: number;
    totalUnrealizedGain: number;
    totalRealMoneyOwed: number;
    totalPendingChores: number;
    totalPendingCashOuts: number;
  };
}

async function fetchOverview(): Promise<OverviewData> {
  const res = await fetch("/api/family/overview");
  if (!res.ok) throw new Error("Failed to fetch overview");
  return res.json();
}

export function FamilyOverview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["familyOverview"],
    queryFn: fetchOverview,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="h-12 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">Failed to load family overview. Please refresh.</p>
      </div>
    );
  }

  const { totals } = data;
  const pendingActions = totals.totalPendingChores + totals.totalPendingCashOuts;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold">${totals.totalValue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">
            All children combined
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Portfolio Value</p>
          <p className="text-2xl font-bold text-blue-600">
            ${totals.totalPortfolioValue.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            Cash: ${totals.totalCashBalance.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Real Money Owed</p>
          <p
            className={`text-2xl font-bold ${
              totals.totalRealMoneyOwed > 0 ? "text-amber-600" : "text-green-600"
            }`}
          >
            ${totals.totalRealMoneyOwed.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            Gains only (cashable)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Pending Actions</p>
          <p
            className={`text-2xl font-bold ${
              pendingActions > 0 ? "text-orange-600" : "text-green-600"
            }`}
          >
            {pendingActions}
          </p>
          <p className="text-xs text-muted-foreground">
            {totals.totalPendingChores} chores, {totals.totalPendingCashOuts} cash-outs
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Export child data for use in other components
export function useChildrenOverview() {
  return useQuery({
    queryKey: ["familyOverview"],
    queryFn: fetchOverview,
    refetchInterval: 30000,
  });
}
