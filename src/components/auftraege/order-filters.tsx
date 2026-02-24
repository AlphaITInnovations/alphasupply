"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const filters = [
  { key: undefined, label: "Alle" },
  { key: "commission", label: "Kommissionierung" },
  { key: "setup", label: "Einrichtung" },
  { key: "ready", label: "Versandbereit" },
  { key: "procurement", label: "Beschaffung" },
] as const;

type FilterKey = (typeof filters)[number]["key"];

export function OrderFilters({ current }: { current?: string }) {
  const searchParams = useSearchParams();

  function buildHref(filterKey: FilterKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (filterKey) {
      params.set("filter", filterKey);
    } else {
      params.delete("filter");
    }
    params.delete("search");
    const qs = params.toString();
    return `/auftraege${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
      {filters.map((f) => {
        const isActive = current === f.key || (!current && !f.key);
        return (
          <Link
            key={f.key ?? "all"}
            href={buildHref(f.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </Link>
        );
      })}
    </div>
  );
}
