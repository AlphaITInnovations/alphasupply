export const dynamic = "force-dynamic";

import { getPipelineOrders } from "@/queries/inventory";
import { PipelineColumn } from "@/components/dashboard/pipeline-column";
import { LowStockStrip } from "@/components/dashboard/low-stock-strip";

export default async function DashboardPage() {
  const { pipeline, completedCount, lowStockArticles } =
    await getPipelineOrders();

  return (
    <div className="space-y-4">
      {/* Kanban Pipeline */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <PipelineColumn
          title="Neu"
          count={pipeline.neu.length}
          orders={pipeline.neu}
        />
        <PipelineColumn
          title="Einrichten"
          count={pipeline.einrichten.length}
          orders={pipeline.einrichten}
          tab="tech"
        />
        <PipelineColumn
          title="Bestellen"
          count={pipeline.bestellen.length}
          orders={pipeline.bestellen}
          tab="proc"
        />
        <PipelineColumn
          title="Wareneingang"
          count={pipeline.wareneingang.length}
          orders={pipeline.wareneingang}
          tab="recv"
        />
        <PipelineColumn
          title="Versandbereit"
          count={pipeline.versandbereit.length}
          orders={pipeline.versandbereit}
        />
        <PipelineColumn
          title="Erledigt"
          count={completedCount}
          completedCount={completedCount}
        />
      </div>

      {/* Low Stock Warning Strip */}
      <LowStockStrip articles={lowStockArticles} />
    </div>
  );
}
