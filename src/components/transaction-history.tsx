"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TransactionType =
  | "CHORE_EARNING"
  | "STOCK_BUY"
  | "STOCK_SELL"
  | "CASH_OUT"
  | "PARENT_DEPOSIT";

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  shares: number | null;
  pricePerShare: number | null;
  description: string | null;
  createdAt: string;
  stock: {
    ticker: string;
    name: string;
  } | null;
}

async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch("/api/child/transactions");
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

function getTransactionIcon(type: TransactionType): string {
  switch (type) {
    case "CHORE_EARNING":
      return "🧹";
    case "STOCK_BUY":
      return "📈";
    case "STOCK_SELL":
      return "📉";
    case "CASH_OUT":
      return "💵";
    case "PARENT_DEPOSIT":
      return "🎁";
    default:
      return "💰";
  }
}

function getTransactionLabel(type: TransactionType): string {
  switch (type) {
    case "CHORE_EARNING":
      return "Chore";
    case "STOCK_BUY":
      return "Buy";
    case "STOCK_SELL":
      return "Sell";
    case "CASH_OUT":
      return "Cash Out";
    case "PARENT_DEPOSIT":
      return "Deposit";
    default:
      return type;
  }
}

function isPositiveTransaction(type: TransactionType): boolean {
  return type === "CHORE_EARNING" || type === "STOCK_SELL" || type === "PARENT_DEPOSIT";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TransactionHistory() {
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ["childTransactions"],
    queryFn: fetchTransactions,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading transactions...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !transactions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">Failed to load transactions</p>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No transactions in the last 2 months.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((tx) => {
            const isPositive = isPositiveTransaction(tx.type);
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getTransactionIcon(tx.type)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {getTransactionLabel(tx.type)}
                      </span>
                      {tx.stock && (
                        <span className="text-sm text-muted-foreground">
                          {tx.stock.ticker}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tx.description || (tx.shares && tx.stock
                        ? `${tx.shares.toFixed(2)} shares @ $${tx.pricePerShare?.toFixed(2)}`
                        : null)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.createdAt)} at {formatTime(tx.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-medium ${
                      isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositive ? "+" : "-"}${tx.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
