"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Stock {
  id: string;
  ticker: string;
  name: string;
  isActive: boolean;
  latestPrice: {
    price: string;
    date: string;
  } | null;
  priceCount: number;
}

interface HealthStatus {
  totalStocks: number;
  activeStocks: number;
  stocksWithRecentPrices: number;
  stocksMissingPrices: string[];
  latestPriceDate: string | null;
  stocks: Stock[];
}

interface UpdateResult {
  success: boolean;
  tradingDate?: string;
  stocksProcessed?: number;
  updated?: number;
  skipped?: number;
  errors?: number;
  duration?: number;
  results?: Array<{
    ticker: string;
    status: string;
    price?: number;
    error?: string;
  }>;
  error?: string;
}

interface SeedResult {
  success: boolean;
  message?: string;
  results?: Array<{
    ticker: string;
    status: string;
    name?: string;
  }>;
}

async function fetchHealthStatus(): Promise<HealthStatus> {
  const res = await fetch("/api/admin/health");
  if (!res.ok) throw new Error("Failed to fetch health status");
  return res.json();
}

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null);
  const [updating, setUpdating] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [seeding, setSeeding] = useState(false);

  const { data: health, isLoading, error } = useQuery({
    queryKey: ["adminHealth"],
    queryFn: fetchHealthStatus,
    refetchInterval: 60000, // Refresh every minute
  });

  async function handleManualUpdate() {
    setUpdating(true);
    setUpdateResult(null);

    try {
      const res = await fetch("/api/cron/update-prices");
      const result = await res.json();
      setUpdateResult(result);
      queryClient.invalidateQueries({ queryKey: ["adminHealth"] });
    } catch (err) {
      setUpdateResult({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setUpdating(false);
    }
  }

  async function handleSeedStocks() {
    setSeeding(true);
    setSeedResult(null);

    try {
      const res = await fetch("/api/admin/seed-stocks", { method: "POST" });
      const result = await res.json();
      setSeedResult(result);
      queryClient.invalidateQueries({ queryKey: ["adminHealth"] });
    } catch (err) {
      setSeedResult({
        success: false,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSeeding(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <Card>
          <CardContent className="pt-4">
            <p className="text-red-500">
              Error loading health status: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="space-y-6">
        {/* Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Price Cache Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Stocks</p>
                <p className="text-2xl font-bold">{health?.totalStocks ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Stocks</p>
                <p className="text-2xl font-bold">{health?.activeStocks ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">With Recent Prices</p>
                <p className="text-2xl font-bold text-green-600">
                  {health?.stocksWithRecentPrices ?? 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Missing Prices</p>
                <p className="text-2xl font-bold text-red-600">
                  {health?.stocksMissingPrices?.length ?? 0}
                </p>
              </div>
            </div>
            {health?.latestPriceDate && (
              <p className="mt-4 text-sm text-muted-foreground">
                Latest price date: {new Date(health.latestPriceDate).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Manual Update */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Manual Price Update</CardTitle>
            <Button onClick={handleManualUpdate} disabled={updating}>
              {updating ? "Updating..." : "Run Update Now"}
            </Button>
          </CardHeader>
          <CardContent>
            {updateResult && (
              <div className="space-y-2">
                <div
                  className={`rounded-md p-3 ${
                    updateResult.success ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <p
                    className={`font-medium ${
                      updateResult.success ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {updateResult.success ? "Update Complete" : "Update Failed"}
                  </p>
                  {updateResult.success && (
                    <div className="mt-2 text-sm text-green-700">
                      <p>Trading Date: {updateResult.tradingDate}</p>
                      <p>Stocks Processed: {updateResult.stocksProcessed}</p>
                      <p>Updated: {updateResult.updated}</p>
                      <p>Skipped (already cached): {updateResult.skipped}</p>
                      <p>Errors: {updateResult.errors}</p>
                      <p>Duration: {updateResult.duration}ms</p>
                    </div>
                  )}
                  {updateResult.error && (
                    <p className="mt-2 text-sm text-red-700">{updateResult.error}</p>
                  )}
                </div>

                {updateResult.results && updateResult.results.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Details:</p>
                    <div className="max-h-48 overflow-y-auto rounded border">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Ticker</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {updateResult.results.map((r) => (
                            <tr key={r.ticker} className="border-t">
                              <td className="px-3 py-2 font-mono">{r.ticker}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs ${
                                    r.status === "updated"
                                      ? "bg-green-100 text-green-700"
                                      : r.status === "skipped"
                                      ? "bg-gray-100 text-gray-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {r.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                {r.price ? `$${r.price.toFixed(2)}` : r.error ?? "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            {!updateResult && (
              <p className="text-sm text-muted-foreground">
                Click &quot;Run Update Now&quot; to manually trigger a price update.
                This fetches the latest closing prices from finnhub.io for all active stocks.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Seed Stocks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Seed Test Stocks</CardTitle>
            <Button
              onClick={handleSeedStocks}
              disabled={seeding}
              variant="outline"
            >
              {seeding ? "Seeding..." : "Seed 10 Stocks"}
            </Button>
          </CardHeader>
          <CardContent>
            {seedResult && (
              <div
                className={`rounded-md p-3 ${
                  seedResult.success ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <p
                  className={`font-medium ${
                    seedResult.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {seedResult.message}
                </p>
                {seedResult.results && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {seedResult.results.map((r) => (
                      <span
                        key={r.ticker}
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          r.status === "created"
                            ? "bg-green-100 text-green-700"
                            : r.status === "exists"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.ticker}: {r.status}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!seedResult && (
              <p className="text-sm text-muted-foreground">
                Add 10 popular, kid-friendly stocks (Apple, Disney, Nike, etc.) to the database.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Missing Prices Warning */}
        {health?.stocksMissingPrices && health.stocksMissingPrices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Stocks Missing Recent Prices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {health.stocksMissingPrices.map((ticker) => (
                  <span
                    key={ticker}
                    className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700"
                  >
                    {ticker}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock List */}
        <Card>
          <CardHeader>
            <CardTitle>All Stocks</CardTitle>
          </CardHeader>
          <CardContent>
            {health?.stocks && health.stocks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Ticker</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2 text-right">Latest Price</th>
                      <th className="px-3 py-2 text-right">Price Date</th>
                      <th className="px-3 py-2 text-right">History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {health.stocks.map((stock) => (
                      <tr key={stock.id} className="border-t">
                        <td className="px-3 py-2 font-mono font-medium">
                          {stock.ticker}
                        </td>
                        <td className="px-3 py-2">{stock.name}</td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              stock.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {stock.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {stock.latestPrice
                            ? `$${Number(stock.latestPrice.price).toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {stock.latestPrice
                            ? new Date(stock.latestPrice.date).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {stock.priceCount} days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No stocks in the database. Add some stocks to get started.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
