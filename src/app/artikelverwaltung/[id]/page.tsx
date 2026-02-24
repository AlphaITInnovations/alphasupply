import { notFound } from "next/navigation";
import { getArticleById, getArticleGroupSuggestions } from "@/queries/inventory";
import { ArticleDetail } from "@/components/artikelverwaltung/article-detail";

export const dynamic = "force-dynamic";

export default async function ArtikeldetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [article, groupSuggestions] = await Promise.all([
    getArticleById(id),
    getArticleGroupSuggestions(),
  ]);

  if (!article) {
    notFound();
  }

  // Serialize for client component (Decimal -> number, Date -> string)
  const serialized = {
    id: article.id,
    name: article.name,
    description: article.description,
    sku: article.sku,
    category: article.category,
    productGroup: article.productGroup,
    productSubGroup: article.productSubGroup,
    avgPurchasePrice:
      article.avgPurchasePrice != null
        ? Number(article.avgPurchasePrice)
        : null,
    unit: article.unit,
    minStockLevel: article.minStockLevel,
    currentStock: article.currentStock,
    incomingStock: article.incomingStock,
    isActive: article.isActive,
    notes: article.notes,
    serialNumbers: article.serialNumbers.map((sn) => ({
      id: sn.id,
      serialNo: sn.serialNo,
      status: sn.status,
      isUsed: sn.isUsed,
      notes: sn.notes,
    })),
    articleSuppliers: article.articleSuppliers.map((as) => ({
      id: as.id,
      supplierSku: as.supplierSku,
      unitPrice: Number(as.unitPrice),
      currency: as.currency,
      leadTimeDays: as.leadTimeDays,
      minOrderQty: as.minOrderQty,
      isPreferred: as.isPreferred,
      supplier: {
        id: as.supplier.id,
        name: as.supplier.name,
      },
    })),
    stockMovements: article.stockMovements.map((sm) => ({
      id: sm.id,
      type: sm.type,
      quantity: sm.quantity,
      reason: sm.reason,
      performedBy: sm.performedBy,
      createdAt: sm.createdAt.toISOString(),
    })),
  };

  return <ArticleDetail article={serialized} groupSuggestions={groupSuggestions} />;
}
