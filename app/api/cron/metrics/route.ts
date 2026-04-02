import { NextRequest, NextResponse } from "next/server";
import { getLogs, updateLogMetrics } from "@/lib/store";
import { getTweetMetrics } from "@/lib/twitter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const querySecret = req.nextUrl.searchParams.get("secret");
  const secret = bearerSecret ?? querySecret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const logs = await getLogs();
    const now = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    // Filter: has tweetId, no metrics yet, posted 24h+ ago, not dry-run
    const eligible = logs.filter(
      (l) =>
        l.tweetId &&
        l.tweetId !== "dry-run" &&
        !l.metrics &&
        now - new Date(l.createdAt).getTime() >= twentyFourHoursMs
    );

    if (eligible.length === 0) {
      return NextResponse.json({ updated: 0, message: "No eligible logs" });
    }

    const tweetIds = eligible.map((l) => l.tweetId as string);
    const metricsData = await getTweetMetrics(tweetIds);

    const metricsMap: Record<string, typeof metricsData[number]> = {};
    for (const m of metricsData) {
      metricsMap[m.tweetId] = m;
    }

    let updated = 0;
    for (const log of eligible) {
      const m = metricsMap[log.tweetId as string];
      if (!m) continue;
      const engagementScore =
        m.likes + m.retweets * 3 + m.replies * 2 + m.quotes * 2;
      try {
        await updateLogMetrics(log.tweetId as string, {
          likes: m.likes,
          retweets: m.retweets,
          replies: m.replies,
          quotes: m.quotes,
          engagementScore,
        });
        updated++;
      } catch {
        // Continue on individual update failure
      }
    }

    return NextResponse.json({ updated, total: eligible.length });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}
