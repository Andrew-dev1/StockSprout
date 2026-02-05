import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "child_session";
const secret = new TextEncoder().encode(
  process.env.CHILD_JWT_SECRET ?? "child-jwt-secret-change-me"
);

export async function createChildSession(childId: string) {
  const token = await new SignJWT({ childId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getChildSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const childId = payload.childId as string;

    const child = await prisma.user.findUnique({
      where: { id: childId },
      include: { family: true },
    });

    if (!child || child.role !== "CHILD") return null;
    return child;
  } catch {
    return null;
  }
}

export async function requireChild() {
  const child = await getChildSession();
  if (!child) throw new Error("Unauthorized: child session required");
  return child;
}

export async function clearChildSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
