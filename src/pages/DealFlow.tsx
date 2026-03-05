import { mockDeals, DEAL_STAGES, DEAL_FLOW_STATUSES, type Deal, type DealStage, type DealFlowStatus } from "@/data/mockData";
import { getAutoPriority, getCapRateValue, getValuationLabel, getRentalPotential, generateBusinessPlan } from "@/lib/dealUtils";
import { motion } from "framer-motion";
import { BarChart3, Calendar, Check, ChevronDown, Download, Filter, Kanban, List, Target, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

function getCommitteeData(deal: Deal) {
  const assetType = deal.assetType || "Bureau";
  const city = deal.city || "Paris";
  const surface = deal.surface || 3000;
  const broker = deal.broker || "Non renseigné";
  const receptionDate = deal.receptionDate || "2024-01-01";
  const annualRent = deal.annualRent || Math.round((deal.amount * deal.yield) / 100);
  const rentPerSqm = deal.rentPerSqm || Math.round(annualRent / surface);
  const occupancyRate = deal.status === "Non éligible" ? 72 : Math.min(98, 85 + deal.score * 0.12);
  const walt = +(2 + deal.score * 0.06).toFixed(1);
  const walb = +(walt * 0.65).toFixed(1);
  const tenants = [
    { name: assetType === "Logistique" ? "DB Schenker" : assetType === "Commerce" ? "Unibail" : "Gecina SA", startDate: "2021-01-01", endDate: "2030-12-31", leaseType: "3/6/9", annualRent: Math.round(annualRent * 0.6), indexation: assetType === "Commerce" ? "ILC" : "ILAT", walt, walb },
    { name: assetType === "Logistique" ? "Kuehne+Nagel" : assetType === "Commerce" ? "Leroy Merlin" : "BNP Paribas", startDate: "2022-06-01", endDate: "2028-05-31", leaseType: "3/6/9", annualRent: Math.round(annualRent * 0.4), indexation: assetType === "Commerce" ? "ILC" : "ILAT", walt: +(walt * 0.7).toFixed(1), walb: +(walb * 0.8).toFixed(1) },
  ];
  const estimatedFees = deal.acquisitionFees || Math.round(deal.amount * 0.07);
  const totalInvested = deal.amount + estimatedFees;
  const capexHistory = [{ year: "2022", amount: Math.round(deal.amount * 0.01), description: "Travaux de conformité" }];
  const capexProjection = [
    { year: "2026", amount: Math.round(deal.amount * 0.015), description: "Rénovation partielle" },
    { year: "2029", amount: Math.round(deal.amount * 0.02), description: "Mise aux normes ESG" },
  ];
  const location = {
    address: deal.address || city,
    accessibility: assetType === "Logistique" ? "Accès direct autoroute, zone logistique prime" : "Métro à 300m, bus, accès périphérique",
    sectorDynamics: deal.score > 60 ? "Secteur en croissance, demande soutenue" : "Secteur stable, demande modérée",
    vacancySubmarket: deal.score > 60 ? "3.2%" : deal.score > 40 ? "7.5%" : "12.1%",
  };
  return { assetType, city, surface, broker, receptionDate, rentPerSqm, occupancyRate: +occupancyRate.toFixed(1), walt, walb, annualRent, tenants, estimatedFees, totalInvested, capexHistory, capexProjection, location };
}

const handleExportOnePager = async (deals: Deal[]) => {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210; const M = 14; const CW = W - M * 2;

  const drawLine = (y: number) => { doc.setDrawColor(220); doc.line(M, y, W - M, y); };
  const sectionTitle = (title: string, y: number) => { doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 180, 120); doc.text(title, M, y); return y + 6; };
  const label = (text: string, x: number, y: number) => { doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(140); doc.text(text.toUpperCase(), x, y); };
  const value = (text: string, x: number, y: number) => { doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(40); doc.text(text, x, y); };
  const checkPage = (y: number, need: number): number => { if (y + need > 280) { doc.addPage(); return 20; } return y; };

  deals.forEach((deal, idx) => {
    if (idx > 0) doc.addPage();
    const data = getCommitteeData(deal);
    const autoPriority = getAutoPriority(deal.receptionDate);
    const bp = generateBusinessPlan(deal);
    const capRate = deal.capRate || 0.06;
    const annualRent = deal.annualRent || data.annualRent;
    const capRateValue = getCapRateValue(annualRent, capRate);
    const valuation = getValuationLabel(deal.amount, capRateValue);
    const rental = getRentalPotential(deal.surface || data.surface, deal.occupiedSurface || Math.round((deal.surface || data.surface) * 0.85), deal.rentPerSqm || data.rentPerSqm);

    // Header
    let y = M;
    doc.setFillColor(25, 30, 38); doc.rect(0, 0, W, 30, "F");
    doc.setFontSize(7); doc.setTextColor(160); doc.setFont("helvetica", "normal"); doc.text("EQUIMMOX — Comité d'Investissement", M, 8);
    doc.setFontSize(7); doc.text(`Confidentiel — ${new Date().toLocaleDateString("fr-FR")}`, W - M, 8, { align: "right" });
    doc.setFontSize(15); doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.text(deal.opportunity, M, 19);
    doc.setFontSize(9); doc.setTextColor(180); doc.setFont("helvetica", "normal"); doc.text(`${data.assetType} • ${data.city}`, M, 25);
    doc.setFontSize(8); doc.text(`Priorité : ${autoPriority}`, W - M, 19, { align: "right" });
    y = 38;

    // A. Infos Générales
    y = sectionTitle("A. Informations Générales", y);
    const colW = CW / 4;
    const infoItems = [
      ["Code", deal.code], ["Nom actif", deal.opportunity], ["Adresse", deal.address || data.city], ["Classe d'actif", data.assetType],
      ["Broker", data.broker], ["Date réception", new Date(data.receptionDate).toLocaleDateString("fr-FR")], ["Statut pipeline", deal.dealStatus], ["Priorité auto", autoPriority],
    ];
    infoItems.forEach((item, i) => {
      const col = i % 4; const row = Math.floor(i / 4);
      label(item[0], M + col * colW, y + row * 12);
      value(item[1], M + col * colW, y + row * 12 + 4);
    });
    y += Math.ceil(infoItems.length / 4) * 12 + 4; drawLine(y); y += 6;

    // B. Contact Broker
    if (deal.brokerContact) {
      y = checkPage(y, 20);
      y = sectionTitle("B. Contact Broker", y);
      const bc = deal.brokerContact;
      [["Nom", bc.name], ["Société", bc.company], ["Email", bc.email], ["Téléphone", bc.phone]].forEach((item, i) => {
        label(item[0], M + (i % 4) * colW, y);
        value(item[1], M + (i % 4) * colW, y + 4);
      });
      y += 12; drawLine(y); y += 6;
    }

    // C. Localisation & Marché
    y = checkPage(y, 20);
    y = sectionTitle("C. Localisation & Marché", y);
    [["Adresse", data.location.address], ["Accessibilité", data.location.accessibility], ["Dynamique", data.location.sectorDynamics], ["Taux vacance", data.location.vacancySubmarket]].forEach((item, i) => {
      label(item[0], M + (i % 4) * colW, y);
      value(item[1], M + (i % 4) * colW, y + 4);
    });
    y += 12; drawLine(y); y += 6;

    // D. Données Locatives
    y = checkPage(y, 30);
    y = sectionTitle("D. Données Locatives", y);
    const thds = ["Locataire", "Début", "Échéance", "Type", "Loyer annuel", "Index.", "WALT", "WALB"];
    const tw = CW / thds.length;
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(120);
    thds.forEach((h, i) => doc.text(h, M + i * tw, y));
    y += 4;
    doc.setFont("helvetica", "normal"); doc.setTextColor(50); doc.setFontSize(7);
    data.tenants.forEach(t => {
      [t.name, new Date(t.startDate).toLocaleDateString("fr-FR"), new Date(t.endDate).toLocaleDateString("fr-FR"), t.leaseType, formatCurrency(t.annualRent), t.indexation, `${t.walt}a`, `${t.walb}a`].forEach((v, i) => doc.text(v, M + i * tw, y));
      y += 5;
    });
    y += 2; drawLine(y); y += 6;

    // E. Potentiel Locatif
    y = checkPage(y, 20);
    y = sectionTitle("E. Potentiel Locatif", y);
    [["Loyer actuel", formatCurrency(rental.currentRent)], ["Loyer potentiel plein", formatCurrency(rental.potentialRent)], ["Potentiel +", `${formatCurrency(rental.uplift)} (+${rental.upliftPercent.toFixed(1)}%)`], ["Loyer/m²/an", `${deal.rentPerSqm || data.rentPerSqm} €`]].forEach((item, i) => {
      label(item[0], M + (i % 4) * colW, y);
      value(item[1], M + (i % 4) * colW, y + 4);
    });
    y += 12; drawLine(y); y += 6;

    // F. Valeur via Cap Rate
    y = checkPage(y, 25);
    y = sectionTitle("F. Valeur via Taux de Capitalisation", y);
    [["Prix demandé", formatCurrency(deal.amount)], ["Valeur estimée", formatCurrency(capRateValue)], ["Écart", `${formatCurrency(capRateValue - deal.amount)} (${((capRateValue - deal.amount) / deal.amount * 100).toFixed(1)}%)`], ["Diagnostic", valuation.label]].forEach((item, i) => {
      label(item[0], M + (i % 4) * colW, y);
      value(item[1], M + (i % 4) * colW, y + 4);
    });
    y += 12; drawLine(y); y += 6;

    // G. Investissement & CAPEX
    y = checkPage(y, 35);
    y = sectionTitle("G. Investissement & CAPEX", y);
    [["Prix acquisition", formatCurrency(deal.amount)], ["Frais estimés", formatCurrency(data.estimatedFees)], ["Total investi", formatCurrency(data.totalInvested)]].forEach((item, i) => {
      label(item[0], M + i * (CW / 3), y);
      value(item[1], M + i * (CW / 3), y + 4);
    });
    y += 12;
    label("CAPEX Historique", M, y);
    y += 4;
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(50);
    data.capexHistory.forEach(c => { doc.text(`${c.year} – ${c.description}: ${formatCurrency(c.amount)}`, M, y); y += 4; });
    label("CAPEX Projection", M, y); y += 4;
    data.capexProjection.forEach(c => { doc.text(`${c.year} – ${c.description}: ${formatCurrency(c.amount)}`, M, y); y += 4; });
    y += 2; drawLine(y); y += 6;

    // Hypothèses Marché
    y = checkPage(y, 20);
    y = sectionTitle(`Hypothèses de marché — ${data.assetType}`, y);
    [["Frais acquis.", `${(bp.params.acquisitionFeesRate * 100).toFixed(1)}%`], ["Indexation", `${bp.params.indexLabel} (${(bp.params.indexation * 100).toFixed(0)}%)`], ["Charges", `${(bp.params.chargesRate * 100).toFixed(0)}%`], ["CAPEX/an", `${(bp.params.capexRate * 100).toFixed(1)}%`], ["Cap sortie", `${(bp.params.exitCapRate * 100).toFixed(1)}%`], ["PV 10a", `${(bp.params.plusValueRate * 100).toFixed(0)}%`]].forEach((item, i) => {
      const cw6 = CW / 6;
      label(item[0], M + (i % 6) * cw6, y);
      value(item[1], M + (i % 6) * cw6, y + 4);
    });
    y += 12; drawLine(y); y += 6;

    // H. TRI & Business Plan
    y = checkPage(y, 40);
    y = sectionTitle("H. TRI & Business Plan", y);
    [["TRI estimé", `${bp.irr}%`], ["Investissement total", formatCurrency(bp.totalInvestment)], ["Cashflow total", formatCurrency(bp.totalCashflow)], ["Prix de sortie", formatCurrency(bp.exitPrice)]].forEach((item, i) => {
      label(item[0], M + (i % 4) * colW, y);
      value(item[1], M + (i % 4) * colW, y + 4);
    });
    y += 12;

    // BP table
    y = checkPage(y, 10 + bp.years.length * 4.5);
    const bpHeaders = ["Année", "Loyers", "Charges", "Capex", "Net CF", "Sortie"];
    const bpW = CW / bpHeaders.length;
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(120);
    bpHeaders.forEach((h, i) => doc.text(h, M + i * bpW, y));
    y += 4;
    doc.setFont("helvetica", "normal"); doc.setTextColor(50); doc.setFontSize(6.5);
    bp.years.forEach(row => {
      y = checkPage(y, 5);
      [String(row.year), formatCurrency(row.rent), row.charges > 0 ? `-${formatCurrency(row.charges)}` : "–", row.capex > 0 ? `-${formatCurrency(row.capex)}` : "–", formatCurrency(row.netCashflow), row.exitValue > 0 ? formatCurrency(row.exitValue) : "–"].forEach((v, i) => doc.text(v, M + i * bpW, y));
      y += 4.5;
    });

    // Footer
    doc.setFontSize(6); doc.setTextColor(160); doc.setFont("helvetica", "italic");
    doc.text("Document généré automatiquement par EQUIMMOX — Confidentiel", M, 287);
    doc.text(`${deal.opportunity} — ${new Date().toLocaleDateString("fr-FR")}`, W - M, 287, { align: "right" });
  });

  doc.save(`EQUIMMOX_OnePagers_${new Date().toISOString().slice(0, 10)}.pdf`);
};

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
    handleExportOnePager(selected);
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
