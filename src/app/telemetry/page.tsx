import { notFound } from "next/navigation";
import { TelemetryClient } from "@/components/TelemetryClient";

export const dynamic = "force-dynamic";

export default function TelemetryPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <TelemetryClient />;
}
