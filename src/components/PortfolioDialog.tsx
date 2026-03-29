import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Filter } from "lucide-react";
import { Asset } from "@/data/mockData";
import { Portfolio } from "@/hooks/usePortfolios";
import { Company } from "@/hooks/useCompanies";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio?: Portfolio | null; // null = create mode
  assets: Asset[];
  companies: Company[];
  onSave: (name: string, assetIds: string[]) => void;
  saving?: boolean;
}

const ASSET_TYPES = ["Bureau", "Commerce", "Résidentiel", "Logistique", "Mixte"];

const PortfolioDialog = ({ open, onOpenChange, portfolio, assets, companies, onSave, saving }: Props) => {
  const [name, setName] = useState(portfolio?.name ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set(portfolio?.assetIds ?? []));
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterCity, setFilterCity] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [showQuickFilters, setShowQuickFilters] = useState(false);

  // Reset state when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setName(portfolio?.name ?? "");
      setSelected(new Set(portfolio?.assetIds ?? []));
      setSearch("");
      setFilterType([]);
      setFilterCity("");
      setFilterCompany("");
    }
    onOpenChange(o);
  };

  const cities = useMemo(() => [...new Set(assets.map((a) => a.city))].sort(), [assets]);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (filterType.length > 0 && !filterType.includes(a.type)) return false;
      if (filterCity && a.city !== filterCity) return false;
      if (filterCompany && a.companyId !== filterCompany) return false;
      if (search.trim()) {
        const kw = search.toLowerCase();
        const s = `${a.name} ${a.address} ${a.city} ${a.type}`.toLowerCase();
        if (!s.includes(kw)) return false;
      }
      return true;
    });
  }, [assets, filterType, filterCity, filterCompany, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((a) => next.add(a.id));
      return next;
    });
  };

  const deselectAll = () => setSelected(new Set());

  const getCompanyName = (id?: string) => {
    if (!id) return null;
    return companies.find((c) => c.id === id)?.name ?? null;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{portfolio ? "Modifier le portefeuille" : "Créer un portefeuille"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0 overflow-hidden flex flex-col">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Nom du portefeuille *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Bureaux Île-de-France" />
          </div>

          {/* Asset selector */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">
                Sélection d'actifs <Badge variant="secondary" className="ml-1">{selected.size}</Badge>
              </p>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowQuickFilters((v) => !v)}>
                  <Filter className="h-3 w-3 mr-1" />Filtres rapides
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectFiltered}>
                  Tout cocher
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={deselectAll}>
                  Tout décocher
                </Button>
              </div>
            </div>

            {/* Quick filters (P1) */}
            {showQuickFilters && (
              <div className="p-3 rounded-lg border border-border bg-muted/30 mb-2 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {ASSET_TYPES.map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant={filterType.includes(t) ? "default" : "outline"}
                      className="h-6 text-xs"
                      onClick={() => setFilterType((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    className="h-7 text-xs rounded border border-border bg-background px-2 flex-1"
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                  >
                    <option value="">Toutes les villes</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    className="h-7 text-xs rounded border border-border bg-background px-2 flex-1"
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                  >
                    <option value="">Toutes les sociétés</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un actif…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
            </div>

            {/* List */}
            <div className="flex-1 min-h-0 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Building2 className="h-6 w-6 mb-2 opacity-40" />
                  <p className="text-sm">Aucun actif trouvé</p>
                </div>
              ) : (
                filtered.map((asset) => {
                  const companyName = getCompanyName(asset.companyId);
                  return (
                    <label key={asset.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 cursor-pointer transition">
                      <Checkbox checked={selected.has(asset.id)} onCheckedChange={() => toggle(asset.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{asset.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{asset.city}</span>
                          <Badge variant="outline" className="text-[10px] h-4">{asset.type}</Badge>
                          {companyName && <span className="text-[10px] text-muted-foreground">• {companyName}</span>}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>Annuler</Button>
          <Button onClick={() => onSave(name, [...selected])} disabled={!name.trim() || saving}>
            {saving ? "Enregistrement…" : portfolio ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PortfolioDialog;
