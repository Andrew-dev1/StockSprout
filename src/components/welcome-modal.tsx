"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WelcomeModalProps {
  userType: "parent" | "child";
  userName?: string;
}

const PARENT_FEATURES = [
  {
    title: "Create Chores",
    description: "Set up tasks for your kids to earn money",
  },
  {
    title: "Review & Approve",
    description: "Check completed chores and approve payments",
  },
  {
    title: "Monitor Investments",
    description: "See how your child's portfolio is growing",
  },
  {
    title: "Teach Finance",
    description: "Help them learn about saving and investing",
  },
];

const CHILD_FEATURES = [
  {
    title: "Complete Chores",
    description: "Finish tasks to earn money for your account",
  },
  {
    title: "Browse Stocks",
    description: "Explore real companies you can invest in",
  },
  {
    title: "Buy & Sell",
    description: "Trade stocks with your earned money",
  },
  {
    title: "Watch It Grow",
    description: "See your investments change over time",
  },
];

export function WelcomeModal({ userType, userName }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const storageKey = `welcome_seen_${userType}`;
    const hasSeenWelcome = localStorage.getItem(storageKey);

    if (!hasSeenWelcome) {
      setOpen(true);
    }
  }, [userType]);

  const handleClose = () => {
    const storageKey = `welcome_seen_${userType}`;
    localStorage.setItem(storageKey, "true");
    setOpen(false);
  };

  const features = userType === "parent" ? PARENT_FEATURES : CHILD_FEATURES;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            {userType === "parent"
              ? "Welcome to StockSprout!"
              : `Welcome${userName ? `, ${userName}` : ""}!`}
          </DialogTitle>
          <DialogDescription className="text-center">
            {userType === "parent"
              ? "Help your kids learn about money and investing through real-world experience."
              : "Learn to earn, save, and invest like a pro!"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-sm">{feature.title}</p>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {userType === "child" && (
          <div className="text-center text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
            <strong>Remember:</strong> Investing can help your money grow, but
            it can also go down. Only invest money you don&apos;t need right away!
          </div>
        )}

        <DialogFooter className="sm:justify-center">
          <Button onClick={handleClose} className="w-full sm:w-auto">
            {userType === "parent" ? "Get Started" : "Let's Go!"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
