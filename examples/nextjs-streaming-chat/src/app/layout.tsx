import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Graphlit Agentic Retrieval Chat",
  description:
    "Minimal Graphlit streamAgent example with explicit ingestion, polling, and a standalone retrieval tool.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
