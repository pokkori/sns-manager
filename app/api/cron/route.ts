import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getTodayServices, getServiceById } from "@/lib/services";
import { postTweet, isTwitterConfigured } from "@/lib/twitter";
import { addLog, getEnabledMap } from "@/lib/store";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayServices = getTodayServices();
  const enabledMap = await getEnabledMap();
  const results: { serviceId: string; status: string; error?: string }[] = [];

  for (const service of todayServices) {
    if (!enabledMap[service.id]) {
      results.push({ serviceId: service.id, status: "skipped (disabled)" });
      continue;
    }

    try {
      // Generate post
      const response = await getAnthropic().messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{ role: "user", content: service.postPrompt }],
      });
      const content = (response.content[0] as { text: string }).text.trim();

      // Post to X
      if (isTwitterConfigured()) {
        const result = await postTweet(content);
        await addLog({
          id: nanoid(),
          serviceId: service.id,
          serviceName: service.name,
          content,
          platform: "x",
          status: "success",
          tweetId: result.tweetId,
          createdAt: new Date().toISOString(),
        });
        results.push({ serviceId: service.id, status: "posted" });
      } else {
        await addLog({
          id: nanoid(),
          serviceId: service.id,
          serviceName: service.name,
          content,
          platform: "x",
          status: "success",
          tweetId: "dry-run",
          createdAt: new Date().toISOString(),
        });
        results.push({ serviceId: service.id, status: "dry-run (no Twitter config)" });
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown";
      const service2 = getServiceById(service.id);
      await addLog({
        id: nanoid(),
        serviceId: service.id,
        serviceName: service2?.name ?? service.id,
        content: "",
        platform: "x",
        status: "failed",
        error,
        createdAt: new Date().toISOString(),
      });
      results.push({ serviceId: service.id, status: "failed", error });
    }

    // Small delay between posts to avoid rate limits
    await new Promise((r) => setTimeout(r, 2000));
  }

  return NextResponse.json({ results, postedAt: new Date().toISOString() });
}
