"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackagePlus, Plus, Trash2, Recycle, Search } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ArticleForm } from "@/components/inventory/article-form";
import { receiveGoods } from "@/actions/inventory";
import { articleCategoryLabels } from "@/types/inventory";
import { toast } from "sonner";

type Article = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
};

type SerialNumberEntry = {
  key: number;
  serialNo: string;
  isUsed: boolean;
};

export function ManualReceivingDialog({
  articles: initialArticles,
  groupSuggestions,
  nextSku,
}: {
  articles: Article[];
  groupSuggestions?: { groups: string[]; subGroups: string[] };
  nextSku?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [articles] = useState(initialArticles);

  // Form state
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [search, setSearch] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [serialEntries, setSerialEntries] = useState<SerialNumberEntry[]>([]);
  const [showNewArticleDialog, setShowNewArticleDialog] = useState(false);
  const [keyCounter, setKeyCounter] = useState(0);

  const isSerialized = selectedArticle?.category === "HIGH_TIER";

  const filteredArticles = search.trim()
    ? articles.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.sku.toLowerCase().includes(search.toLowerCase())
      )
    : articles;

  function resetForm() {
    setSelectedArticle(null);
    setSearch("");
    setQuantity(1);
    setReason("");
    setPerformedBy("");
    setSerialEntries([]);
  }

  function handleSelectArticle(article: Article) {
    setSelectedArticle(article);
    setSearch("");
    if (article.category === "HIGH_TIER") {
      setQuantity(1);
      setSerialEntries([{ key: keyCounter, serialNo: "", isUsed: false }]);
      setKeyCounter((k) => k + 1);
    } else {
      setSerialEntries([]);
    }
  }

  function handleQuantityChange(newQty: number) {
    setQuantity(newQty);
    if (isSerialized) {
      const entries: SerialNumberEntry[] = [];
      for (let i = 0; i < newQty; i++) {
        entries.push(
          serialEntries[i] ?? {
            key: keyCounter + i,
            serialNo: "",
            isUsed: false,
          }
        );
      }
      setSerialEntries(entries);
      setKeyCounter((k) => k + newQty);
    }
  }

  function updateSerialEntry(index: number, field: "serialNo" | "isUsed", value: string | boolean) {
    setSerialEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  }

  function handleSubmit() {
    if (!selectedArticle) {
      toast.error("Bitte einen Artikel auswählen.");
      return;
    }
    if (quantity < 1) {
      toast.error("Menge muss mindestens 1 sein.");
      return;
    }
    if (isSerialized) {
      const missing = serialEntries.some((e) => !e.serialNo.trim());
      if (missing) {
        toast.error("Bitte alle Seriennummern ausfüllen.");
        return;
      }
      if (serialEntries.length !== quantity) {
        toast.error("Anzahl der Seriennummern stimmt nicht mit der Menge überein.");
        return;
      }
    }

    startTransition(async () => {
      const result = await receiveGoods({
        articleId: selectedArticle.id,
        quantity,
        reason: reason || undefined,
        performedBy: performedBy || undefined,
        serialNumbers: isSerialized
          ? serialEntries.map((e) => ({
              serialNo: e.serialNo,
              isUsed: e.isUsed,
            }))
          : undefined,
      });

      if (result.success) {
        toast.success(`${quantity}x ${selectedArticle.name} eingebucht`);
        resetForm();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Fehler beim Wareneingang.");
      }
    });
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogTrigger asChild>
          <Button>
            <PackagePlus className="mr-2 h-4 w-4" />
            Manueller Wareneingang
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manueller Wareneingang</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Artikel wählen */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Artikel *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowNewArticleDialog(true)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Neuer Artikel
                </Button>
              </div>

              {selectedArticle ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <PackagePlus className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{selectedArticle.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {selectedArticle.sku}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {articleCategoryLabels[selectedArticle.category]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setSelectedArticle(null);
                      setSerialEntries([]);
                    }}
                  >
                    Ändern
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Artikel suchen (Name oder Art.Nr.)..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
                    {filteredArticles.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Kein Artikel gefunden.
                        <Button
                          variant="link"
                          size="sm"
                          className="ml-1"
                          onClick={() => setShowNewArticleDialog(true)}
                        >
                          Neuen anlegen?
                        </Button>
                      </div>
                    ) : (
                      filteredArticles.map((article) => (
                        <button
                          key={article.id}
                          type="button"
                          className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-muted/50 transition-colors"
                          onClick={() => handleSelectArticle(article)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{article.name}</p>
                            <p className="font-mono text-xs text-muted-foreground">{article.sku}</p>
                          </div>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                            {articleCategoryLabels[article.category]}
                          </Badge>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Menge & Details */}
            {selectedArticle && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Menge *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) =>
                        handleQuantityChange(Math.max(1, parseInt(e.target.value) || 1))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Grund</Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="z.B. Nachlieferung"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="performedBy">Durchgeführt von</Label>
                    <Input
                      id="performedBy"
                      value={performedBy}
                      onChange={(e) => setPerformedBy(e.target.value)}
                      placeholder="Name"
                    />
                  </div>
                </div>

                {/* Seriennummern */}
                {isSerialized && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">
                        Seriennummern ({serialEntries.length})
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const newQty = quantity + 1;
                          setQuantity(newQty);
                          setSerialEntries((prev) => [
                            ...prev,
                            { key: keyCounter, serialNo: "", isUsed: false },
                          ]);
                          setKeyCounter((k) => k + 1);
                        }}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Weitere
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {serialEntries.map((entry, idx) => (
                        <div
                          key={entry.key}
                          className="flex items-center gap-2 rounded-lg border bg-muted/20 p-2.5"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary shrink-0">
                            {idx + 1}
                          </span>
                          <Input
                            placeholder="Seriennummer..."
                            value={entry.serialNo}
                            onChange={(e) =>
                              updateSerialEntry(idx, "serialNo", e.target.value)
                            }
                            className="flex-1 font-mono h-8 text-sm"
                          />
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Switch
                              checked={entry.isUsed}
                              onCheckedChange={(checked) =>
                                updateSerialEntry(idx, "isUsed", checked)
                              }
                            />
                            <span
                              className={`text-[11px] font-medium w-[72px] ${
                                entry.isUsed
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {entry.isUsed ? (
                                <span className="inline-flex items-center gap-1">
                                  <Recycle className="h-3 w-3" />
                                  Gebraucht
                                </span>
                              ) : (
                                "Neu"
                              )}
                            </span>
                          </div>
                          {serialEntries.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                setSerialEntries((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                );
                                setQuantity((q) => Math.max(1, q - 1));
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isPending}
                >
                  <PackagePlus className="mr-2 h-4 w-4" />
                  {isPending
                    ? "Wird eingebucht..."
                    : `${quantity}x ${selectedArticle.name} einbuchen`}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested dialog: Neuer Artikel */}
      <Dialog open={showNewArticleDialog} onOpenChange={setShowNewArticleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neuen Artikel anlegen</DialogTitle>
          </DialogHeader>
          <ArticleForm
            onSuccess={() => {
              setShowNewArticleDialog(false);
              router.refresh();
            }}
            groupSuggestions={groupSuggestions}
            nextSku={nextSku}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
