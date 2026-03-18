import { useState } from "react";
import { mockAssets, Asset } from "@/data/mockData";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Grid3X3, List, MapPin, TrendingUp, Trash2, Loader2 } from "lucide-react";
import ExcelImport from "@/components/ExcelImport";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAssets, useImportAssets, useDeleteAsset } from "@/hooks/useAssets";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

type ViewMode = "cards" | "table";

const Assets = () => {
  const [view, setView] = useState<ViewMode>("cards");
  const { data: dbAssets, isLoading } = useAssets();
  const importMutation = useImportAssets();
  const deleteMutation = useDeleteAsset();

  // Use DB assets if available, otherwise fall back to mock
  const assets = dbAssets && dbAssets.length > 0 ? dbAssets : mockAssets;

  const handleImport = (newAssets: Asset[]) => {
    importMutation.mutate(newAssets);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parc Immobilier</h1>
          <p className="text-sm text-muted-foreground mt-1">{assets.length} actifs sous gestion</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={view === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("cards")}
            className="h-8 px-3"
          >
            <Grid3X3 className="h-4 w-4 mr-1.5" />
            Cartes
          </Button>
          <Button
            variant={view === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
            className="h-8 px-3"
          >
            <List className="h-4 w-4 mr-1.5" />
            Tableau
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((asset, i) => {
            const vacancyRate = (asset.vacantSurface / asset.totalSurface * 100).toFixed(1);
            const hasUnpaid = asset.tenants.some(t => t.unpaid);
            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative group/card"
              >
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="absolute top-3 right-3 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity p-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive"
                      title="Supprimer cet actif"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer {asset.name} ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. L'actif sera définitivement supprimé du parc.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(asset.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Link
                  to={`/assets/${asset.id}`}
                  className="block kpi-card group hover:border-accent/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-accent" />
                    </div>
                    {hasUnpaid && <span className="badge-danger">Impayé</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">{asset.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />{asset.address}, {asset.city}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Loyer annuel</p>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(asset.annualRent)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Rendement</p>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-accent" />
                        {asset.yield}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Surface</p>
                      <p className="text-sm font-semibold text-foreground">{asset.totalSurface.toLocaleString("fr-FR")} m²</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Vacance</p>
                      <p className={`text-sm font-semibold ${+vacancyRate > 15 ? "text-destructive" : +vacancyRate > 8 ? "text-warning" : "text-success"}`}>
                        {vacancyRate}% ({asset.vacantSurface.toLocaleString("fr-FR")} m²)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="badge-neutral">{asset.type}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">Score risque</span>
                      <span className={`text-xs font-bold ${asset.riskScore >= 70 ? "text-destructive" : asset.riskScore >= 50 ? "text-warning" : "text-success"}`}>
                        {asset.riskScore}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actif</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Surface</TableHead>
                <TableHead className="text-right">Loyer annuel</TableHead>
                <TableHead className="text-right">Rendement</TableHead>
                <TableHead className="text-right">Vacance</TableHead>
                <TableHead className="text-right">Risque</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => {
                const vacancyRate = (asset.vacantSurface / asset.totalSurface * 100).toFixed(1);
                const hasUnpaid = asset.tenants.some(t => t.unpaid);
                return (
                  <TableRow key={asset.id} className="group">
                    <TableCell>
                      <Link to={`/assets/${asset.id}`} className="font-medium text-foreground group-hover:text-accent transition-colors">
                        {asset.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{asset.address}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{asset.city}</TableCell>
                    <TableCell><span className="badge-neutral">{asset.type}</span></TableCell>
                    <TableCell className="text-right font-medium">{asset.totalSurface.toLocaleString("fr-FR")} m²</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(asset.annualRent)}</TableCell>
                    <TableCell className="text-right font-medium">{asset.yield}%</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${+vacancyRate > 15 ? "text-destructive" : +vacancyRate > 8 ? "text-warning" : "text-success"}`}>
                        {vacancyRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold ${asset.riskScore >= 70 ? "text-destructive" : asset.riskScore >= 50 ? "text-warning" : "text-success"}`}>
                        {asset.riskScore}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {hasUnpaid && <span className="badge-danger">Impayé</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer {asset.name} ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. L'actif sera définitivement supprimé du parc.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(asset.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ExcelImport onImport={handleImport} />
    </div>
  );
};

export default Assets;
