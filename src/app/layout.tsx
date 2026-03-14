import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "OpenClaw — Operator Console",
  description: "AI Operations Platform — Content Creation, Social Media, Agent Orchestration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans bg-oc-bg text-oc-text antialiased`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto max-h-screen p-[22px_28px]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
