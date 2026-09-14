import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { RecentNotes } from "@/components/dashboard/recent-notes";

export default function Home() {
  return <div className="space-y-8"><header><p className="text-sm font-medium text-indigo-600">Good morning</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard</h1><p className="mt-2 text-slate-500">พื้นที่รวม Note และสถานะการรับข้อมูลของคุณ</p></header><DashboardCards /><RecentNotes /></div>;
}
