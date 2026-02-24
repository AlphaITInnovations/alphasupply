export const dynamic = "force-dynamic";

import { getPendingReceivingOrders } from "@/queries/receiving";
import { getArticlesForReceiving } from "@/queries/inventory";
import { PendingDeliveries } from "@/components/wareneingang/pending-deliveries";
import { ManualReceiving } from "@/components/wareneingang/manual-receiving";

export default async function WareneingangPage() {
  const [pendingOrders, articles] = await Promise.all([
    getPendingReceivingOrders(),
    getArticlesForReceiving(),
  ]);

  // Serialize dates and Decimal fields for client components
  const serializedOrders = pendingOrders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    orderedFor: order.orderedFor,
    costCenter: order.costCenter,
    createdAt: order.createdAt.toISOString(),
    totalPending: order.totalPending,
    totalDone: order.totalDone,
    totalItems: order.totalItems,
    pendingItems: order.pendingItems.map((item) => ({
      id: item.id,
      orderId: order.id,
      articleId: item.articleId,
      freeText: item.freeText,
      quantity: item.quantity,
      receivedQty: item.receivedQty,
      supplierId: item.supplierId,
      supplierOrderNo: item.supplierOrderNo,
      orderedAt: item.orderedAt?.toISOString() ?? null,
      orderedBy: item.orderedBy,
      article: item.article
        ? {
            id: item.article.id,
            name: item.article.name,
            sku: item.article.sku,
            category: item.article.category,
            unit: item.article.unit,
          }
        : null,
      supplier: item.supplier
        ? {
            id: item.supplier.id,
            name: item.supplier.name,
          }
        : null,
    })),
    pendingMf: order.pendingMf.map((mf) => ({
      id: mf.id,
      orderId: order.id,
      type: mf.type,
      simType: mf.simType,
      tariff: mf.tariff,
      phoneNote: mf.phoneNote,
      simNote: mf.simNote,
      ordered: mf.ordered,
      received: mf.received,
      providerOrderNo: mf.providerOrderNo,
      orderedAt: mf.orderedAt?.toISOString() ?? null,
      orderedBy: mf.orderedBy,
    })),
  }));

  const serializedArticles = articles.map((a) => ({
    id: a.id,
    name: a.name,
    sku: a.sku,
    category: a.category,
    unit: a.unit,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wareneingang</h1>
        <p className="text-muted-foreground">
          Eingegangene Lieferungen erfassen und einlagern
        </p>
      </div>

      <PendingDeliveries orders={serializedOrders} />

      <ManualReceiving articles={serializedArticles} />
    </div>
  );
}
