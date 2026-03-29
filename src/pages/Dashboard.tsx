import { useState, useMemo } from "react";
import { useAssets } from "@/hooks/useAssets";
import { useCompanies } from "@/hooks/useCompanies";
import { usePortfolios, useCreatePortfolio, useUpdatePortfolio, useDeletePortfolio, Portfolio, WidgetConfig } from "@/hooks/usePortfolios";
import { mockAssets, getAssetLeases } from "@/data/mockData";
import { useFundTargets } from "@/hooks/useFundTargets";
import FundTargetsPopover from "@/components/FundTargetsPopover";
import PortfolioDialog from "@/components/PortfolioDialog";
import PortfolioWidgetConfig from "@/components/PortfolioWidgetConfig";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Building2, Calendar, TrendingUp, Info, Plus, Settings2, Pencil, Trash2, FolderKanban } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <Info className="h-8 w-8 text-muted-foreground/50 mb-2" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

const SESSION_KEY = "dashboard_portfolio_id";

const Dashboard = () => {
  const { data: assets, isLoading } = useAssets();
  const { data: companies = [] } = useCompanies();
  const { data: portfolios = [], isLoading: loadingPortfolios } = usePortfolios();
  const createPortfolio = useCreatePortfolio();
  const updatePortfolio = useUpdatePortfolio();
  const deletePortfolio = useDeletePortfolio();
  const navigate = useNavigate();
  const { targets: fundTargets, updateTargets } = useFundTargets();

  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(() => sessionStorage.getItem(SESSION_KEY) || "all");
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [widgetConfigOpen, setWidgetConfigOpen] = useState(false);

  const handlePortfolioChange = (v: string) => {
    setSelectedPortfolioId(v);
    sessionStorage.setItem(SESSION_KEY, v);
  };

  const selectedPortfolio = portfolios.find((p) => p.id === selectedPortfolioId) ?? null;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div><h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1><p className="text-sm text-muted-foreground mt-1">Chargement…</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      </div>
    );
  }

  const allAssets = assets && assets.length > 0 ? assets : mockAssets;
  const isDemo = !assets || assets.length === 0;

  // Filter by portfolio
  const safeAssets = selectedPortfolio
    ? allAssets.filter((a) => selectedPortfolio.assetIds.includes(a.id))
    : allAssets;

  // Global stats for delta comparison (P1)
  const globalTotalValue = allAssets.reduce((s, a) => s + a.acquisitionPrice, 0);
  const globalYield = globalTotalValue > 0 ? allAssets.reduce((s, a) => s + a.yield * a.acquisitionPrice, 0) / globalTotalValue : 0;
  const globalTotalSurface = allAssets.reduce((s, a) => s + a.totalSurface, 0);
  const globalVacantSurface = allAssets.reduce((s, a) => s + a.vacantSurface, 0);
  const globalVacancy = globalTotalSurface > 0 ? (globalVacantSurface / globalTotalSurface) * 100 : 0;
  const globalRent = allAssets.reduce((s, a) => s + a.annualRent, 0);

  const totalRent = safeAssets.reduce((s, a) => s + a.annualRent, 0);
  const totalValue = safeAssets.reduce((s, a) => s + a.acquisitionPrice, 0);
  const triPondere = totalValue > 0 ? safeAssets.reduce((s, a) => s + a.yield * a.acquisitionPrice, 0) / totalValue : 0;
  const rendementPondere = triPondere;
  const totalSurface = safeAssets.reduce((s, a) => s + a.totalSurface, 0);
  const totalVacantSurface = safeAssets.reduce((s, a) => s + a.vacantSurface, 0);
  const vacancePonderee = totalSurface > 0 ? (totalVacantSurface / totalSurface) * 100 : 0;

  const ecartRendement = rendementPondere - fundTargets.yieldTarget;
  const ecartVacance = vacancePonderee - fundTargets.vacancyTarget;

  const showDelta = selectedPortfolio !== null;
  const deltaValue = showDelta ? totalValue - globalTotalValue : 0;
  const deltaRent = showDelta ? totalRent - globalRent : 0;
  const deltaYield = showDelta ? triPondere - globalYield : 0;
  const deltaVacancy = showDelta ? vacancePonderee - globalVacancy : 0;

  const allLeases = safeAssets.flatMap(a => getAssetLeases(a).map(l => ({ ...l, assetName: a.name, assetId: a.id })));
  const upcomingLeases = allLeases.filter(l => l.endDate).sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()).slice(0, 5);
  const hasLeases = upcomingLeases.length > 0;

  const assetsWithYield = safeAssets.filter(a => a.yield > 0);
  const yieldData = assetsWithYield.map(a => ({ name: a.name.length > 16 ? a.name.slice(0, 16) + "…" : a.name, rendement: a.yield }));
  const hasYieldData = yieldData.length > 0;

  const typeGroups = safeAssets.reduce<Record<string, number>>((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {});
  const typeData = Object.entries(typeGroups).map(([name, value]) => ({ name, value }));

  const cityGroups = safeAssets.reduce<Record<string, number>>((acc, a) => { acc[a.city] = (acc[a.city] || 0) + 1; return acc; }, {});
  const cityData = Object.entries(cityGroups).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const COLORS = ["hsl(187,72%,40%)", "hsl(220,55%,18%)", "hsl(152,60%,40%)", "hsl(45,80%,50%)", "hsl(280,50%,50%)", "hsl(340,60%,50%)", "hsl(30,70%,50%)"];

  const wc = selectedPortfolio?.widgetConfig ?? { kpis: true, typeChart: true, cityChart: true, performanceChart: true, leases: true, alerts: true, topYield: true, topVacancy: true };

  const DeltaBadge = ({ value, suffix = "", invert = false }: { value: number; suffix?: string; invert?: boolean }) => {
    if (!showDelta) return null;
    const positive = invert ? value <= 0 : value >= 0;
    return (
      <span className={`text-[10px] font-medium ${positive ? "text-success" : "text-destructive"}`}>
        {value >= 0 ? "+" : ""}{suffix === "%" ? value.toFixed(1) : suffix === "pts" ? value.toFixed(2) : formatCurrency(value)} {suffix} vs global
      </span>
    );
  };

  const kpis = [
    { label: "Valeur sous gestion", value: formatCurrency(totalValue), icon: Building2, trend: `${safeAssets.length} actif${safeAssets.length > 1 ? "s" : ""}`, positive: true, delta: deltaValue, deltaSuffix: "" },
    { label: "Loyers annualisés", value: formatCurrency(totalRent), icon: TrendingUp, trend: totalRent > 0 ? "Actif" : "Aucun loyer", positive: totalRent > 0, delta: deltaRent, deltaSuffix: "" },
    { label: "TRI moyen pondéré", value: `${triPondere.toFixed(1)}%`, icon: TrendingUp, trend: triPondere > fundTargets.yieldTarget ? "Au-dessus cible" : triPondere > 0 ? "Sous cible" : "Non renseigné", positive: triPondere > fundTargets.yieldTarget, delta: deltaYield, deltaSuffix: "pts" },
    { label: "Vacance pondérée", value: `${vacancePonderee.toFixed(1)}%`, icon: AlertTriangle, trend: vacancePonderee <= fundTargets.vacancyTarget ? "Sous cible" : "Au-dessus cible", positive: vacancePonderee <= fundTargets.vacancyTarget, delta: deltaVacancy, deltaSuffix: "%", invert: true },
  ];

  const handleSavePortfolio = (name: string, assetIds: string[]) => {
    if (editingPortfolio) {
      updatePortfolio.mutate({ id: editingPortfolio.id, name, assetIds }, { onSuccess: () => setPortfolioDialogOpen(false) });
    } else {
      createPortfolio.mutate({ name, assetIds }, { onSuccess: () => setPortfolioDialogOpen(false) });
    }
  };

  const handleDeletePortfolio = () => {
    if (!deleteConfirmId) return;
    deletePortfolio.mutate(deleteConfirmId, {
      onSuccess: () => {
        if (selectedPortfolioId === deleteConfirmId) handlePortfolioChange("all");
        setDeleteConfirmId(null);
      },
    });
  };

  const handleWidgetSave = (config: WidgetConfig) => {
    if (selectedPortfolio) {
      updatePortfolio.mutate({ id: selectedPortfolio.id, widgetConfig: config });
    }
  };

  // Top 5 by yield
  const topYield = [...safeAssets].sort((a, b) => b.yield - a.yield).slice(0, 5);
  const topVacancy = [...safeAssets].map(a => ({ ...a, vacRate: a.totalSurface > 0 ? (a.vacantSurface / a.totalSurface) * 100 : 0 })).sort((a, b) => b.vacRate - a.vacRate).filter(a => a.vacRate > 0).slice(0, 5);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header + Portfolio selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble du parc et du pipeline d'investissement</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedPortfolioId} onValueChange={handlePortfolioChange}>
              <SelectTrigger className="h-8 w-[200px] text-sm">
                <SelectValue placeholder="Tous les actifs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les actifs</SelectItem>
                {portfolios.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPortfolio && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier le portefeuille" onClick={() => { setEditingPortfolio(selectedPortfolio); setPortfolioDialogOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Supprimer le portefeuille" onClick={() => setDeleteConfirmId(selectedPortfolio.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Personnaliser les widgets" onClick={() => setWidgetConfigOpen(true)}>
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => { setEditingPortfolio(null); setPortfolioDialogOpen(true); }}>
            <Plus className="h-3.5 w-3.5" />Portefeuille
          </Button>
        </div>
      </div>

      {isDemo && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-accent/30 bg-accent/5 p-4 flex items-center gap-3">
          <Building2 className="h-5 w-5 text-accent shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Données de démonstration</p>
            <p className="text-xs text-muted-foreground">
              Ajoutez vos premiers actifs pour remplacer ces exemples par vos données réelles.{" "}
              <button onClick={() => navigate("/assets")} className="text-accent hover:underline font-medium">Ajouter un actif →</button>
            </p>
          </div>
        </motion.div>
      )}

      {selectedPortfolio && safeAssets.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <FolderKanban className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Ce portefeuille ne contient aucun actif.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => { setEditingPortfolio(selectedPortfolio); setPortfolioDialogOpen(true); }}>
            Ajouter des actifs
          </Button>
        </div>
      )}

      {/* KPIs */}
      {wc.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="kpi-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                <kpi.icon className="h-4 w-4 text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <div className="flex items-center gap-1 mt-2">
                {kpi.positive ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
                <span className={`text-xs font-medium ${kpi.positive ? "text-success" : "text-destructive"}`}>{kpi.trend}</span>
              </div>
              {showDelta && (
                <div className="mt-1">
                  <DeltaBadge value={kpi.delta} suffix={kpi.deltaSuffix} invert={(kpi as any).invert} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Parc Actif vs Cible Fonds */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="kpi-card">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-foreground">Parc Actif vs Cible Fonds</h3>
          <FundTargetsPopover targets={fundTargets} onUpdate={updateTargets} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Parc actuel</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Rendement moyen pondéré</p>
                <p className="text-lg font-bold text-foreground">{rendementPondere.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vacance moyenne pondérée</p>
                <p className="text-lg font-bold text-foreground">{vacancePonderee.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 border-x border-border/50 px-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Cible fonds</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Rendement cible</p>
                <p className="text-lg font-bold text-foreground">{fundTargets.yieldTarget.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vacance cible</p>
                <p className="text-lg font-bold text-foreground">{fundTargets.vacancyTarget.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Écart</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Écart rendement</p>
                <p className={`text-lg font-bold ${ecartRendement >= 0 ? "text-success" : "text-destructive"}`}>
                  {ecartRendement >= 0 ? "+" : ""}{ecartRendement.toFixed(2)} pts
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Écart vacance</p>
                <p className={`text-lg font-bold ${ecartVacance <= 0 ? "text-success" : "text-destructive"}`}>
                  {ecartVacance >= 0 ? "+" : ""}{ecartVacance.toFixed(1)} pts
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {wc.performanceChart && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="kpi-card lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-4">Performance par actif vs cible fonds</h3>
            {hasYieldData ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={yieldData}>
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(187,72%,40%)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(187,72%,40%)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} domain={[0, 'auto']} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,15%,90%)", fontSize: 12 }} />
                  <ReferenceLine y={fundTargets.yieldTarget} stroke="hsl(0,72%,51%)" strokeDasharray="8 5" strokeWidth={2} label={{ value: `Cible ${fundTargets.yieldTarget}%`, position: "right", fontSize: 11, fill: "hsl(0,72%,51%)" }} />
                  <Area type="monotone" dataKey="rendement" stroke="hsl(187,72%,40%)" strokeWidth={2.5} fill="url(#areaFill)" name="Rendement actif (%)" dot={{ r: 3, fill: "hsl(187,72%,40%)" }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Renseignez le rendement (yield) de vos actifs pour afficher ce graphique." />
            )}
          </motion.div>
        )}

        {wc.typeChart && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par type</h3>
            {typeData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2 flex-wrap">
                  {typeData.map((t, i) => (
                    <div key={t.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      {t.name}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState message="Ajoutez des actifs pour voir la répartition par type." />
            )}
          </motion.div>
        )}
      </div>

      {/* City chart */}
      {wc.cityChart && cityData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par ville</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={cityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {cityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 flex-wrap">
            {cityData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {c.name}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top yield + Top vacancy */}
      {(wc.topYield || wc.topVacancy) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {wc.topYield && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="kpi-card">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />Top 5 rendements
              </h3>
              {topYield.length > 0 ? (
                <div className="space-y-2">
                  {topYield.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1 transition" onClick={() => navigate(`/assets/${a.id}`)}>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.city} • {a.type}</p>
                      </div>
                      <span className="text-sm font-bold text-success">{a.yield.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="Aucun actif avec rendement renseigné." />}
            </motion.div>
          )}
          {wc.topVacancy && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="kpi-card">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />Top 5 vacance
              </h3>
              {topVacancy.length > 0 ? (
                <div className="space-y-2">
                  {topVacancy.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1 transition" onClick={() => navigate(`/assets/${a.id}`)}>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.city} • {a.type}</p>
                      </div>
                      <span className={`text-sm font-bold ${a.vacRate > 15 ? "text-destructive" : a.vacRate > 8 ? "text-warning" : "text-success"}`}>{a.vacRate.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="Aucun actif avec vacance." />}
            </motion.div>
          )}
        </div>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {wc.leases && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />Prochaines échéances de baux
            </h3>
            {hasLeases ? (
              <div className="space-y-3">
                {upcomingLeases.map((lease, idx) => {
                  const daysLeft = Math.ceil((new Date(lease.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={lease.id || idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{lease.tenantName}</p>
                        <p className="text-xs text-muted-foreground">{lease.assetName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{new Date(lease.endDate).toLocaleDateString("fr-FR")}</p>
                        <span className={daysLeft < 180 ? "badge-danger" : daysLeft < 365 ? "badge-warning" : "badge-neutral"}>
                          {daysLeft < 0 ? "Expiré" : `${daysLeft}j`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="Ajoutez des locataires à vos actifs pour voir les prochaines échéances." />
            )}
          </motion.div>
        )}

        {wc.alerts && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />Alertes de risque
            </h3>
            <div className="space-y-3">
              {safeAssets.map(asset => {
                const leases = getAssetLeases(asset);
                if (leases.length === 0) return null;
                const alerts: { text: string; level: "danger" | "warning" }[] = [];
                const topLease = leases.reduce((a, b) => a.currentRent > b.currentRent ? a : b);
                if (asset.annualRent > 0) {
                  const dependency = topLease.currentRent / asset.annualRent * 100;
                  if (dependency > 40) alerts.push({ text: `Dépendance locataire ${dependency.toFixed(0)}% (${topLease.tenantName})`, level: "danger" });
                }
                leases.forEach(l => {
                  if (!l.endDate) return;
                  const days = Math.ceil((new Date(l.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  if (days < 180 && days > 0) alerts.push({ text: `Échéance < 6 mois : ${l.tenantName}`, level: "warning" });
                });
                if (leases.some(l => l.unpaid)) alerts.push({ text: "Impayé existant", level: "danger" });
                if (alerts.length === 0) return null;
                return (
                  <div key={asset.id} className="py-2 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1 transition" onClick={() => navigate(`/assets/${asset.id}`)}>
                    <p className="text-sm font-medium text-foreground mb-1.5">{asset.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {alerts.map((a, i) => (
                        <span key={i} className={a.level === "danger" ? "badge-danger" : "badge-warning"}>{a.text}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {safeAssets.every(a => getAssetLeases(a).length === 0) && (
                <EmptyState message="Ajoutez des locataires pour détecter les alertes de risque automatiquement." />
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Portfolio Dialog */}
      <PortfolioDialog
        open={portfolioDialogOpen}
        onOpenChange={setPortfolioDialogOpen}
        portfolio={editingPortfolio}
        assets={allAssets}
        companies={companies}
        onSave={handleSavePortfolio}
        saving={createPortfolio.isPending || updatePortfolio.isPending}
      />

      {/* Widget Config Dialog */}
      {selectedPortfolio && (
        <PortfolioWidgetConfig
          open={widgetConfigOpen}
          onOpenChange={setWidgetConfigOpen}
          config={selectedPortfolio.widgetConfig}
          onSave={handleWidgetSave}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce portefeuille ?</AlertDialogTitle>
            <AlertDialogDescription>Le portefeuille sera supprimé, mais les actifs qu'il contient ne seront pas affectés.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePortfolio} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
