import { redirect } from "next/navigation";
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
        <p className="font-medium">Hi, {child.firstName}!</p>
        <ChildLogoutButton />
      </header>
      {children}
    </div>
  );
}
