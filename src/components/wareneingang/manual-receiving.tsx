"use client";

import { useState, useTransition, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  PackagePlus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { receiveGoods } from "@/actions/inventory";
import { articleCategoryLabels } from "@/types/inventory";
import { toast } from "sonner";

type ArticleOption = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
};

const tierBadgeColors: Record<string, string> = {
  HIGH_TIER:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
  MID_TIER:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  LOW_TIER:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export function ManualReceiving({ articles }: { articles: ArticleOption[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<ArticleOption | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [serialNumbers, setSerialNumbers] = useState<
    { serialNo: string; isUsed: boolean }[]
  >([]);
  const [isPending, startTransition] = useTransition();

  const isHighTier = selectedArticle?.category === "HIGH_TIER";

  const filteredArticles = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return articles
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) || a.sku.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [articles, search]);

  function selectArticle(article: ArticleOption) {
    setSelectedArticle(article);
    setSearch("");
    setQuantity(1);
    if (article.category === "HIGH_TIER") {
      setSerialNumbers([{ serialNo: "", isUsed: false }]);
    } else {
      setSerialNumbers([]);
    }
  }

  function handleQuantityChange(newQty: number) {
    const q = Math.max(1, newQty);
    setQuantity(q);
    if (isHighTier) {
      setSerialNumbers(
        Array.from({ length: q }, (_, i) =>
          i < serialNumbers.length
            ? serialNumbers[i]
            : { serialNo: "", isUsed: false }
        )
      );
    }
  }

  function updateSerial(
    index: number,
    field: "serialNo" | "isUsed",
    value: string | boolean
  ) {
    setSerialNumbers((prev) =>
      prev.map((sn, i) => (i === index ? { ...sn, [field]: value } : sn))
    );
  }

  function resetForm() {
    setSelectedArticle(null);
    setSearch("");
    setQuantity(1);
    setReason("");
    setSerialNumbers([]);
  }

  function handleSubmit() {
    if (!selectedArticle) {
      toast.error("Bitte einen Artikel auswaehlen.");
      return;
    }

    if (isHighTier) {
      const emptySerials = serialNumbers.some((sn) => !sn.serialNo.trim());
      if (emptySerials) {
        toast.error("Bitte alle Seriennummern ausfuellen.");
        return;
      }
      const duplicates = serialNumbers.filter(
        (sn, i, arr) =>
          arr.findIndex((s) => s.serialNo.trim() === sn.serialNo.trim()) !== i
      );
      if (duplicates.length > 0) {
        toast.error("Seriennummern muessen eindeutig sein.");
        return;
      }
    }

    startTransition(async () => {
      const result = await receiveGoods({
        articleId: selectedArticle.id,
        quantity,
        reason: reason.trim() || undefined,
        serialNumbers: isHighTier
          ? serialNumbers.map((sn) => ({
              serialNo: sn.serialNo.trim(),
              isUsed: sn.isUsed,
            }))
          : undefined,
      });

      if (result.success) {
        toast.success(
          `${quantity}x ${selectedArticle.name} eingelagert`
        );
        resetForm();
      } else {
        toast.error(result.error ?? "Fehler beim Wareneingang");
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex h-5 w-5 items-center justify-center">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-primary" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <PackagePlus className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Manueller Wareneingang</span>
        <span className="text-xs text-muted-foreground">
          Ware ohne Auftragsbezug einlagern
        </span>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="border-t border-border/30 p-4 space-y-4">
          {/* Article search */}
          {!selectedArticle ? (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Artikel suchen
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Name oder SKU eingeben..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {filteredArticles.length > 0 && (
                <div className="rounded-lg border border-border/50 bg-card divide-y divide-border/30 max-h-60 overflow-y-auto">
                  {filteredArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => selectArticle(article)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {article.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {article.sku}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-md border px-1.5 py-0 text-[9px] font-semibold ${
                          tierBadgeColors[article.category] ?? ""
                        }`}
                      >
                        {articleCategoryLabels[article.category]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {search.trim() && filteredArticles.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Kein Artikel gefunden.
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Selected article display */}
              <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{selectedArticle.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedArticle.sku}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-md border px-1.5 py-0 text-[9px] font-semibold ${
                    tierBadgeColors[selectedArticle.category] ?? ""
                  }`}
                >
                  {articleCategoryLabels[selectedArticle.category]}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="text-xs"
                >
                  Aendern
                </Button>
              </div>

              {/* Quantity */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="manual-qty">Menge</Label>
                  <Input
                    id="manual-qty"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-reason">Grund (optional)</Label>
                  <Input
                    id="manual-reason"
                    placeholder="z.B. Direktkauf, Retoure..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>

              {/* Serial numbers for HIGH_TIER */}
              {isHighTier && (
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
                          placeholder="Seriennummer eingeben..."
                          value={sn.serialNo}
                          onChange={(e) =>
                            updateSerial(index, "serialNo", e.target.value)
                          }
                          className="h-8 text-sm font-mono"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Switch
                            checked={sn.isUsed}
                            onCheckedChange={(checked) =>
                              updateSerial(index, "isUsed", checked)
                            }
                            size="sm"
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

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full"
              >
                {isPending
                  ? "Wird eingelagert..."
                  : `${quantity}x ${selectedArticle.name} einlagern`}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
