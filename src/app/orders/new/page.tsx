export const dynamic = "force-dynamic";

import { OrderForm } from "@/components/orders/order-form";
import { getArticlesForReceiving } from "@/queries/inventory";

export default async function NewOrderPage() {
  const articles = await getArticlesForReceiving();

  // Add currentStock to article data for the order form
  const articlesWithStock = await (await import("@/lib/db")).db.article.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      currentStock: true,
      unit: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <OrderForm articles={articlesWithStock} />
    </div>
  );
}
