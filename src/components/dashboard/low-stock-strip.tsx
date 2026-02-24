import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export function LowStockStrip({
  articles,
}: {
  articles: {
    id: string;
    name: string;
    currentStock: number;
    minStockLevel: number;
  }[];
}) {
  if (articles.length === 0) return null;

  const visible = articles.slice(0, 3);
  const remaining = articles.length - visible.length;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200/50 bg-amber-50/50 px-4 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
      <span className="shrink-0 text-sm font-medium text-amber-700 dark:text-amber-400">
        {articles.length} Artikel unter Mindestbestand
      </span>
      <div className="flex items-center gap-2 overflow-x-auto">
        {visible.map((a) => (
          <Link
            key={a.id}
            href={`/inventory/${a.id}`}
            className="shrink-0 rounded-md bg-amber-100/80 px-2 py-0.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200/80 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60"
          >
            {a.name} {a.currentStock}/{a.minStockLevel}
          </Link>
        ))}
        {remaining > 0 && (
          <Link
            href="/inventory/stock"
            className="shrink-0 rounded-md bg-amber-100/80 px-2 py-0.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200/80 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60"
          >
            +{remaining} mehr
          </Link>
        )}
      </div>
    </div>
  );
}
