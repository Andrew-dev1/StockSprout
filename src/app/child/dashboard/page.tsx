import { requireChild } from "@/lib/child-auth";
import { redirect } from "next/navigation";
import { ChildDashboardContent } from "./dashboard-content";

export default async function ChildDashboardPage() {
  let child;
  try {
    child = await requireChild();
  } catch {
    redirect("/child-login");
  }

  return <ChildDashboardContent balance={child.balance.toString()} />;
}
