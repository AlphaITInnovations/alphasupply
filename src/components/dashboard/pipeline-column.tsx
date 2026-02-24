import type { PipelineOrder } from "@/queries/inventory";
import { PipelineCard } from "./pipeline-card";
import { cn } from "@/lib/utils";

const colorMap: Record<string, { dot: string; badge: string; bg: string }> = {
  slate: {
    dot: "bg-slate-400 dark:bg-slate-500",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    bg: "bg-slate-50/50 dark:bg-slate-900/20",
  },
  blue: {
    dot: "bg-blue-500 dark:bg-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    bg: "bg-blue-50/30 dark:bg-blue-950/20",
  },
  amber: {
    dot: "bg-amber-500 dark:bg-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    bg: "bg-amber-50/30 dark:bg-amber-950/20",
  },
  emerald: {
    dot: "bg-emerald-500 dark:bg-emerald-400",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    bg: "bg-emerald-50/30 dark:bg-emerald-950/20",
  },
  indigo: {
    dot: "bg-indigo-500 dark:bg-indigo-400",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
    bg: "bg-indigo-50/30 dark:bg-indigo-950/20",
  },
  gray: {
    dot: "bg-gray-400 dark:bg-gray-500",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    bg: "bg-gray-50/30 dark:bg-gray-900/20",
  },
};

export function PipelineColumn({
  title,
  count,
  orders,
  completedCount,
  tab,
  color = "slate",
}: {
  title: string;
  count: number;
  orders?: PipelineOrder[];
  completedCount?: number;
  tab?: string;
  color?: string;
}) {
  const c = colorMap[color] ?? colorMap.slate;

  return (
    <div className="flex min-w-[220px] flex-1 flex-col">
      {/* Column header */}
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", c.dot)} />
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
            c.badge
          )}
        >
          {count}
        </span>
      </div>

      {/* Cards area */}
      <div className={cn("flex-1 space-y-2.5 rounded-xl p-2", c.bg)}>
        {orders?.map((order) => (
          <PipelineCard key={order.id} order={order} tab={tab} />
        ))}
        {completedCount !== undefined && (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="block text-2xl font-bold text-foreground/60">
                {completedCount}
              </span>
              abgeschlossen
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
