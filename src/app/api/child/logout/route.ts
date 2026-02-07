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
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
