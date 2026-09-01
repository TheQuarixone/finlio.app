import type { Metadata } from "next";
import { AllocationView } from "@/components/app/allocation-view";

export const metadata: Metadata = { title: "Allocation · Finlio" };

export default function Page() {
  return <AllocationView />;
}
