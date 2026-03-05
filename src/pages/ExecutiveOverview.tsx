import { mockAssets, mockDeals } from "@/data/mockData";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Building2, CircleDollarSign, Crosshair, Layers, MapPin, ShieldAlert, Target, TrendingUp, Zap } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, RadialBarChart, RadialBar } from "recharts";

const fmt = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

const ExecutiveOverview = () => {
  const totalAUM = mockAssets.reduce((s, a) => s + a.acquisitionPrice, 0);
  const totalRent = mockAssets.reduce((s, a) => s + a.annualRent, 0);
  const avgYield = mockAssets.reduce((s, a) => s + a.yield * a.acquisitionPrice, 0) / totalAUM;
  const targetYield = 7.0;
  const yieldDelta = avgYield - targetYield;
  const avgVacancy = mockAssets.reduce((s, a) => s + (a.vacantSurface / a.totalSurface) * 100, 0) / mockAssets.length;
  const activePipeline = mockDeals.filter((d) => d.status !== "Non éligible");
  const totalPipeline = activePipeline.reduce((s, d) => s + d.amount, 0);
  const avgTRI = activePipeline.reduce((s, d) => s + d.triEstimated * d.amount, 0) / totalPipeline;
  const triDelta = avgTRI - targetYield;
  const eligibleDeals = mockDeals.filter((d) => d.status === "Éligible").length;
  const analyzedDeals = mockDeals.filter((d) => d.status !== "Non éligible").length;
  const eligibilityRate = analyzedDeals > 0 ? (eligibleDeals / analyzedDeals) * 100 : 0;
  const avgDaysInPipeline = Math.round(activePipeline.reduce((s, d) => s + d.daysInPipeline, 0) / activePipeline.length);
  const avgRiskScore = Math.round(mockAssets.reduce((s, a) => s + a.riskScore, 0) / mockAssets.length);
  const cityConcentration = mockAssets.reduce((acc, a) => { const city = a.city.split(" ")[0]; acc[city] = (acc[city] || 0) + a.acquisitionPrice; return acc; }, {} as Record<string, number>);
  const topCity = Object.entries(cityConcentration).sort((a, b) => b[1] - a[1])[0];
  const topCityPct = ((topCity[1] / totalAUM) * 100).toFixed(0);
  const criticalVacancy = mockAssets.filter((a) => (a.vacantSurface / a.totalSurface) * 100 > 15);
  const alerts: { text: string; level: "critical" | "warning" | "info"; icon: typeof AlertTriangle }[] = [];
  if (yieldDelta > 0) alerts.push({ text: `+${yieldDelta.toFixed(1)} pts au-dessus de la cible fonds`, level: "info", icon: TrendingUp });
  else alerts.push({ text: `${yieldDelta.toFixed(1)} pts en-dessous de la cible fonds`, level: "critical", icon: AlertTriangle });
  alerts.push({ text: `${fmt(totalPipeline)} de valeur potentielle en pipeline`, level: "info", icon: CircleDollarSign });
  if (Number(topCityPct) > 30) alerts.push({ text: `${topCityPct}% du parc concentré sur ${topCity[0]}`, level: "warning", icon: MapPin });
  criticalVacancy.forEach((a) => alerts.push({ text: `${a.name} : vacance ${((a.vacantSurface / a.totalSurface) * 100).toFixed(0)}%`, level: "critical", icon: Building2 }));
  const unpaidAssets = mockAssets.filter((a) => a.tenants.some((t) => t.unpaid));
  if (unpaidAssets.length > 0) alerts.push({ text: `${unpaidAssets.length} actif(s) avec impayés`, level: "critical", icon: ShieldAlert });
  const performanceData = mockAssets.map((a) => ({ name: a.name.split(" ").slice(0, 2).join(" "), rendement: a.yield, cible: targetYield, risque: a.riskScore }));
  const riskDistribution = [
    { name: "Faible (<50)", value: mockAssets.filter((a) => a.riskScore < 50).length, fill: "hsl(152,60%,40%)" },
    { name: "Moyen (50-70)", value: mockAssets.filter((a) => a.riskScore >= 50 && a.riskScore < 70).length, fill: "hsl(38,92%,50%)" },
    { name: "Élevé (≥70)", value: mockAssets.filter((a) => a.riskScore >= 70).length, fill: "hsl(0,72%,51%)" },
  ];
  const gaugeData = [{ name: "Score", value: avgRiskScore, fill: avgRiskScore < 50 ? "hsl(152,60%,40%)" : avgRiskScore < 70 ? "hsl(38,92%,50%)" : "hsl(0,72%,51%)" }];
  const heroKPIs = [
    { label: "Valeur sous gestion", value: fmt(totalAUM), icon: Layers, sub: `${mockAssets.length} actifs` },
    { label: "Performance globale", value: `${avgYield.toFixed(1)}%`, icon: Target, sub: `Cible : ${targetYield}%`, delta: yieldDelta, positive: yieldDelta >= 0 },
    { label: "TRI pipeline pondéré", value: `${avgTRI.toFixed(1)}%`, icon: Crosshair, sub: `vs cible ${targetYield}%`, delta: triDelta, positive: triDelta >= 0 },
    { label: "Pipeline actif", value: fmt(totalPipeline), icon: CircleDollarSign, sub: `${activePipeline.length} deals actifs` },
    { label: "Taux d'éligibilité", value: `${eligibilityRate.toFixed(0)}%`, icon: Zap, sub: eligibilityRate >= 60 ? "Élevé" : eligibilityRate >= 20 ? "Moyen" : "Faible" },
    { label: "Risque consolidé", value: `${avgRiskScore}/100`, icon: ShieldAlert, sub: avgRiskScore < 50 ? "Maîtrisé" : avgRiskScore < 70 ? "Modéré" : "Élevé" },
  ];
  const anim = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06, duration: 0.4 } });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1440px] mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-1">Strategic Intelligence</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Executive Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Vision consolidée du parc et du pipeline — données temps réel</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success animate-pulse" />Mis à jour en temps réel</div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {heroKPIs.map((kpi, i) => (
          <motion.div key={kpi.label} {...anim(i)} className="kpi-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]"><kpi.icon className="w-16 h-16 text-foreground" /></div>
            <kpi.icon className="h-4 w-4 text-accent mb-2" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-lg lg:text-xl font-bold text-foreground">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-1.5">
              {kpi.delta !== undefined && (kpi.positive ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />)}
              <span className={`text-[10px] font-medium ${kpi.delta !== undefined ? (kpi.positive ? "text-success" : "text-destructive") : "text-muted-foreground"}`}>{kpi.delta !== undefined ? `${kpi.delta > 0 ? "+" : ""}${kpi.delta.toFixed(1)} pts` : kpi.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div {...anim(6)} className="kpi-card border-l-4" style={{ borderLeftColor: alerts.some((a) => a.level === "critical") ? "hsl(0,72%,51%)" : "hsl(38,92%,50%)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Alertes stratégiques prioritaires</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg px-3 py-2.5" style={{ backgroundColor: alert.level === "critical" ? "hsl(0 72% 51% / 0.06)" : alert.level === "warning" ? "hsl(38 92% 50% / 0.06)" : "hsl(187 72% 40% / 0.06)" }}>
              <alert.icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: alert.level === "critical" ? "hsl(0,72%,51%)" : alert.level === "warning" ? "hsl(38,92%,50%)" : "hsl(187,72%,40%)" }} />
              <span className="text-xs font-medium text-foreground">{alert.text}</span>
            </div>
          ))}
        </div>
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...anim(7)} className="kpi-card lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Performance par actif vs cible fonds</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={performanceData}>
              <defs><linearGradient id="gradRendement" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(187,72%,40%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(187,72%,40%)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(220,10%,46%)" }} /><YAxis tick={{ fontSize: 10, fill: "hsl(220,10%,46%)" }} domain={[0, "auto"]} /><Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,15%,90%)", fontSize: 12 }} />
              <Area type="monotone" dataKey="rendement" stroke="hsl(187,72%,40%)" fill="url(#gradRendement)" strokeWidth={2} name="Rendement (%)" /><Area type="monotone" dataKey="cible" stroke="hsl(0,72%,51%)" fill="none" strokeWidth={1.5} strokeDasharray="6 3" name="Cible fonds (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div {...anim(8)} className="kpi-card flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-foreground mb-2">Risque consolidé portefeuille</h3>
          <ResponsiveContainer width="100%" height={180}><RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={gaugeData} startAngle={180} endAngle={0} barSize={14}><RadialBar background dataKey="value" cornerRadius={8} /></RadialBarChart></ResponsiveContainer>
          <p className="text-3xl font-bold text-foreground -mt-8">{avgRiskScore}</p>
          <p className="text-xs text-muted-foreground mt-1">{avgRiskScore < 50 ? "Risque maîtrisé" : avgRiskScore < 70 ? "Risque modéré" : "Risque élevé"}</p>
          <div className="flex gap-3 mt-4">{riskDistribution.map((r) => (<div key={r.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: r.fill }} />{r.value} {r.name.split(" ")[0].toLowerCase()}</div>))}</div>
        </motion.div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...anim(9)} className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Crosshair className="h-4 w-4 text-accent" />Top deals pipeline — Score le plus élevé</h3>
          <div className="space-y-2.5">{[...activePipeline].sort((a, b) => b.score - a.score).slice(0, 5).map((deal) => (<div key={deal.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"><div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{deal.opportunity}</p><div className="flex items-center gap-2 mt-0.5"><span className="badge-accent">{deal.stage}</span><span className="text-[10px] text-muted-foreground">{deal.responsible}</span></div></div><div className="text-right ml-3"><p className="text-sm font-bold text-foreground">{fmt(deal.amount)}</p><div className="flex items-center gap-1 justify-end"><span className="text-[10px] text-muted-foreground">Score</span><span className={`text-xs font-bold ${deal.score >= 80 ? "text-success" : deal.score >= 60 ? "text-warning" : "text-destructive"}`}>{deal.score}</span></div></div></div>))}</div>
        </motion.div>
        <motion.div {...anim(10)} className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" />Performance actifs — Création de valeur</h3>
          <div className="space-y-2.5">{[...mockAssets].map((a) => ({ ...a, yieldDelta: a.yield - targetYield, vacancyRate: (a.vacantSurface / a.totalSurface) * 100 })).sort((a, b) => b.yieldDelta - a.yieldDelta).map((asset) => (<div key={asset.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"><div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{asset.name}</p><div className="flex items-center gap-2 mt-0.5"><span className="text-[10px] text-muted-foreground">{asset.city}</span><span className={asset.riskScore >= 70 ? "badge-danger" : asset.riskScore >= 50 ? "badge-warning" : "badge-success"}>Risque {asset.riskScore}</span></div></div><div className="text-right ml-3"><div className="flex items-center gap-1 justify-end">{asset.yieldDelta >= 0 ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}<span className={`text-sm font-bold ${asset.yieldDelta >= 0 ? "text-success" : "text-destructive"}`}>{asset.yieldDelta > 0 ? "+" : ""}{asset.yieldDelta.toFixed(1)}%</span></div><p className="text-[10px] text-muted-foreground">Vacance {asset.vacancyRate.toFixed(0)}%</p></div></div>))}</div>
        </motion.div>
      </div>
      <motion.div {...anim(11)} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-primary px-6 py-4">
        {[{ label: "Loyers annualisés", value: fmt(totalRent) }, { label: "Vacance moyenne", value: `${avgVacancy.toFixed(1)}%` }, { label: "Durée moy. pipeline", value: `${avgDaysInPipeline}j` }, { label: "Deals actifs", value: `${activePipeline.length}` }].map((m) => (<div key={m.label} className="text-center"><p className="text-[10px] uppercase tracking-wider text-primary-foreground/60 font-medium">{m.label}</p><p className="text-lg font-bold text-primary-foreground">{m.value}</p></div>))}
      </motion.div>
    </div>
  );
};

export default ExecutiveOverview;
