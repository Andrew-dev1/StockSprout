import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const user = await currentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <SignedOut>
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-zinc-900">
          <h1 className="mb-2 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Stock Trading Kids
          </h1>
          <p className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Learn to invest, one chore at a time.
          </p>
          <p className="mb-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Parent Login
          </p>
          <div className="flex flex-col gap-3">
            <SignInButton mode="modal">
              <button className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
                Create Account
              </button>
            </SignUpButton>
          </div>
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <Link
              href="/child-login"
              className="block w-full text-center rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
            >
              I&apos;m a Kid
            </Link>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Redirecting to dashboard...
          </p>
        </div>
      </SignedIn>
    </div>
  );
}
