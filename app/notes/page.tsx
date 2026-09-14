"use client";

import { useCallback, useEffect, useState } from "react";

type Note = { id: string; textContent: string | null; categoryName?: string | null; categoryId: string | null; contentType: string; capturedAt: string };
type Category = { id: string; name: string; color: string };

const emptyForm = { textContent: "", categoryId: "" };

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [notesResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/notes?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(categoryFilter ? { categoryId: categoryFilter } : {}) })}`),
        fetch("/api/categories"),
      ]);
      if (!notesResponse.ok || !categoriesResponse.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      const notesData = await notesResponse.json() as { items: Note[] };
      const categoriesData = await categoriesResponse.json() as { items: Category[] };
      setNotes(notesData.items); setCategories(categoriesData.items);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "เกิดข้อผิดพลาด"); }
    finally { setLoading(false); }
  }, [categoryFilter, query]);

  useEffect(() => { const timer = window.setTimeout(() => { void loadData(); }, 0); return () => window.clearTimeout(timer); }, [loadData]);

  function openCreate() { setEditingId(null); setForm(emptyForm); setFormOpen(true); }
  function openEdit(note: Note) { setEditingId(note.id); setForm({ textContent: note.textContent ?? "", categoryId: note.categoryId ?? "" }); setFormOpen(true); }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!form.textContent.trim()) return; setSaving(true); setError("");
    try { const response = await fetch(editingId ? `/api/notes/${editingId}` : "/api/notes", { method: editingId ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ textContent: form.textContent, categoryId: form.categoryId || null }) }); if (!response.ok) throw new Error("บันทึก Note ไม่สำเร็จ"); setFormOpen(false); await loadData(); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : "เกิดข้อผิดพลาด"); }
    finally { setSaving(false); }
  }

  async function removeNote(note: Note) { if (!window.confirm("ต้องการลบ Note นี้ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้")) return; const response = await fetch(`/api/notes/${note.id}`, { method: "DELETE" }); if (!response.ok) { setError("ลบ Note ไม่สำเร็จ"); return; } await loadData(); }

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-indigo-600">Workspace</p><h1 className="mt-1 text-3xl font-bold">Notes</h1><p className="mt-2 text-slate-500">สร้าง แก้ไข ลบ และค้นหา Note ของคุณ</p></div><button onClick={openCreate} className="min-h-11 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700">+ สร้าง Note</button></header>
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row"><label className="flex-1"><span className="sr-only">ค้นหา Notes</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาด้วยคำหรือความหมาย..." className="min-h-11 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label><label><span className="sr-only">กรองตามหมวดหมู่</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 sm:w-52"><option value="">ทุกหมวดหมู่</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></section>
    {error && <div role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    {loading ? <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">กำลังโหลด Notes...</div> : notes.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200"><p className="font-semibold">ยังไม่มี Note</p><p className="mt-2 text-sm text-slate-500">เริ่มจด Note แรกของคุณได้เลย</p><button onClick={openCreate} className="mt-5 min-h-11 rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">สร้าง Note แรก</button></div> : <div className="grid gap-4 md:grid-cols-2">{notes.map((note) => <article key={note.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between gap-3"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{note.categoryName ?? "ยังไม่จัดหมวด"}</span><span className="text-xs text-slate-400">{note.contentType}</span></div><p className="mt-4 whitespace-pre-wrap leading-7 text-slate-800">{note.textContent || "ไม่มีข้อความ"}</p></div><div className="flex gap-1"><button aria-label="แก้ไข Note" onClick={() => openEdit(note)} className="min-h-11 min-w-11 rounded-lg text-slate-500 hover:bg-slate-100">แก้ไข</button><button aria-label="ลบ Note" onClick={() => void removeNote(note)} className="min-h-11 min-w-11 rounded-lg text-rose-500 hover:bg-rose-50">ลบ</button></div></div><time className="mt-5 block text-xs text-slate-400">{new Date(note.capturedAt).toLocaleString("th-TH")}</time></article>)}</div>}
    {isFormOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6"><form onSubmit={submitForm} className="w-full max-w-xl rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{editingId ? "แก้ไข Note" : "สร้าง Note"}</h2><button type="button" onClick={() => setFormOpen(false)} aria-label="ปิดฟอร์ม" className="min-h-11 min-w-11 rounded-lg text-slate-500 hover:bg-slate-100">✕</button></div><label className="mt-6 block text-sm font-semibold text-slate-700">เนื้อหา<textarea autoFocus value={form.textContent} onChange={(event) => setForm({ ...form, textContent: event.target.value })} rows={7} className="mt-2 w-full rounded-xl border border-slate-200 p-4 leading-7 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="เขียน Note ของคุณ..." /></label><label className="mt-4 block text-sm font-semibold text-slate-700">หมวดหมู่<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4"><option value="">ยังไม่จัดหมวด</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setFormOpen(false)} className="min-h-11 rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-100">ยกเลิก</button><button disabled={saving || !form.textContent.trim()} className="min-h-11 rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "กำลังบันทึก..." : "บันทึก Note"}</button></div></form></div>}
  </div>;
}
