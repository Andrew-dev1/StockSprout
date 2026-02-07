import { redirect } from "next/navigation";
import Link from "next/link";
import { getChildSession } from "@/lib/child-auth";
import { ChildLogoutButton } from "./logout-button";

export default async function ChildDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const child = await getChildSession();
  if (!child) redirect("/child-login");

  return (
    <div>
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <p className="font-medium">Hi, {child.firstName}!</p>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/child/dashboard" className="font-semibold">
              Dashboard
            </Link>
            <Link href="/stocks" className="text-muted-foreground hover:text-foreground">
              Stocks
            </Link>
          </nav>
        </div>
        <ChildLogoutButton />
      </header>
      {children}
    </div>
  );
}
