import type { Metadata } from "next";
import { HoldingsView } from "@/components/app/holdings-view";

export const metadata: Metadata = { title: "Holdings · Finlio" };

export default function Page() {
  return <HoldingsView />;
}
