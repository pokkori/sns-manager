import { NextRequest, NextResponse } from "next/server";
import { postTweet, isTwitterConfigured } from "@/lib/twitter";
import { addLog, getEnabledMap } from "@/lib/store";
import { getServiceById } from "@/lib/services";
import { postFirstComment } from "@/lib/firstComment";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { serviceId, content, platform = "x", skipEnabledCheck = false } = await req.json();
  const service = getServiceById(serviceId);
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
  if (!content?.trim()) return NextResponse.json({ error: "Content is empty" }, { status: 400 });

  // Check enabled status (skip for manual posts)
  if (!skipEnabledCheck) {
    const enabled = await getEnabledMap();
    if (!enabled[serviceId]) {
      return NextResponse.json({ error: "This service is disabled" }, { status: 403 });
    }
  }

  const log = {
    id: nanoid(),
    serviceId,
    serviceName: service.name,
    content,
    platform: platform as "x" | "tiktok_script",
    status: "draft" as const,
    createdAt: new Date().toISOString(),
  };

  // TikTok script: just save, no actual posting
  if (platform === "tiktok_script") {
    await addLog({ ...log, status: "success" });
    return NextResponse.json({ ok: true, platform: "tiktok_script" });
  }

  // X posting
  if (!isTwitterConfigured()) {
    // Dry run
    await addLog({ ...log, status: "success", tweetId: "dry-run" });
    return NextResponse.json({ ok: true, dryRun: true, message: "Twitter APIが未設定のため、ドライランとして記録しました" });
  }

  try {
    const result = await postTweet(content);
    await addLog({ ...log, status: "success", tweetId: result.tweetId });

    // ファーストコメント（リプライ）投稿 — 失敗してもメイン投稿は成功扱い
    postFirstComment(result.tweetId, service).catch((e) =>
      console.warn("[FirstComment] unexpected error:", e)
    );

    return NextResponse.json({ ok: true, tweetUrl: result.url });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    await addLog({ ...log, status: "failed", error });
    return NextResponse.json({ error }, { status: 500 });
  }
}
