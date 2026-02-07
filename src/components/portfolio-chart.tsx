"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Snapshot {
  date: string;
  portfolioValue: number;
  cashBalance: number;
  totalValue: number;
}

async function fetchPortfolioHistory(): Promise<Snapshot[]> {
  const res = await fetch("/api/child/portfolio-history");
  if (!res.ok) throw new Error("Failed to fetch portfolio history");
  return res.json();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function PortfolioChart() {
  const { data: snapshots, isLoading, error } = useQuery({
    queryKey: ["portfolioHistory"],
    queryFn: fetchPortfolioHistory,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !snapshots || snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No portfolio history yet. Check back tomorrow!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate gain/loss
  const firstValue = snapshots[0].totalValue;
  const lastValue = snapshots[snapshots.length - 1].totalValue;
  const change = lastValue - firstValue;
  const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Portfolio Performance</CardTitle>
          <div className="text-right">
            <p
              className={`text-lg font-medium ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? "+" : ""}${change.toFixed(2)} ({isPositive ? "+" : ""}
              {changePercent.toFixed(1)}%)
            </p>
            <p className="text-xs text-muted-foreground">
              vs. {formatDate(snapshots[0].date)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={snapshots}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
                width={60}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name === "totalValue"
                    ? "Total"
                    : name === "portfolioValue"
                    ? "Stocks"
                    : "Cash",
                ]}
                labelFormatter={(label) => `Date: ${formatDate(label)}`}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />
              <Legend
                formatter={(value) =>
                  value === "totalValue"
                    ? "Total Value"
                    : value === "portfolioValue"
                    ? "Stocks"
                    : "Cash"
                }
              />
              <Line
                type="monotone"
                dataKey="totalValue"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="portfolioValue"
                stroke="#16a34a"
                strokeWidth={1}
                dot={false}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="cashBalance"
                stroke="#9333ea"
                strokeWidth={1}
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
