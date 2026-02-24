import type { PipelineOrder } from "@/queries/inventory";
import { PipelineCard } from "./pipeline-card";

export function PipelineColumn({
  title,
  count,
  orders,
  completedCount,
}: {
  title: string;
  count: number;
  orders?: PipelineOrder[];
  completedCount?: number;
}) {
  return (
    <div className="flex min-w-[180px] flex-1 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium">
          {count}
        </span>
      </div>
      <div className="flex-1 space-y-2">
        {orders?.map((order) => (
          <PipelineCard key={order.id} order={order} />
        ))}
        {completedCount !== undefined && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border/50 p-8 text-center">
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
