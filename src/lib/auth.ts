import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function getCurrentUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { family: true },
  });

  return dbUser;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireParent() {
  const user = await requireUser();
  if (user.role !== "PARENT") throw new Error("Forbidden: parent role required");
  return user;
}
