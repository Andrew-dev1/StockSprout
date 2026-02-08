"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EducationalTooltip } from "@/components/educational-tooltip";

interface TradeFormProps {
  ticker: string;
  currentPrice: number;
  balance: number;
  holding: {
    shares: number;
    costBasis: number;
  } | null;
}

async function buyStock(data: { ticker: string; amount: number }) {
  const res = await fetch("/api/trades/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to buy stock");
  }
  return res.json();
}

async function sellStock(data: { ticker: string; shares: number }) {
  const res = await fetch("/api/trades/sell", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to sell stock");
  }
  return res.json();
}

export function TradeForm({
  ticker,
  currentPrice,
  balance,
  holding,
}: TradeFormProps) {
  const [buyAmount, setBuyAmount] = useState("");
  const [sellShares, setSellShares] = useState("");
  const [activeTab, setActiveTab] = useState("buy");
  const queryClient = useQueryClient();

  const buyMutation = useMutation({
    mutationFn: buyStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock", ticker] });
      queryClient.invalidateQueries({ queryKey: ["childPortfolio"] });
      queryClient.invalidateQueries({ queryKey: ["childData", ticker] });
      setBuyAmount("");
    },
  });

  const sellMutation = useMutation({
    mutationFn: sellStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock", ticker] });
      queryClient.invalidateQueries({ queryKey: ["childPortfolio"] });
      queryClient.invalidateQueries({ queryKey: ["childData", ticker] });
      setSellShares("");
    },
  });

  const buyAmountNum = parseFloat(buyAmount) || 0;
  const sellSharesNum = parseFloat(sellShares) || 0;

  const sharesToBuy =
    buyAmountNum > 0 && currentPrice > 0
      ? Math.floor((buyAmountNum / currentPrice) * 1000000) / 1000000
      : 0;

  const sellProceeds = sellSharesNum * currentPrice;

  const canBuy = buyAmountNum >= 5 && buyAmountNum <= balance && sharesToBuy > 0;
  const canSell =
    holding && sellSharesNum > 0 && sellSharesNum <= holding.shares;

  const handleBuy = () => {
    if (canBuy) {
      buyMutation.mutate({ ticker, amount: buyAmountNum });
    }
  };

  const handleSell = () => {
    if (canSell) {
      sellMutation.mutate({ ticker, shares: sellSharesNum });
    }
  };

  const handleSellAll = () => {
    if (holding && holding.shares > 0) {
      setSellShares(holding.shares.toString());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <EducationalTooltip term="investing">Trade {ticker}</EducationalTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell" disabled={!holding}>
              Sell
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <EducationalTooltip term="balance">Available:</EducationalTooltip> ${balance.toFixed(2)}
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyAmount">Amount (USD)</Label>
              <Input
                id="buyAmount"
                type="number"
                min="5"
                step="0.01"
                placeholder="$5.00 minimum"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                disabled={buyMutation.isPending}
              />
            </div>

            {buyAmountNum > 0 && (
              <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Price per share:</span>
                  <span>${currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <EducationalTooltip term="fractional-shares">
                    <span>Shares you&apos;ll get:</span>
                  </EducationalTooltip>
                  <span>{sharesToBuy.toFixed(6)}</span>
                </div>
              </div>
            )}

            {buyAmountNum > 0 && buyAmountNum < 5 && (
              <p className="text-sm text-red-500">Minimum purchase is $5.00</p>
            )}

            {buyAmountNum > balance && (
              <p className="text-sm text-red-500">Insufficient balance</p>
            )}

            {buyMutation.isError && (
              <p className="text-sm text-red-500">{buyMutation.error.message}</p>
            )}

            {buyMutation.isSuccess && (
              <p className="text-sm text-green-600">Purchase successful!</p>
            )}

            <Button
              className="w-full"
              onClick={handleBuy}
              disabled={!canBuy || buyMutation.isPending}
            >
              {buyMutation.isPending ? "Buying..." : `Buy ${ticker}`}
            </Button>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4">
            {holding ? (
              <>
                <div className="text-sm text-muted-foreground">
                  You own: {holding.shares.toFixed(6)} shares
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellShares">Shares to Sell</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sellShares"
                      type="number"
                      min="0"
                      step="0.000001"
                      placeholder="0.000000"
                      value={sellShares}
                      onChange={(e) => setSellShares(e.target.value)}
                      disabled={sellMutation.isPending}
                    />
                    <Button
                      variant="outline"
                      onClick={handleSellAll}
                      disabled={sellMutation.isPending}
                    >
                      All
                    </Button>
                  </div>
                </div>

                {sellSharesNum > 0 && (
                  <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Price per share:</span>
                      <span>${currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>You&apos;ll receive:</span>
                      <span>${sellProceeds.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {sellSharesNum > holding.shares && (
                  <p className="text-sm text-red-500">
                    You only own {holding.shares.toFixed(6)} shares
                  </p>
                )}

                {sellMutation.isError && (
                  <p className="text-sm text-red-500">
                    {sellMutation.error.message}
                  </p>
                )}

                {sellMutation.isSuccess && (
                  <p className="text-sm text-green-600">Sale successful!</p>
                )}

                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={handleSell}
                  disabled={!canSell || sellMutation.isPending}
                >
                  {sellMutation.isPending ? "Selling..." : `Sell ${ticker}`}
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">
                You don&apos;t own any shares of {ticker}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
