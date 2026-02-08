"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Holding {
  id: string;
  stockId: string;
  ticker: string;
  name: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface PortfolioData {
  holdings: Holding[];
  totals: {
    value: number;
    costBasis: number;
    gainLoss: number;
    gainLossPercent: number;
  };
  balance: number;
}

async function fetchPortfolio(): Promise<PortfolioData> {
  const res = await fetch("/api/child/portfolio");
  if (!res.ok) throw new Error("Failed to fetch portfolio");
  return res.json();
}

export function PortfolioHoldings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["childPortfolio"],
    queryFn: fetchPortfolio,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading portfolio...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">Failed to load portfolio</p>
        </CardContent>
      </Card>
    );
  }

  const { holdings, totals } = data;

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You don&apos;t own any stocks yet.{" "}
            <Link href="/stocks" className="text-primary hover:underline">
              Browse stocks
            </Link>{" "}
            to start investing!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Portfolio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Portfolio Summary */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-xl font-bold">${totals.value.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
              <p
                className={`text-xl font-bold ${
                  totals.gainLoss >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totals.gainLoss >= 0 ? "+" : ""}${totals.gainLoss.toFixed(2)} (
                {totals.gainLoss >= 0 ? "+" : ""}
                {totals.gainLossPercent.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Holdings List */}
        <div className="space-y-3">
          {holdings.map((holding) => {
            const isDelisted = holding.currentPrice === 0;
            return (
              <Link
                key={holding.id}
                href={`/stocks/${holding.ticker}`}
                className="block"
              >
                <div className={`flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors ${isDelisted ? "border-amber-300 bg-amber-50" : ""}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{holding.ticker}</p>
                      {isDelisted && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                          No price data
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{holding.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {holding.shares.toFixed(2)} shares @ $
                      {holding.currentPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${holding.currentValue.toFixed(2)}</p>
                    <p
                      className={`text-sm ${
                        holding.gainLoss >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {holding.gainLoss >= 0 ? "+" : ""}$
                      {holding.gainLoss.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <Link
          href="/stocks"
          className="block text-center text-sm text-primary hover:underline"
        >
          Browse more stocks
        </Link>
      </CardContent>
    </Card>
  );
}
