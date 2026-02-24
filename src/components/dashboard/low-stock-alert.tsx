import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LowStockArticle = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStockLevel: number;
  category: string;
};

export function LowStockAlert({ articles }: { articles: LowStockArticle[] }) {
  const visible = articles.slice(0, 5);

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <CardTitle className="text-base">Niedrige Lagerbestände</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {visible.map((article) => (
            <li key={article.id} className="flex items-center justify-between text-sm">
              <Link
                href={`/artikelverwaltung/${article.id}`}
                className="text-foreground hover:text-primary hover:underline"
              >
                {article.name}
              </Link>
              <span className="font-mono text-muted-foreground">
                {article.currentStock}/{article.minStockLevel} Stk
              </span>
            </li>
          ))}
        </ul>
        {articles.length > 5 && (
          <Link
            href="/lager"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Alle anzeigen &rarr;
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
