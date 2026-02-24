"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { articleCategoryLabels } from "@/types/inventory";
import { createArticle } from "@/actions/inventory";
import { toast } from "sonner";

type GroupSuggestions = {
  groups: string[];
  subGroups: string[];
};

export function ArticleCreateForm({
  nextSku,
  groupSuggestions,
}: {
  nextSku: string;
  groupSuggestions: GroupSuggestions;
}) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean; article?: { id: string } } | null,
      formData: FormData
    ) => {
      return createArticle(formData);
    },
    null
  );

  useEffect(() => {
    if (state?.success && state.article) {
      toast.success("Artikel erstellt");
      router.push(`/artikelverwaltung/${state.article.id}`);
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Artikeldaten</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Artikelbezeichnung"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">Artikelnummer</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={nextSku}
                required
                readOnly
                className="bg-muted/50 font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Wird automatisch vergeben
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="category">Tier-Kategorie *</Label>
              <Select name="category" defaultValue="MID_TIER">
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
              <Label htmlFor="unit">Einheit</Label>
              <Input
                id="unit"
                name="unit"
                defaultValue="Stk"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Mindestbestand</Label>
              <Input
                id="minStockLevel"
                name="minStockLevel"
                type="number"
                min={0}
                defaultValue={0}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="productGroup">Produktgruppe</Label>
              <Input
                id="productGroup"
                name="productGroup"
                placeholder="z.B. Notebook, Monitor, Drucker"
                list="create-productGroup-suggestions"
              />
              {groupSuggestions.groups.length > 0 && (
                <datalist id="create-productGroup-suggestions">
                  {groupSuggestions.groups.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="productSubGroup">Untergruppe</Label>
              <Input
                id="productSubGroup"
                name="productSubGroup"
                placeholder="z.B. 14 Zoll, Bluetooth, USB-C"
                list="create-productSubGroup-suggestions"
              />
              {groupSuggestions.subGroups.length > 0 && (
                <datalist id="create-productSubGroup-suggestions">
                  {groupSuggestions.subGroups.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avgPurchasePrice">EK-Preis netto</Label>
            <div className="relative">
              <Input
                id="avgPurchasePrice"
                name="avgPurchasePrice"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                EUR
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Netto-Einkaufspreis ohne Mehrwertsteuer
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Optionale Beschreibung des Artikels"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Interne Notizen"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Wird erstellt..." : "Artikel erstellen"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
