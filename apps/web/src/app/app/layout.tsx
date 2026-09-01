import { requireUser } from "@/lib/dal";
import { AppShell } from "@/components/app/app-shell";
import { TrpcProvider } from "@/lib/trpc/client";

/**
 * Everything under `/app` is behind sign-in.
 *
 * `requireUser()` is the real check — `proxy.ts` only skips rendering a page
 * nobody may see. Doing it in the layout means a new route under `/app` is
 * protected by existing rather than by remembering to add a guard.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <TrpcProvider>
      <AppShell>{children}</AppShell>
    </TrpcProvider>
  );
}
