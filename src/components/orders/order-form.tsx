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

export function OrderForm({ articles, onSuccess }: { articles: Article[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  const [orderItems, setOrderItems] = useState<OrderItemEntry[]>([]);
  const [articleSearch, setArticleSearch] = useState("");
  const [showArticleList, setShowArticleList] = useState(false);
  const [freeTextInput, setFreeTextInput] = useState("");
  const [showFreeText, setShowFreeText] = useState(false);

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
    if (!orderedFor.trim()) return toast.error("Empf\u00e4nger ist erforderlich.");
    if (!costCenter.trim()) return toast.error("Kostenstelle ist erforderlich.");
    if (isShipping && !shippingStreet.trim()) return toast.error("Stra\u00dfe ist erforderlich bei Versand.");
    if (isShipping && !shippingZip.trim()) return toast.error("PLZ ist erforderlich bei Versand.");
    if (isShipping && !shippingCity.trim()) return toast.error("Stadt ist erforderlich bei Versand.");
    if (!isShipping && !pickupBy.trim()) return toast.error("Name des Abholers ist erforderlich.");
    if (!hasItems) return toast.error("Mindestens ein Artikel oder Mobilfunk-Position hinzuf\u00fcgen.");

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
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/orders");
        }
        router.refresh();
      } else {
        toast.error(result.error ?? "Fehler beim Erstellen.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Auftragsdetails */}
      <Card>
        <CardHeader className="py-2.5 px-4">
          <CardTitle className="text-sm">Auftragsdetails</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2.5">
          <div className="grid gap-2.5 sm:grid-cols-3">
            <div>
              <Label htmlFor="orderedBy" className="text-xs">Besteller *</Label>
              <Input id="orderedBy" value={orderedBy} onChange={(e) => setOrderedBy(e.target.value)} placeholder="Wer hat bestellt?" className="h-8 mt-1" />
            </div>
            <div>
              <Label htmlFor="orderedFor" className="text-xs">Empf&auml;nger *</Label>
              <Input id="orderedFor" value={orderedFor} onChange={(e) => setOrderedFor(e.target.value)} placeholder="F&uuml;r wen?" className="h-8 mt-1" />
            </div>
            <div>
              <Label htmlFor="costCenter" className="text-xs">Kostenstelle *</Label>
              <Input id="costCenter" value={costCenter} onChange={(e) => setCostCenter(e.target.value)} placeholder="z.B. 4711" className="h-8 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lieferung */}
      <Card>
        <CardHeader className="py-2.5 px-4">
          <CardTitle className="text-sm">Lieferung</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2.5">
          <div className="flex items-center gap-3 rounded-md border bg-muted/20 px-3 py-2">
            <UserCheck className={`h-4 w-4 ${!isShipping ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-xs font-medium ${!isShipping ? "" : "text-muted-foreground"}`}>Abholung</span>
            <Switch checked={isShipping} onCheckedChange={setIsShipping} className="mx-1" />
            <span className={`text-xs font-medium ${isShipping ? "" : "text-muted-foreground"}`}>Versand</span>
            <Send className={`h-4 w-4 ${isShipping ? "text-primary" : "text-muted-foreground"}`} />
          </div>

          {isShipping ? (
            <div className="space-y-2">
              <div>
                <Label htmlFor="shippingCompany" className="text-xs">Firma / Empf&auml;nger</Label>
                <Input id="shippingCompany" value={shippingCompany} onChange={(e) => setShippingCompany(e.target.value)} placeholder="Firmenname" className="h-8 mt-1" />
              </div>
              <div>
                <Label htmlFor="shippingStreet" className="text-xs">Stra&szlig;e + Hausnr. *</Label>
                <Input id="shippingStreet" value={shippingStreet} onChange={(e) => setShippingStreet(e.target.value)} placeholder="Musterstra&szlig;e 123" className="h-8 mt-1" />
              </div>
              <div className="grid gap-2 sm:grid-cols-[100px_1fr]">
                <div>
                  <Label htmlFor="shippingZip" className="text-xs">PLZ *</Label>
                  <Input id="shippingZip" value={shippingZip} onChange={(e) => setShippingZip(e.target.value)} placeholder="12345" maxLength={10} className="h-8 mt-1" />
                </div>
                <div>
                  <Label htmlFor="shippingCity" className="text-xs">Stadt *</Label>
                  <Input id="shippingCity" value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} placeholder="Berlin" className="h-8 mt-1" />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="pickupBy" className="text-xs">Wird abgeholt von *</Label>
              <Input id="pickupBy" value={pickupBy} onChange={(e) => setPickupBy(e.target.value)} placeholder="Name der abholenden Person" className="h-8 mt-1" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Artikel */}
      <Card>
        <CardHeader className="py-2.5 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Artikel ({orderItems.length})</CardTitle>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setShowFreeText(!showFreeText); setShowArticleList(false); }}>
              <FileText className="mr-1 h-3 w-3" />
              Freitext
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {/* Ausgewaehlte Artikel */}
          {orderItems.length > 0 && (
            <div className="space-y-1.5">
              {orderItems.map((item, idx) => {
                if (item.type === "article") {
                  const inStock = item.article.currentStock >= item.quantity;
                  return (
                    <div key={`article-${item.article.id}`} className="flex items-center gap-2 rounded-md border p-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.article.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-muted-foreground">{item.article.sku}</span>
                          <span className={`text-[10px] font-medium ${inStock ? "text-emerald-600" : "text-red-600"}`}>
                            Lager: {item.article.currentStock}
                          </span>
                        </div>
                      </div>
                      <Input type="number" min={1} value={item.quantity} onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 1)} className="w-16 h-7 text-center font-mono text-xs" />
                      <span className="text-[10px] text-muted-foreground w-5">{item.article.unit}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                }
                return (
                  <div key={`freetext-${idx}`} className="flex items-center gap-2 rounded-md border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.text}</p>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400">Freitext</span>
                    </div>
                    <Input type="number" min={1} value={item.quantity} onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 1)} className="w-16 h-7 text-center font-mono text-xs" />
                    <span className="text-[10px] text-muted-foreground w-5">Stk</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Freitext */}
          {showFreeText && (
            <div className="rounded-md border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10 p-2 space-y-1.5">
              <Label className="text-[10px] text-amber-700 dark:text-amber-400">Freitext-Position</Label>
              <div className="flex gap-1.5">
                <Input placeholder="z.B. Spezial-Kabel USB-C 3m..." value={freeTextInput} onChange={(e) => setFreeTextInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFreeText()} className="flex-1 h-7 text-sm" />
                <Button size="sm" className="h-7 text-xs" onClick={addFreeText} disabled={!freeTextInput.trim()}>
                  <Plus className="mr-1 h-3 w-3" />
                  OK
                </Button>
              </div>
            </div>
          )}

          {/* Artikelsuche */}
          <div className="space-y-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Artikel hinzuf&uuml;gen (Name / Art.Nr.)..."
                value={articleSearch}
                onChange={(e) => { setArticleSearch(e.target.value); setShowArticleList(true); setShowFreeText(false); }}
                onFocus={() => { setShowArticleList(true); setShowFreeText(false); }}
                className="pl-8 h-8 text-sm"
              />
            </div>
            {showArticleList && (
              <div className="max-h-40 overflow-y-auto rounded-md border divide-y text-sm">
                {filteredArticles.length === 0 ? (
                  <div className="px-3 py-3 text-center text-muted-foreground text-xs">
                    {articleSearch ? "Kein Artikel gefunden." : "Alle bereits hinzugef\u00fcgt."}
                  </div>
                ) : (
                  filteredArticles.slice(0, 20).map((article) => (
                    <button key={article.id} type="button" className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/50 transition-colors" onClick={() => addArticle(article)}>
                      <Plus className="h-3 w-3 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{article.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{article.sku}</p>
                      </div>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">
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

      {/* Mobilfunk */}
      <Card>
        <CardHeader className="py-2.5 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <Smartphone className="h-3.5 w-3.5" />
              Mobilfunk ({mobilfunkItems.length})
            </CardTitle>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addMobilfunk}>
              <Plus className="mr-1 h-3 w-3" />
              Hinzuf&uuml;gen
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {mobilfunkItems.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Keine Mobilfunk-Positionen.
            </p>
          ) : (
            mobilfunkItems.map((mf) => (
              <div key={mf._key} className="rounded-md border border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-950/20 p-3 space-y-2">
                {/* Typ */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {(["PHONE_AND_SIM", "PHONE_ONLY", "SIM_ONLY"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => updateMobilfunk(mf._key, { type: t })} className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${mf.type === t ? "bg-violet-600 text-white shadow-sm" : "bg-white dark:bg-white/10 text-muted-foreground hover:bg-violet-100 dark:hover:bg-violet-900/30 border"}`}>
                        {mobilfunkTypeLabels[t]}
                      </button>
                    ))}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeMobilfunk(mf._key)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {mf.type !== "PHONE_ONLY" && (
                  <div className="flex gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] flex items-center gap-1">
                        <CardSim className="h-2.5 w-2.5" />
                        SIM-Typ
                      </Label>
                      <div className="flex gap-1">
                        {(["SIM", "ESIM"] as const).map((st) => (
                          <button key={st} type="button" onClick={() => updateMobilfunk(mf._key, { simType: st })} className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${mf.simType === st ? "bg-violet-600 text-white" : "bg-white dark:bg-white/10 text-muted-foreground border"}`}>
                            {simTypeLabels[st]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Tarif</Label>
                      <div className="flex gap-1">
                        {(["STANDARD", "UNLIMITED"] as const).map((tf) => (
                          <button key={tf} type="button" onClick={() => updateMobilfunk(mf._key, { tariff: tf })} className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${mf.tariff === tf ? "bg-violet-600 text-white" : "bg-white dark:bg-white/10 text-muted-foreground border"}`}>
                            {mobilfunkTariffLabels[tf]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-2">
                  {mf.type !== "SIM_ONLY" && (
                    <div>
                      <Label className="text-[10px]">Handy-Hinweis</Label>
                      <Input placeholder="iPhone 15, Samsung..." value={mf.phoneNote ?? ""} onChange={(e) => updateMobilfunk(mf._key, { phoneNote: e.target.value })} className="h-7 text-xs mt-0.5" />
                    </div>
                  )}
                  {mf.type !== "PHONE_ONLY" && (
                    <div>
                      <Label className="text-[10px]">SIM-Hinweis</Label>
                      <Input placeholder="Rufnummer, Portierung..." value={mf.simNote ?? ""} onChange={(e) => updateMobilfunk(mf._key, { simNote: e.target.value })} className="h-7 text-xs mt-0.5" />
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
        <CardHeader className="py-2.5 px-4">
          <CardTitle className="text-sm">Notizen</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optionale Anmerkungen..." rows={2} className="text-sm" />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button size="lg" className="w-full" onClick={handleSubmit} disabled={isPending || !hasItems}>
        <PackageCheck className="mr-2 h-5 w-5" />
        {isPending ? "Wird erstellt..." : "Auftrag erstellen"}
      </Button>
    </div>
  );
}
