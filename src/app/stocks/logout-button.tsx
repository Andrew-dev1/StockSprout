"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ChildLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/child/logout", { method: "POST" });
    router.push("/child-login");
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      Log Out
    </Button>
  );
}
