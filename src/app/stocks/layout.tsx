import Link from "next/link";
import { getChildSession } from "@/lib/child-auth";

async function ChildHeader() {
  const child = await getChildSession();
  if (!child) return null;

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
          <Link href="/stocks" className="text-foreground font-medium">
            Stocks
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Balance: ${Number(child.balance).toFixed(2)}
        </span>
        <Link
          href="/child/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to Dashboard
        </Link>
      </div>
    </header>
  );
}

export default async function StocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <ChildHeader />
      {children}
    </div>
  );
}
