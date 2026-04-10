import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function verifyKomojuSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const sigBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== sigBuf.length) return false;
  return timingSafeEqual(expectedBuf, sigBuf);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-komoju-signature");
  const webhookSecret = process.env.KOMOJU_WEBHOOK_SECRET;

  if (webhookSecret) {
    const valid = verifyKomojuSignature(rawBody, signature, webhookSecret);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = body.type as string;
  const resource = body.resource as Record<string, unknown>;

  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { error } = await supabase.from("komoju_revenue").insert({
    service_name: (resource?.metadata as Record<string, string>)?.service_name ?? "unknown",
    event_type: eventType,
    amount: (resource?.amount as number) ?? 0,
    currency: (resource?.currency as string) ?? "JPY",
    customer_id: (resource?.customer_id as string) ?? null,
    subscription_id: (resource?.subscription_id as string) ?? null,
  });

  if (error) {
    console.error("[komoju-webhook] Supabase insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event: eventType });
}
