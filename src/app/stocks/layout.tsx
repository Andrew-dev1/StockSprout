import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getChildSession } from "@/lib/child-auth";
import { getCurrentUser } from "@/lib/auth";
import { ChildLogoutButton } from "./logout-button";

async function StocksHeader() {
  // Check child session first (takes priority if both exist)
  const child = await getChildSession();
  if (child) {
    return (
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <p className="font-medium">Hi, {child.firstName}!</p>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/child/dashboard"
              className="text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link href="/stocks" className="font-semibold">
              Stocks
            </Link>
          </nav>
        </div>
        <ChildLogoutButton />
      </header>
    );
  }

  // Check if parent is logged in via Clerk
  const parentUser = await getCurrentUser();
  if (parentUser) {
    return (
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link href="/stocks" className="font-semibold">
            Stocks
          </Link>
        </nav>
        <UserButton />
      </header>
    );
  }

  // No one logged in
  return null;
}

export default async function StocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <StocksHeader />
      {children}
    </div>
  );
}
