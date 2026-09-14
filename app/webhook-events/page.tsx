"use client";

import { useEffect, useState } from "react";

type Event = { id: string; event_type: string; status: string; attempt_count: number; last_error: string | null };

export default function WebhookEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  async function load() { const response = await fetch("/api/webhook-events"); if (!response.ok) throw new Error("โหลด Webhook Events ไม่สำเร็จ"); setEvents((await response.json()).items); }
  useEffect(() => { const timer = window.setTimeout(() => { void load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "เกิดข้อผิดพลาด")); }, 0); return () => window.clearTimeout(timer); }, []);
  async function retry(id: string) { const response = await fetch(`/api/webhook-events/${id}/retry`, { method: "POST" }); if (!response.ok) { setError("Retry ไม่สำเร็จ"); return; } await load(); }
  return <div className="space-y-8"><header><p className="text-sm font-medium text-indigo-600">Workspace</p><h1 className="mt-1 text-3xl font-bold">Webhook Events</h1><p className="mt-2 text-slate-500">ตรวจสอบสถานะการรับข้อมูลจาก LINE และ Retry งานที่ล้มเหลว</p></header>{error && <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}<section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50"><tr><th className="px-5 py-3">ประเภท</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3">Attempts</th><th className="px-5 py-3">Error</th><th className="px-5 py-3">จัดการ</th></tr></thead><tbody>{events.map((event) => <tr key={event.id} className="border-b border-slate-100"><td className="px-5 py-4">{event.event_type}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{event.status}</span></td><td className="px-5 py-4">{event.attempt_count}</td><td className="max-w-xs truncate px-5 py-4 text-rose-600">{event.last_error ?? "—"}</td><td className="px-5 py-4">{event.status === "failed" && <button onClick={() => void retry(event.id)} className="min-h-10 rounded-lg border border-indigo-200 px-3 text-indigo-700 hover:bg-indigo-50">Retry</button>}</td></tr>)}</tbody></table>{events.length === 0 && <p className="p-10 text-center text-slate-500">ยังไม่มี Event</p>}</div></section></div>;
}
