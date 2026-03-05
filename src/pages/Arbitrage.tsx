import { mockAssets, Asset } from "@/data/mockData";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, AlertTriangle, Building2, ArrowUpRight, ShieldCheck, Activity, Target, Zap, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

const MARKET_BENCHMARKS: Record<string, { capRate: number; rentPerSqm: number; label: string }> = {
  Bureau: { capRate: 5.5, rentPerSqm: 320, label: "Bureaux" },
  Commerce: { capRate: 5.8, rentPerSqm: 250, label: "Commerce" },
  Résidentiel: { capRate: 4.2, rentPerSqm: 180, label: "Résidentiel" },
  Logistique: { capRate: 5.0, rentPerSqm: 80, label: "Logistique" },
};

interface AssetAnalysis { asset: Asset; yieldDelta: number; isHighPotential: boolean; rentPerSqm: number; marketRentPerSqm: number; rentGap: number; isUndervalued: boolean; healthScore: number; vacancyRate: number; hasUnpaid: boolean; unpaidTotal: number; nearExpiry: number; tenantConcentration: number; recommendations: string[]; }

function analyzeAsset(asset: Asset): AssetAnalysis {
  const benchmark = MARKET_BENCHMARKS[asset.type] || MARKET_BENCHMARKS.Bureau;
  const yieldDelta = asset.yield - benchmark.capRate;
  const isHighPotential = yieldDelta > 0;
  const occupiedSurface = asset.totalSurface - asset.vacantSurface;
  const rentPerSqm = occupiedSurface > 0 ? asset.annualRent / occupiedSurface : 0;
  const rentGap = benchmark.rentPerSqm > 0 ? ((benchmark.rentPerSqm - rentPerSqm) / benchmark.rentPerSqm) * 100 : 0;
  const isUndervalued = rentGap > 10;
  const vacancyRate = (asset.vacantSurface / asset.totalSurface) * 100;
  const hasUnpaid = asset.tenants.some((t) => t.unpaid);
  const unpaidTotal = asset.tenants.reduce((s, t) => s + (t.unpaidAmount || 0), 0);
  const now = new Date();
  const sixMonths = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
  const nearExpiry = asset.tenants.filter((t) => new Date(t.endDate) <= sixMonths).length;
  const totalRent = asset.annualRent;
  const maxTenantRent = Math.max(...asset.tenants.map((t) => t.currentRent), 0);
  const tenantConcentration = totalRent > 0 ? (maxTenantRent / totalRent) * 100 : 0;
  let health = 100;
  if (vacancyRate > 15) health -= 25; else if (vacancyRate > 8) health -= 12;
  if (hasUnpaid) health -= 15;
  if (nearExpiry > 0) health -= nearExpiry * 8;
  if (tenantConcentration > 50) health -= 15; else if (tenantConcentration > 40) health -= 8;
  if (yieldDelta < 0) health -= 10;
  health = Math.max(0, Math.min(100, health));
  const recommendations: string[] = [];
  if (isHighPotential) recommendations.push(`Rendement supérieur au marché (+${yieldDelta.toFixed(1)} pts) — actif à conserver et optimiser`);
  if (isUndervalued) recommendations.push(`Loyer sous-estimé de ${rentGap.toFixed(0)}% vs benchmark — renégociation recommandée`);
  if (vacancyRate > 15) recommendations.push("Vacance critique — plan de commercialisation urgent");
  if (tenantConcentration > 40) recommendations.push(`Concentration locataire ${tenantConcentration.toFixed(0)}% — diversification nécessaire`);
  if (hasUnpaid) recommendations.push(`Impayés de ${unpaidTotal.toLocaleString("fr-FR")} € — recouvrement à initier`);
  if (nearExpiry > 0) recommendations.push(`${nearExpiry} bail(s) expirant sous 6 mois — anticiper renouvellement`);
  if (recommendations.length === 0) recommendations.push("Actif sain — maintenir la stratégie en cours");
  return { asset, yieldDelta, isHighPotential, rentPerSqm, marketRentPerSqm: benchmark.rentPerSqm, rentGap, isUndervalued, healthScore: health, vacancyRate, hasUnpaid, unpaidTotal, nearExpiry, tenantConcentration, recommendations };
}

const formatCurrency = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
const healthColor = (score: number) => score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";
const healthBg = (score: number) => score >= 75 ? "hsl(var(--success))" : score >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

const Arbitrage = () => {
  const analyses = mockAssets.map(analyzeAsset).sort((a, b) => b.healthScore - a.healthScore);
  const highPotential = analyses.filter((a) => a.isHighPotential);
  const undervalued = analyses.filter((a) => a.isUndervalued);
  const atRisk = analyses.filter((a) => a.healthScore < 60);
  const avgHealth = Math.round(analyses.reduce((s, a) => s + a.healthScore, 0) / analyses.length);
  const yieldCompareData = analyses.map((a) => ({ name: a.asset.name.length > 18 ? a.asset.name.slice(0, 18) + "…" : a.asset.name, rendement: a.asset.yield, marché: MARKET_BENCHMARKS[a.asset.type]?.capRate || 5.5, delta: a.yieldDelta }));
  const rentCompareData = analyses.map((a) => ({ name: a.asset.name.length > 18 ? a.asset.name.slice(0, 18) + "…" : a.asset.name, actuel: Math.round(a.rentPerSqm), benchmark: a.marketRentPerSqm }));
  const healthRadial = analyses.map((a) => ({ name: a.asset.name.length > 14 ? a.asset.name.slice(0, 14) + "…" : a.asset.name, value: a.healthScore, fill: healthBg(a.healthScore) }));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Arbitrage Stratégique</h1>
        <p className="text-sm text-muted-foreground mt-1">Analyse comparative et recommandations automatiques sur le parc</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Santé Moyenne", value: `${avgHealth}/100`, icon: Activity, color: healthColor(avgHealth), sub: avgHealth >= 75 ? "Portefeuille sain" : avgHealth >= 50 ? "Vigilance requise" : "Action urgente" },
          { label: "Actifs Fort Potentiel", value: highPotential.length, icon: TrendingUp, color: "text-success", sub: "Rendement > cap rate marché" },
          { label: "Loyers Sous-estimés", value: undervalued.length, icon: Target, color: "text-warning", sub: "> 10% sous benchmark" },
          { label: "Actifs à Risque", value: atRisk.length, icon: AlertTriangle, color: "text-destructive", sub: "Score santé < 60" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="kpi-card">
              <div className="flex items-center gap-2 mb-2"><kpi.icon className={`h-4 w-4 ${kpi.color}`} /><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{kpi.label}</span></div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" />Rendement vs Cap Rate Marché</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={260}><BarChart data={yieldCompareData} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} /><YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="%" /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} /><Bar dataKey="rendement" name="Rendement actuel" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} /><Bar dataKey="marché" name="Cap rate marché" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-warning" />Loyer €/m² vs Benchmark Marché</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={260}><BarChart data={rentCompareData} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} /><YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="€" /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} /><Bar dataKey="actuel" name="Loyer actuel €/m²" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} /><Bar dataKey="benchmark" name="Benchmark marché" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
      </div>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" />Score de Santé par Actif</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={200}><RadialBarChart innerRadius="30%" outerRadius="90%" data={healthRadial} startAngle={180} endAngle={0}><RadialBar dataKey="value" cornerRadius={6} background={{ fill: "hsl(var(--muted))" }}>{healthRadial.map((entry, i) => <Cell key={i} fill={entry.fill} />)}</RadialBar><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [`${value}/100`, "Score"]} /></RadialBarChart></ResponsiveContainer><div className="flex flex-wrap gap-3 mt-2 justify-center">{analyses.map((a) => (<span key={a.asset.id} className="flex items-center gap-1.5 text-xs"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: healthBg(a.healthScore) }} /><span className="text-muted-foreground">{a.asset.name}</span><span className={`font-semibold ${healthColor(a.healthScore)}`}>{a.healthScore}</span></span>))}</div></CardContent></Card>
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-accent" />Analyse Détaillée & Recommandations</h2>
        <div className="space-y-4">
          {analyses.map((a, i) => (
            <motion.div key={a.asset.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-72 p-5 border-b lg:border-b-0 lg:border-r border-border flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><Building2 className="h-5 w-5 text-accent" /></div>
                      <div><Link to={`/assets/${a.asset.id}`} className="text-sm font-semibold text-foreground hover:text-accent transition-colors">{a.asset.name}</Link><p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{a.asset.city}</p></div>
                    </div>
                    <div className="flex items-center gap-2"><span className="badge-neutral">{a.asset.type}</span><span className={`text-xs font-bold ${healthColor(a.healthScore)}`}>Santé {a.healthScore}/100</span></div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><p className="text-muted-foreground">Rendement</p><p className="font-semibold">{a.asset.yield}%</p></div>
                      <div><p className="text-muted-foreground">Δ Marché</p><p className={`font-semibold ${a.yieldDelta >= 0 ? "text-success" : "text-destructive"}`}>{a.yieldDelta >= 0 ? "+" : ""}{a.yieldDelta.toFixed(1)} pts</p></div>
                      <div><p className="text-muted-foreground">Loyer/m²</p><p className="font-semibold">{Math.round(a.rentPerSqm)} €</p></div>
                      <div><p className="text-muted-foreground">Benchmark</p><p className="font-semibold">{a.marketRentPerSqm} €</p></div>
                      <div><p className="text-muted-foreground">Vacance</p><p className={`font-semibold ${a.vacancyRate > 15 ? "text-destructive" : a.vacancyRate > 8 ? "text-warning" : "text-success"}`}>{a.vacancyRate.toFixed(1)}%</p></div>
                      <div><p className="text-muted-foreground">Concentration</p><p className={`font-semibold ${a.tenantConcentration > 40 ? "text-warning" : "text-foreground"}`}>{a.tenantConcentration.toFixed(0)}%</p></div>
                    </div>
                  </div>
                  <div className="flex-1 p-5">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {a.isHighPotential && <span className="badge-success flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Fort potentiel</span>}
                      {a.isUndervalued && <span className="badge-warning flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Loyer sous-estimé</span>}
                      {a.hasUnpaid && <span className="badge-danger flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Impayés</span>}
                      {a.nearExpiry > 0 && <span className="badge-warning flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {a.nearExpiry} bail(s) proche(s)</span>}
                      {a.healthScore >= 75 && <span className="badge-accent flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Actif sain</span>}
                    </div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recommandations automatiques</h4>
                    <ul className="space-y-1.5">
                      {a.recommendations.map((rec, j) => (<li key={j} className="flex items-start gap-2 text-sm text-foreground"><ArrowUpRight className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />{rec}</li>))}
                    </ul>
                    <div className="mt-4"><Link to={`/assets/${a.asset.id}`} className="text-xs font-medium text-accent hover:underline flex items-center gap-1">Voir la fiche actif <ArrowUpRight className="h-3 w-3" /></Link></div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Arbitrage;
