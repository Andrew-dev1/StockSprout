import { NextResponse } from "next/server";
import { clearChildSession } from "@/lib/child-auth";

export async function POST() {
  await clearChildSession();
  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  await clearChildSession();
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect") || "/";

  // Prevent open redirect - only allow internal paths
  const safePath = redirectTo.startsWith("/") && !redirectTo.startsWith("//")
    ? redirectTo
    : "/";

  return NextResponse.redirect(new URL(safePath, request.url));
}
