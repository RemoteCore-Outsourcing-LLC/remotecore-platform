import { NextResponse } from "next/server";
import { consultationSlots } from "@/lib/consultations";

export const dynamic = "force-dynamic";

// Open consultation times, as moments in time. The picker shows them in the visitor's own time zone.
export async function GET() {
  const s = await consultationSlots();
  return NextResponse.json(s, { headers: { "Cache-Control": "no-store" } });
}
