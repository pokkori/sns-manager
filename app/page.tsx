"use client";
import { useState, useEffect, useCallback } from "react";
import { SERVICES, type Service } from "@/lib/services";

type PostLog = {
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

type ServiceState = {
  generating: boolean;
  posting: boolean;
  preview: string;
  lastResult: string;
  platform: "x" | "tiktok_script";
};

type LocalHistory = {
  text: string;
  createdAt: string;
};

const LOCAL_HISTORY_KEY = "sns_auto_history";
const LOCAL_HISTORY_MAX = 5;

function saveLocalHistory(text: string) {
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    const history: LocalHistory[] = raw ? JSON.parse(raw) : [];
    const newEntry: LocalHistory = { text, createdAt: new Date().toISOString() };
    const updated = [newEntry, ...history].slice(0, LOCAL_HISTORY_MAX);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

function loadLocalHistory(): LocalHistory[] {
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function Dashboard() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [states, setStates] = useState<Record<string, ServiceState>>({});
  const [logs, setLogs] = useState<PostLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [localHistory, setLocalHistory] = useState<LocalHistory[]>([]);

  const initStates = useCallback(() => {
    const init: Record<string, ServiceState> = {};
    SERVICES.forEach((s) => {
      init[s.id] = { generating: false, posting: false, preview: "", lastResult: "", platform: "x" };
    });
    setStates(init);
  }, []);

  useEffect(() => {
    initStates();
    // Load enabled map
    fetch("/api/toggle").then((r) => r.json()).then((d) => setEnabled(d.enabled ?? {}));
    // Load logs
    fetch("/api/logs").then((r) => r.json()).then((d) => {
      setLogs(d.logs ?? []);
      setLogsLoading(false);
    });
    // Load local history
    setLocalHistory(loadLocalHistory());
  }, [initStates]);

  function updateState(id: string, patch: Partial<ServiceState>) {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function toggleEnabled(serviceId: string) {
    const newVal = !enabled[serviceId];
    setEnabled((prev) => ({ ...prev, [serviceId]: newVal }));
    await fetch("/api/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId, enabled: newVal }),
    });
  }

  async function generate(service: Service) {
    const platform = states[service.id]?.platform ?? "x";
    updateState(service.id, { generating: true, preview: "", lastResult: "" });
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: service.id, platform }),
    });
    const data = await res.json();
    updateState(service.id, { generating: false, preview: data.text ?? data.error ?? "エラー" });
  }

  async function post(service: Service) {
    const preview = states[service.id]?.preview;
    const platform = states[service.id]?.platform ?? "x";
    if (!preview) return;
    updateState(service.id, { posting: true, lastResult: "" });
    const res = await fetch("/api/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: service.id, content: preview, platform, skipEnabledCheck: true }),
    });
    const data = await res.json();
    let result = "";
    if (data.ok) {
      result = data.tweetUrl ? `✅ 投稿完了 → ${data.tweetUrl}` : data.dryRun ? "✅ ドライラン記録済み" : "✅ スクリプト保存済み";
      // Save to local history
      saveLocalHistory(preview);
      setLocalHistory(loadLocalHistory());
      // Refresh logs
      fetch("/api/logs").then((r) => r.json()).then((d) => setLogs(d.logs ?? []));
    } else {
      result = `❌ ${data.error}`;
    }
    updateState(service.id, { posting: false, lastResult: result });
  }

  const totalSuccess = logs.filter((l) => l.status === "success").length;
  const todaySuccess = logs.filter((l) => {
    const today = new Date().toDateString();
    return l.status === "success" && new Date(l.createdAt).toDateString() === today;
  }).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <header className="backdrop-blur-sm bg-gray-900/80 border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-black text-xl text-white">SNS自動投稿管理</h1>
          <p className="text-xs text-gray-500 mt-0.5">pokkori services — {SERVICES.length} services</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-2xl font-black text-emerald-400">{todaySuccess}</div>
            <div className="text-xs text-gray-500">今日の投稿</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-blue-400">{totalSuccess}</div>
            <div className="text-xs text-gray-500">累計投稿</div>
          </div>
          <a
            href="/email"
            aria-label="コールドメール送信ページへ移動"
            className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            コールドメール
          </a>
          <button
            onClick={() => setShowLog(!showLog)}
            aria-label={showLog ? "ダッシュボードに戻る" : "投稿ログを見る"}
            className="backdrop-blur-sm bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-lg text-sm transition border border-white/10"
          >
            {showLog ? "ダッシュボードに戻る" : "投稿ログを見る"}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {showLog ? (
          /* Log view */
          <div>
            <h2 className="font-bold text-lg mb-4">投稿履歴</h2>
            {logsLoading ? (
              <p className="text-gray-500 text-sm">読み込み中...</p>
            ) : logs.length === 0 ? (
              <p className="text-gray-500 text-sm">まだ投稿履歴がありません</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const svc = SERVICES.find((s) => s.id === log.serviceId);
                  return (
                    <div key={log.id} className="backdrop-blur-sm bg-white/5 border border-white/10 shadow-lg rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{svc?.emoji ?? ""}</span>
                          <span className="font-bold text-sm">{log.serviceName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            log.platform === "x" ? "bg-white/10 text-gray-300" : "bg-pink-900/60 text-pink-300"
                          }`}>
                            {log.platform === "x" ? "X" : "TikTok台本"}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            log.status === "success" ? "bg-emerald-900/60 text-emerald-400" :
                            log.status === "failed" ? "bg-red-900/60 text-red-400" : "bg-white/10 text-gray-400"
                          }`}>
                            {log.status === "success" ? "成功" : log.status === "failed" ? "失敗" : "下書き"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString("ja-JP")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{log.content}</p>
                      {log.tweetId && log.tweetId !== "dry-run" && (
                        <a
                          href={`https://x.com/i/web/status/${log.tweetId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${log.serviceName}の投稿をXで見る`}
                          className="text-xs text-blue-400 hover:underline mt-2 block"
                        >
                          Xで見る →
                        </a>
                      )}
                      {log.error && <p className="text-xs text-red-400 mt-2">{log.error}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Dashboard */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">サービス一覧</h2>
              <p className="text-xs text-gray-500">
                有効: {Object.values(enabled).filter(Boolean).length} / {SERVICES.length}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERVICES.map((service) => {
                const st = states[service.id] ?? { generating: false, posting: false, preview: "", lastResult: "", platform: "x" };
                const isEnabled = enabled[service.id] ?? true;

                return (
                  <div
                    key={service.id}
                    className={`backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 shadow-lg p-5 flex flex-col gap-3 transition ${
                      isEnabled ? "" : "opacity-60"
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{service.emoji}</span>
                        <div>
                          <h3 className="font-bold text-sm">{service.name}</h3>
                          <p className="text-xs text-gray-500">
                            {service.cronDays.map((d) => ["日","月","火","水","木","金","土"][d]).join("・")}曜日 自動投稿
                          </p>
                        </div>
                      </div>
                      {/* Toggle */}
                      <button
                        onClick={() => toggleEnabled(service.id)}
                        aria-label={`${service.name}の自動投稿を${isEnabled ? "無効" : "有効"}にする`}
                        aria-pressed={isEnabled}
                        className={`w-10 h-6 rounded-full transition-colors relative ${
                          isEnabled ? "bg-emerald-500" : "bg-gray-700"
                        }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          isEnabled ? "translate-x-4" : "translate-x-0.5"
                        }`} />
                      </button>
                    </div>

                    {/* Platform selector */}
                    <div className="flex gap-2">
                      {(["x", "tiktok_script"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => updateState(service.id, { platform: p })}
                          aria-label={`${service.name}の投稿プラットフォームを${p === "x" ? "X（旧Twitter）" : "TikTok台本"}に切り替える`}
                          aria-pressed={st.platform === p}
                          className={`text-xs px-3 py-1 rounded-full transition ${
                            st.platform === p
                              ? p === "x" ? "bg-blue-900/80 text-blue-300 border border-blue-700/40" : "bg-pink-900/80 text-pink-300 border border-pink-700/40"
                              : "bg-white/5 text-gray-500 border border-white/10"
                          }`}
                        >
                          {p === "x" ? "X投稿" : "TikTok台本"}
                        </button>
                      ))}
                    </div>

                    {/* Preview area */}
                    {st.preview && (
                      <textarea
                        aria-label={`${service.name}の投稿プレビュー（編集可能）`}
                        className="w-full backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-gray-200 resize-none h-24 focus:outline-none focus:border-white/30"
                        value={st.preview}
                        onChange={(e) => updateState(service.id, { preview: e.target.value })}
                      />
                    )}

                    {/* Result */}
                    {st.lastResult && (
                      <p className={`text-xs ${st.lastResult.startsWith("✅") ? "text-emerald-400" : "text-red-400"}`}>
                        {st.lastResult}
                      </p>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => generate(service)}
                        disabled={st.generating}
                        aria-label={`${service.name}の投稿文を${st.preview ? "再生成" : "生成"}する`}
                        className="flex-1 backdrop-blur-sm bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-bold py-2 rounded-xl transition disabled:opacity-50 border border-white/10"
                      >
                        {st.generating ? "生成中..." : st.preview ? "再生成" : "生成"}
                      </button>
                      {st.preview && (
                        <button
                          onClick={() => post(service)}
                          disabled={st.posting}
                          aria-label={`${service.name}の投稿文を${st.platform === "x" ? "Xに投稿" : "TikTok台本として保存"}する`}
                          className="flex-1 bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-xl transition disabled:opacity-50 border border-blue-500/30 backdrop-blur-sm"
                        >
                          {st.posting ? "投稿中..." : "投稿"}
                        </button>
                      )}
                    </div>

                    {/* Service link */}
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${service.name}のサービスページを新しいタブで開く`}
                      className="text-xs text-gray-600 hover:text-gray-400 transition text-center"
                    >
                      {service.url.replace("https://", "")} ↗
                    </a>
                  </div>
                );
              })}
            </div>

            {/* Local history panel */}
            <div className="mt-8">
              <h2 className="font-bold text-lg mb-4">利用履歴</h2>
              {localHistory.length === 0 ? (
                <div className="backdrop-blur-sm bg-white/5 border border-white/10 shadow-lg rounded-2xl px-5 py-4">
                  <p className="text-gray-500 text-sm">まだ投稿履歴がありません。投稿すると自動で記録されます。</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {localHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="backdrop-blur-sm bg-white/5 border border-white/10 shadow-lg rounded-xl px-4 py-3 flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 truncate" title={item.text}>
                          {item.text.slice(0, 50)}{item.text.length > 50 ? "…" : ""}
                        </p>
                      </div>
                      <span className="text-xs text-gray-600 shrink-0">
                        {new Date(item.createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent logs preview */}
            <div className="mt-8">
              <h2 className="font-bold text-lg mb-4">直近の投稿</h2>
              {logsLoading ? (
                <p className="text-gray-500 text-sm">読み込み中...</p>
              ) : logs.length === 0 ? (
                <p className="text-gray-500 text-sm">まだ投稿がありません。各サービスカードで「生成」→「投稿」を押してください。</p>
              ) : (
                <div className="space-y-2">
                  {logs.slice(0, 5).map((log) => {
                    const svc = SERVICES.find((s) => s.id === log.serviceId);
                    return (
                      <div key={log.id} className="flex items-center gap-3 backdrop-blur-sm bg-white/5 border border-white/10 shadow-lg rounded-xl px-4 py-3">
                        <span>{svc?.emoji ?? ""}</span>
                        <span className="text-sm font-bold w-28 shrink-0">{log.serviceName}</span>
                        <p className="text-xs text-gray-400 flex-1 truncate">{log.content}</p>
                        <span className={`text-xs shrink-0 ${log.status === "success" ? "text-emerald-400" : "text-red-400"}`}>
                          {log.status === "success" ? "成功" : "失敗"}
                        </span>
                        <span className="text-xs text-gray-600 shrink-0">
                          {new Date(log.createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                  {logs.length > 5 && (
                    <button
                      onClick={() => setShowLog(true)}
                      aria-label={`投稿ログ全${logs.length}件を見る`}
                      className="text-xs text-gray-500 hover:text-gray-300 transition w-full text-center py-2"
                    >
                      全{logs.length}件を見る →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Cron info */}
            <div className="mt-8 backdrop-blur-sm bg-white/5 border border-white/10 shadow-lg rounded-2xl p-5">
              <h3 className="font-bold text-sm mb-3 text-emerald-400">自動投稿スケジュール</h3>
              <div className="grid md:grid-cols-2 gap-2 text-xs text-gray-400">
                {SERVICES.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span>{s.emoji}</span>
                    <span className="text-gray-300">{s.name}:</span>
                    <span>{s.cronDays.map((d) => ["日","月","火","水","木","金","土"][d]).join("・")}曜 {s.cronHour}時</span>
                    <span className={enabled[s.id] !== false ? "text-emerald-400" : "text-gray-600"}>
                      {enabled[s.id] !== false ? "ON" : "OFF"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Vercel Cron: 毎日 9:00 JST に実行 → 各サービスのスケジュールに応じて自動投稿
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
