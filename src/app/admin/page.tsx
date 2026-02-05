import { requireParent } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminDashboard } from "./admin-dashboard";

export default async function AdminPage() {
  // Only parents can access admin page
  try {
    await requireParent();
  } catch {
    redirect("/");
  }

  return <AdminDashboard />;
}
