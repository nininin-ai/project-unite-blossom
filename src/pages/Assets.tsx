import { useState, useMemo } from "react";
import { mockAssets, Asset, getAssetLeases } from "@/data/mockData";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Grid3X3, List, MapPin, TrendingUp, Trash2, Loader2, Filter, Search, X } from "lucide-react";
import AddAssetDialog from "@/components/AddAssetDialog";
import ImportExcelDialog from "@/components/ImportExcelDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAssets, useDeleteAsset } from "@/hooks/useAssets";
import { useCompanies } from "@/hooks/useCompanies";
import { usePortfolios, useCreatePortfolio } from "@/hooks/usePortfolios";
import PortfolioDialog from "@/components/PortfolioDialog";
import { FolderKanban } from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

const ASSET_TYPES = ["Bureau", "Commerce", "Résidentiel", "Logistique", "Mixte"];

type ViewMode = "cards" | "table";

const Assets = () => {
  const [view, setView] = useState<ViewMode>("cards");
  const { data: dbAssets, isLoading } = useAssets();
  const { data: companies = [] } = useCompanies();
  const { data: portfolios = [] } = usePortfolios();
  const createPortfolio = useCreatePortfolio();
  const deleteMutation = useDeleteAsset();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [vacancyOnly, setVacancyOnly] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);

  const assets = dbAssets && dbAssets.length > 0 ? dbAssets : mockAssets;

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(a.type)) return false;
      if (vacancyOnly && a.vacantSurface <= 0) return false;
      if (keyword.trim()) {
        const kw = keyword.toLowerCase();
        const searchable = `${a.name} ${a.address} ${a.city} ${a.type}`.toLowerCase();
        if (!searchable.includes(kw)) return false;
      }
      return true;
    });
  }, [assets, selectedTypes, vacancyOnly, keyword]);

  const toggleType = (t: string) => {
    setSelectedTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const hasActiveFilters = selectedTypes.length > 0 || vacancyOnly || keyword.trim().length > 0;

  const handleDelete = (id: string) => { deleteMutation.mutate(id); };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parc Immobilier</h1>
          <p className="text-sm text-muted-foreground mt-1">{assets.length} actifs sous gestion</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setPortfolioDialogOpen(true)}>
            <FolderKanban className="h-3.5 w-3.5" />Portefeuille
          </Button>
          <ImportExcelDialog />
          <AddAssetDialog />
        </div>
      </div>

      {/* View toggles + Filter button */}
      <div className="flex items-center gap-2 flex-wrap">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={view === "cards" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("cards")}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cartes</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={view === "table" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("table")}>
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tableau</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant={showFilters ? "default" : "ghost"}
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter className="h-4 w-4" />
          Filtres
          {hasActiveFilters && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{selectedTypes.length + (vacancyOnly ? 1 : 0) + (keyword.trim() ? 1 : 0)}</Badge>}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => { setSelectedTypes([]); setVacancyOnly(false); setKeyword(""); }}>
            <X className="h-3 w-3 mr-1" /> Réinitialiser
          </Button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 p-4 rounded-lg border border-border bg-card">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type d'actif</p>
            <div className="flex flex-wrap gap-2">
              {ASSET_TYPES.map((t) => (
                <Button key={t} variant={selectedTypes.includes(t) ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => toggleType(t)}>
                  {t}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={vacancyOnly} onChange={(e) => setVacancyOnly(e.target.checked)} className="rounded border-border" />
              <span className="text-sm text-foreground">Vacance &gt; 0 uniquement</span>
            </label>
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher (adresse, ville, nom…)" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="pl-9 h-8 text-sm" />
          </div>
        </motion.div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Aucun actif ne correspond aux filtres</p>
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset, i) => {
            const vacancyRate = asset.totalSurface > 0 ? (asset.vacantSurface / asset.totalSurface * 100).toFixed(1) : "0.0";
            const leases = getAssetLeases(asset);
            const hasUnpaid = leases.some(l => l.unpaid);
            return (
              <motion.div key={asset.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="relative group/card">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="absolute top-3 right-3 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity p-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive" title="Supprimer cet actif">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer {asset.name} ?</AlertDialogTitle>
                      <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(asset.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Link to={`/assets/${asset.id}`} className="block kpi-card group hover:border-accent/30 transition-all">
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
                        {vacancyRate}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="badge-neutral">{asset.type}</span>
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
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => {
                const vacancyRate = asset.totalSurface > 0 ? (asset.vacantSurface / asset.totalSurface * 100).toFixed(1) : "0.0";
                const leases = getAssetLeases(asset);
                const hasUnpaid = leases.some(l => l.unpaid);
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
                    <TableCell className="text-center">
                      {hasUnpaid && <span className="badge-danger">Impayé</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Supprimer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer {asset.name} ?</AlertDialogTitle>
                            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(asset.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
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

      <PortfolioDialog
        open={portfolioDialogOpen}
        onOpenChange={setPortfolioDialogOpen}
        portfolio={null}
        assets={assets}
        companies={companies}
        onSave={(name, assetIds) => {
          createPortfolio.mutate({ name, assetIds }, { onSuccess: () => setPortfolioDialogOpen(false) });
        }}
        saving={createPortfolio.isPending}
      />
    </div>
  );
};

export default Assets;
