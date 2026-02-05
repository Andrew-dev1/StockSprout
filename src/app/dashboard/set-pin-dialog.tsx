"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SetPinDialog({
  childId,
  childName,
}: {
  childId: string;
  childName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setPin("");
      setError("");
      setSuccess(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/family/children/${childId}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = Array.isArray(data.error)
          ? data.error[0]?.message
          : data.error;
        setError(msg ?? "Something went wrong");
        return;
      }

      setSuccess(true);
      setTimeout(() => setOpen(false), 1000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Set PIN
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set PIN for {childName}</DialogTitle>
          <DialogDescription>
            Set a 6-digit PIN so {childName} can log in to their dashboard.
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <p className="text-sm text-green-600">PIN set successfully!</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`pin-${childId}`}>6-Digit PIN</Label>
              <Input
                id={`pin-${childId}`}
                type="password"
                inputMode="numeric"
                maxLength={6}
                pattern="\d{6}"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPin(val);
                }}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Set PIN"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
