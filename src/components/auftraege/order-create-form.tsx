"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Search,
  Send,
  UserCheck,
  PackageCheck,
  FileText,
  Smartphone,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createOrder } from "@/actions/orders";
import { articleCategoryLabels } from "@/types/inventory";
import {
  mobilfunkTypeLabels,
  simTypeLabels,
  mobilfunkTariffLabels,
} from "@/types/orders";
import type { MobilfunkItemInput } from "@/types/orders";
import { toast } from "sonner";

type Article = {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  unit: string;
};

type OrderItemEntry =
  | { type: "article"; article: Article; quantity: number }
  | { type: "freetext"; text: string; quantity: number };

type MobilfunkEntry = MobilfunkItemInput & { _key: number };

const categoryColors: Record<string, string> = {
  HIGH_TIER:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  MID_TIER:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  LOW_TIER:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
};

export function OrderCreateForm({ articles }: { articles: Article[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Section 1: Auftraggeber
  const [orderedBy, setOrderedBy] = useState("");
  const [orderedFor, setOrderedFor] = useState("");
  const [costCenter, setCostCenter] = useState("");

  // Section 2: Lieferung
  const [isShipping, setIsShipping] = useState(false);
  const [shippingCompany, setShippingCompany] = useState("");
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [pickupBy, setPickupBy] = useState("");

  // Section 3: Artikel
  const [orderItems, setOrderItems] = useState<OrderItemEntry[]>([]);
  const [articleSearch, setArticleSearch] = useState("");
  const [showArticleList, setShowArticleList] = useState(false);
  const [showFreeText, setShowFreeText] = useState(false);
  const [freeTextInput, setFreeTextInput] = useState("");

  // Section 4: Mobilfunk
  const [mobilfunkItems, setMobilfunkItems] = useState<MobilfunkEntry[]>([]);
  const [mobilfunkOpen, setMobilfunkOpen] = useState(false);
  const mfKeyRef = useRef(0);

  // Section 5: Notizen
  const [notes, setNotes] = useState("");

  const selectedIds = new Set(
    orderItems.filter((i) => i.type === "article").map((i) => i.article.id)
  );

  const filteredArticles = articleSearch.trim()
    ? articles.filter(
        (a) =>
          !selectedIds.has(a.id) &&
          (a.name.toLowerCase().includes(articleSearch.toLowerCase()) ||
            a.sku.toLowerCase().includes(articleSearch.toLowerCase()))
      )
    : articles.filter((a) => !selectedIds.has(a.id));

  function addArticle(article: Article) {
    setOrderItems((prev) => [
      ...prev,
      { type: "article", article, quantity: 1 },
    ]);
    setArticleSearch("");
    setShowArticleList(false);
  }

  function addFreeText() {
    if (!freeTextInput.trim()) return;
    setOrderItems((prev) => [
      ...prev,
      { type: "freetext", text: freeTextInput.trim(), quantity: 1 },
    ]);
    setFreeTextInput("");
    setShowFreeText(false);
  }

  function removeItem(index: number) {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuantity(index: number, quantity: number) {
    setOrderItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  }

  function addMobilfunk() {
    setMobilfunkItems((prev) => [
      ...prev,
      {
        _key: ++mfKeyRef.current,
        type: "PHONE_AND_SIM",
        simType: "SIM",
        tariff: "STANDARD",
      },
    ]);
    setMobilfunkOpen(true);
  }

  function removeMobilfunk(key: number) {
    setMobilfunkItems((prev) => prev.filter((m) => m._key !== key));
  }

  function updateMobilfunk(key: number, updates: Partial<MobilfunkItemInput>) {
    setMobilfunkItems((prev) =>
      prev.map((m) => {
        if (m._key !== key) return m;
        const updated = { ...m, ...updates };
        if (updated.type === "PHONE_ONLY") {
          updated.simType = undefined;
          updated.tariff = undefined;
          updated.simNote = undefined;
        }
        if (updated.type === "SIM_ONLY") {
          updated.phoneNote = undefined;
        }
        if (updates.type && updates.type !== "PHONE_ONLY") {
          if (!updated.simType) updated.simType = "SIM";
          if (!updated.tariff) updated.tariff = "STANDARD";
        }
        return updated;
      })
    );
  }

  const hasItems = orderItems.length > 0 || mobilfunkItems.length > 0;

  function handleSubmit() {
    if (!orderedBy.trim()) return toast.error("Besteller ist erforderlich.");
    if (!orderedFor.trim()) return toast.error("Empfänger ist erforderlich.");
    if (!costCenter.trim())
      return toast.error("Kostenstelle ist erforderlich.");
    if (isShipping && !shippingStreet.trim())
      return toast.error("Straße ist erforderlich bei Versand.");
    if (isShipping && !shippingZip.trim())
      return toast.error("PLZ ist erforderlich bei Versand.");
    if (isShipping && !shippingCity.trim())
      return toast.error("Stadt ist erforderlich bei Versand.");
    if (!isShipping && !pickupBy.trim())
      return toast.error("Name des Abholers ist erforderlich.");
    if (!hasItems)
      return toast.error(
        "Mindestens ein Artikel oder Mobilfunk-Position hinzufügen."
      );

    startTransition(async () => {
      const result = await createOrder({
        orderedBy,
        orderedFor,
        costCenter,
        deliveryMethod: isShipping ? "SHIPPING" : "PICKUP",
        shippingCompany: isShipping ? shippingCompany || undefined : undefined,
        shippingStreet: isShipping ? shippingStreet : undefined,
        shippingZip: isShipping ? shippingZip : undefined,
        shippingCity: isShipping ? shippingCity : undefined,
        pickupBy: !isShipping ? pickupBy : undefined,
        notes: notes || undefined,
        items: orderItems.map((item) =>
          item.type === "article"
            ? { articleId: item.article.id, quantity: item.quantity }
            : { freeText: item.text, quantity: item.quantity }
        ),
        mobilfunk:
          mobilfunkItems.length > 0
            ? mobilfunkItems.map(({ _key, ...mf }) => mf)
            : undefined,
      });

      if (result.success && result.order) {
        toast.success(`Auftrag ${result.order.orderNumber} erstellt`);
        router.push("/auftraege");
      } else {
        toast.error(result.error ?? "Fehler beim Erstellen.");
      }
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Section 1: Auftraggeber */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auftraggeber</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="orderedBy">Besteller *</Label>
              <Input
                id="orderedBy"
                value={orderedBy}
                onChange={(e) => setOrderedBy(e.target.value)}
                placeholder="Wer hat bestellt?"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="orderedFor">Empfänger *</Label>
              <Input
                id="orderedFor"
                value={orderedFor}
                onChange={(e) => setOrderedFor(e.target.value)}
                placeholder="Für wen?"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="costCenter">Kostenstelle *</Label>
              <Input
                id="costCenter"
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                placeholder="z.B. 4711"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Lieferung */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lieferung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!isShipping ? "default" : "outline"}
              onClick={() => setIsShipping(false)}
              className="flex-1"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Abholung
            </Button>
            <Button
              type="button"
              variant={isShipping ? "default" : "outline"}
              onClick={() => setIsShipping(true)}
              className="flex-1"
            >
              <Send className="mr-2 h-4 w-4" />
              Versand
            </Button>
          </div>

          {isShipping ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="shippingCompany">Firma</Label>
                <Input
                  id="shippingCompany"
                  value={shippingCompany}
                  onChange={(e) => setShippingCompany(e.target.value)}
                  placeholder="Firmenname (optional)"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="shippingStreet">Straße + Hausnr. *</Label>
                <Input
                  id="shippingStreet"
                  value={shippingStreet}
                  onChange={(e) => setShippingStreet(e.target.value)}
                  placeholder="Musterstraße 123"
                  className="mt-1"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <div>
                  <Label htmlFor="shippingZip">PLZ *</Label>
                  <Input
                    id="shippingZip"
                    value={shippingZip}
                    onChange={(e) => setShippingZip(e.target.value)}
                    placeholder="12345"
                    maxLength={10}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingCity">Stadt *</Label>
                  <Input
                    id="shippingCity"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder="Berlin"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="pickupBy">Abholer Name *</Label>
              <Input
                id="pickupBy"
                value={pickupBy}
                onChange={(e) => setPickupBy(e.target.value)}
                placeholder="Name der abholenden Person"
                className="mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Artikel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Artikel ({orderItems.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowFreeText(!showFreeText);
                setShowArticleList(false);
              }}
            >
              <FileText className="mr-1 h-3.5 w-3.5" />
              Freitext hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Selected items */}
          {orderItems.length > 0 && (
            <div className="space-y-2">
              {orderItems.map((item, idx) => {
                if (item.type === "article") {
                  const inStock = item.article.currentStock >= item.quantity;
                  return (
                    <div
                      key={`article-${item.article.id}`}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.article.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {item.article.sku}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${
                              categoryColors[item.article.category] || ""
                            }`}
                          >
                            {articleCategoryLabels[item.article.category]}
                          </Badge>
                          <span
                            className={`text-[10px] font-medium ${
                              inStock ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            Lager: {item.article.currentStock}{" "}
                            {item.article.unit}
                          </span>
                        </div>
                      </div>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(idx, parseInt(e.target.value) || 1)
                        }
                        className="w-16 h-8 text-center font-mono text-xs"
                      />
                      <span className="text-[10px] text-muted-foreground w-5">
                        {item.article.unit}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                }
                return (
                  <div
                    key={`freetext-${idx}`}
                    className="flex items-center gap-3 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.text}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[9px] text-amber-600 border-amber-300 mt-0.5"
                      >
                        Freitext
                      </Badge>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(idx, parseInt(e.target.value) || 1)
                      }
                      className="w-16 h-8 text-center font-mono text-xs"
                    />
                    <span className="text-[10px] text-muted-foreground w-5">
                      Stk
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Freetext input */}
          {showFreeText && (
            <div className="rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10 p-3 space-y-2">
              <Label className="text-xs text-amber-700 dark:text-amber-400">
                Freitext-Position
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="z.B. Spezial-Kabel USB-C 3m..."
                  value={freeTextInput}
                  onChange={(e) => setFreeTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addFreeText()}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={addFreeText}
                  disabled={!freeTextInput.trim()}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Hinzufügen
                </Button>
              </div>
            </div>
          )}

          {/* Article search */}
          <div className="space-y-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Artikel suchen (Name / Art.Nr.)..."
                value={articleSearch}
                onChange={(e) => {
                  setArticleSearch(e.target.value);
                  setShowArticleList(true);
                  setShowFreeText(false);
                }}
                onFocus={() => {
                  setShowArticleList(true);
                  setShowFreeText(false);
                }}
                className="pl-9"
              />
            </div>
            {showArticleList && (
              <div className="max-h-48 overflow-y-auto rounded-lg border divide-y text-sm">
                {filteredArticles.length === 0 ? (
                  <div className="px-3 py-4 text-center text-muted-foreground text-xs">
                    {articleSearch
                      ? "Kein Artikel gefunden."
                      : "Alle bereits hinzugefügt."}
                  </div>
                ) : (
                  filteredArticles.slice(0, 20).map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                      onClick={() => addArticle(article)}
                    >
                      <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {article.name}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {article.sku}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 shrink-0 ${
                          categoryColors[article.category] || ""
                        }`}
                      >
                        {articleCategoryLabels[article.category]}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                        {article.currentStock} {article.unit}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Mobilfunk */}
      <Card>
        <CardHeader>
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setMobilfunkOpen(!mobilfunkOpen)}
          >
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4" />
              Mobilfunk ({mobilfunkItems.length})
              {mobilfunkOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                addMobilfunk();
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Hinzufügen
            </Button>
          </div>
        </CardHeader>
        {mobilfunkOpen && (
          <CardContent className="space-y-3">
            {mobilfunkItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine Mobilfunk-Positionen. Klicken Sie &quot;Hinzufügen&quot;
                um eine Position anzulegen.
              </p>
            ) : (
              mobilfunkItems.map((mf) => (
                <div
                  key={mf._key}
                  className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-950/20 p-4 space-y-3"
                >
                  {/* Type selector */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {(
                        ["PHONE_AND_SIM", "PHONE_ONLY", "SIM_ONLY"] as const
                      ).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            updateMobilfunk(mf._key, { type: t })
                          }
                          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                            mf.type === t
                              ? "bg-violet-600 text-white shadow-sm"
                              : "bg-white dark:bg-white/10 text-muted-foreground hover:bg-violet-100 dark:hover:bg-violet-900/30 border"
                          }`}
                        >
                          {mobilfunkTypeLabels[t]}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMobilfunk(mf._key)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* SIM Type and Tariff */}
                  {mf.type !== "PHONE_ONLY" && (
                    <div className="flex gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">SIM-Typ</Label>
                        <div className="flex gap-1">
                          {(["SIM", "ESIM"] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() =>
                                updateMobilfunk(mf._key, { simType: st })
                              }
                              className={`rounded px-2.5 py-0.5 text-xs font-medium transition-colors ${
                                mf.simType === st
                                  ? "bg-violet-600 text-white"
                                  : "bg-white dark:bg-white/10 text-muted-foreground border"
                              }`}
                            >
                              {simTypeLabels[st]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tarif</Label>
                        <div className="flex gap-1">
                          {(["STANDARD", "UNLIMITED"] as const).map((tf) => (
                            <button
                              key={tf}
                              type="button"
                              onClick={() =>
                                updateMobilfunk(mf._key, { tariff: tf })
                              }
                              className={`rounded px-2.5 py-0.5 text-xs font-medium transition-colors ${
                                mf.tariff === tf
                                  ? "bg-violet-600 text-white"
                                  : "bg-white dark:bg-white/10 text-muted-foreground border"
                              }`}
                            >
                              {mobilfunkTariffLabels[tf]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {mf.type !== "SIM_ONLY" && (
                      <div>
                        <Label className="text-xs">Handy-Hinweis</Label>
                        <Input
                          placeholder="iPhone 15, Samsung..."
                          value={mf.phoneNote ?? ""}
                          onChange={(e) =>
                            updateMobilfunk(mf._key, {
                              phoneNote: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    )}
                    {mf.type !== "PHONE_ONLY" && (
                      <div>
                        <Label className="text-xs">SIM-Hinweis</Label>
                        <Input
                          placeholder="Rufnummer, Portierung..."
                          value={mf.simNote ?? ""}
                          onChange={(e) =>
                            updateMobilfunk(mf._key, {
                              simNote: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>

      {/* Section 5: Notizen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optionale Anmerkungen zum Auftrag..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Separator />
      <Button
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        disabled={isPending || !hasItems}
      >
        <PackageCheck className="mr-2 h-5 w-5" />
        {isPending ? "Wird erstellt..." : "Auftrag erstellen"}
      </Button>
    </div>
  );
}
