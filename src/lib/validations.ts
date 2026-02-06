import { z } from "zod";

export const onboardingSchema = z.object({
  familyName: z.string().min(1, "Family name is required").max(100),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
});

export const addChildSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
});

export const createChoreSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  reward: z.coerce.number().min(0.01, "Reward must be at least $0.01"),
  isRecurring: z.boolean().default(false),
});

export const childLoginSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  familyName: z.string().min(1, "Family name is required").max(100),
  pin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
});

export const setPinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
});

export const buyStockSchema = z.object({
  ticker: z.string().min(1).max(10).transform((s) => s.toUpperCase()),
  amount: z.coerce.number().min(5, "Minimum purchase is $5.00"),
});

export const sellStockSchema = z.object({
  ticker: z.string().min(1).max(10).transform((s) => s.toUpperCase()),
  shares: z.coerce.number().positive("Shares must be greater than 0"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type AddChildInput = z.infer<typeof addChildSchema>;
export type CreateChoreInput = z.infer<typeof createChoreSchema>;
export type ChildLoginInput = z.infer<typeof childLoginSchema>;
export type SetPinInput = z.infer<typeof setPinSchema>;
export type BuyStockInput = z.infer<typeof buyStockSchema>;
export type SellStockInput = z.infer<typeof sellStockSchema>;
