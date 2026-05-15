import type { Metadata } from "next";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "Pentracore CRM",
  description: "Commodity Sales CRM — Pentracore International",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
