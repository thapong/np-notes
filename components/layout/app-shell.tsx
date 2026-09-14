"use client";
import { useState } from "react";
import { SlideMenu } from "./slide-menu";
export function AppShell({ children }: { children: React.ReactNode }) { const [open, setOpen] = useState(false); return <div className="min-h-screen bg-slate-50 text-slate-900"><SlideMenu open={open} onToggle={() => setOpen(!open)} /><main className={`${open ? "md:pl-64" : "md:pl-20"} min-h-screen transition-all`}><div className="mx-auto max-w-7xl p-4 sm:p-8">{children}</div></main></div>; }
