"use client";

import { useState, useTransition } from "react";
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
  CardSim,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

let mfKeyCounter = 0;

export function OrderForm({ articles }: { articles: Article[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Order fields
  const [orderedBy, setOrderedBy] = useState("");
  const [orderedFor, setOrderedFor] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [isShipping, setIsShipping] = useState(false);
  const [shippingCompany, setShippingCompany] = useState("");
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [pickupBy, setPickupBy] = useState("");
  const [notes, setNotes] = useState("");

  // Article selection
  const [orderItems, setOrderItems] = useState<OrderItemEntry[]>([]);
  const [articleSearch, setArticleSearch] = useState("");
  const [showArticleList, setShowArticleList] = useState(false);
  const [freeTextInput, setFreeTextInput] = useState("");
  const [showFreeText, setShowFreeText] = useState(false);

  // Mobilfunk
  const [mobilfunkItems, setMobilfunkItems] = useState<MobilfunkEntry[]>([]);

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
    setOrderItems((prev) => [...prev, { type: "article", article, quantity: 1 }]);
    setArticleSearch("");
    setShowArticleList(false);
  }

  function addFreeText() {
    if (!freeTextInput.trim()) return;
    setOrderItems((prev) => [...prev, { type: "freetext", text: freeTextInput.trim(), quantity: 1 }]);
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

  // Mobilfunk functions
  function addMobilfunk() {
    setMobilfunkItems((prev) => [
      ...prev,
      { _key: ++mfKeyCounter, type: "PHONE_AND_SIM", simType: "SIM", tariff: "STANDARD" },
    ]);
  }

  function removeMobilfunk(key: number) {
    setMobilfunkItems((prev) => prev.filter((m) => m._key !== key));
  }

  function updateMobilfunk(key: number, updates: Partial<MobilfunkItemInput>) {
    setMobilfunkItems((prev) =>
      prev.map((m) => {
        if (m._key !== key) return m;
        const updated = { ...m, ...updates };
        // Clear SIM fields when type is PHONE_ONLY
        if (updated.type === "PHONE_ONLY") {
          updated.simType = undefined;
          updated.tariff = undefined;
          updated.simNote = undefined;
        }
        // Clear phone fields when type is SIM_ONLY
        if (updated.type === "SIM_ONLY") {
          updated.phoneNote = undefined;
        }
        // Ensure SIM defaults when switching to type with SIM
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
    if (!orderedBy.trim()) {
      toast.error("Besteller ist erforderlich.");
      return;
    }
    if (!orderedFor.trim()) {
      toast.error("Empfänger ist erforderlich.");
      return;
    }
    if (!costCenter.trim()) {
      toast.error("Kostenstelle ist erforderlich.");
      return;
    }
    if (isShipping && !shippingStreet.trim()) {
      toast.error("Straße ist erforderlich bei Versand.");
      return;
    }
    if (isShipping && !shippingZip.trim()) {
      toast.error("PLZ ist erforderlich bei Versand.");
      return;
    }
    if (isShipping && !shippingCity.trim()) {
      toast.error("Stadt ist erforderlich bei Versand.");
      return;
    }
    if (!isShipping && !pickupBy.trim()) {
      toast.error("Name des Abholers ist erforderlich.");
      return;
    }
    if (!hasItems) {
      toast.error("Mindestens ein Artikel oder Mobilfunk-Position muss hinzugefügt werden.");
      return;
    }

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
        mobilfunk: mobilfunkItems.length > 0
          ? mobilfunkItems.map(({ _key, ...mf }) => mf)
          : undefined,
      });

      if (result.success) {
        toast.success(`Auftrag ${result.order?.orderNumber} erstellt`);
        router.push("/orders");
        router.refresh();
      } else {
        toast.error(result.error ?? "Fehler beim Erstellen.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Besteller & Empfänger */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Auftragsdetails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderedBy">Besteller *</Label>
              <Input
                id="orderedBy"
                value={orderedBy}
                onChange={(e) => setOrderedBy(e.target.value)}
                placeholder="Wer hat bestellt?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderedFor">Empfänger *</Label>
              <Input
                id="orderedFor"
                value={orderedFor}
                onChange={(e) => setOrderedFor(e.target.value)}
                placeholder="Für wen ist die Bestellung?"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="costCenter">Kostenstelle *</Label>
            <Input
              id="costCenter"
              value={costCenter}
              onChange={(e) => setCostCenter(e.target.value)}
              placeholder="z.B. 4711"
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Versand / Abholung */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lieferung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/20 p-4">
            <div className="flex items-center gap-3 flex-1">
              <UserCheck className={`h-5 w-5 ${!isShipping ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${!isShipping ? "" : "text-muted-foreground"}`}>
                Abholung
              </span>
            </div>
            <Switch
              checked={isShipping}
              onCheckedChange={setIsShipping}
            />
            <div className="flex items-center gap-3 flex-1 justify-end">
              <span className={`text-sm font-medium ${isShipping ? "" : "text-muted-foreground"}`}>
                Versand
              </span>
              <Send className={`h-5 w-5 ${isShipping ? "text-primary" : "text-muted-foreground"}`} />
            </div>
          </div>

          {isShipping ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="shippingCompany">Firma / Empfänger</Label>
                <Input
                  id="shippingCompany"
                  value={shippingCompany}
                  onChange={(e) => setShippingCompany(e.target.value)}
                  placeholder="Firmenname oder Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingStreet">Straße + Hausnr. *</Label>
                <Input
                  id="shippingStreet"
                  value={shippingStreet}
                  onChange={(e) => setShippingStreet(e.target.value)}
                  placeholder="z.B. Musterstraße 123"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="shippingZip">PLZ *</Label>
                  <Input
                    id="shippingZip"
                    value={shippingZip}
                    onChange={(e) => setShippingZip(e.target.value)}
                    placeholder="12345"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingCity">Stadt *</Label>
                  <Input
                    id="shippingCity"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder="z.B. Berlin"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="pickupBy">Wird abgeholt von *</Label>
              <Input
                id="pickupBy"
                value={pickupBy}
                onChange={(e) => setPickupBy(e.target.value)}
                placeholder="Name der abholenden Person"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Artikelauswahl */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Artikel ({orderItems.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowFreeText(!showFreeText); setShowArticleList(false); }}
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Freitext
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ausgewählte Artikel */}
          {orderItems.length > 0 && (
            <div className="space-y-2">
              {orderItems.map((item, idx) => {
                if (item.type === "article") {
                  const inStock = item.article.currentStock >= item.quantity;
                  return (
                    <div
                      key={`article-${item.article.id}`}
                      className="flex items-center gap-3 rounded-lg border bg-card p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.article.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs text-muted-foreground">
                            {item.article.sku}
                          </span>
                          <span className={`text-[10px] font-medium ${inStock ? "text-emerald-600" : "text-red-600"}`}>
                            Lager: {item.article.currentStock}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(idx, parseInt(e.target.value) || 1)
                          }
                          className="w-20 h-8 text-center font-mono"
                        />
                        <span className="text-xs text-muted-foreground w-6">
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
                    </div>
                  );
                }

                // Free text item
                return (
                  <div
                    key={`freetext-${idx}`}
                    className="flex items-center gap-3 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.text}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          Freitext – nicht im Artikelstamm
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(idx, parseInt(e.target.value) || 1)
                        }
                        className="w-20 h-8 text-center font-mono"
                      />
                      <span className="text-xs text-muted-foreground w-6">
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
                  </div>
                );
              })}
            </div>
          )}

          {/* Freitext hinzufügen */}
          {showFreeText && (
            <div className="rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10 p-3 space-y-2">
              <Label className="text-xs text-amber-700 dark:text-amber-400">Freitext-Position hinzufügen</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="z.B. Spezial-Kabel USB-C 3m..."
                  value={freeTextInput}
                  onChange={(e) => setFreeTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addFreeText()}
                  className="flex-1"
                />
                <Button size="sm" onClick={addFreeText} disabled={!freeTextInput.trim()}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Hinzufügen
                </Button>
              </div>
            </div>
          )}

          {/* Artikel hinzufügen */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Artikel hinzufügen (Name oder Art.Nr.)..."
                value={articleSearch}
                onChange={(e) => {
                  setArticleSearch(e.target.value);
                  setShowArticleList(true);
                  setShowFreeText(false);
                }}
                onFocus={() => { setShowArticleList(true); setShowFreeText(false); }}
                className="pl-9"
              />
            </div>
            {showArticleList && (
              <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
                {filteredArticles.length === 0 ? (
                  <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                    {articleSearch ? "Kein Artikel gefunden." : "Alle Artikel bereits hinzugefügt."}
                  </div>
                ) : (
                  filteredArticles.slice(0, 20).map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-muted/50 transition-colors"
                      onClick={() => addArticle(article)}
                    >
                      <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{article.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{article.sku}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        {articleCategoryLabels[article.category]}
                      </Badge>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
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

      {/* Mobilfunk */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4" />
              Mobilfunk ({mobilfunkItems.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addMobilfunk}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {mobilfunkItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Mobilfunk-Positionen. Nur hinzufügen wenn Handy/SIM benötigt.
            </p>
          ) : (
            mobilfunkItems.map((mf) => (
              <div
                key={mf._key}
                className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-950/20 p-4 space-y-3"
              >
                {/* Typ-Auswahl */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {(["PHONE_AND_SIM", "PHONE_ONLY", "SIM_ONLY"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateMobilfunk(mf._key, { type: t })}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
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

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* SIM-Typ (nur wenn SIM dabei) */}
                  {mf.type !== "PHONE_ONLY" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1.5">
                        <CardSim className="h-3 w-3" />
                        SIM-Typ
                      </Label>
                      <div className="flex gap-1.5">
                        {(["SIM", "ESIM"] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => updateMobilfunk(mf._key, { simType: st })}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                              mf.simType === st
                                ? "bg-violet-600 text-white shadow-sm"
                                : "bg-white dark:bg-white/10 text-muted-foreground hover:bg-violet-100 dark:hover:bg-violet-900/30 border"
                            }`}
                          >
                            {simTypeLabels[st]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tarif (nur wenn SIM dabei) */}
                  {mf.type !== "PHONE_ONLY" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tarif</Label>
                      <div className="flex gap-1.5">
                        {(["STANDARD", "UNLIMITED"] as const).map((tf) => (
                          <button
                            key={tf}
                            type="button"
                            onClick={() => updateMobilfunk(mf._key, { tariff: tf })}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                              mf.tariff === tf
                                ? "bg-violet-600 text-white shadow-sm"
                                : "bg-white dark:bg-white/10 text-muted-foreground hover:bg-violet-100 dark:hover:bg-violet-900/30 border"
                            }`}
                          >
                            {mobilfunkTariffLabels[tf]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notiz-Felder */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {mf.type !== "SIM_ONLY" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Handy-Hinweis</Label>
                      <Input
                        placeholder="z.B. iPhone 15, Samsung Galaxy..."
                        value={mf.phoneNote ?? ""}
                        onChange={(e) => updateMobilfunk(mf._key, { phoneNote: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  )}
                  {mf.type !== "PHONE_ONLY" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">SIM-Hinweis</Label>
                      <Input
                        placeholder="z.B. Rufnummer, Portierung..."
                        value={mf.simNote ?? ""}
                        onChange={(e) => updateMobilfunk(mf._key, { simNote: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Notizen */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optionale Anmerkungen zum Auftrag..."
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Submit */}
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
