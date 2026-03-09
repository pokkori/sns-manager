// Vercel KV wrapper — falls back to in-memory if KV is not configured
import { SERVICES } from "./services";

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
