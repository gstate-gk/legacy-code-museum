import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Legacy Code Museum",
  description: "64,828件のコメントから読み解く、プログラマたちの声 — コード考古学のインタラクティブ博物館",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navigation />
        <main className="min-h-screen pt-16">
          {children}
        </main>
        <footer className="border-t border-[var(--lca-brass)]/20 py-8 text-center text-sm text-[var(--lca-text-dim)]">
          <p>Legacy Code Museum &mdash; G.state Inc.</p>
          <p className="mt-1">Built with Claude Code / Full Vibe Coding</p>
        </footer>
      </body>
    </html>
  );
}
