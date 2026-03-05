import { mockDeals, DEAL_STAGES, DEAL_FLOW_STATUSES, type Deal, type DealStage, type DealFlowStatus } from "@/data/mockData";
import { getAutoPriority } from "@/lib/dealUtils";
import { motion } from "framer-motion";
import { BarChart3, Calendar, Check, ChevronDown, Download, Filter, Kanban, List, Target, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

const priorityBadge = (p: Deal["priority"]) => { if (p === "Élevée") return "badge-danger"; if (p === "Moyenne") return "badge-warning"; return "badge-neutral"; };
const statusBadge = (s: Deal["status"]) => { if (s === "Éligible") return "badge-success"; if (s === "Non éligible") return "badge-danger"; return "badge-accent"; };
const dealStatusBadge = (s: DealFlowStatus) => { if (s === "Nouveau deal") return "badge-accent"; if (s === "En analyse") return "badge-warning"; if (s === "Étudié") return "badge-success"; return "badge-neutral"; };

const DealFlow = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [stageFilter, setStageFilter] = useState<DealStage | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "Élevée" | "Moyenne" | "Faible">("all");
  const [dealStatusFilter, setDealStatusFilter] = useState<DealFlowStatus | "all">("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());

  const enrichedDeals = useMemo(() => mockDeals.map(d => ({ ...d, autoPriority: getAutoPriority(d.receptionDate) })), []);
  const years = useMemo(() => { const ySet = new Set<string>(); enrichedDeals.forEach(d => { if (d.receptionDate) ySet.add(new Date(d.receptionDate).getFullYear().toString()); }); return Array.from(ySet).sort().reverse(); }, [enrichedDeals]);
  const filtered = useMemo(() => enrichedDeals.filter(d => { if (stageFilter !== "all" && d.stage !== stageFilter) return false; if (priorityFilter !== "all" && d.autoPriority !== priorityFilter) return false; if (dealStatusFilter !== "all" && d.dealStatus !== dealStatusFilter) return false; if (yearFilter !== "all" && d.receptionDate && new Date(d.receptionDate).getFullYear().toString() !== yearFilter) return false; return true; }), [enrichedDeals, stageFilter, priorityFilter, dealStatusFilter, yearFilter]);

  const eligible = enrichedDeals.filter(d => d.status !== "Non éligible");
  const totalPipeline = eligible.reduce((s, d) => s + d.amount, 0);
  const avgYield = eligible.reduce((s, d) => s + d.yield * d.amount, 0) / totalPipeline;
  const eligibilityRate = (enrichedDeals.filter(d => d.status === "Éligible").length / enrichedDeals.length * 100);

  const kpis = [
    { label: "Pipeline total", value: formatCurrency(totalPipeline), icon: BarChart3, sub: `${eligible.length} deals actifs` },
    { label: "Taux rendement moyen", value: `${avgYield.toFixed(1)}%`, icon: TrendingUp, sub: "Pondéré par montant" },
    { label: "Taux d'éligibilité", value: `${eligibilityRate.toFixed(0)}%`, icon: Target, sub: `${enrichedDeals.filter(d => d.status === "Éligible").length} deals éligibles` },
    { label: "Deals en pipeline", value: `${enrichedDeals.length}`, icon: Calendar, sub: "Toutes étapes" },
  ];

  const toggleSelect = (id: string) => { setSelectedDeals(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const toggleAll = () => { if (selectedDeals.size === filtered.length) setSelectedDeals(new Set()); else setSelectedDeals(new Set(filtered.map(d => d.id))); };

  const handleExportPDF = () => {
    const selected = enrichedDeals.filter(d => selectedDeals.has(d.id));
    selected.forEach((deal) => {
      window.open(`/deals/${deal.id}`, '_blank');
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-foreground">Deal Flow</h1><p className="text-sm text-muted-foreground mt-1">Pipeline d'investissement • {enrichedDeals.length} opportunités</p></div>
        <div className="flex items-center gap-2">
          {selectedDeals.size > 0 && <button onClick={handleExportPDF} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"><Download className="h-4 w-4" />One Pager {selectedDeals.size > 1 ? `(${selectedDeals.size})` : ""}</button>}
          <button onClick={() => setView("table")} className={`p-2 rounded-lg transition-colors ${view === "table" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}><List className="h-4 w-4" /></button>
          <button onClick={() => setView("kanban")} className={`p-2 rounded-lg transition-colors ${view === "kanban" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}><Kanban className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (<motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="kpi-card"><div className="flex items-center justify-between mb-2"><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span><kpi.icon className="h-3.5 w-3.5 text-accent" /></div><p className="text-xl font-bold text-foreground">{kpi.value}</p><p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p></motion.div>))}
      </div>
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"><Filter className="h-4 w-4 text-muted-foreground" />Filtres<ChevronDown className="h-4 w-4 text-muted-foreground" /></CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          <div className="flex items-center gap-2 flex-wrap"><span className="text-xs font-medium text-muted-foreground w-16">Étape</span><button onClick={() => setStageFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${stageFilter === "all" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>Tous</button>{DEAL_STAGES.map(stage => (<button key={stage} onClick={() => setStageFilter(stage)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${stageFilter === stage ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{stage}</button>))}</div>
          <div className="flex items-center gap-2 flex-wrap"><span className="text-xs font-medium text-muted-foreground w-16">Priorité</span><button onClick={() => setPriorityFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${priorityFilter === "all" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>Toutes</button>{(["Élevée", "Moyenne", "Faible"] as const).map(p => (<button key={p} onClick={() => setPriorityFilter(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${priorityFilter === p ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{p}</button>))}</div>
          <div className="flex items-center gap-2 flex-wrap"><span className="text-xs font-medium text-muted-foreground w-16">Statut</span><button onClick={() => setDealStatusFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dealStatusFilter === "all" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>Tous</button>{DEAL_FLOW_STATUSES.map(s => (<button key={s} onClick={() => setDealStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dealStatusFilter === s ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{s}</button>))}</div>
          <div className="flex items-center gap-2 flex-wrap"><span className="text-xs font-medium text-muted-foreground w-16">Année</span><button onClick={() => setYearFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${yearFilter === "all" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>Toutes</button>{years.map(y => (<button key={y} onClick={() => setYearFilter(y)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${yearFilter === y ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{y}</button>))}</div>
        </CollapsibleContent>
      </Collapsible>
      {view === "table" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kpi-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border"><th className="table-header py-3 px-3"><Checkbox checked={selectedDeals.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></th>{["Code", "Opportunité", "Étape", "Statut DF", "Priorité", "Rendement", "Montant", "Broker", "Réception"].map(h => (<th key={h} className="table-header text-left py-3 px-3 whitespace-nowrap">{h}</th>))}</tr></thead>
            <tbody>{filtered.map(deal => (<tr key={deal.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"><td className="py-3 px-3" onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedDeals.has(deal.id)} onCheckedChange={() => toggleSelect(deal.id)} /></td><td className="py-3 px-3 font-mono text-xs text-muted-foreground" onClick={() => navigate(`/deals/${deal.id}`)}>{deal.code}</td><td className="py-3 px-3" onClick={() => navigate(`/deals/${deal.id}`)}><p className="font-medium text-foreground">{deal.opportunity}</p><p className="text-xs text-muted-foreground">{deal.city}</p></td><td className="py-3 px-3" onClick={() => navigate(`/deals/${deal.id}`)}><span className="badge-accent">{deal.stage}</span></td><td className="py-3 px-3" onClick={() => navigate(`/deals/${deal.id}`)}><span className={dealStatusBadge(deal.dealStatus)}>{deal.dealStatus}</span></td><td className="py-3 px-3" onClick={() => navigate(`/deals/${deal.id}`)}><span className={priorityBadge(deal.autoPriority)}>{deal.autoPriority}</span></td><td className="py-3 px-3 font-semibold text-foreground" onClick={() => navigate(`/deals/${deal.id}`)}>{deal.yield.toFixed(1)}%</td><td className="py-3 px-3 text-foreground" onClick={() => navigate(`/deals/${deal.id}`)}>{formatCurrency(deal.amount)}</td><td className="py-3 px-3 text-xs text-muted-foreground" onClick={() => navigate(`/deals/${deal.id}`)}>{deal.broker || "–"}</td><td className="py-3 px-3 text-muted-foreground" onClick={() => navigate(`/deals/${deal.id}`)}>{deal.receptionDate ? new Date(deal.receptionDate).toLocaleDateString("fr-FR") : "–"}</td></tr>))}</tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Aucun deal ne correspond aux filtres sélectionnés.</p>}
        </motion.div>
      )}
      {view === "kanban" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 overflow-x-auto pb-4">
          {DEAL_STAGES.map(stage => { const stageDeals = filtered.filter(d => d.stage === stage); return (<div key={stage} className="min-w-[260px] flex-shrink-0"><div className="flex items-center justify-between mb-3 px-1"><h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stage}</h3><span className="text-xs font-bold text-muted-foreground bg-muted rounded-full h-5 w-5 flex items-center justify-center">{stageDeals.length}</span></div><div className="space-y-2">{stageDeals.map(deal => (<div key={deal.id} onClick={() => navigate(`/deals/${deal.id}`)} className="kpi-card !p-4 space-y-2 cursor-pointer hover:border-accent/30 transition-colors"><div className="flex items-start justify-between"><p className="text-sm font-medium text-foreground leading-tight">{deal.opportunity}</p><span className={priorityBadge(deal.autoPriority)}>{deal.autoPriority[0]}</span></div><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground font-mono">{deal.code}</span><span className={dealStatusBadge(deal.dealStatus)}>{deal.dealStatus}</span></div><div className="flex items-center justify-between pt-1 border-t border-border/50"><span className="text-xs text-muted-foreground">{formatCurrency(deal.amount)}</span><span className="text-xs font-semibold text-foreground">{deal.yield.toFixed(1)}%</span></div></div>))}</div></div>); })}
        </motion.div>
      )}
    </div>
  );
};

export default DealFlow;
