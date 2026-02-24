"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createArticle, updateArticle } from "@/actions/inventory";
import { articleCategoryLabels } from "@/types/inventory";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

type ArticleData = {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  category: string;
  productGroup: string | null;
  productSubGroup: string | null;
  avgPurchasePrice: { toNumber(): number } | number | string | null;
  unit: string;
  minStockLevel: number;
  notes: string | null;
};

export function ArticleForm({
  article,
  onSuccess,
  groupSuggestions,
  nextSku,
}: {
  article?: ArticleData;
  onSuccess?: () => void;
  groupSuggestions?: { groups: string[]; subGroups: string[] };
  nextSku?: string;
}) {
  const router = useRouter();
  const action = article ? updateArticle : createArticle;
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      if (article) {
        formData.set("id", article.id);
      }
      return action(formData);
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(article ? "Artikel aktualisiert" : "Artikel erstellt");
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
      if (!onSuccess) {
        router.push("/inventory");
      }
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, article, router, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={article?.name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">Artikelnummer</Label>
          <Input
            id="sku"
            name="sku"
            defaultValue={article?.sku ?? nextSku}
            required
            readOnly
            className="bg-muted/50 font-mono"
          />
          {!article && (
            <p className="text-[11px] text-muted-foreground">Wird automatisch vergeben</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="category">Kategorie *</Label>
          <Select
            name="category"
            defaultValue={article?.category ?? "MID_TIER"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(articleCategoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Einheit</Label>
          <Input
            id="unit"
            name="unit"
            defaultValue={article?.unit ?? "Stk"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStockLevel">Mindestbestand</Label>
          <Input
            id="minStockLevel"
            name="minStockLevel"
            type="number"
            min={0}
            defaultValue={article?.minStockLevel ?? 0}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="productGroup">Produktgruppe</Label>
          <Input
            id="productGroup"
            name="productGroup"
            defaultValue={article?.productGroup ?? ""}
            placeholder="z.B. Notebook, Monitor, Drucker"
            list="productGroup-suggestions"
          />
          {groupSuggestions && groupSuggestions.groups.length > 0 && (
            <datalist id="productGroup-suggestions">
              {groupSuggestions.groups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="productSubGroup">Unterkategorie</Label>
          <Input
            id="productSubGroup"
            name="productSubGroup"
            defaultValue={article?.productSubGroup ?? ""}
            placeholder="z.B. 14 Zoll, Bluetooth, USB-C"
            list="productSubGroup-suggestions"
          />
          {groupSuggestions && groupSuggestions.subGroups.length > 0 && (
            <datalist id="productSubGroup-suggestions">
              {groupSuggestions.subGroups.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="avgPurchasePrice">Durchschn. Einkaufspreis (netto, ohne MwSt.)</Label>
        <div className="relative">
          <Input
            id="avgPurchasePrice"
            name="avgPurchasePrice"
            type="number"
            min={0}
            step={0.01}
            defaultValue={article?.avgPurchasePrice != null ? Number(article.avgPurchasePrice) : ""}
            placeholder="0.00"
            className="pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">EUR</span>
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
          defaultValue={article?.description ?? ""}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notizen</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={article?.notes ?? ""}
          rows={2}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Speichern..."
            : article
              ? "Aktualisieren"
              : "Erstellen"}
        </Button>
        {!onSuccess && (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  );
}
