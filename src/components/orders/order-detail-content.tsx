"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  UserCheck,
  Smartphone,
  Wrench,
  ShoppingCart,
  FileText,
  Check,
  User,
  Building2,
  MapPin,
  ExternalLink,
  XCircle,
  CardSim,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StockLight } from "@/components/orders/stock-light";
import {
  orderStatusLabels,
  orderStatusColors,
  deliveryMethodLabels,
  mobilfunkTypeLabels,
  simTypeLabels,
  mobilfunkTariffLabels,
  canCancelOrder,
} from "@/types/orders";
import { articleCategoryLabels } from "@/types/inventory";
import { cancelOrder } from "@/actions/orders";
import { toast } from "sonner";
import type { fetchOrderDetail } from "@/actions/orders";

type OrderDetail = NonNullable<Awaited<ReturnType<typeof fetchOrderDetail>>>;

export function OrderDetailContent({
  order,
  onClose,
}: {
  order: OrderDetail;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const shippingFormatted =
    order.deliveryMethod === "SHIPPING"
      ? [order.shippingCompany, order.shippingStreet, [order.shippingZip, order.shippingCity].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", ")
      : null;

  // Progress
  const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const pickedItems = order.items.reduce((sum, i) => sum + i.pickedQty, 0);
  const totalMf = order.mobilfunk.length;
  const setupMf = order.mobilfunk.filter((mf) => mf.setupDone).length;
  const orderableItems = order.items.filter((i) => i.needsOrdering);
  const orderedItems = orderableItems.filter((i) => i.orderedAt).length;
  const orderedMf = order.mobilfunk.filter((mf) => mf.ordered).length;
  const receivedItems = orderableItems.filter((i) => i.receivedQty >= i.quantity).length;
  const receivedMf = order.mobilfunk.filter((mf) => mf.received).length;

  const showCancel = canCancelOrder(order);

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelOrder(order.id);
      if ("success" in result) {
        toast.success("Auftrag storniert");
        onClose();
        router.refresh();
      } else {
        toast.error(result.error ?? "Fehler");
      }
    });
  }

  return (
    <>
      <DialogHeader className="pb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <DialogTitle className="font-mono text-xl">{order.orderNumber}</DialogTitle>
          <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${orderStatusColors[order.computedStatus]}`}>
            {orderStatusLabels[order.computedStatus]}
          </span>
          <StockLight availability={order.stockAvailability} size="lg" showLabel />
        </div>
        <DialogDescription>
          Erstellt am {new Date(order.createdAt).toLocaleString("de-DE")}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        {/* Info-Grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCell icon={<User className="h-3.5 w-3.5" />} label="Besteller" value={order.orderedBy} />
          <InfoCell icon={<User className="h-3.5 w-3.5" />} label="Empf&auml;nger" value={order.orderedFor} />
          <InfoCell icon={<Building2 className="h-3.5 w-3.5" />} label="Kostenstelle" value={order.costCenter} mono />
          <InfoCell
            icon={order.deliveryMethod === "SHIPPING" ? <Send className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
            label={deliveryMethodLabels[order.deliveryMethod]}
            value={order.deliveryMethod === "SHIPPING" ? shippingFormatted ?? "\u2013" : order.pickupBy ?? "\u2013"}
          />
        </div>

        {/* Versandadresse */}
        {order.deliveryMethod === "SHIPPING" && order.shippingStreet && (
          <div className="rounded-lg border p-3 text-sm space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <MapPin className="h-3 w-3" />
              Versandadresse
            </div>
            {order.shippingCompany && <p className="font-semibold">{order.shippingCompany}</p>}
            <p>{order.shippingStreet}</p>
            <p>{[order.shippingZip, order.shippingCity].filter(Boolean).join(" ")}</p>
            {order.trackingNumber && (
              <p className="text-xs text-muted-foreground mt-2">
                Sendungsnr: <span className="font-mono font-semibold">{order.trackingNumber}</span>
              </p>
            )}
          </div>
        )}

        {/* Fortschritt */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Fortschritt</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <ProgressRow
              icon={<Wrench className="h-3.5 w-3.5 text-blue-500" />}
              label="Techniker"
              detail={
                <>
                  {pickedItems}/{totalItems} Artikel
                  {totalMf > 0 && <>, {setupMf}/{totalMf} Mobilfunk</>}
                  {order.techDoneAt && <> &middot; <Check className="inline h-3 w-3 text-emerald-500" /></>}
                </>
              }
              value={totalItems > 0 ? pickedItems / totalItems : 1}
            />
            {(orderableItems.length > 0 || totalMf > 0) && (
              <ProgressRow
                icon={<ShoppingCart className="h-3.5 w-3.5 text-amber-500" />}
                label="Beschaffung"
                detail={
                  <>
                    {orderedItems}/{orderableItems.length} Artikel
                    {totalMf > 0 && <>, {orderedMf}/{totalMf} Mobilfunk</>}
                  </>
                }
                value={(orderableItems.length + totalMf) > 0 ? (orderedItems + orderedMf) / (orderableItems.length + totalMf) : 1}
              />
            )}
            {(orderableItems.length > 0 || totalMf > 0) && (
              <ProgressRow
                icon={<FileText className="h-3.5 w-3.5 text-emerald-500" />}
                label="Wareneingang"
                detail={
                  <>
                    {receivedItems}/{orderableItems.length} Artikel
                    {totalMf > 0 && <>, {receivedMf}/{totalMf} Mobilfunk</>}
                  </>
                }
                value={(orderableItems.length + totalMf) > 0 ? (receivedItems + receivedMf) / (orderableItems.length + totalMf) : 1}
              />
            )}
          </CardContent>
        </Card>

        {/* Positionen */}
        {order.items.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Positionen ({order.items.length})</h4>
            <div className="space-y-1.5">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-lg border p-2.5 text-sm ${
                    !item.article ? "bg-amber-50/30 dark:bg-amber-950/10" : ""
                  }`}
                >
                  <span
                    className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                      !item.article
                        ? "bg-red-500"
                        : item.article.currentStock >= item.quantity
                          ? "bg-emerald-500"
                          : "bg-red-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-sm">
                      {item.article ? item.article.name : item.freeText}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      {item.article ? (
                        <>
                          <span className="font-mono">{item.article.sku}</span>
                          <Badge variant="secondary" className="text-[9px] px-1 py-0">
                            {articleCategoryLabels[item.article.category]}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-600 border-amber-300">
                          Freitext
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right space-y-0.5">
                    <p className="font-mono text-xs">{item.quantity} {item.article?.unit ?? "Stk"}</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      {item.pickedQty >= item.quantity ? (
                        <span title="Entnommen"><Check className="h-3 w-3 text-emerald-500" /></span>
                      ) : item.pickedQty > 0 ? (
                        <span className="text-[10px] text-blue-500">{item.pickedQty}/{item.quantity}</span>
                      ) : null}
                      {item.orderedAt && <span title="Bestellt"><ShoppingCart className="h-3 w-3 text-amber-500" /></span>}
                      {item.receivedQty >= item.quantity && <span title="Empfangen"><Check className="h-3 w-3 text-violet-500" /></span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobilfunk */}
        {order.mobilfunk.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5" />
              Mobilfunk ({order.mobilfunk.length})
            </h4>
            <div className="space-y-1.5">
              {order.mobilfunk.map((mf) => (
                <div
                  key={mf.id}
                  className={`rounded-lg border p-3 text-sm ${
                    mf.setupDone
                      ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20"
                      : "border-violet-200 bg-violet-50/30 dark:border-violet-800 dark:bg-violet-950/20"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        mf.type === "PHONE_AND_SIM"
                          ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800"
                          : mf.type === "PHONE_ONLY"
                            ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                            : "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800"
                      }`}
                    >
                      {mobilfunkTypeLabels[mf.type]}
                    </Badge>
                    {mf.simType && (
                      <Badge variant="outline" className="text-[10px]">
                        <CardSim className="mr-1 h-2.5 w-2.5" />
                        {simTypeLabels[mf.simType]}
                      </Badge>
                    )}
                    {mf.tariff && (
                      <Badge variant="outline" className="text-[10px]">
                        {mobilfunkTariffLabels[mf.tariff]}
                      </Badge>
                    )}
                    {mf.setupDone && <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">Eingerichtet</Badge>}
                    {mf.ordered && <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">Bestellt</Badge>}
                    {mf.received && <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">Empfangen</Badge>}
                  </div>
                  <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                    {mf.phoneNote && <span><strong>Handy:</strong> {mf.phoneNote}</span>}
                    {mf.simNote && <span><strong>SIM:</strong> {mf.simNote}</span>}
                    {mf.imei && <span><strong>IMEI:</strong> <span className="font-mono">{mf.imei}</span></span>}
                    {mf.phoneNumber && <span><strong>Nr:</strong> <span className="font-mono">{mf.phoneNumber}</span></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notizen */}
        {order.notes && (
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">Notizen</p>
            <p className="text-sm whitespace-pre-line">{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/techniker/${order.id}`}>
              <Wrench className="mr-1.5 h-3.5 w-3.5" />
              Techniker
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/procurement">
              <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
              Beschaffung
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/orders/${order.id}`}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Vollansicht
            </Link>
          </Button>
          {showCancel && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleCancel}
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Stornieren
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function InfoCell({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border p-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={`text-sm font-semibold truncate ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

function ProgressRow({
  icon,
  label,
  detail,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  detail: React.ReactNode;
  value: number;
}) {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-primary" : "bg-muted"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
