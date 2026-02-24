"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Undo2,
  Package,
  FileText,
  LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { articleCategoryLabels } from "@/types/inventory";
import { pickItem, unpickItem } from "@/actions/techniker";
import { toast } from "sonner";
import type { OrderDetailFull } from "./order-detail";
import { FreetextResolveDialog } from "@/components/orders/freetext-resolve-dialog";

const categoryColors: Record<string, string> = {
  HIGH_TIER:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  MID_TIER:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  LOW_TIER:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
};

export function OrderPositions({ order }: { order: OrderDetailFull }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [snSelection, setSnSelection] = useState<Record<string, string>>({});
  const [resolveItem, setResolveItem] = useState<{
    id: string;
    freeText: string;
  } | null>(null);

  const isDone = !!order.techDoneAt;
  const techName = order.technicianName || "";

  function handlePick(item: OrderDetailFull["items"][0]) {
    if (!techName.trim()) {
      toast.error("Bitte zuerst Technikernamen oben eingeben.");
      return;
    }
    startTransition(async () => {
      const result = await pickItem({
        orderItemId: item.id,
        orderId: order.id,
        articleId: item.article!.id,
        quantity: item.quantity,
        serialNumberId:
          item.article!.category === "HIGH_TIER"
            ? snSelection[item.id]
            : undefined,
        technicianName: techName.trim(),
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleUnpick(item: OrderDetailFull["items"][0]) {
    if (!techName.trim()) {
      toast.error("Bitte zuerst Technikernamen eingeben.");
      return;
    }
    startTransition(async () => {
      const linkedSn = item.serialNumbers[0];
      const result = await unpickItem({
        orderItemId: item.id,
        orderId: order.id,
        articleId: item.article!.id,
        quantity: item.pickedQty,
        serialNumberId: linkedSn?.id,
        technicianName: techName.trim(),
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  if (order.items.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Positionen / Kommissionierung ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
                <TableHead className="py-2 w-12 text-center" />
                <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">
                  Artikel
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">
                  Kategorie
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider text-right">
                  Menge
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider text-right">
                  Aktion
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => {
                const isPicked = item.pickedQty >= item.quantity;
                const isFreeText = !item.article;
                const isSerialized = item.article?.category === "HIGH_TIER";
                const availableSNs = item.article?.serialNumbers || [];

                return (
                  <TableRow
                    key={item.id}
                    className={`border-border/30 ${
                      isPicked
                        ? "bg-emerald-50/50 dark:bg-emerald-950/10"
                        : isFreeText
                          ? "bg-amber-50/30 dark:bg-amber-950/10"
                          : ""
                    }`}
                  >
                    {/* Checkbox / status indicator */}
                    <TableCell className="text-center">
                      {isPicked ? (
                        <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${
                            isFreeText
                              ? "bg-amber-500"
                              : item.article &&
                                  item.article.currentStock >= item.quantity
                                ? "bg-emerald-500"
                                : "bg-red-500"
                          }`}
                        />
                      )}
                    </TableCell>

                    {/* Article name */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          {isFreeText && (
                            <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                          <span className="text-sm font-medium">
                            {item.article?.name || item.freeText}
                          </span>
                        </div>
                        {item.article && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {item.article.sku}
                          </span>
                        )}
                        {/* Serial number linked */}
                        {isPicked && item.serialNumbers.length > 0 && (
                          <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                            SN:{" "}
                            {item.serialNumbers
                              .map((sn) => sn.serialNo)
                              .join(", ")}
                          </div>
                        )}
                        {/* SN selection for unpicked serialized */}
                        {isSerialized &&
                          !isPicked &&
                          !isDone &&
                          availableSNs.length > 0 && (
                            <div className="mt-1">
                              <Select
                                value={snSelection[item.id] || ""}
                                onValueChange={(v) =>
                                  setSnSelection((prev) => ({
                                    ...prev,
                                    [item.id]: v,
                                  }))
                                }
                              >
                                <SelectTrigger className="w-56 h-7 text-xs">
                                  <SelectValue placeholder="Seriennummer wählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableSNs.map((sn) => (
                                    <SelectItem
                                      key={sn.id}
                                      value={sn.id}
                                      className="text-xs"
                                    >
                                      {sn.serialNo}{" "}
                                      {sn.isUsed ? "(gebraucht)" : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                      </div>
                    </TableCell>

                    {/* Category badge */}
                    <TableCell>
                      {isFreeText ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700"
                        >
                          Freitext
                        </Badge>
                      ) : item.article ? (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            categoryColors[item.article.category] || ""
                          }`}
                        >
                          {articleCategoryLabels[item.article.category]}
                        </Badge>
                      ) : null}
                    </TableCell>

                    {/* Quantity */}
                    <TableCell className="text-right font-mono text-sm">
                      {item.quantity} {item.article?.unit || "Stk"}
                    </TableCell>

                    {/* Status text */}
                    <TableCell>
                      {isPicked ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          Entnommen
                          {item.pickedBy && ` von ${item.pickedBy}`}
                        </span>
                      ) : isFreeText ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          Nicht zugeordnet
                        </span>
                      ) : item.article &&
                        item.article.currentStock < item.quantity ? (
                        <span className="text-xs text-red-600 dark:text-red-400">
                          Nicht am Lager ({item.article.currentStock}/
                          {item.quantity})
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Ausstehend
                        </span>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      {isFreeText ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-amber-600 hover:text-amber-700"
                          onClick={() =>
                            setResolveItem({
                              id: item.id,
                              freeText: item.freeText || "",
                            })
                          }
                        >
                          <LinkIcon className="mr-1 h-3 w-3" />
                          Zuordnen
                        </Button>
                      ) : !isDone && item.article ? (
                        isPicked ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleUnpick(item)}
                            disabled={isPending}
                          >
                            <Undo2 className="mr-1 h-3 w-3" />
                            Zurück
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handlePick(item)}
                            disabled={
                              isPending ||
                              item.article.currentStock < item.quantity ||
                              (isSerialized && !snSelection[item.id])
                            }
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Entnehmen
                          </Button>
                        )
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Freetext resolve dialog */}
      {resolveItem && (
        <FreetextResolveDialog
          open={!!resolveItem}
          onOpenChange={(open) => {
            if (!open) setResolveItem(null);
          }}
          orderItemId={resolveItem.id}
          freeText={resolveItem.freeText}
          articles={order.allArticles}
        />
      )}
    </>
  );
}
