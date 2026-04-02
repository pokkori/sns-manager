// Vercel KV wrapper — falls back to in-memory if KV is not configured
import { SERVICES } from "./services";

export type PostLogMetrics = {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  engagementScore: number; // likes + retweets*3 + replies*2 + quotes*2
};

export type PostLog = {
  id: string;
  serviceId: string;
  serviceName: string;
  content: string;
  platform: "x" | "tiktok_script";
  status: "success" | "failed" | "draft";
  tweetId?: string;
  error?: string;
  createdAt: string;
  metrics?: PostLogMetrics;
};

// In-memory fallback (resets on cold start)
const memLogs: PostLog[] = [];
const memEnabled: Record<string, boolean> = Object.fromEntries(
  SERVICES.map((s) => [s.id, true])
);

async function getKv() {
  if (!process.env.KV_REST_API_URL) return null;
  try {
    const { kv } = await import("@vercel/kv");
    return kv;
  } catch {
    return null;
  }
}

export async function getLogs(): Promise<PostLog[]> {
  const kv = await getKv();
  if (kv) {
    const logs = await kv.get<PostLog[]>("sns_logs");
    return logs ?? [];
  }
  return [...memLogs].reverse();
}

export async function addLog(log: PostLog): Promise<void> {
  const kv = await getKv();
  if (kv) {
    const logs = await kv.get<PostLog[]>("sns_logs") ?? [];
    const updated = [log, ...logs].slice(0, 200);
    await kv.set("sns_logs", updated);
  } else {
    memLogs.unshift(log);
    if (memLogs.length > 200) memLogs.pop();
  }
}

export async function getEnabledMap(): Promise<Record<string, boolean>> {
  const kv = await getKv();
  if (kv) {
    const map = await kv.get<Record<string, boolean>>("sns_enabled");
    if (map) return map;
  }
  return { ...memEnabled };
}

export async function setEnabled(serviceId: string, enabled: boolean): Promise<void> {
  const kv = await getKv();
  if (kv) {
    const map = await kv.get<Record<string, boolean>>("sns_enabled") ?? {};
    map[serviceId] = enabled;
    await kv.set("sns_enabled", map);
  } else {
    memEnabled[serviceId] = enabled;
  }
}

export async function updateLogMetrics(
  tweetId: string,
  metrics: PostLog["metrics"]
): Promise<void> {
  const kv = await getKv();
  if (kv) {
    const logs = await kv.get<PostLog[]>("sns_logs") ?? [];
    const idx = logs.findIndex((l) => l.tweetId === tweetId);
    if (idx !== -1) {
      logs[idx] = { ...logs[idx], metrics };
      await kv.set("sns_logs", logs);
    }
  } else {
    const idx = memLogs.findIndex((l) => l.tweetId === tweetId);
    if (idx !== -1) {
      memLogs[idx] = { ...memLogs[idx], metrics };
    }
  }
}

export async function getServiceStats(): Promise<Array<{
  serviceId: string;
  serviceName: string;
  totalPosts: number;
  totalEngagement: number;
  avgEngagement: number;
  lastPostedAt: string | null;
}>> {
  const logs = await getLogs();
  const statsMap: Record<string, {
    serviceId: string;
    serviceName: string;
    totalPosts: number;
    totalEngagement: number;
    lastPostedAt: string | null;
  }> = {};

  // Initialize with all services
  for (const svc of SERVICES) {
    statsMap[svc.id] = {
      serviceId: svc.id,
      serviceName: svc.name,
      totalPosts: 0,
      totalEngagement: 0,
      lastPostedAt: null,
    };
  }

  for (const log of logs) {
    if (log.status !== "success") continue;
    if (!statsMap[log.serviceId]) {
      statsMap[log.serviceId] = {
        serviceId: log.serviceId,
        serviceName: log.serviceName,
        totalPosts: 0,
        totalEngagement: 0,
        lastPostedAt: null,
      };
    }
    const entry = statsMap[log.serviceId];
    entry.totalPosts += 1;
    if (log.metrics) {
      entry.totalEngagement += log.metrics.engagementScore;
    }
    if (!entry.lastPostedAt || log.createdAt > entry.lastPostedAt) {
      entry.lastPostedAt = log.createdAt;
    }
  }

  return Object.values(statsMap).map((entry) => ({
    ...entry,
    avgEngagement: entry.totalPosts > 0
      ? Math.round((entry.totalEngagement / entry.totalPosts) * 10) / 10
      : 0,
  }));
}
