"use client";

import { Fragment, useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Hash,
  Search,
  Package,
  Plus,
  PackageCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  articleCategoryLabels,
  serialNumberStatusLabels,
} from "@/types/inventory";
import { receiveGoods, quickCreateArticle } from "@/actions/inventory";
import { toast } from "sonner";

type SerialNumberInfo = {
  id: string;
  serialNo: string;
  status: string;
};

type StockArticle = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  currentStock: number;
  incomingStock: number;
  minStockLevel: number;
  serialNumbers: SerialNumberInfo[];
};

type ArticleOption = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
};

type SortKey = "name" | "currentStock" | "category";
type SortDir = "asc" | "desc";

const tierBadgeColors: Record<string, string> = {
  HIGH_TIER:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
  MID_TIER:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  LOW_TIER:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

const snStatusDotColors: Record<string, string> = {
  IN_STOCK: "bg-emerald-500 shadow-[0_0_4px_theme(colors.emerald.500)]",
  RESERVED: "bg-blue-500 shadow-[0_0_4px_theme(colors.blue.500)]",
  DEPLOYED: "bg-gray-400",
  DEFECTIVE: "bg-red-500 shadow-[0_0_4px_theme(colors.red.500)]",
  RETURNED: "bg-amber-500 shadow-[0_0_4px_theme(colors.amber.500)]",
  DISPOSED: "bg-slate-400",
};

export function StockOverview({
  articles,
  allArticles,
}: {
  articles: StockArticle[];
  allArticles: ArticleOption[];
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleExpand(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const filtered = useMemo(() => {
    let result = articles;

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.sku.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name, "de");
          break;
        case "currentStock":
          cmp = a.currentStock - b.currentStock;
          break;
        case "category":
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [articles, search, sortKey, sortDir]);

  const totalStock = filtered.reduce((sum, a) => sum + a.currentStock, 0);

  const SortHeader = ({
    label,
    sortKeyName,
    className,
  }: {
    label: string;
    sortKeyName: SortKey;
    className?: string;
  }) => {
    const isCurrentSort = sortKey === sortKeyName;
    return (
      <button
        onClick={() => toggleSort(sortKeyName)}
        className={`group/sort flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-foreground ${className ?? ""}`}
      >
        {label}
        {isCurrentSort ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowDown className="h-3 w-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover/sort:opacity-50 transition-opacity" />
        )}
      </button>
    );
  };

  function stockColor(current: number, min: number): string {
    if (min === 0) return "";
    if (current > min) return "text-emerald-600 dark:text-emerald-400";
    if (current === min) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  }

  return (
    <div className="space-y-4">
      {/* Search + Manual Stock-In */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Artikel suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ManualStockInDialog allArticles={allArticles} />
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{filtered.length}</span> Artikel
        </span>
        <span>
          <span className="font-semibold text-foreground">{totalStock}</span> Einheiten gesamt
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-10" />
              <TableHead className="py-3">
                <SortHeader label="Artikel" sortKeyName="name" />
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">
                SKU
              </TableHead>
              <TableHead className="py-3">
                <SortHeader label="Tier" sortKeyName="category" />
              </TableHead>
              <TableHead className="py-3 text-right">
                <SortHeader
                  label="Bestand"
                  sortKeyName="currentStock"
                  className="justify-end"
                />
              </TableHead>
              <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider">
                Im Zulauf
              </TableHead>
              <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider">
                Min-Bestand
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm font-medium">
                      Keine Artikel gefunden
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Passen Sie die Suche an.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((article) => {
                const hasSerialnumbers =
                  article.category === "HIGH_TIER" &&
                  article.serialNumbers.length > 0;
                const isExpanded = expandedRows.has(article.id);
                const stockStatus = getStockStatus(
                  article.currentStock,
                  article.minStockLevel
                );

                return (
                  <Fragment key={article.id}>
                    <TableRow
                      className={`border-border/30 transition-colors duration-150 ${
                        hasSerialnumbers ? "cursor-pointer" : ""
                      } ${isExpanded ? "bg-muted/20" : ""}`}
                      onClick={
                        hasSerialnumbers
                          ? () => toggleExpand(article.id)
                          : undefined
                      }
                    >
                      {/* Expand chevron */}
                      <TableCell className="w-10 px-3">
                        {hasSerialnumbers && (
                          <div className="flex h-5 w-5 items-center justify-center rounded">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-primary" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Artikel name */}
                      <TableCell>
                        <Link
                          href={`/artikelverwaltung/${article.id}`}
                          className="text-sm font-medium hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {article.name}
                        </Link>
                      </TableCell>

                      {/* SKU */}
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {article.sku}
                        </span>
                      </TableCell>

                      {/* Tier Badge */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${tierBadgeColors[article.category] ?? ""}`}
                        >
                          {articleCategoryLabels[article.category]}
                        </span>
                      </TableCell>

                      {/* Bestand */}
                      <TableCell className="text-right">
                        <span
                          className={`text-sm font-bold tabular-nums ${stockColor(article.currentStock, article.minStockLevel)}`}
                        >
                          {article.currentStock}
                          <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                            {article.unit}
                          </span>
                        </span>
                      </TableCell>

                      {/* Im Zulauf */}
                      <TableCell className="text-right">
                        {article.incomingStock > 0 ? (
                          <span className="text-sm font-medium tabular-nums text-amber-500">
                            +{article.incomingStock}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/40 tabular-nums">
                            &ndash;
                          </span>
                        )}
                      </TableCell>

                      {/* Min-Bestand */}
                      <TableCell className="text-right">
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {article.minStockLevel > 0
                            ? article.minStockLevel
                            : "\u2013"}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${stockStatus.className}`}
                        >
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                    </TableRow>

                    {/* Expanded serial numbers */}
                    {hasSerialnumbers && isExpanded && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20 border-border/30">
                        <TableCell />
                        <TableCell colSpan={7} className="py-3 pr-6">
                          <div className="space-y-2.5">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                              <Hash className="h-3 w-3" />
                              Seriennummern ({article.serialNumbers.length})
                            </p>
                            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                              {article.serialNumbers.map((sn) => (
                                <div
                                  key={sn.id}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-card px-3 py-2 transition-colors hover:border-border"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`h-1.5 w-1.5 rounded-full ${snStatusDotColors[sn.status] ?? "bg-gray-400"}`}
                                    />
                                    <span className="font-mono text-xs font-medium">
                                      {sn.serialNo}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    {serialNumberStatusLabels[sn.status]}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** Manual stock-in dialog for adding stock without an order */
function ManualStockInDialog({
  allArticles: initialArticles,
}: {
  allArticles: ArticleOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [serialNumbers, setSerialNumbers] = useState<
    { serialNo: string; isUsed: boolean }[]
  >([]);

  // Inline article creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>("MID_TIER");
  const [newUnit, setNewUnit] = useState("Stk");
  const [newMinStock, setNewMinStock] = useState(0);
  const [localArticles, setLocalArticles] = useState<ArticleOption[]>(initialArticles);

  const allArticles = localArticles;
  const selectedArticle = allArticles.find((a) => a.id === selectedArticleId);
  const isHighTier = selectedArticle?.category === "HIGH_TIER";

  function handleArticleChange(articleId: string) {
    setSelectedArticleId(articleId);
    const article = allArticles.find((a) => a.id === articleId);
    if (article?.category === "HIGH_TIER") {
      setSerialNumbers(
        Array.from({ length: quantity }, () => ({ serialNo: "", isUsed: false }))
      );
    } else {
      setSerialNumbers([]);
    }
  }

  function handleQuantityChange(qty: number) {
    const newQty = Math.max(1, qty);
    setQuantity(newQty);
    if (isHighTier) {
      setSerialNumbers(
        Array.from({ length: newQty }, (_, i) => serialNumbers[i] || { serialNo: "", isUsed: false })
      );
    }
  }

  function resetForm() {
    setSelectedArticleId("");
    setQuantity(1);
    setSerialNumbers([]);
    setShowCreateForm(false);
    setNewName("");
    setNewCategory("MID_TIER");
    setNewUnit("Stk");
    setNewMinStock(0);
    setLocalArticles(initialArticles);
  }

  function handleCreateArticle() {
    if (!newName.trim()) {
      toast.error("Bitte Artikelname eingeben.");
      return;
    }
    startTransition(async () => {
      const result = await quickCreateArticle({
        name: newName.trim(),
        category: newCategory as "HIGH_TIER" | "MID_TIER" | "LOW_TIER",
        unit: newUnit || "Stk",
        minStockLevel: newMinStock,
      });
      if (result.success) {
        toast.success(`Artikel "${result.article.name}" angelegt (${result.article.sku})`);
        const newArt: ArticleOption = {
          id: result.article.id,
          name: result.article.name,
          sku: result.article.sku,
          category: result.article.category,
          unit: result.article.unit,
        };
        setLocalArticles((prev) => [...prev, newArt].sort((a, b) => a.name.localeCompare(b.name, "de")));
        setSelectedArticleId(result.article.id);
        setShowCreateForm(false);
        setNewName("");
        setNewCategory("MID_TIER");
        // Set up serial numbers if HIGH_TIER
        if (result.article.category === "HIGH_TIER") {
          setSerialNumbers(
            Array.from({ length: quantity }, () => ({ serialNo: "", isUsed: false }))
          );
        } else {
          setSerialNumbers([]);
        }
      } else {
        toast.error(result.error ?? "Fehler beim Anlegen.");
      }
    });
  }

  function handleSubmit() {
    if (!selectedArticleId) {
      toast.error("Bitte Artikel auswählen.");
      return;
    }
    if (isHighTier && serialNumbers.some((sn) => !sn.serialNo.trim())) {
      toast.error("Bitte alle Seriennummern ausfüllen.");
      return;
    }

    startTransition(async () => {
      const result = await receiveGoods({
        articleId: selectedArticleId,
        quantity,
        reason: "Manueller Wareneingang",
        serialNumbers: isHighTier ? serialNumbers : undefined,
      });
      if (result.success) {
        toast.success(`${selectedArticle?.name} eingebucht (${quantity} ${selectedArticle?.unit || "Stk"})`);
        setOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast.error(result.error ?? "Fehler beim Einbuchen.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Manuell einbuchen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4" />
            Manueller Wareneingang
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Article selection */}
          <div>
            <Label className="text-xs">Artikel *</Label>
            <Select value={selectedArticleId || undefined} onValueChange={handleArticleChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Artikel auswählen..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {allArticles.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="text-sm">
                    <span className="font-mono text-[10px] text-muted-foreground mr-2">
                      {a.sku}
                    </span>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Inline: Create new article */}
          {!showCreateForm ? (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="text-xs text-primary hover:underline"
            >
              + Neuen Artikel anlegen
            </button>
          ) : (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
              <p className="text-xs font-semibold text-primary">Neuen Artikel anlegen</p>
              <div>
                <Label className="text-xs">Name *</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Artikelbezeichnung..."
                  className="mt-1 h-8 text-sm"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <Label className="text-xs">Kategorie *</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(articleCategoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="text-sm">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Einheit</Label>
                  <Input
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Min-Bestand</Label>
                  <Input
                    type="number"
                    min={0}
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(parseInt(e.target.value) || 0)}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateArticle}
                  disabled={isPending || !newName.trim()}
                >
                  {isPending ? "Wird angelegt..." : "Anlegen"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewName("");
                    setNewCategory("MID_TIER");
                    setNewUnit("Stk");
                    setNewMinStock(0);
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <Label className="text-xs">Menge *</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="mt-1 w-24"
            />
          </div>

          {/* Serial numbers for HIGH_TIER */}
          {isHighTier && serialNumbers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Seriennummern
              </Label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {serialNumbers.map((sn, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-3 py-2"
                  >
                    <span className="text-xs text-muted-foreground tabular-nums w-5 shrink-0">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder="Seriennummer..."
                      value={sn.serialNo}
                      onChange={(e) => {
                        const updated = [...serialNumbers];
                        updated[index] = { ...updated[index], serialNo: e.target.value };
                        setSerialNumbers(updated);
                      }}
                      className="h-8 text-sm font-mono"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Switch
                        checked={sn.isUsed}
                        onCheckedChange={(checked) => {
                          const updated = [...serialNumbers];
                          updated[index] = { ...updated[index], isUsed: checked };
                          setSerialNumbers(updated);
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground w-12">
                        {sn.isUsed ? "Gebraucht" : "Neu"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isPending || !selectedArticleId}
            className="w-full"
          >
            {isPending ? "Wird eingebucht..." : "Einbuchen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getStockStatus(
  current: number,
  min: number
): { label: string; className: string } {
  if (min === 0) {
    return {
      label: "OK",
      className:
        "border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300",
    };
  }
  if (current > min) {
    return {
      label: "OK",
      className:
        "border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300",
    };
  }
  if (current === min) {
    return {
      label: "Knapp",
      className:
        "border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300",
    };
  }
  return {
    label: "Niedrig",
    className:
      "border-red-200 text-red-700 dark:border-red-800 dark:text-red-300",
  };
}
