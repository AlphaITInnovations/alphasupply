"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, UserCheck, MapPin, User, Building2, FileText, Smartphone, CardSim, Wrench, ShoppingCart, Check, X, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FreetextResolveDialog } from "./freetext-resolve-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deliveryMethodLabels, mobilfunkTypeLabels, simTypeLabels, mobilfunkTariffLabels } from "@/types/orders";
import { articleCategoryLabels } from "@/types/inventory";
import { MobilfunkDeliveryToggle } from "@/components/orders/mobilfunk-delivery-toggle";
import type { FullOrder } from "./order-tabs";

export function OrderOverviewTab({ order }: { order: FullOrder }) {
  const [resolveItem, setResolveItem] = useState<{ id: string; freeText: string } | null>(null);

  const shippingFormatted = order.deliveryMethod === "SHIPPING"
    ? [order.shippingCompany, order.shippingStreet, [order.shippingZip, order.shippingCity].filter(Boolean).join(" ")].filter(Boolean).join(", ")
    : null;

  // Progress calculations
  const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const pickedItems = order.items.reduce((sum, i) => sum + i.pickedQty, 0);
  const totalMf = order.mobilfunk.length;
  const setupMf = order.mobilfunk.filter((mf) => mf.setupDone).length;
  const orderableItems = order.items.filter((i) => i.needsOrdering);
  const orderedItems = orderableItems.filter((i) => i.orderedAt).length;
  const orderedMf = order.mobilfunk.filter((mf) => mf.ordered).length;
  const receivedItems = orderableItems.filter((i) => i.receivedQty >= i.quantity).length;
  const receivedMf = order.mobilfunk.filter((mf) => mf.received).length;

  return (
    <div className="space-y-6">
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
                    ? shippingFormatted ?? "–"
                    : order.pickupBy ?? "–"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bars */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fortschritt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-blue-500" />
                Techniker
              </span>
              <span className="text-xs text-muted-foreground">
                {pickedItems}/{totalItems} Artikel
                {totalMf > 0 && <>, {setupMf}/{totalMf} Mobilfunk</>}
                {order.techDoneAt && <> &middot; <Check className="inline h-3 w-3 text-emerald-500" /> Abgeschlossen</>}
              </span>
            </div>
            <ProgressBar value={totalItems > 0 ? pickedItems / totalItems : 1} />
          </div>

          {(orderableItems.length > 0 || totalMf > 0) && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5 text-amber-500" />
                  Beschaffung
                </span>
                <span className="text-xs text-muted-foreground">
                  {orderedItems}/{orderableItems.length} Artikel
                  {totalMf > 0 && <>, {orderedMf}/{totalMf} Mobilfunk</>}
                </span>
              </div>
              <ProgressBar value={(orderableItems.length + totalMf) > 0 ? (orderedItems + orderedMf) / (orderableItems.length + totalMf) : 1} />
            </div>
          )}

          {(orderableItems.length > 0 || totalMf > 0) && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-emerald-500" />
                  Wareneingang
                </span>
                <span className="text-xs text-muted-foreground">
                  {receivedItems}/{orderableItems.length} Artikel
                  {totalMf > 0 && <>, {receivedMf}/{totalMf} Mobilfunk</>}
                </span>
              </div>
              <ProgressBar value={(orderableItems.length + totalMf) > 0 ? (receivedItems + receivedMf) / (orderableItems.length + totalMf) : 1} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Versandadresse Detail */}
      {order.deliveryMethod === "SHIPPING" && order.shippingStreet && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-[11px] text-muted-foreground mb-1">Versandadresse</p>
                {order.shippingCompany && (
                  <p className="text-sm font-semibold">{order.shippingCompany}</p>
                )}
                <p className="text-sm">{order.shippingStreet}</p>
                <p className="text-sm">
                  {[order.shippingZip, order.shippingCity].filter(Boolean).join(" ")}
                </p>
              </div>
            </div>
            {order.trackingNumber && (
              <div className="mt-3 text-xs text-muted-foreground">
                Sendungsnr: <span className="font-mono font-semibold">{order.trackingNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Artikelliste */}
      {order.items.length > 0 && (
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
                  <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider text-right">Menge</TableHead>
                  <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider text-center">Entnommen</TableHead>
                  <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider text-center">Bestellt</TableHead>
                  <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider text-center">Empfangen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => {
                  if (!item.article) {
                    return (
                      <TableRow key={item.id} className="border-border/30 bg-amber-50/30 dark:bg-amber-950/10">
                        <TableCell>
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] text-amber-600 hover:text-amber-700"
                            onClick={() => setResolveItem({ id: item.id, freeText: item.freeText || "" })}
                          >
                            <LinkIcon className="mr-1 h-3 w-3" />
                            Zuweisen
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span className="text-sm font-medium">{item.freeText}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                            Freitext
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{item.quantity}</TableCell>
                        <TableCell className="text-center"><X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" /></TableCell>
                        <TableCell className="text-center">
                          {item.orderedAt ? <Check className="h-3.5 w-3.5 text-emerald-500 mx-auto" /> : <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.receivedQty >= item.quantity ? <Check className="h-3.5 w-3.5 text-emerald-500 mx-auto" /> : <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />}
                        </TableCell>
                      </TableRow>
                    );
                  }

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
                      <TableCell className="text-right font-mono text-sm">
                        {item.quantity} {item.article.unit}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.pickedQty >= item.quantity ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                        ) : item.pickedQty > 0 ? (
                          <span className="text-xs font-mono">{item.pickedQty}/{item.quantity}</span>
                        ) : (
                          <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.orderedAt ? (
                          <div className="text-center">
                            <Check className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(item.orderedAt).toLocaleDateString("de-DE")}
                            </span>
                          </div>
                        ) : item.needsOrdering ? (
                          <span className="text-[10px] text-amber-600">ausstehend</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/40">–</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.receivedQty >= item.quantity ? (
                          <div className="text-center">
                            <Check className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                            {item.receivedAt && (
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(item.receivedAt).toLocaleDateString("de-DE")}
                              </span>
                            )}
                          </div>
                        ) : item.needsOrdering ? (
                          <span className="text-[10px] text-muted-foreground/40">ausstehend</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/40">–</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Mobilfunk */}
      {order.mobilfunk.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4" />
              Mobilfunk ({order.mobilfunk.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.mobilfunk.map((mf) => (
              <div
                key={mf.id}
                className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                  mf.setupDone
                    ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20"
                    : "border-violet-200 bg-violet-50/30 dark:border-violet-800 dark:bg-violet-950/20"
                }`}
              >
                <MobilfunkDeliveryToggle id={mf.id} delivered={mf.delivered} />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className={`text-[10px] ${
                        mf.type === "PHONE_AND_SIM"
                          ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800"
                          : mf.type === "PHONE_ONLY"
                            ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                            : "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800"
                      }`}
                      variant="outline"
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
                    {mf.setupDone && (
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" variant="outline">
                        Eingerichtet
                      </Badge>
                    )}
                    {mf.ordered && (
                      <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" variant="outline">
                        Bestellt
                      </Badge>
                    )}
                    {mf.received && (
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" variant="outline">
                        Empfangen
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                    {mf.phoneNote && (
                      <span><span className="font-medium text-foreground">Handy:</span> {mf.phoneNote}</span>
                    )}
                    {mf.simNote && (
                      <span><span className="font-medium text-foreground">SIM:</span> {mf.simNote}</span>
                    )}
                    {mf.imei && (
                      <span><span className="font-medium text-foreground">IMEI:</span> <span className="font-mono">{mf.imei}</span></span>
                    )}
                    {mf.phoneNumber && (
                      <span><span className="font-medium text-foreground">Nr:</span> <span className="font-mono">{mf.phoneNumber}</span></span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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

      {/* Freitext Resolve Dialog */}
      {resolveItem && (
        <FreetextResolveDialog
          open={!!resolveItem}
          onOpenChange={(open) => { if (!open) setResolveItem(null); }}
          orderItemId={resolveItem.id}
          freeText={resolveItem.freeText}
          articles={order.allArticles}
        />
      )}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${
          pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-primary" : "bg-muted"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
