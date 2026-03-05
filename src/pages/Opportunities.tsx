import { mockNewOpportunities } from "@/data/mockData";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Calendar, MapPin } from "lucide-react";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

const statusBadge = (s: string) => s === "Nouveau" ? "badge-accent" : "badge-warning";

const Opportunities = () => {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nouvelles Opportunités</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mockNewOpportunities.length} opportunités en attente d'analyse
        </p>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: mockNewOpportunities.length },
          { label: "Nouvelles", value: mockNewOpportunities.filter(o => o.status === "Nouveau").length },
          { label: "En analyse", value: mockNewOpportunities.filter(o => o.status === "En analyse").length },
          { label: "Rendement moyen", value: `${(mockNewOpportunities.reduce((s, o) => s + o.yieldRate, 0) / mockNewOpportunities.length).toFixed(1)}%` },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kpi-card text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{kpi.label}</p>
            <p className="text-lg font-bold text-foreground mt-1">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="kpi-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Code", "Nom", "Classe d'actif", "Localisation", "Statut", "Taux de rendement", "Date de réception", "Source", ""].map(h => (
                <th key={h} className="table-header text-left py-3 px-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockNewOpportunities.map((opp) => (
              <tr
                key={opp.id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{opp.code}</td>
                <td className="py-3 px-3">
                  <p className="font-medium text-foreground">{opp.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(opp.askingPrice)}</p>
                </td>
                <td className="py-3 px-3">
                  <span className="badge-neutral flex items-center gap-1 w-fit">
                    <Building2 className="h-3 w-3" />{opp.assetType}
                  </span>
                </td>
                <td className="py-3 px-3 text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{opp.city}</span>
                </td>
                <td className="py-3 px-3"><span className={statusBadge(opp.status)}>{opp.status}</span></td>
                <td className="py-3 px-3 font-semibold text-foreground">{opp.yieldRate.toFixed(1)}%</td>
                <td className="py-3 px-3 text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(opp.receptionDate).toLocaleDateString("fr-FR")}</span>
                </td>
                <td className="py-3 px-3 text-xs text-muted-foreground">{opp.source}</td>
                <td className="py-3 px-3">
                  <Link to={`/opportunities/${opp.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                    One-Pager <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default Opportunities;
