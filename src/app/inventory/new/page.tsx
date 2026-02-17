import { ArticleForm } from "@/components/inventory/article-form";

export default function NewArticlePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Neuer Artikel</h1>
      <ArticleForm />
    </div>
  );
}
