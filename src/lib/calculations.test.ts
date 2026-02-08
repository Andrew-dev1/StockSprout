import { describe, it, expect } from "vitest";
import {
  calculateShares,
  calculateProceeds,
  calculateCostBasisToRemove,
  calculateUnrealizedGain,
  calculateEligibleCashout,
  shouldDeleteHolding,
  formatCurrency,
  formatSharesDisplay,
  formatSharesInternal,
} from "./calculations";

describe("calculateShares", () => {
  it("calculates correct shares for even division", () => {
    // $100 at $50/share = 2 shares
    expect(calculateShares(100, 50)).toBe(2);
  });

  it("rounds down to 6 decimal places", () => {
    // $10 at $3/share = 3.333333... -> 3.333333
    const shares = calculateShares(10, 3);
    expect(shares).toBe(3.333333);
  });

  it("handles fractional shares correctly", () => {
    // $5 at $150/share = 0.033333...
    const shares = calculateShares(5, 150);
    expect(shares).toBe(0.033333);
  });

  it("returns 0 for zero price", () => {
    expect(calculateShares(100, 0)).toBe(0);
  });

  it("returns 0 for negative price", () => {
    expect(calculateShares(100, -50)).toBe(0);
  });

  it("handles small purchases", () => {
    // $5 at $200/share = 0.025
    expect(calculateShares(5, 200)).toBe(0.025);
  });
});

describe("calculateProceeds", () => {
  it("calculates correct proceeds", () => {
    expect(calculateProceeds(10, 50)).toBe(500);
  });

  it("handles fractional shares", () => {
    expect(calculateProceeds(0.5, 100)).toBe(50);
  });

  it("handles small values", () => {
    expect(calculateProceeds(0.001, 100)).toBeCloseTo(0.1);
  });
});

describe("calculateCostBasisToRemove", () => {
  it("calculates proportional cost basis", () => {
    // Total cost $100 for 10 shares, selling 5 shares
    // Cost per share = $10, selling 5 = $50
    expect(calculateCostBasisToRemove(100, 10, 5)).toBe(50);
  });

  it("handles selling all shares", () => {
    expect(calculateCostBasisToRemove(100, 10, 10)).toBe(100);
  });

  it("handles fractional shares", () => {
    // $50 cost for 2 shares, selling 0.5 shares
    expect(calculateCostBasisToRemove(50, 2, 0.5)).toBe(12.5);
  });

  it("returns 0 for zero total shares", () => {
    expect(calculateCostBasisToRemove(100, 0, 5)).toBe(0);
  });
});

describe("calculateUnrealizedGain", () => {
  it("calculates positive gain", () => {
    expect(calculateUnrealizedGain(150, 100)).toBe(50);
  });

  it("calculates negative gain (loss)", () => {
    expect(calculateUnrealizedGain(80, 100)).toBe(-20);
  });

  it("calculates zero gain", () => {
    expect(calculateUnrealizedGain(100, 100)).toBe(0);
  });
});

describe("calculateEligibleCashout", () => {
  it("rounds down to nearest $5", () => {
    expect(calculateEligibleCashout(27, 0)).toBe(25);
  });

  it("subtracts previous cashouts", () => {
    // $50 gains - $20 previous = $30 remaining -> $30
    expect(calculateEligibleCashout(50, 20)).toBe(30);
  });

  it("returns 0 when previous cashouts exceed gains", () => {
    expect(calculateEligibleCashout(50, 60)).toBe(0);
  });

  it("returns 0 for gains less than $5", () => {
    expect(calculateEligibleCashout(4, 0)).toBe(0);
  });

  it("handles exact $5 multiples", () => {
    expect(calculateEligibleCashout(25, 0)).toBe(25);
  });

  it("handles large amounts", () => {
    expect(calculateEligibleCashout(1000, 100)).toBe(900);
  });
});

describe("shouldDeleteHolding", () => {
  it("returns true for zero shares", () => {
    expect(shouldDeleteHolding(0)).toBe(true);
  });

  it("returns true for dust amounts", () => {
    expect(shouldDeleteHolding(0.0000001)).toBe(true);
    expect(shouldDeleteHolding(0.000001)).toBe(true);
  });

  it("returns false for meaningful shares", () => {
    expect(shouldDeleteHolding(0.000002)).toBe(false);
    expect(shouldDeleteHolding(0.01)).toBe(false);
    expect(shouldDeleteHolding(1)).toBe(false);
  });
});

describe("formatCurrency", () => {
  it("formats to 2 decimal places", () => {
    expect(formatCurrency(10)).toBe("10.00");
    expect(formatCurrency(10.5)).toBe("10.50");
    expect(formatCurrency(10.999)).toBe("11.00");
  });
});

describe("formatSharesDisplay", () => {
  it("formats to 2 decimal places for UI", () => {
    expect(formatSharesDisplay(1.234567)).toBe("1.23");
  });
});

describe("formatSharesInternal", () => {
  it("formats to 6 decimal places for storage", () => {
    expect(formatSharesInternal(1.23456789)).toBe("1.234568");
  });
});
