export const dynamic = "force-dynamic";

import { getPipelineOrders } from "@/queries/inventory";
import { PipelineColumn } from "@/components/dashboard/pipeline-column";
import { LowStockStrip } from "@/components/dashboard/low-stock-strip";
import { PageHeader } from "@/components/layout/page-header";

export default async function DashboardPage() {
  const { pipeline, completedCount, lowStockArticles } =
    await getPipelineOrders();

  return (
    <div className="space-y-5">
      <PageHeader title="Pipeline" description="Auftrags-Pipeline im Überblick" />

      {/* Kanban Pipeline */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <PipelineColumn
          title="Neu"
          count={pipeline.neu.length}
          orders={pipeline.neu}
          color="slate"
        />
        <PipelineColumn
          title="Einrichten"
          count={pipeline.einrichten.length}
          orders={pipeline.einrichten}
          tab="tech"
          color="blue"
        />
        <PipelineColumn
          title="Bestellen"
          count={pipeline.bestellen.length}
          orders={pipeline.bestellen}
          tab="proc"
          color="amber"
        />
        <PipelineColumn
          title="Wareneingang"
          count={pipeline.wareneingang.length}
          orders={pipeline.wareneingang}
          tab="recv"
          color="emerald"
        />
        <PipelineColumn
          title="Versandbereit"
          count={pipeline.versandbereit.length}
          orders={pipeline.versandbereit}
          color="indigo"
        />
        <PipelineColumn
          title="Erledigt"
          count={completedCount}
          completedCount={completedCount}
          color="gray"
        />
      </div>

      {/* Low Stock Warning Strip */}
      <LowStockStrip articles={lowStockArticles} />
    </div>
  );
}
