export const dynamic = "force-dynamic";

import { getTechOrders } from "@/queries/techniker";
import { TechOrderList } from "@/components/techniker/tech-order-list";
import { PageHeader } from "@/components/layout/page-header";

export default async function TechnikerPage() {
  const orders = await getTechOrders();

  return (
    <div className="space-y-6">
      <PageHeader title="Techniker" description="Aufträge bearbeiten und Artikel entnehmen" />
      <TechOrderList orders={orders} />
    </div>
  );
}
