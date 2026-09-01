import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getCurrentUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Sign in · Finlio" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  // Already signed in — nothing to do here.
  if (await getCurrentUser()) redirect("/app");

  const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/app";

  return (
    <main className="grid min-h-dvh place-items-center bg-secondary px-5 py-16">
      <div className="w-full max-w-sm">
        <SignInForm next={destination} />
        {error && (
          <p role="alert" className="mt-6 text-sm text-destructive">
            {error === "exchange_failed"
              ? "That link has expired. Ask for a new code."
              : "Something went wrong signing you in. Try again."}
          </p>
        )}
      </div>
    </main>
  );
}
