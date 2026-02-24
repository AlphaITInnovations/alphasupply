import { getArticles } from "@/queries/inventory";
import { ArticleCatalog } from "@/components/artikelverwaltung/article-catalog";

export const dynamic = "force-dynamic";

export default async function ArtikelverwaltungPage() {
  const articles = await getArticles({ activeOnly: false });

  // Serialize for client component (Decimal -> number)
  const serialized = articles.map((a) => ({
    id: a.id,
    name: a.name,
    sku: a.sku,
    category: a.category,
    productGroup: a.productGroup,
    productSubGroup: a.productSubGroup,
    avgPurchasePrice: a.avgPurchasePrice != null ? Number(a.avgPurchasePrice) : null,
    currentStock: a.currentStock,
    isActive: a.isActive,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Artikelverwaltung</h1>
        <p className="text-muted-foreground">
          Artikel anlegen, bearbeiten und verwalten
        </p>
      </div>
      <ArticleCatalog articles={serialized} />
    </div>
  );
}
