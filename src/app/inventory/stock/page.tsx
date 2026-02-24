export const dynamic = "force-dynamic";

import { Package, AlertTriangle, Hash } from "lucide-react";
import { getStockArticles } from "@/queries/inventory";
import { StockTable } from "@/components/inventory/stock-table";
import { PageHeader } from "@/components/layout/page-header";

export default async function StockPage() {
  const articles = await getStockArticles();

  const totalItems = articles.reduce((sum, a) => sum + a.currentStock, 0);
  const totalSerialized = articles.filter((a) => a.category === "HIGH_TIER").length;
  const lowStock = articles.filter(
    (a) => a.currentStock <= a.minStockLevel && a.minStockLevel > 0
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Lager" description="Aktuelle Bestände und Seriennummern" />
      {/* Summary Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo/10">
            <Package className="h-5 w-5 text-indigo" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{articles.length}</p>
            <p className="text-xs text-muted-foreground">Artikel im Lager</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-light/10">
            <Hash className="h-5 w-5 text-indigo-light" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{totalSerialized}</p>
            <p className="text-xs text-muted-foreground">Mit Seriennummer</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${lowStock > 0 ? "bg-destructive/10" : "bg-success/10"}`}>
            <AlertTriangle className={`h-5 w-5 ${lowStock > 0 ? "text-destructive" : "text-success"}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold tracking-tight ${lowStock > 0 ? "text-destructive" : ""}`}>
              {lowStock}
            </p>
            <p className="text-xs text-muted-foreground">Niedrigbestand</p>
          </div>
        </div>
      </div>

      <StockTable articles={articles} />
    </div>
  );
}
