"use client";

import type { StockAvailability } from "@/types/orders";

const config: Record<StockAvailability, { color: string; glow: string; label: string }> = {
  green: {
    color: "bg-emerald-500",
    glow: "shadow-[0_0_8px_2px_rgba(16,185,129,0.4)]",
    label: "Alle Artikel am Lager",
  },
  yellow: {
    color: "bg-amber-400",
    glow: "shadow-[0_0_8px_2px_rgba(251,191,36,0.4)]",
    label: "Artikel in Zulauf",
  },
  red: {
    color: "bg-red-500",
    glow: "shadow-[0_0_8px_2px_rgba(239,68,68,0.4)]",
    label: "Artikel fehlen",
  },
};

export function StockLight({
  availability,
  size = "md",
  showLabel = false,
}: {
  availability: StockAvailability;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const c = config[availability];
  const sizeClass = size === "sm" ? "h-2.5 w-2.5" : size === "lg" ? "h-4 w-4" : "h-3 w-3";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block rounded-full ${c.color} ${c.glow} ${sizeClass}`}
        title={c.label}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{c.label}</span>
      )}
    </div>
  );
}
