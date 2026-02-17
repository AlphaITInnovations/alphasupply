export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, UserCheck, MapPin, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrderById } from "@/queries/orders";
import { orderStatusLabels, orderStatusColors, deliveryMethodLabels } from "@/types/orders";
import { articleCategoryLabels } from "@/types/inventory";
import { StockLight } from "@/components/orders/stock-light";
import { OrderStatusActions } from "@/components/orders/order-status-actions";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/orders">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
            <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${orderStatusColors[order.status]}`}>
              {orderStatusLabels[order.status]}
            </span>
            <StockLight availability={order.stockAvailability} size="lg" showLabel />
          </div>
          <p className="ml-10 text-sm text-muted-foreground">
            Erstellt am {new Date(order.createdAt).toLocaleString("de-DE")}
          </p>
        </div>
        <OrderStatusActions orderId={order.id} currentStatus={order.status} />
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Besteller</p>
                <p className="text-sm font-semibold">{order.orderedBy}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Empfänger</p>
                <p className="text-sm font-semibold">{order.orderedFor}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Kostenstelle</p>
                <p className="text-sm font-semibold font-mono">{order.costCenter}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                {order.deliveryMethod === "SHIPPING" ? (
                  <Send className="h-4 w-4 text-primary" />
                ) : (
                  <UserCheck className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">
                  {deliveryMethodLabels[order.deliveryMethod]}
                </p>
                <p className="text-sm font-semibold">
                  {order.deliveryMethod === "SHIPPING"
                    ? order.shippingAddress ?? "–"
                    : order.pickupBy ?? "–"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Versandadresse (nur bei Versand, wenn lang) */}
      {order.deliveryMethod === "SHIPPING" && order.shippingAddress && order.shippingAddress.length > 30 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Versandadresse</p>
                <p className="text-sm whitespace-pre-line">{order.shippingAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Artikelliste */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Bestellpositionen ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
                <TableHead className="py-2 w-10" />
                <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">Art.Nr.</TableHead>
                <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">Artikel</TableHead>
                <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">Kategorie</TableHead>
                <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider text-right">Bestellt</TableHead>
                <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider text-right">Am Lager</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => {
                const inStock = item.article.currentStock >= item.quantity;
                return (
                  <TableRow key={item.id} className="border-border/30">
                    <TableCell>
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          inStock ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/inventory/${item.article.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {item.article.sku}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {item.article.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {articleCategoryLabels[item.article.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {item.quantity} {item.article.unit}
                    </TableCell>
                    <TableCell className={`text-right font-mono text-sm ${inStock ? "text-emerald-600" : "text-red-600 font-semibold"}`}>
                      {item.article.currentStock} {item.article.unit}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notizen */}
      {order.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notizen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {order.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
