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
  unit: string;
  minStockLevel: number;
  targetStockLevel: number | null;
  notes: string | null;
};

export function ArticleForm({
  article,
  onSuccess,
}: {
  article?: ArticleData;
  onSuccess?: () => void;
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
          <Label htmlFor="sku">Artikelnummer *</Label>
          <Input
            id="sku"
            name="sku"
            defaultValue={article?.sku}
            placeholder="ART-001"
            required
            disabled={!!article}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="category">Kategorie *</Label>
          <Select
            name="category"
            defaultValue={article?.category ?? "STANDARD"}
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

      <div className="space-y-2">
        <Label htmlFor="targetStockLevel">Zielbestand (optional)</Label>
        <Input
          id="targetStockLevel"
          name="targetStockLevel"
          type="number"
          min={0}
          defaultValue={article?.targetStockLevel ?? ""}
        />
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
