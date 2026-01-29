import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/");

  // Already onboarded? Go to dashboard
  const existing = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });
  if (existing) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <OnboardingForm
        defaultFirstName={clerkUser.firstName ?? ""}
        defaultLastName={clerkUser.lastName ?? ""}
      />
    </div>
  );
}
