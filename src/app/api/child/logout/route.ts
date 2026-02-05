import { NextResponse } from "next/server";
import { clearChildSession } from "@/lib/child-auth";

export async function POST() {
  await clearChildSession();
  return NextResponse.json({ success: true });
}
