export const dynamic = "force-dynamic";

import { getDashboardData } from "@/queries/dashboard";
import { ActionCards } from "@/components/dashboard/action-cards";
import { DashboardOrderTable } from "@/components/dashboard/order-table";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";

export default async function DashboardPage() {
  const { orders, counts, lowStockArticles } = await getDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Übersicht aller offenen Aufgaben</p>
      </div>

      <ActionCards counts={counts} />

      <DashboardOrderTable orders={orders} />

      {lowStockArticles.length > 0 && (
        <LowStockAlert articles={lowStockArticles} />
      )}
    </div>
  );
}
