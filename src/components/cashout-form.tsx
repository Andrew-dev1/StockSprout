"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CashoutEligibility {
  eligibleAmount: number;
  hasPendingRequest: boolean;
  pendingAmount: number | null;
}

async function fetchEligibility(): Promise<CashoutEligibility> {
  const res = await fetch("/api/child/cashout");
  if (!res.ok) throw new Error("Failed to fetch eligibility");
  return res.json();
}

async function requestCashout(amount: number) {
  const res = await fetch("/api/child/cashout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to request cash-out");
  }
  return res.json();
}

export function CashoutForm() {
  const [amount, setAmount] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["cashoutEligibility"],
    queryFn: fetchEligibility,
  });

  const mutation = useMutation({
    mutationFn: requestCashout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashoutEligibility"] });
      setAmount("");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Out</CardTitle>
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
          <CardTitle>Cash Out</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">
            Failed to load cash-out info. Please refresh.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (data.hasPendingRequest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Out</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 font-medium">Pending Request</p>
            <p className="text-amber-700 text-sm">
              You have a pending cash-out request for ${data.pendingAmount?.toFixed(2)}.
              Waiting for parent approval.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.eligibleAmount < 5) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Out</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You need at least $5 in gains to cash out. Keep investing!
          </p>
        </CardContent>
      </Card>
    );
  }

  const amountNum = parseInt(amount) || 0;
  const isValidAmount =
    amountNum >= 5 && amountNum <= data.eligibleAmount && amountNum % 5 === 0;

  const handleSubmit = () => {
    if (isValidAmount) {
      mutation.mutate(amountNum);
    }
  };

  // Generate quick select options (multiples of $5 up to eligible)
  const quickOptions = [];
  for (let i = 5; i <= data.eligibleAmount && quickOptions.length < 4; i += 5) {
    quickOptions.push(i);
  }
  if (!quickOptions.includes(data.eligibleAmount)) {
    quickOptions.push(data.eligibleAmount);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Out</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">Available to Cash Out</p>
          <p className="text-2xl font-bold text-green-700">
            ${data.eligibleAmount.toFixed(2)}
          </p>
          <p className="text-green-600 text-xs">Based on your investment gains</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (must be multiple of $5)</Label>
          <Input
            id="amount"
            type="number"
            min="5"
            max={data.eligibleAmount}
            step="5"
            placeholder="$5.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={mutation.isPending}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {quickOptions.map((opt) => (
            <Button
              key={opt}
              variant="outline"
              size="sm"
              onClick={() => setAmount(opt.toString())}
              disabled={mutation.isPending}
            >
              ${opt}
            </Button>
          ))}
        </div>

        {amountNum > 0 && amountNum % 5 !== 0 && (
          <p className="text-sm text-red-500">Amount must be a multiple of $5</p>
        )}

        {amountNum > data.eligibleAmount && (
          <p className="text-sm text-red-500">
            Maximum is ${data.eligibleAmount.toFixed(2)}
          </p>
        )}

        {mutation.isError && (
          <p className="text-sm text-red-500">{mutation.error.message}</p>
        )}

        {mutation.isSuccess && (
          <p className="text-sm text-green-600">
            Request submitted! Waiting for parent approval.
          </p>
        )}

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!isValidAmount || mutation.isPending}
        >
          {mutation.isPending ? "Submitting..." : "Request Cash Out"}
        </Button>
      </CardContent>
    </Card>
  );
}
