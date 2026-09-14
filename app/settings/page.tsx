"use client";

import { useEffect, useState } from "react";

type Settings = { provider: string; model: string; health: { ok: boolean; detail: string }; externalData: boolean };

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  useEffect(() => { void fetch("/api/settings/ai").then((response) => response.json()).then(setSettings).catch(() => setMessage("โหลดการตั้งค่าไม่สำเร็จ")); }, []);
  async function reindex() { setWorking(true); setMessage(""); const response = await fetch("/api/settings/ai/reindex", { method: "POST" }); const data = await response.json() as { processed?: number; failed?: number; error?: string }; setMessage(response.ok ? `Re-index สำเร็จ ${data.processed} รายการ${data.failed ? `, ล้มเหลว ${data.failed} รายการ` : ""}` : data.error ?? "Re-index ไม่สำเร็จ"); setWorking(false); }
  return <div className="space-y-8"><header><p className="text-sm font-medium text-indigo-600">Workspace</p><h1 className="mt-1 text-3xl font-bold">Settings</h1><p className="mt-2 text-slate-500">ตั้งค่า AI Provider และระบบค้นหา</p></header><section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="font-semibold">AI Provider</h2>{settings ? <div className="mt-4 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Provider</p><p className="font-semibold">{settings.provider}</p></div><div><p className="text-xs text-slate-500">Model</p><p className="font-semibold">{settings.model}</p></div><div><p className="text-xs text-slate-500">Health</p><p className={settings.health.ok ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"}>{settings.health.ok ? "พร้อมใช้งาน" : "ไม่พร้อมใช้งาน"}</p></div></div> : <p className="mt-4 text-sm text-slate-500">กำลังโหลด...</p>}<p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{settings?.externalData ? "OpenRouter จะส่งข้อความออกไปยังบริการภายนอก" : "Ollama ประมวลผลภายในเครื่อง"} การเปลี่ยน provider หรือ model ต้อง Re-index Note เดิม</p><button onClick={() => void reindex()} disabled={working} className="mt-5 min-h-11 rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white disabled:opacity-50">{working ? "กำลัง Re-index..." : "Re-index Notes ที่ยังไม่มี Embedding"}</button>{message && <p role="status" className="mt-3 text-sm text-slate-600">{message}</p>}</section></div>;
}
