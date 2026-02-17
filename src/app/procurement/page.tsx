export const dynamic = "force-dynamic";

import { ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getProcurementOrders, getSuppliers } from "@/queries/procurement";
import { ProcurementForm } from "@/components/procurement/procurement-form";

export default async function ProcurementPage() {
  const [orders, suppliers] = await Promise.all([
    getProcurementOrders(),
    getSuppliers(),
  ]);

  // Filter to only orders with pending items
  const pendingOrders = orders.filter((o) => o.totalOrdered < o.totalOrderable);
  const doneOrders = orders.filter((o) => o.totalOrdered >= o.totalOrderable);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Beschaffung</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground">
              Keine offenen Bestellungen
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
              Aktuell gibt es keine Aufträge mit offenen Nachbestellungen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ProcurementForm orders={[...pendingOrders, ...doneOrders]} suppliers={suppliers} />
      )}
    </div>
  );
}
