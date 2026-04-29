import fs from "fs";

interface FaxResult {
  success: boolean;
  jobId?: string;
  cost?: number;
  error?: string;
}

export async function sendFaxDM(faxNumber: string, pdfPath: string): Promise<FaxResult> {
  const apiKey = process.env.DIGIFAX_API_KEY;
  if (!apiKey) return { success: false, error: "DIGIFAX_API_KEY not set" };

  const form = new FormData();
  form.append("faxdst", faxNumber.replace(/^\+81/, "0").replace(/-/g, ""));

  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });
  form.append("faxfile", pdfBlob, "kaigo-kasuhara-ai.pdf");

  try {
    const res = await fetch("https://digifax.jp/apiv1/send", {
      method: "POST",
      headers: { "X-API-KEY": apiKey },
      body: form,
    });
    const data = (await res.json()) as { result: string; id?: string; cost?: number; message?: string };
    if (data.result === "ok") return { success: true, jobId: data.id, cost: data.cost };
    return { success: false, error: data.message ?? "Unknown error" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function batchFaxDM(
  faxList: string[],
  pdfPath: string,
  batchSize = 50
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < faxList.length; i += batchSize) {
    const batch = faxList.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map((fax) => sendFaxDM(fax, pdfPath)));
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.success) sent++;
      else failed++;
    }
    if (i + batchSize < faxList.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
    console.log(
      `FAX送信進捗: ${Math.min(i + batchSize, faxList.length)}/${faxList.length} (成功${sent}/失敗${failed})`
    );
  }

  return { sent, failed };
}

export async function getFaxCredits(): Promise<number | null> {
  const apiKey = process.env.DIGIFAX_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://digifax.jp/apiv1/credits", {
      headers: { "X-API-KEY": apiKey },
    });
    const data = (await res.json()) as { credits?: number };
    return data.credits ?? null;
  } catch {
    return null;
  }
}
