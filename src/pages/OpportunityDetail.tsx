import { useParams, Link, useNavigate } from "react-router-dom";
import { mockNewOpportunities } from "@/data/mockData";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  MapPin,
  Printer,
  Send,
  ThumbsDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useState } from "react";
import DealMap from "@/components/DealMap";
import logoEquimmox from "@/assets/logo-equimmox.png";
import { getAssetImage } from "@/lib/assetImages";

const fmt = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

const OpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const opp = mockNewOpportunities.find((o) => o.id === id);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showTRI, setShowTRI] = useState(false);

  if (!opp) return <div className="p-8 text-center text-muted-foreground">Opportunité introuvable</div>;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto print-area">
      <div className="flex items-center justify-between no-print">
        <Link to="/opportunities" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour aux opportunités
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
        >
          <Printer className="h-4 w-4" /> Imprimer
        </button>
      </div>

      {/* Print header with logo */}
      <div className="hidden print-only">
        <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: '#e5e5e5' }}>
          <img src={logoEquimmox} alt="EquimmoX" style={{ width: '105px' }} />
          <div className="text-right">
            <p style={{ fontSize: '10px', color: '#999' }}>Fiche Opportunité — Confidentiel</p>
            <p style={{ fontSize: '10px', color: '#999' }}>{new Date().toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-80 space-y-3 shrink-0">
          <img
            src={getAssetImage(opp.assetType)}
            alt={opp.name}
            className="h-44 w-full rounded-xl object-cover border border-border/60"
          />
          <DealMap address={opp.address} city={opp.city} name={opp.name} className="h-32" />
        </div>

        {/* Key Facts */}
        <div className="flex-1">
          <div className="mb-3">
            <p className="text-xs font-mono text-muted-foreground">{opp.code}</p>
            <h1 className="text-2xl font-bold text-foreground">{opp.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5" />{opp.address}, {opp.city}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {[
              { label: "Classe d'actif", value: opp.assetType },
              { label: "Adresse", value: `${opp.address}, ${opp.city}` },
              { label: "Surface", value: `${opp.surface.toLocaleString("fr-FR")} m²` },
              { label: "Prix demandé", value: fmt(opp.askingPrice) },
              { label: "Loyer en place", value: opp.currentRent > 0 ? fmt(opp.currentRent) : "N/A" },
              { label: "Taux de rendement", value: `${opp.yieldRate}%` },
              { label: "Date de réception", value: new Date(opp.receptionDate).toLocaleDateString("fr-FR") },
              { label: "Statut", value: opp.status },
            ].map((item) => (
              <div key={item.label} className="py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{item.label}</p>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Données Locatives */}
      {opp.tenants.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Données Locatives</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Locataire", "Début", "Échéance", "Type bail", "Loyer annuel", "Indexation", "WALT", "WALB"].map(h => (
                    <th key={h} className="table-header text-left py-2 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {opp.tenants.map((t, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="py-2 px-3 font-medium text-foreground">{t.name}</td>
                    <td className="py-2 px-3 text-muted-foreground">{new Date(t.startDate).toLocaleDateString("fr-FR")}</td>
                    <td className="py-2 px-3 text-muted-foreground">{new Date(t.endDate).toLocaleDateString("fr-FR")}</td>
                    <td className="py-2 px-3 text-muted-foreground">{t.leaseType}</td>
                    <td className="py-2 px-3 text-foreground">{fmt(t.annualRent)}</td>
                    <td className="py-2 px-3 text-muted-foreground">{t.indexation}</td>
                    <td className="py-2 px-3 text-foreground">{t.walt} ans</td>
                    <td className="py-2 px-3 text-foreground">{t.walb} ans</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Investissement & CAPEX */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="kpi-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Investissement & CAPEX</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Investissement</h4>
            <div className="space-y-2">
              {[
                { label: "Prix acquisition", value: fmt(opp.investment.acquisitionPrice) },
                { label: "Frais estimés", value: fmt(opp.investment.estimatedFees) },
                { label: "Montant total investi", value: fmt(opp.investment.totalInvested) },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">CAPEX</h4>
            {opp.investment.capexHistory.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">Historique</p>
                {opp.investment.capexHistory.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-border/30">
                    <span className="text-xs text-muted-foreground">{c.year} – {c.description}</span>
                    <span className="text-xs font-medium text-foreground">{fmt(c.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            {opp.investment.capexProjection.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Projection</p>
                {opp.investment.capexProjection.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-border/30">
                    <span className="text-xs text-muted-foreground">{c.year} – {c.description}</span>
                    <span className="text-xs font-medium text-foreground">{fmt(c.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            {opp.investment.capexHistory.length === 0 && opp.investment.capexProjection.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Aucun CAPEX identifié</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* TRI */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="kpi-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">TRI brut – horizon 10 ans</p>
            <p className="text-3xl font-bold text-accent">{opp.triEstimated}%</p>
          </div>
          <button onClick={() => setShowTRI(!showTRI)} className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline">
            Voir détail TRI <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showTRI ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showTRI && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 space-y-2 border-t border-border/50 pt-4">
            {[
              { label: "Sommaire investissement", value: fmt(opp.triDetail.investmentSummary) },
              { label: "CAPEX historique", value: fmt(opp.triDetail.capexHistorique) },
              { label: "Projection CAPEX futur", value: fmt(opp.triDetail.capexProjection) },
              { label: "Loyers projetés (10 ans)", value: fmt(opp.triDetail.projectedRents) },
              { label: "Cashflow net", value: fmt(opp.triDetail.netCashflow) },
              { label: "Hypothèse valeur de sortie", value: fmt(opp.triDetail.exitValueHypothesis) },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="kpi-card no-print">
        <h3 className="text-sm font-semibold text-foreground mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/deals")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <TrendingUp className="h-4 w-4" /> Intégrer au Deal Flow
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
            <Upload className="h-4 w-4" /> Associer documents
          </button>
          <button
            onClick={() => setShowReject(!showReject)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
          >
            <ThumbsDown className="h-4 w-4" /> Rejeter l'opportunité
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
            <Send className="h-4 w-4" /> Envoyer l'analyse
          </button>
        </div>

        {showReject && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="text-sm font-medium text-foreground mb-2">Motif du rejet :</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              rows={3}
              placeholder="Ex : Rendement insuffisant, risque locatif trop élevé…"
            />
            <button className="mt-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90">
              Confirmer le rejet
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default OpportunityDetail;
