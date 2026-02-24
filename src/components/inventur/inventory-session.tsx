"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  X,
  Euro,
  Package,
  AlertTriangle,
  ClipboardCheck,
  SkipForward,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  checkInventoryItem,
  applyInventoryCorrections,
  completeInventoryWithoutCorrections,
  cancelInventory,
} from "@/actions/inventur";
import { articleCategoryLabels } from "@/types/inventory";
import { toast } from "sonner";

type InventoryItemData = {
  id: string;
  articleId: string;
  expectedQty: number;
  countedQty: number | null;
  difference: number | null;
  checked: boolean;
  checkedBy: string | null;
  checkedAt: string | null;
  notes: string | null;
  article: {
    id: string;
    name: string;
    sku: string;
    category: string;
    unit: string;
    currentStock: number;
    avgPurchasePrice: number;
  };
};

type InventoryData = {
  id: string;
  name: string;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  startedBy: string;
  completedAt: string | null;
  createdAt: string;
  notes: string | null;
  items: InventoryItemData[];
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

const categoryBadgeColors: Record<string, string> = {
  HIGH_TIER: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  MID_TIER: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  LOW_TIER: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
};

export function InventorySession({ inventory }: { inventory: InventoryData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"guided" | "list">(
    inventory.status === "IN_PROGRESS" ? "guided" : "list"
  );
  const [checkerName, setCheckerName] = useState("");

  // Find first unchecked item for guided mode
  const uncheckedItems = inventory.items.filter((i) => !i.checked);
  const checkedItems = inventory.items.filter((i) => i.checked);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = inventory.items.findIndex((i) => !i.checked);
    return idx >= 0 ? idx : 0;
  });

  const progress =
    inventory.items.length > 0
      ? Math.round((checkedItems.length / inventory.items.length) * 100)
      : 0;

  const deviations = checkedItems.filter(
    (i) => i.difference !== null && i.difference !== 0
  );

  // Total value of inventory
  const totalExpectedValue = inventory.items.reduce(
    (sum, i) => sum + i.expectedQty * i.article.avgPurchasePrice,
    0
  );
  const totalCountedValue = checkedItems.reduce(
    (sum, i) =>
      sum + (i.countedQty ?? i.expectedQty) * i.article.avgPurchasePrice,
    0
  );

  const isComplete = inventory.status !== "IN_PROGRESS";
  const allChecked = uncheckedItems.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/inventur">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {inventory.name}
              </h1>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  inventory.status === "IN_PROGRESS"
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                    : inventory.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
                }`}
              >
                {inventory.status === "IN_PROGRESS"
                  ? "Laufend"
                  : inventory.status === "COMPLETED"
                    ? "Abgeschlossen"
                    : "Abgebrochen"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Gestartet von {inventory.startedBy} am{" "}
              {new Date(inventory.createdAt).toLocaleDateString("de-DE")}
            </p>
          </div>
        </div>

        {!isComplete && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setViewMode(viewMode === "guided" ? "list" : "guided")
              }
            >
              {viewMode === "guided" ? "Listenansicht" : "Geführte Inventur"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600">
                  <X className="mr-1 h-3.5 w-3.5" />
                  Abbrechen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Inventur abbrechen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Die laufende Inventur wird abgebrochen. Bereits geprüfte
                    Positionen bleiben erhalten, aber es werden keine Korrekturen
                    angewendet.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Zurück</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      startTransition(async () => {
                        const result = await cancelInventory(inventory.id);
                        if (result.error) toast.error(result.error);
                        else {
                          toast.success("Inventur abgebrochen.");
                          router.push("/inventur");
                        }
                      });
                    }}
                  >
                    Abbrechen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Progress + Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Fortschritt</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {checkedItems.length} / {inventory.items.length} geprüft
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Soll-Wert</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(totalExpectedValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Ist-Wert (geprüft)</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(totalCountedValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${deviations.length > 0 ? "text-amber-500" : "text-emerald-500"}`} />
              <div>
                <p className="text-xs text-muted-foreground">Abweichungen</p>
                <p className="text-sm font-semibold">{deviations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checker Name */}
      {!isComplete && (
        <div className="flex items-center gap-3">
          <Label className="text-sm whitespace-nowrap">Prüfer:</Label>
          <Input
            value={checkerName}
            onChange={(e) => setCheckerName(e.target.value)}
            placeholder="Ihr Name"
            className="max-w-xs"
          />
        </div>
      )}

      {/* Main Content */}
      {viewMode === "guided" && !isComplete ? (
        <GuidedView
          items={inventory.items}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          checkerName={checkerName}
          isPending={isPending}
          startTransition={startTransition}
          router={router}
        />
      ) : (
        <ListView
          items={inventory.items}
          isComplete={isComplete}
          checkerName={checkerName}
          isPending={isPending}
          startTransition={startTransition}
        />
      )}

      {/* Finish Actions */}
      {!isComplete && allChecked && (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <div>
                <p className="text-lg font-semibold">
                  Alle Positionen geprüft!
                </p>
                <p className="text-sm text-muted-foreground">
                  {deviations.length > 0
                    ? `${deviations.length} Abweichung(en) gefunden. Korrekturen anwenden?`
                    : "Keine Abweichungen festgestellt."}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {deviations.length > 0 && (
                  <Button
                    onClick={() => {
                      startTransition(async () => {
                        const result = await applyInventoryCorrections(
                          inventory.id,
                          checkerName || inventory.startedBy
                        );
                        if (result.error) toast.error(result.error);
                        else {
                          toast.success(
                            "Korrekturen angewendet und Inventur abgeschlossen."
                          );
                          router.refresh();
                        }
                      });
                    }}
                    disabled={isPending}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Korrekturen anwenden & Abschließen
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    startTransition(async () => {
                      const result =
                        await completeInventoryWithoutCorrections(inventory.id);
                      if (result.error) toast.error(result.error);
                      else {
                        toast.success("Inventur abgeschlossen.");
                        router.refresh();
                      }
                    });
                  }}
                  disabled={isPending}
                >
                  Ohne Korrekturen abschließen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GuidedView({
  items,
  currentIndex,
  setCurrentIndex,
  checkerName,
  isPending,
  startTransition,
  router,
}: {
  items: InventoryItemData[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  checkerName: string;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  router: ReturnType<typeof useRouter>;
}) {
  const [countInput, setCountInput] = useState("");
  const [noteInput, setNoteInput] = useState("");

  const item = items[currentIndex];
  if (!item) return null;

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < items.length - 1;

  function handleConfirm() {
    if (!checkerName.trim()) {
      toast.error("Bitte zuerst Ihren Namen als Prüfer eingeben.");
      return;
    }
    const qty = countInput === "" ? item.expectedQty : parseInt(countInput, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error("Bitte eine gültige Menge eingeben.");
      return;
    }

    startTransition(async () => {
      const result = await checkInventoryItem({
        inventoryItemId: item.id,
        countedQty: qty,
        checkedBy: checkerName.trim(),
        notes: noteInput.trim() || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        const diff = result.difference;
        if (diff && diff !== 0) {
          toast.info(
            `Abweichung: ${diff > 0 ? "+" : ""}${diff} ${item.article.unit}`
          );
        } else {
          toast.success("OK - Bestand stimmt überein.");
        }
        setCountInput("");
        setNoteInput("");
        // Move to next unchecked
        const nextUnchecked = items.findIndex(
          (i, idx) => idx > currentIndex && !i.checked
        );
        if (nextUnchecked >= 0) {
          setCurrentIndex(nextUnchecked);
        } else {
          // Check from beginning
          const fromStart = items.findIndex((i) => !i.checked && i.id !== item.id);
          if (fromStart >= 0) {
            setCurrentIndex(fromStart);
          }
        }
        router.refresh();
      }
    });
  }

  function handleSkip() {
    if (canGoForward) {
      setCurrentIndex(currentIndex + 1);
      setCountInput("");
      setNoteInput("");
    }
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Artikel {currentIndex + 1} von {items.length}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              disabled={!canGoBack}
              onClick={() => {
                setCurrentIndex(currentIndex - 1);
                setCountInput("");
                setNoteInput("");
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!canGoForward}
              onClick={() => {
                setCurrentIndex(currentIndex + 1);
                setCountInput("");
                setNoteInput("");
              }}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.checked ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Bereits geprüft</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Gezählt: {item.countedQty} (Soll: {item.expectedQty})
              {item.difference !== 0 && item.difference !== null && (
                <span className="font-semibold text-amber-700 dark:text-amber-400 ml-2">
                  Differenz: {item.difference > 0 ? "+" : ""}
                  {item.difference}
                </span>
              )}
            </p>
          </div>
        ) : (
          <>
            {/* Article Info */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{item.article.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {item.article.sku}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={categoryBadgeColors[item.article.category] || ""}
                >
                  {articleCategoryLabels[item.article.category] ||
                    item.article.category}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Soll-Bestand</p>
                  <p className="text-xl font-bold">
                    {item.expectedQty}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {item.article.unit}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Akt. Bestand</p>
                  <p className="text-xl font-bold">
                    {item.article.currentStock}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {item.article.unit}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">EK-Wert</p>
                  <p className="text-xl font-bold">
                    {item.article.avgPurchasePrice > 0
                      ? formatCurrency(
                          item.expectedQty * item.article.avgPurchasePrice
                        )
                      : "–"}
                  </p>
                </div>
              </div>
            </div>

            {/* Count Input */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Gezählte Menge</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={countInput}
                    onChange={(e) => setCountInput(e.target.value)}
                    placeholder={String(item.expectedQty)}
                    className="max-w-32 text-lg font-mono"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirm();
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.article.unit}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (leer = Soll bestätigen)
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Anmerkung (optional)</Label>
                <Textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="z.B. Artikel beschädigt, falsch einsortiert..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleConfirm} disabled={isPending || !checkerName.trim()}>
                <Check className="mr-2 h-4 w-4" />
                Bestätigen
              </Button>
              <Button variant="outline" onClick={handleSkip} disabled={!canGoForward}>
                <SkipForward className="mr-2 h-4 w-4" />
                Überspringen
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ListView({
  items,
  isComplete,
  checkerName,
  isPending,
  startTransition,
}: {
  items: InventoryItemData[];
  isComplete: boolean;
  checkerName: string;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [countInput, setCountInput] = useState("");
  const [noteInput, setNoteInput] = useState("");

  function handleCheck(item: InventoryItemData) {
    if (!checkerName.trim()) {
      toast.error("Bitte zuerst Ihren Namen als Prüfer eingeben.");
      return;
    }
    const qty = countInput === "" ? item.expectedQty : parseInt(countInput, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error("Bitte eine gültige Menge eingeben.");
      return;
    }
    startTransition(async () => {
      const result = await checkInventoryItem({
        inventoryItemId: item.id,
        countedQty: qty,
        checkedBy: checkerName.trim(),
        notes: noteInput.trim() || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        setExpandedId(null);
        setCountInput("");
        setNoteInput("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-lg border transition-colors ${
            item.checked
              ? item.difference && item.difference !== 0
                ? "border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20"
                : "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20"
              : "hover:bg-muted/30"
          }`}
        >
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
            onClick={() => {
              if (!isComplete && !item.checked) {
                setExpandedId(expandedId === item.id ? null : item.id);
                setCountInput("");
                setNoteInput("");
              }
            }}
          >
            <div className="flex h-6 w-6 items-center justify-center">
              {item.checked ? (
                <CheckCircle2 className={`h-5 w-5 ${
                  item.difference && item.difference !== 0
                    ? "text-amber-500"
                    : "text-emerald-500"
                }`} />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
              )}
            </div>
            <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">
              {item.article.sku}
            </span>
            <span className="text-sm font-medium flex-1 truncate">
              {item.article.name}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] shrink-0 ${categoryBadgeColors[item.article.category] || ""}`}
            >
              {articleCategoryLabels[item.article.category] || item.article.category}
            </Badge>
            <div className="text-right w-20 shrink-0">
              {item.checked ? (
                <div>
                  <span className="text-sm font-semibold">
                    {item.countedQty}
                  </span>
                  {item.difference !== null && item.difference !== 0 && (
                    <span className={`text-xs ml-1 ${
                      item.difference > 0 ? "text-emerald-600" : "text-red-600"
                    }`}>
                      ({item.difference > 0 ? "+" : ""}
                      {item.difference})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Soll: {item.expectedQty}
                </span>
              )}
            </div>
            {!isComplete && !item.checked && (
              <div className="w-5">
                {expandedId === item.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </button>

          {/* Expanded edit area */}
          {expandedId === item.id && !item.checked && !isComplete && (
            <div className="px-4 pb-4 pl-14 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={countInput}
                  onChange={(e) => setCountInput(e.target.value)}
                  placeholder={String(item.expectedQty)}
                  className="w-24 text-sm font-mono"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCheck(item);
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.article.unit}
                </span>
                <Input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Anmerkung..."
                  className="flex-1 text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => handleCheck(item)}
                  disabled={isPending || !checkerName.trim()}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
