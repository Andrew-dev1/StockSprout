"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockSearch } from "@/components/stock-search";
import { TradeForm } from "@/components/trade-form";
import Link from "next/link";

interface StockData {
  ticker: string;
  name: string;
  logo: string | null;
  industry?: string;
  exchange?: string;
  marketCap?: number;
  website?: string;
  isTracked: boolean;
  quote: {
    current: number;
    previousClose: number;
    open: number;
    high: number;
    low: number;
    change: number;
    changePercent: number;
    timestamp: number;
  };
  priceHistory: Array<{ date: string; price: number }>;
  market: {
    isOpen: boolean;
    session: string;
    holiday: string | null;
  } | null;
}

async function fetchStockData(ticker: string): Promise<StockData> {
  const res = await fetch(`/api/stocks/${ticker}`);
  if (!res.ok) {
    throw new Error("Stock not found");
  }
  return res.json();
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

function formatMarketCap(cap: number): string {
  if (cap >= 1000) {
    return `$${(cap / 1000).toFixed(1)}T`;
  }
  return `$${cap.toFixed(1)}B`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimestamp(timestamp: number): string {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

interface ChildData {
  balance: number;
  holding: {
    shares: number;
    costBasis: number;
  } | null;
}

export function StockDetail({
  ticker,
  childData,
}: {
  ticker: string;
  childData: ChildData | null;
}) {
  const router = useRouter();

  const { data: stock, isLoading, error } = useQuery({
    queryKey: ["stock", ticker],
    queryFn: () => fetchStockData(ticker),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <StockSearch />
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading stock data...</p>
        </div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <StockSearch />
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">
              Stock not found. Please try a different ticker.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/stocks")}
            >
              Back to Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPositive = stock.quote.change >= 0;

  // Detect potential delisted/inactive stocks
  const isPotentiallyDelisted =
    stock.quote.current === 0 ||
    (stock.priceHistory.length === 0 && !stock.isTracked);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <StockSearch />
      </div>

      {/* Delisted Warning */}
      {isPotentiallyDelisted && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 text-lg">&#9888;</span>
            <p className="text-sm text-amber-700 font-medium">
              This stock may be delisted or inactive. Price data is unavailable or outdated.
              Trading is not recommended.
            </p>
          </div>
        </div>
      )}

      {/* Stock Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {stock.logo ? (
              <img
                src={stock.logo}
                alt={stock.name}
                className="w-16 h-16 rounded-lg object-contain bg-white border"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
                {stock.ticker.slice(0, 2)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{stock.ticker}</h1>
                {stock.isTracked && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Tracked
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">{stock.name}</p>
              {stock.industry && (
                <p className="text-sm text-muted-foreground">{stock.industry}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{formatPrice(stock.quote.current)}</p>
              <p
                className={`text-lg font-medium ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? "+" : ""}
                {stock.quote.change.toFixed(2)} ({isPositive ? "+" : ""}
                {stock.quote.changePercent.toFixed(2)}%)
              </p>
            </div>
          </div>

          {/* Market Status */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {stock.market && (
                <>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      stock.market.isOpen ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-muted-foreground">
                    Market {stock.market.isOpen ? "Open" : "Closed"}
                    {stock.market.holiday && ` (${stock.market.holiday})`}
                  </span>
                </>
              )}
            </div>
            <p className="text-muted-foreground">
              Last updated: {formatTimestamp(stock.quote.timestamp)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Price Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>30-Day Price History</CardTitle>
        </CardHeader>
        <CardContent>
          {stock.priceHistory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stock.priceHistory}
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
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    width={60}
                  />
                  <Tooltip
                    formatter={(value) => [formatPrice(value as number), "Price"]}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={isPositive ? "#16a34a" : "#dc2626"}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No price history available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quote Details */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="font-medium">{formatPrice(stock.quote.open)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Previous Close</p>
              <p className="font-medium">{formatPrice(stock.quote.previousClose)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Day High</p>
              <p className="font-medium">{formatPrice(stock.quote.high)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Day Low</p>
              <p className="font-medium">{formatPrice(stock.quote.low)}</p>
            </div>
            {stock.marketCap && (
              <div>
                <p className="text-sm text-muted-foreground">Market Cap</p>
                <p className="font-medium">{formatMarketCap(stock.marketCap)}</p>
              </div>
            )}
            {stock.exchange && (
              <div>
                <p className="text-sm text-muted-foreground">Exchange</p>
                <p className="font-medium">{stock.exchange}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trade Section */}
      {isPotentiallyDelisted ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Trading is disabled for this stock due to missing price data.
            </p>
          </CardContent>
        </Card>
      ) : childData ? (
        <TradeForm
          ticker={ticker}
          currentPrice={stock.quote.previousClose}
          balance={childData.balance}
          holding={childData.holding}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              <Link href="/child-login" className="text-primary hover:underline">
                Log in
              </Link>{" "}
              as a child to trade this stock.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
