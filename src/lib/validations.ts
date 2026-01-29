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

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type AddChildInput = z.infer<typeof addChildSchema>;
export type CreateChoreInput = z.infer<typeof createChoreSchema>;
