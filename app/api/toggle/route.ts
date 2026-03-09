import { NextRequest, NextResponse } from "next/server";
import { setEnabled, getEnabledMap } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const map = await getEnabledMap();
  return NextResponse.json({ enabled: map });
}

export async function POST(req: NextRequest) {
  const { serviceId, enabled } = await req.json();
  await setEnabled(serviceId, enabled);
  return NextResponse.json({ ok: true });
}
