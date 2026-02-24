"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Star,
  Plus,
  ArrowLeft,
  Package,
  Truck,
  Hash,
  History,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  articleCategoryLabels,
  serialNumberStatusLabels,
  stockMovementTypeLabels,
} from "@/types/inventory";
import { updateArticle, createSerialNumber } from "@/actions/inventory";
import { toast } from "sonner";

// ---- Types ----

type SerialNumber = {
  id: string;
  serialNo: string;
  status: string;
  isUsed: boolean;
  notes: string | null;
};

type ArticleSupplier = {
  id: string;
  supplierSku: string | null;
  unitPrice: number;
  currency: string;
  leadTimeDays: number | null;
  minOrderQty: number;
  isPreferred: boolean;
  supplier: {
    id: string;
    name: string;
  };
};

type StockMovement = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  performedBy: string | null;
  createdAt: string;
};

type Article = {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  category: string;
  productGroup: string | null;
  productSubGroup: string | null;
  avgPurchasePrice: number | null;
  unit: string;
  minStockLevel: number;
  currentStock: number;
  incomingStock: number;
  isActive: boolean;
  notes: string | null;
  serialNumbers: SerialNumber[];
  articleSuppliers: ArticleSupplier[];
  stockMovements: StockMovement[];
};

type GroupSuggestions = {
  groups: string[];
  subGroups: string[];
};

// ---- Color maps ----

const tierBadgeColors: Record<string, string> = {
  HIGH_TIER:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
  MID_TIER:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  LOW_TIER:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

const snStatusBadgeColors: Record<string, string> = {
  IN_STOCK:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  RESERVED:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  DEPLOYED:
    "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  DEFECTIVE:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  RETURNED:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  DISPOSED:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

const movementTypeBadgeColors: Record<string, string> = {
  IN: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  OUT: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  ADJUSTMENT:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
};

// ---- Component ----

export function ArticleDetail({
  article,
  groupSuggestions,
}: {
  article: Article;
  groupSuggestions: GroupSuggestions;
}) {
  const isHighTier = article.category === "HIGH_TIER";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/artikelverwaltung"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zur Artikelverwaltung
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {article.name}
            </h1>
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${tierBadgeColors[article.category] ?? ""}`}
            >
              {articleCategoryLabels[article.category]}
            </span>
            {!article.isActive && (
              <Badge variant="destructive" className="text-[10px]">
                Inaktiv
              </Badge>
            )}
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {article.sku}
          </p>
        </div>
      </div>

      {/* Stammdaten */}
      <StammdatenCard article={article} groupSuggestions={groupSuggestions} />

      {/* Lieferanten */}
      {article.articleSuppliers.length > 0 && (
        <LieferantenCard suppliers={article.articleSuppliers} />
      )}

      {/* Seriennummern (HIGH_TIER only) */}
      {isHighTier && (
        <SeriennummernCard
          serialNumbers={article.serialNumbers}
          articleId={article.id}
        />
      )}

      {/* Bewegungshistorie */}
      <BewegungshistorieCard movements={article.stockMovements} />
    </div>
  );
}

// ---- Stammdaten Card ----

function StammdatenCard({
  article,
  groupSuggestions,
}: {
  article: Article;
  groupSuggestions: GroupSuggestions;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("id", article.id);
      return updateArticle(formData);
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Artikel aktualisiert");
      setEditOpen(false);
      router.refresh();
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  const fields: { label: string; value: string | number | null }[] = [
    { label: "Name", value: article.name },
    { label: "SKU", value: article.sku },
    {
      label: "Tier-Kategorie",
      value: articleCategoryLabels[article.category] ?? article.category,
    },
    { label: "Produktgruppe", value: article.productGroup },
    { label: "Untergruppe", value: article.productSubGroup },
    {
      label: "EK-Preis netto",
      value:
        article.avgPurchasePrice != null
          ? `${article.avgPurchasePrice.toFixed(2)} \u20AC`
          : null,
    },
    { label: "Einheit", value: article.unit },
    { label: "Mindestbestand", value: article.minStockLevel },
    { label: "Bestand", value: article.currentStock },
    { label: "Im Zulauf", value: article.incomingStock },
    { label: "Beschreibung", value: article.description },
    { label: "Notizen", value: article.notes },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Stammdaten
          </CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Bearbeiten
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <div key={field.label} className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {field.label}
                </p>
                <p className="text-sm">
                  {field.value != null && field.value !== ""
                    ? String(field.value)
                    : "\u2013"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Artikel bearbeiten</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={article.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sku">Artikelnummer</Label>
                <Input
                  id="edit-sku"
                  name="sku"
                  defaultValue={article.sku}
                  required
                  readOnly
                  className="bg-muted/50 font-mono"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Kategorie *</Label>
                <Select name="category" defaultValue={article.category}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(articleCategoryLabels).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Einheit</Label>
                <Input
                  id="edit-unit"
                  name="unit"
                  defaultValue={article.unit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-minStockLevel">Mindestbestand</Label>
                <Input
                  id="edit-minStockLevel"
                  name="minStockLevel"
                  type="number"
                  min={0}
                  defaultValue={article.minStockLevel}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-productGroup">Produktgruppe</Label>
                <Input
                  id="edit-productGroup"
                  name="productGroup"
                  defaultValue={article.productGroup ?? ""}
                  placeholder="z.B. Notebook, Monitor, Drucker"
                  list="edit-productGroup-suggestions"
                />
                {groupSuggestions.groups.length > 0 && (
                  <datalist id="edit-productGroup-suggestions">
                    {groupSuggestions.groups.map((g) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-productSubGroup">Unterkategorie</Label>
                <Input
                  id="edit-productSubGroup"
                  name="productSubGroup"
                  defaultValue={article.productSubGroup ?? ""}
                  placeholder="z.B. 14 Zoll, Bluetooth, USB-C"
                  list="edit-productSubGroup-suggestions"
                />
                {groupSuggestions.subGroups.length > 0 && (
                  <datalist id="edit-productSubGroup-suggestions">
                    {groupSuggestions.subGroups.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-avgPurchasePrice">
                Durchschn. Einkaufspreis (netto)
              </Label>
              <div className="relative">
                <Input
                  id="edit-avgPurchasePrice"
                  name="avgPurchasePrice"
                  type="number"
                  min={0}
                  step={0.01}
                  defaultValue={
                    article.avgPurchasePrice != null
                      ? article.avgPurchasePrice
                      : ""
                  }
                  placeholder="0.00"
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  EUR
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Beschreibung</Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={article.description ?? ""}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notizen</Label>
              <Textarea
                id="edit-notes"
                name="notes"
                defaultValue={article.notes ?? ""}
                rows={2}
              />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Speichern..." : "Aktualisieren"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---- Lieferanten Card ----

function LieferantenCard({
  suppliers,
}: {
  suppliers: ArticleSupplier[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Lieferanten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
                <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">
                  Lieferant
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">
                  Lieferanten-SKU
                </TableHead>
                <TableHead className="py-2 text-right text-xs font-semibold uppercase tracking-wider">
                  Einzelpreis
                </TableHead>
                <TableHead className="py-2 text-right text-xs font-semibold uppercase tracking-wider">
                  Lieferzeit
                </TableHead>
                <TableHead className="py-2 text-right text-xs font-semibold uppercase tracking-wider">
                  Min-Menge
                </TableHead>
                <TableHead className="py-2 text-center text-xs font-semibold uppercase tracking-wider">
                  Bevorzugt
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((as) => (
                <TableRow key={as.id} className="border-border/30">
                  <TableCell className="text-sm font-medium">
                    {as.supplier.name}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {as.supplierSku || "\u2013"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {as.unitPrice.toFixed(2)} {as.currency}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {as.leadTimeDays != null
                      ? `${as.leadTimeDays} Tage`
                      : "\u2013"}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {as.minOrderQty}
                  </TableCell>
                  <TableCell className="text-center">
                    {as.isPreferred && (
                      <Star className="mx-auto h-4 w-4 fill-amber-400 text-amber-400" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Seriennummern Card ----

function SeriennummernCard({
  serialNumbers,
  articleId,
}: {
  serialNumbers: SerialNumber[];
  articleId: string;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("articleId", articleId);
      return createSerialNumber(formData);
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Seriennummer erfasst");
      setAddOpen(false);
      router.refresh();
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Seriennummern
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {serialNumbers.length}
            </Badge>
          </CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              Seriennummer hinzufuegen
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {serialNumbers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine Seriennummern vorhanden.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">
                      Seriennummer
                    </TableHead>
                    <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="py-2 text-center text-xs font-semibold uppercase tracking-wider">
                      Gebraucht
                    </TableHead>
                    <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">
                      Notizen
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serialNumbers.map((sn) => (
                    <TableRow key={sn.id} className="border-border/30">
                      <TableCell>
                        <span className="font-mono text-xs font-medium">
                          {sn.serialNo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${snStatusBadgeColors[sn.status] ?? ""}`}
                        >
                          {serialNumberStatusLabels[sn.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {sn.isUsed ? "Ja" : "Nein"}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {sn.notes || "\u2013"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Serial Number Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seriennummer erfassen</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-serialNo">Seriennummer *</Label>
              <Input id="add-serialNo" name="serialNo" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-notes">Notizen</Label>
              <Input id="add-notes" name="notes" />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Wird gespeichert..." : "Seriennummer speichern"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---- Bewegungshistorie Card ----

function BewegungshistorieCard({
  movements,
}: {
  movements: StockMovement[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Bewegungshistorie
          <Badge variant="secondary" className="ml-1 text-[10px]">
            Letzte {movements.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine Lagerbewegungen vorhanden.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
                  <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">
                    Datum
                  </TableHead>
                  <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">
                    Typ
                  </TableHead>
                  <TableHead className="py-2 text-right text-xs font-semibold uppercase tracking-wider">
                    Menge
                  </TableHead>
                  <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">
                    Grund
                  </TableHead>
                  <TableHead className="py-2 text-xs font-semibold uppercase tracking-wider">
                    Durch
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id} className="border-border/30">
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {formatDate(m.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${movementTypeBadgeColors[m.type] ?? ""}`}
                      >
                        {stockMovementTypeLabels[m.type] ?? m.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {m.reason || "\u2013"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {m.performedBy || "\u2013"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Helpers ----

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
