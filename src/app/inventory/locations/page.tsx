import { MapPin } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getWarehouseLocations } from "@/queries/inventory";
import { LocationForm } from "@/components/inventory/location-form";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const locations = await getWarehouseLocations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lagerorte</h1>
        <LocationForm />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead className="text-right">Artikelzuordnungen</TableHead>
              <TableHead className="text-right">Seriennummern</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  <MapPin className="mx-auto mb-2 h-8 w-8" />
                  Keine Lagerorte vorhanden. Erstellen Sie den ersten Lagerort.
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {location.description ?? "–"}
                  </TableCell>
                  <TableCell className="text-right">
                    {location._count.stockLocations}
                  </TableCell>
                  <TableCell className="text-right">
                    {location._count.serialNumbers}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
