import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  // Not onboarded yet
  if (!dbUser) redirect("/onboarding");

  return (
    <div>
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="font-semibold">
            Dashboard
          </Link>
          <Link href="/stocks" className="text-muted-foreground hover:text-foreground">
            Stocks
          </Link>
        </nav>
        <UserButton />
      </header>
      {children}
    </div>
  );
}
