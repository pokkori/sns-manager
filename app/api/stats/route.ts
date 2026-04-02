import { NextResponse } from "next/server";
import { getServiceStats } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getServiceStats();
    return NextResponse.json({ stats });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}
