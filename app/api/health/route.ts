import { NextResponse } from "next/server";
import { getLogs } from "@/lib/store";
import { SERVICES } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let recentLogs: Awaited<ReturnType<typeof getLogs>> = [];
  let storeAvailable = true;

  try {
    const allLogs = await getLogs();
    recentLogs = allLogs.filter((l) => new Date(l.createdAt) >= oneDayAgo);
  } catch {
    storeAvailable = false;
  }

  const totalRecent = recentLogs.length;
  const errorRecent = recentLogs.filter((l) => l.status === "failed").length;
  const successRecent = recentLogs.filter((l) => l.status === "success").length;
  const errorRate = totalRecent > 0
    ? Math.round((errorRecent / totalRecent) * 1000) / 10
    : 0;

  // サービスごとの直近24時間ステータス
  const serviceStatus = SERVICES.map((svc) => {
    const svcLogs = recentLogs.filter((l) => l.serviceId === svc.id);
    const lastLog = svcLogs[0] ?? null;
    return {
      id: svc.id,
      name: svc.name,
      lastStatus: lastLog?.status ?? "no_data",
      lastPostedAt: lastLog?.createdAt ?? null,
      errorCount: svcLogs.filter((l) => l.status === "failed").length,
    };
  });

  const hasHighErrorRate = errorRate >= 30;
  const overallStatus = !storeAvailable
    ? "degraded"
    : hasHighErrorRate
    ? "warning"
    : "ok";

  return NextResponse.json({
    status: overallStatus,
    checkedAt: now.toISOString(),
    store: storeAvailable ? "available" : "unavailable",
    last24h: {
      total: totalRecent,
      success: successRecent,
      error: errorRecent,
      errorRate: `${errorRate}%`,
    },
    services: serviceStatus,
  });
}
