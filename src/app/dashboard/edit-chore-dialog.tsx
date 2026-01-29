"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface Chore {
  id: string;
  title: string;
  description: string | null;
  reward: string;
  isRecurring: boolean;
}

export function EditChoreDialog({ chore }: { chore: Chore }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(chore.title);
  const [description, setDescription] = useState(chore.description ?? "");
  const [reward, setReward] = useState(chore.reward);
  const [isRecurring, setIsRecurring] = useState(chore.isRecurring);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setTitle(chore.title);
      setDescription(chore.description ?? "");
      setReward(chore.reward);
      setIsRecurring(chore.isRecurring);
      setError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/family/chores/${chore.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          reward: parseFloat(reward),
          isRecurring,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.formErrors?.[0] ?? "Something went wrong");
        return;
      }

      setOpen(false);
      router.refresh();
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
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Chore</DialogTitle>
          <DialogDescription>
            Update the details for this chore.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`editTitle-${chore.id}`}>Title</Label>
            <Input
              id={`editTitle-${chore.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`editDesc-${chore.id}`}>
              Description (optional)
            </Label>
            <Input
              id={`editDesc-${chore.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`editReward-${chore.id}`}>Reward ($)</Label>
            <Input
              id={`editReward-${chore.id}`}
              type="number"
              step="0.01"
              min="0.01"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id={`editRecurring-${chore.id}`}
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor={`editRecurring-${chore.id}`}>Recurring chore</Label>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
