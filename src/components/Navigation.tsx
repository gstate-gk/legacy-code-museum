"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Museum", icon: "🏛" },
  { href: "/explorer", label: "Explorer", icon: "🔍" },
  { href: "/appraisal", label: "Appraisal", icon: "🔎" },
  { href: "/quiz", label: "Quiz", icon: "❓" },
  { href: "/discovery", label: "Discovery", icon: "💎" },
];

export function Navigation() {
  const pathname = usePathname();
  const basePath = process.env.NODE_ENV === "production" ? "/legacy-code-archive" : "";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--lca-brass)]/20 bg-[var(--lca-bg)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="font-mono text-lg font-bold text-[var(--lca-gold)]">
          LCA Museum
        </Link>
        <div className="flex gap-1 sm:gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname === `${basePath}${item.href}`;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-2 py-1.5 text-sm transition-colors sm:px-3 ${
                  isActive
                    ? "bg-[var(--lca-brass)]/20 text-[var(--lca-gold)]"
                    : "text-[var(--lca-text-dim)] hover:text-[var(--lca-text)]"
                }`}
              >
                <span className="hidden sm:inline">{item.icon} </span>
                <span className="text-xs sm:text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
