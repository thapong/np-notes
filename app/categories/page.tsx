"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Category = { id: string; name: string; slug: string; color: string | null };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("โหลดหมวดหมู่ไม่สำเร็จ");
      const data = await response.json() as { items: Category[] };
      setCategories(data.items);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "เกิดข้อผิดพลาด"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { void loadCategories(); }, 0); return () => window.clearTimeout(timer); }, [loadCategories]);

  function startEdit(category: Category) { setEditingId(category.id); setName(category.name); setError(""); }
  function cancelEdit() { setEditingId(null); setName(""); }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(editingId ? `/api/categories/${editingId}` : "/api/categories", { method: editingId ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: trimmedName }) });
      if (!response.ok) { const data = await response.json().catch(() => ({})) as { error?: string }; throw new Error(data.error ?? "บันทึกหมวดหมู่ไม่สำเร็จ"); }
      cancelEdit(); await loadCategories();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "เกิดข้อผิดพลาด"); }
    finally { setSaving(false); }
  }

  async function removeCategory(category: Category) {
    if (!window.confirm(`ต้องการลบหมวดหมู่ “${category.name}” ใช่หรือไม่? Notes ในหมวดนี้จะถูกยกเลิกการจัดหมวด`)) return;
    setError("");
    try {
      const response = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
      if (!response.ok) { const data = await response.json().catch(() => ({})) as { error?: string }; throw new Error(data.error ?? "ลบหมวดหมู่ไม่สำเร็จ"); }
      if (editingId === category.id) cancelEdit();
      await loadCategories();
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "เกิดข้อผิดพลาด"); }
  }

  return <div className="space-y-8">
    <header><p className="text-sm font-medium text-indigo-600">Workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Categories</h1><p className="mt-2 text-slate-500">เพิ่ม แก้ไข และลบหมวดหมู่สำหรับจัดระเบียบ Note ของคุณ</p></header>
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"><h2 className="text-lg font-semibold">{editingId ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</h2><form onSubmit={submitCategory} className="mt-4 flex flex-col gap-3 sm:flex-row"><label className="flex-1"><span className="sr-only">ชื่อหมวดหมู่</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น งาน, ไอเดีย, หนังสือ" className="min-h-11 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label><div className="flex gap-2"><button type="submit" disabled={saving || !name.trim()} className="min-h-11 rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "+ เพิ่มหมวดหมู่"}</button>{editingId && <button type="button" onClick={cancelEdit} className="min-h-11 rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-100">ยกเลิก</button>}</div></form></section>
    {error && <div role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">หมวดหมู่ทั้งหมด</h2><span className="text-sm text-slate-500">{categories.length} รายการ</span></div>{loading ? <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">กำลังโหลดหมวดหมู่...</div> : categories.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">ยังไม่มีหมวดหมู่ เพิ่มหมวดหมู่แรกได้เลย</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category) => <article key={category.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-indigo-500" /><div><h3 className="font-semibold text-slate-800">{category.name}</h3><p className="mt-1 text-xs text-slate-400">{category.slug}</p></div></div><div className="flex gap-1"><button aria-label={`แก้ไข ${category.name}`} onClick={() => startEdit(category)} className="min-h-11 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100">แก้ไข</button><button aria-label={`ลบ ${category.name}`} onClick={() => void removeCategory(category)} className="min-h-11 rounded-lg px-3 text-sm text-rose-600 hover:bg-rose-50">ลบ</button></div></div></article>)}</div>}</section>
  </div>;
}
