// KOMOJU LIVE 6本のヘルスチェックスクリプト
// 使い方: node scripts/check-services.mjs

const SERVICES = [
  { name: "競馬予想AI", url: "https://keiba-yoso-ai.vercel.app" },
  { name: "クレームAI", url: "https://claim-ai-beryl.vercel.app" },
  { name: "パワハラ対策AI", url: "https://pawahara-ai.vercel.app" },
  { name: "共同親権サポートAI", url: "https://kyodo-shinken-ai.vercel.app" },
  { name: "婚活AI", url: "https://konkatsu-ai.vercel.app" },
  { name: "告白LINE返信AI", url: "https://kokuhaku-line-ai.vercel.app" },
];

const TIMEOUT_MS = 10000;

async function checkService(service) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(service.url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    const elapsed = Date.now() - start;
    return {
      name: service.name,
      url: service.url,
      status: res.status,
      ok: res.status < 400,
      elapsed: `${elapsed}ms`,
      error: null,
    };
  } catch (err) {
    clearTimeout(timer);
    const elapsed = Date.now() - start;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return {
      name: service.name,
      url: service.url,
      status: null,
      ok: false,
      elapsed: `${elapsed}ms`,
      error: isTimeout ? "TIMEOUT" : (err instanceof Error ? err.message : String(err)),
    };
  }
}

async function main() {
  const now = new Date();
  // JST変換
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  console.log(`\nサービス稼働確認 - ${jst.toISOString().replace("T", " ").slice(0, 19)} JST`);
  console.log("=".repeat(60));

  const results = await Promise.all(SERVICES.map(checkService));

  let allOk = true;
  for (const r of results) {
    const mark = r.ok ? "OK " : "NG ";
    const statusStr = r.status !== null ? `HTTP ${r.status}` : "N/A";
    const errorStr = r.error ? ` [${r.error}]` : "";
    console.log(`${mark} ${r.name.padEnd(20)} ${statusStr.padEnd(10)} ${r.elapsed}${errorStr}`);
    if (!r.ok) allOk = false;
  }

  console.log("=".repeat(60));

  const ngServices = results.filter((r) => !r.ok);
  if (ngServices.length > 0) {
    console.log(`\n[警告] ${ngServices.length}本のサービスで異常を検知:`);
    for (const r of ngServices) {
      console.log(`  - ${r.name}: ${r.error ?? `HTTP ${r.status}`} (${r.url})`);
    }
    process.exit(1);
  } else {
    console.log(`\n全${results.length}本のサービスが正常稼働中`);
  }
}

main().catch((err) => {
  console.error("チェックスクリプト実行エラー:", err);
  process.exit(1);
});
