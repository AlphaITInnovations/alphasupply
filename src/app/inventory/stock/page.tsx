export const dynamic = "force-dynamic";

import { getStockArticles } from "@/queries/inventory";
import { StockTable } from "@/components/inventory/stock-table";

export default async function StockPage() {
  const articles = await getStockArticles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lagerbestand</h1>
        <p className="text-sm text-muted-foreground">
          {articles.length} Artikel im Lager
        </p>
      </div>

      <StockTable articles={articles} />
    </div>
  );
}
