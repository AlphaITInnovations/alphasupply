export const dynamic = "force-dynamic";

export default async function ArtikeldetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Artikeldetail</h1>
        <p className="text-muted-foreground">Artikel {id}</p>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        In Entwicklung...
      </div>
    </div>
  );
}
