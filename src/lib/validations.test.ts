import { describe, it, expect } from "vitest";
import {
  buyStockSchema,
  sellStockSchema,
  childLoginSchema,
  setPinSchema,
  createChoreSchema,
  addChildSchema,
  onboardingSchema,
} from "./validations";

describe("buyStockSchema", () => {
  it("accepts valid buy with $5 minimum", () => {
    const result = buyStockSchema.safeParse({ ticker: "aapl", amount: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ticker).toBe("AAPL"); // uppercase transform
      expect(result.data.amount).toBe(5);
    }
  });

  it("accepts amounts above $5", () => {
    const result = buyStockSchema.safeParse({ ticker: "TSLA", amount: 100 });
    expect(result.success).toBe(true);
  });

  it("rejects amounts below $5", () => {
    const result = buyStockSchema.safeParse({ ticker: "AAPL", amount: 4.99 });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = buyStockSchema.safeParse({ ticker: "AAPL", amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = buyStockSchema.safeParse({ ticker: "AAPL", amount: -10 });
    expect(result.success).toBe(false);
  });

  it("transforms ticker to uppercase", () => {
    const result = buyStockSchema.safeParse({ ticker: "msft", amount: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ticker).toBe("MSFT");
    }
  });

  it("rejects empty ticker", () => {
    const result = buyStockSchema.safeParse({ ticker: "", amount: 10 });
    expect(result.success).toBe(false);
  });

  it("rejects ticker over 10 characters", () => {
    const result = buyStockSchema.safeParse({ ticker: "VERYLONGTICKER", amount: 10 });
    expect(result.success).toBe(false);
  });
});

describe("sellStockSchema", () => {
  it("accepts valid sell with positive shares", () => {
    const result = sellStockSchema.safeParse({ ticker: "aapl", shares: 0.5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ticker).toBe("AAPL");
      expect(result.data.shares).toBe(0.5);
    }
  });

  it("accepts fractional shares", () => {
    const result = sellStockSchema.safeParse({ ticker: "TSLA", shares: 0.000001 });
    expect(result.success).toBe(true);
  });

  it("rejects zero shares", () => {
    const result = sellStockSchema.safeParse({ ticker: "AAPL", shares: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative shares", () => {
    const result = sellStockSchema.safeParse({ ticker: "AAPL", shares: -1 });
    expect(result.success).toBe(false);
  });
});

describe("childLoginSchema", () => {
  it("accepts valid 6-digit PIN", () => {
    const result = childLoginSchema.safeParse({
      firstName: "John",
      familyName: "Smith",
      pin: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects 5-digit PIN", () => {
    const result = childLoginSchema.safeParse({
      firstName: "John",
      familyName: "Smith",
      pin: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects 7-digit PIN", () => {
    const result = childLoginSchema.safeParse({
      firstName: "John",
      familyName: "Smith",
      pin: "1234567",
    });
    expect(result.success).toBe(false);
  });

  it("rejects PIN with letters", () => {
    const result = childLoginSchema.safeParse({
      firstName: "John",
      familyName: "Smith",
      pin: "12345a",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty firstName", () => {
    const result = childLoginSchema.safeParse({
      firstName: "",
      familyName: "Smith",
      pin: "123456",
    });
    expect(result.success).toBe(false);
  });
});

describe("setPinSchema", () => {
  it("accepts valid 6-digit PIN", () => {
    const result = setPinSchema.safeParse({ pin: "000000" });
    expect(result.success).toBe(true);
  });

  it("rejects non-numeric PIN", () => {
    const result = setPinSchema.safeParse({ pin: "abcdef" });
    expect(result.success).toBe(false);
  });
});

describe("createChoreSchema", () => {
  it("accepts valid chore with minimum reward", () => {
    const result = createChoreSchema.safeParse({
      title: "Clean room",
      reward: 0.01,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero reward", () => {
    const result = createChoreSchema.safeParse({
      title: "Clean room",
      reward: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = createChoreSchema.safeParse({
      title: "",
      reward: 5,
    });
    expect(result.success).toBe(false);
  });

  it("defaults isRecurring to false", () => {
    const result = createChoreSchema.safeParse({
      title: "Clean room",
      reward: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isRecurring).toBe(false);
    }
  });
});

describe("addChildSchema", () => {
  it("accepts valid child names", () => {
    const result = addChildSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty firstName", () => {
    const result = addChildSchema.safeParse({
      firstName: "",
      lastName: "Doe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects names over 50 characters", () => {
    const result = addChildSchema.safeParse({
      firstName: "A".repeat(51),
      lastName: "Doe",
    });
    expect(result.success).toBe(false);
  });
});

describe("onboardingSchema", () => {
  it("accepts valid onboarding data", () => {
    const result = onboardingSchema.safeParse({
      familyName: "The Smiths",
      firstName: "John",
      lastName: "Smith",
    });
    expect(result.success).toBe(true);
  });

  it("rejects family name over 100 characters", () => {
    const result = onboardingSchema.safeParse({
      familyName: "A".repeat(101),
      firstName: "John",
      lastName: "Smith",
    });
    expect(result.success).toBe(false);
  });
});
