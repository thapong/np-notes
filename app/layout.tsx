import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: "NP Note", description: "Personal notes workspace" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="th" className="h-full antialiased"><body className="min-h-full"><AppShell>{children}</AppShell></body></html>;
}
