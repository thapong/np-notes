"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Category = { id: string; name: string; slug: string; color: string | null };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("โหลดหมวดหมู่ไม่สำเร็จ");
      const data = await response.json() as { items: Category[] };
      setCategories(data.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadCategories(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCategories]);

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "เพิ่มหมวดหมู่ไม่สำเร็จ");
      }
      setName("");
      await loadCategories();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  return <div className="space-y-8">
    <header><p className="text-sm font-medium text-indigo-600">Workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Categories</h1><p className="mt-2 text-slate-500">จัดการหมวดหมู่สำหรับจัดระเบียบ Note ของคุณ</p></header>
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"><h2 className="text-lg font-semibold">เพิ่มหมวดหมู่</h2><form onSubmit={submitCategory} className="mt-4 flex flex-col gap-3 sm:flex-row"><label className="flex-1"><span className="sr-only">ชื่อหมวดหมู่</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น งาน, ไอเดีย, หนังสือ" className="min-h-11 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label><button type="submit" disabled={saving || !name.trim()} className="min-h-11 rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "กำลังเพิ่ม..." : "+ เพิ่มหมวดหมู่"}</button></form></section>
    {error && <div role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">หมวดหมู่ทั้งหมด</h2><span className="text-sm text-slate-500">{categories.length} รายการ</span></div>{loading ? <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">กำลังโหลดหมวดหมู่...</div> : categories.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">ยังไม่มีหมวดหมู่ เพิ่มหมวดหมู่แรกได้เลย</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category) => <article key={category.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-indigo-500" /><div><h3 className="font-semibold text-slate-800">{category.name}</h3><p className="mt-1 text-xs text-slate-400">{category.slug}</p></div></div></article>)}</div>}</section>
  </div>;
}
