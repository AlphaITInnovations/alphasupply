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
import { toast } from "sonner";

type Article = {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  unit: string;
};

type OrderItemEntry = {
  article: Article;
  quantity: number;
};

export function OrderForm({ articles }: { articles: Article[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Order fields
  const [orderedBy, setOrderedBy] = useState("");
  const [orderedFor, setOrderedFor] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [isShipping, setIsShipping] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [pickupBy, setPickupBy] = useState("");
  const [notes, setNotes] = useState("");

  // Article selection
  const [orderItems, setOrderItems] = useState<OrderItemEntry[]>([]);
  const [articleSearch, setArticleSearch] = useState("");
  const [showArticleList, setShowArticleList] = useState(false);

  const selectedIds = new Set(orderItems.map((i) => i.article.id));

  const filteredArticles = articleSearch.trim()
    ? articles.filter(
        (a) =>
          !selectedIds.has(a.id) &&
          (a.name.toLowerCase().includes(articleSearch.toLowerCase()) ||
            a.sku.toLowerCase().includes(articleSearch.toLowerCase()))
      )
    : articles.filter((a) => !selectedIds.has(a.id));

  function addArticle(article: Article) {
    setOrderItems((prev) => [...prev, { article, quantity: 1 }]);
    setArticleSearch("");
    setShowArticleList(false);
  }

  function removeArticle(index: number) {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuantity(index: number, quantity: number) {
    setOrderItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  }

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
    if (isShipping && !shippingAddress.trim()) {
      toast.error("Versandadresse ist erforderlich.");
      return;
    }
    if (!isShipping && !pickupBy.trim()) {
      toast.error("Name des Abholers ist erforderlich.");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Mindestens ein Artikel muss hinzugefügt werden.");
      return;
    }

    startTransition(async () => {
      const result = await createOrder({
        orderedBy,
        orderedFor,
        costCenter,
        deliveryMethod: isShipping ? "SHIPPING" : "PICKUP",
        shippingAddress: isShipping ? shippingAddress : undefined,
        pickupBy: !isShipping ? pickupBy : undefined,
        notes: notes || undefined,
        items: orderItems.map((i) => ({
          articleId: i.article.id,
          quantity: i.quantity,
        })),
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
            <div className="space-y-2">
              <Label htmlFor="shippingAddress">Versandadresse *</Label>
              <Textarea
                id="shippingAddress"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Straße, PLZ, Ort..."
                rows={3}
              />
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
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ausgewählte Artikel */}
          {orderItems.length > 0 && (
            <div className="space-y-2">
              {orderItems.map((item, idx) => {
                const inStock = item.article.currentStock >= item.quantity;
                return (
                  <div
                    key={item.article.id}
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
                        onClick={() => removeArticle(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
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
                }}
                onFocus={() => setShowArticleList(true)}
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
        disabled={isPending || orderItems.length === 0}
      >
        <PackageCheck className="mr-2 h-5 w-5" />
        {isPending ? "Wird erstellt..." : "Auftrag erstellen"}
      </Button>
    </div>
  );
}
