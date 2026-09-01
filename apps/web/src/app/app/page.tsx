import type { Metadata } from "next";
import { Dashboard } from "@/components/app/dashboard";

export const metadata: Metadata = {
  title: "Dashboard · Finlio",
  description: "Your net worth, computed on your device.",
};

/**
 * The dashboard is a client component because the data it renders never leaves
 * the browser — it is read from OPFS and decrypted with a key the server has no
 * copy of. There is nothing for the server to render.
 */
export default function AppPage() {
  return <Dashboard />;
}
