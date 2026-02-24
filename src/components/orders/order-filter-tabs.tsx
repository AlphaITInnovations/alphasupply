"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const filters = [
  { key: undefined, label: "Alle" },
  { key: "tech", label: "Techniker" },
  { key: "proc", label: "Beschaffung" },
] as const;

export function OrderFilterTabs({ current }: { current?: "tech" | "proc" }) {
  const searchParams = useSearchParams();

  function buildHref(filterKey: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (filterKey) {
      params.set("filter", filterKey);
    } else {
      params.delete("filter");
    }
    const qs = params.toString();
    return `/orders${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
      {filters.map((f) => {
        const isActive = current === f.key;
        return (
          <Link
            key={f.key ?? "all"}
            href={buildHref(f.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
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
