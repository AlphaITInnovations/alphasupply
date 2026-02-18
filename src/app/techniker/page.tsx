export const dynamic = "force-dynamic";

import { getTechOrders } from "@/queries/techniker";
import { TechOrderList } from "@/components/techniker/tech-order-list";

export default async function TechnikerPage() {
  const orders = await getTechOrders();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Techniker - Auftragsbearbeitung</h1>
      <TechOrderList orders={orders} />
    </div>
  );
}
