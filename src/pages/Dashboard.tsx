import { mockAssets, mockDeals } from "@/data/mockData";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Building2, Calendar, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

const Dashboard = () => {
  const totalRent = mockAssets.reduce((s, a) => s + a.annualRent, 0);
  const avgVacancy = mockAssets.reduce((s, a) => s + (a.vacantSurface / a.totalSurface) * 100, 0) / mockAssets.length;
  const eligible = mockDeals.filter(d => d.status !== "Non éligible");
  const totalPipeline = eligible.reduce((s, d) => s + d.amount, 0);
  const avgTRI = eligible.reduce((s, d) => s + d.triEstimated * d.amount, 0) / totalPipeline;

  const upcomingLeases = mockAssets
    .flatMap(a => a.tenants.map(t => ({ ...t, assetName: a.name })))
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 5);

  const risks = mockAssets.filter(a => a.riskScore >= 70);

  const yieldData = mockAssets.map(a => ({ name: a.name.split(" ")[0], rendement: a.yield, vacance: +(a.vacantSurface / a.totalSurface * 100).toFixed(1) }));

  const typeData = [
    { name: "Bureau", value: mockAssets.filter(a => a.type === "Bureau").length },
    { name: "Commerce", value: mockAssets.filter(a => a.type === "Commerce").length },
    { name: "Résidentiel", value: mockAssets.filter(a => a.type === "Résidentiel").length },
    { name: "Logistique", value: mockAssets.filter(a => a.type === "Logistique").length },
  ].filter(t => t.value > 0);
  const COLORS = ["hsl(187,72%,40%)", "hsl(220,55%,18%)", "hsl(152,60%,40%)", "hsl(38,92%,50%)"];

  const kpis = [
    { label: "Loyers annualisés", value: formatCurrency(totalRent), icon: TrendingUp, trend: "+4.2%", positive: true },
    { label: "Taux de vacance moyen", value: `${avgVacancy.toFixed(1)}%`, icon: Building2, trend: "-1.3%", positive: true },
    { label: "Pipeline total", value: formatCurrency(totalPipeline), icon: ArrowUpRight, trend: "+12%", positive: true },
    { label: "TRI moyen pondéré", value: `${avgTRI.toFixed(1)}%`, icon: TrendingUp, trend: avgTRI > 7 ? "Au-dessus cible" : "Sous cible", positive: avgTRI > 7 },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble du parc et du pipeline d'investissement</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="kpi-card"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className="h-4 w-4 text-accent" />
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-2">
              {kpi.positive ? (
                <ArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive" />
              )}
              <span className={`text-xs font-medium ${kpi.positive ? "text-success" : "text-destructive"}`}>{kpi.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="kpi-card lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Rendement & Vacance par actif</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={yieldData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,15%,90%)", fontSize: 12 }} />
              <Bar dataKey="rendement" fill="hsl(187,72%,40%)" radius={[4, 4, 0, 0]} name="Rendement (%)" />
              <Bar dataKey="vacance" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} name="Vacance (%)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {typeData.map((t, i) => (
              <div key={t.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {t.name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" />
            Prochaines échéances de baux
          </h3>
          <div className="space-y-3">
            {upcomingLeases.map((lease) => {
              const daysLeft = Math.ceil((new Date(lease.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <div key={lease.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{lease.name}</p>
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
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Alertes de risque
          </h3>
          <div className="space-y-3">
            {mockAssets.map(asset => {
              const alerts: { text: string; level: "danger" | "warning" }[] = [];
              const topTenant = asset.tenants.reduce((a, b) => a.currentRent > b.currentRent ? a : b);
              const dependency = topTenant.currentRent / asset.annualRent * 100;
              if (dependency > 40) alerts.push({ text: `Dépendance locataire ${dependency.toFixed(0)}% (${topTenant.name})`, level: "danger" });
              asset.tenants.forEach(t => {
                const days = Math.ceil((new Date(t.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (days < 180 && days > 0) alerts.push({ text: `Échéance < 6 mois : ${t.name}`, level: "warning" });
              });
              if (asset.tenants.some(t => t.unpaid)) alerts.push({ text: "Impayé existant", level: "danger" });
              if (alerts.length === 0) return null;
              return (
                <div key={asset.id} className="py-2 border-b border-border/50 last:border-0">
                  <p className="text-sm font-medium text-foreground mb-1.5">{asset.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {alerts.map((a, i) => (
                      <span key={i} className={a.level === "danger" ? "badge-danger" : "badge-warning"}>{a.text}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
