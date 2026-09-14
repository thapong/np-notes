"use client";

import { useEffect, useState } from "react";

export function DashboardCards() { const [counts, setCounts] = useState({ notes: "—", categories: "—", processing: "—" }); useEffect(() => { void fetch("/api/dashboard").then((response) => response.json()).then((data) => setCounts(data.counts)); }, []); return <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Total Notes</p><p className="mt-2 text-3xl font-bold">{counts.notes}</p></div><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Categories</p><p className="mt-2 text-3xl font-bold">{counts.categories}</p></div><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Processing</p><p className="mt-2 text-3xl font-bold text-amber-600">{counts.processing}</p></div></div>; }
