import { useAssets } from "@/hooks/useAssets";
import { Asset } from "@/data/mockData";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  TrendingDown,
  AlertTriangle,
  Building2,
  ArrowUpRight,
  Activity,
  Target,
  Zap,
  MapPin,
  Banknote,
  CreditCard,
  ShieldAlert,
  RefreshCw,
  DollarSign,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const fmt = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

interface AssetAnalysis {
  asset: Asset;
  yieldDelta: number;
  vacancyRate: number;
  annualCharges: number;
  annualCreditPayments: number;
  cashFlow: number;
  cashFlowYield: number;
  hasUnpaid: boolean;
  unpaidTotal: number;
  nearExpiry: number;
  tenantConcentration: number;
  totalCRD: number;
  hasCredit: boolean;
  creditEndsSoon: boolean;
  healthScore: number;
  recommendations: { text: string; level: "critical" | "warning" | "info" }[];
  verdict: { label: string; className: string; phrase: string };
}

function analyzeAsset(asset: Asset, portfolioAvgYield: number): AssetAnalysis {
  const yieldDelta = asset.yield - portfolioAvgYield;
  const vacancyRate = asset.totalSurface > 0 ? (asset.vacantSurface / asset.totalSurface) * 100 : 0;

  // Charges
  const annualCharges = (asset.charges || []).reduce((s, c) => s + c.annualAmount, 0);

  // Credits
  const credits = asset.credits || [];
  const annualCreditPayments = credits.reduce((s, c) => s + c.monthlyPayment * 12, 0);
  const totalCRD = credits.reduce((s, c) => s + c.remainingCapital, 0);
  const hasCredit = credits.length > 0;

  const now = new Date();
  const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const creditEndsSoon = credits.some((c) => c.endDate && new Date(c.endDate) <= oneYear);

  // Cash-flow
  const cashFlow = asset.annualRent - annualCharges - annualCreditPayments;
  const cashFlowYield = asset.acquisitionPrice > 0 ? (cashFlow / asset.acquisitionPrice) * 100 : 0;

  // Tenants
  const hasUnpaid = asset.tenants.some((t) => t.unpaid);
  const unpaidTotal = asset.tenants.reduce((s, t) => s + (t.unpaidAmount || 0), 0);
  const sixMonths = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
  const nearExpiry = asset.tenants.filter((t) => t.endDate && new Date(t.endDate) <= sixMonths).length;
  const maxTenantRent = Math.max(...asset.tenants.map((t) => t.currentRent), 0);
  const tenantConcentration = asset.annualRent > 0 ? (maxTenantRent / asset.annualRent) * 100 : 0;

  // Health score
  let health = 100;
  if (cashFlow < 0) health -= 30;
  else if (cashFlowYield < 1) health -= 15;
  if (vacancyRate > 15) health -= 20;
  else if (vacancyRate > 8) health -= 10;
  if (hasUnpaid) health -= 15;
  if (unpaidTotal > asset.annualRent * 0.1) health -= 10;
  if (yieldDelta < -1) health -= 15;
  else if (yieldDelta < 0) health -= 5;
  if (annualCreditPayments > asset.annualRent * 0.6) health -= 15;
  if (tenantConcentration > 50) health -= 10;
  if (nearExpiry > 0) health -= nearExpiry * 5;
  health = Math.max(0, Math.min(100, health));

  // Recommendations
  const recommendations: AssetAnalysis["recommendations"] = [];

  // 1 — Rendement faible
  if (yieldDelta < -1)
    recommendations.push({ text: `Rendement ${asset.yield.toFixed(1)}% très inférieur à la moyenne du parc (${portfolioAvgYield.toFixed(1)}%) — capital immobilisé sous-performant`, level: "critical" });
  else if (yieldDelta < 0)
    recommendations.push({ text: `Rendement ${asset.yield.toFixed(1)}% légèrement sous la moyenne du parc (${portfolioAvgYield.toFixed(1)}%)`, level: "warning" });

  // 2 — Cash-flow
  if (cashFlow < 0)
    recommendations.push({ text: `Cash-flow négatif de ${fmt(cashFlow)}/an — déficit chronique, l'actif coûte plus qu'il ne rapporte`, level: "critical" });
  else if (cashFlowYield < 1)
    recommendations.push({ text: `Cash-flow net très faible (${cashFlowYield.toFixed(1)}%) — rentabilité réelle insuffisante`, level: "warning" });

  // 3 — Impayés
  if (unpaidTotal > 0)
    recommendations.push({ text: `Impayés de ${fmt(unpaidTotal)} — risque contentieux, recouvrement à initier`, level: unpaidTotal > asset.annualRent * 0.1 ? "critical" : "warning" });

  // 4 — Crédit
  if (hasCredit && annualCreditPayments > asset.annualRent * 0.6)
    recommendations.push({ text: `Charge de crédit (${fmt(annualCreditPayments)}/an) absorbe ${((annualCreditPayments / asset.annualRent) * 100).toFixed(0)}% des loyers — rentabilité détruite`, level: "critical" });
  if (!hasCredit && asset.acquisitionPrice > 0)
    recommendations.push({ text: `Aucun crédit — option de refinancement possible pour libérer du capital`, level: "info" });
  if (creditEndsSoon)
    recommendations.push({ text: `Crédit arrivant à échéance sous 12 mois — étudier refinancement ou remboursement`, level: "warning" });

  // 5 — Revente
  if (health < 50 && asset.acquisitionPrice > 0)
    recommendations.push({ text: `Actif fragile — envisager la cession pour libérer ${fmt(asset.acquisitionPrice)} et réinvestir sur de meilleurs actifs`, level: "warning" });

  // Vacance
  if (vacancyRate > 15)
    recommendations.push({ text: `Vacance critique (${vacancyRate.toFixed(0)}%) — plan de commercialisation urgent`, level: "critical" });

  if (recommendations.length === 0)
    recommendations.push({ text: "Actif sain — maintenir la stratégie en cours", level: "info" });

  // Verdict
  let verdict: AssetAnalysis["verdict"];
  if (health < 40) verdict = { label: "Arbitrer", className: "badge-danger", phrase: "Cession recommandée — actif destructeur de valeur" };
  else if (health < 60) verdict = { label: "Surveiller", className: "badge-warning", phrase: "Vigilance — des actions correctives sont nécessaires" };
  else if (cashFlow < 0) verdict = { label: "Restructurer", className: "badge-warning", phrase: "Restructuration financière nécessaire" };
  else verdict = { label: "Conserver", className: "badge-success", phrase: "Actif performant — maintenir la stratégie" };

  return {
    asset, yieldDelta, vacancyRate, annualCharges, annualCreditPayments, cashFlow, cashFlowYield,
    hasUnpaid, unpaidTotal, nearExpiry, tenantConcentration, totalCRD, hasCredit, creditEndsSoon,
    healthScore: health, recommendations, verdict,
  };
}

const healthColor = (score: number) =>
  score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";

const Arbitrage = () => {
  const { assets, isLoading } = useAssets();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Chargement…</span>
      </div>
    );
  }

  if (!assets || assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
        <Building2 className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">Aucun actif à analyser</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Ajoutez des actifs à votre parc et renseignez leurs informations (loyers, charges, crédits) pour générer l'analyse d'arbitrage.
        </p>
        <Link to="/assets" className="text-sm font-medium text-accent hover:underline flex items-center gap-1">
          Aller au parc immobilier <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  const totalAUM = assets.reduce((s, a) => s + a.acquisitionPrice, 0);
  const portfolioAvgYield = totalAUM > 0
    ? assets.reduce((s, a) => s + a.yield * a.acquisitionPrice, 0) / totalAUM
    : 0;

  const analyses = assets.map((a) => analyzeAsset(a, portfolioAvgYield)).sort((a, b) => a.healthScore - b.healthScore);

  const negativeCF = analyses.filter((a) => a.cashFlow < 0);
  const withUnpaid = analyses.filter((a) => a.unpaidTotal > 0);
  const atRisk = analyses.filter((a) => a.healthScore < 60);
  const avgHealth = Math.round(analyses.reduce((s, a) => s + a.healthScore, 0) / analyses.length);

  // Check data completeness
  const missingTenants = assets.filter((a) => !a.tenants || a.tenants.length === 0);
  const missingCharges = assets.filter((a) => !a.charges || a.charges.length === 0);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Arbitrage Stratégique</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analyse du parc basée sur vos données réelles — rendement, cash-flow, crédits et risques
        </p>
      </div>

      {(missingTenants.length > 0 || missingCharges.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-semibold">Données incomplètes — l'analyse peut être imprécise</span>
          </div>
          {missingTenants.length > 0 && (
            <p className="text-xs text-muted-foreground">
              <strong>{missingTenants.length} actif(s)</strong> sans locataires renseignés :{" "}
              {missingTenants.map((a) => a.name).join(", ")}
            </p>
          )}
          {missingCharges.length > 0 && (
            <p className="text-xs text-muted-foreground">
              <strong>{missingCharges.length} actif(s)</strong> sans charges renseignées :{" "}
              {missingCharges.map((a) => a.name).join(", ")}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Complétez ces informations via la fiche de chaque actif pour affiner l'arbitrage.
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Santé Moyenne", value: `${avgHealth}/100`, icon: Activity, color: healthColor(avgHealth), sub: avgHealth >= 75 ? "Portefeuille sain" : avgHealth >= 50 ? "Vigilance requise" : "Action urgente" },
          { label: "Cash-flow Négatif", value: negativeCF.length, icon: TrendingDown, color: negativeCF.length > 0 ? "text-destructive" : "text-success", sub: negativeCF.length > 0 ? `${negativeCF.length} actif(s) déficitaire(s)` : "Tous les actifs rentables" },
          { label: "Impayés Locatifs", value: withUnpaid.length, icon: ShieldAlert, color: withUnpaid.length > 0 ? "text-destructive" : "text-success", sub: withUnpaid.length > 0 ? `${fmt(withUnpaid.reduce((s, a) => s + a.unpaidTotal, 0))} d'impayés` : "Aucun impayé" },
          { label: "Actifs à Risque", value: atRisk.length, icon: AlertTriangle, color: atRisk.length > 0 ? "text-destructive" : "text-success", sub: "Score santé < 60" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="kpi-card">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{kpi.label}</span>
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          Analyse Détaillée & Recommandations
          <span className="text-xs font-normal text-muted-foreground ml-2">
            (trié du plus fragile au plus sain)
          </span>
        </h2>
        <div className="space-y-4">
          {analyses.map((a, i) => (
            <motion.div key={a.asset.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  {/* Left panel — Asset info */}
                  <div className="lg:w-72 p-5 border-b lg:border-b-0 lg:border-r border-border flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <Link to={`/assets/${a.asset.id}`} className="text-sm font-semibold text-foreground hover:text-accent transition-colors">
                          {a.asset.name}
                        </Link>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {a.asset.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge-neutral">{a.asset.type}</span>
                      <span className={`text-xs font-bold ${healthColor(a.healthScore)}`}>Santé {a.healthScore}/100</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Rendement</p>
                        <p className="font-semibold">{a.asset.yield.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Δ Parc</p>
                        <p className={`font-semibold ${a.yieldDelta >= 0 ? "text-success" : "text-destructive"}`}>
                          {a.yieldDelta >= 0 ? "+" : ""}{a.yieldDelta.toFixed(1)} pts
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vacance</p>
                        <p className={`font-semibold ${a.vacancyRate > 15 ? "text-destructive" : a.vacancyRate > 8 ? "text-warning" : "text-success"}`}>
                          {a.vacancyRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valeur</p>
                        <p className="font-semibold">{fmt(a.asset.acquisitionPrice)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right panel — Analysis */}
                  <div className="flex-1 p-5 space-y-4">
                    {/* Financial metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> Cash-flow net
                        </p>
                        <p className={`text-sm font-bold ${a.cashFlow >= 0 ? "text-success" : "text-destructive"}`}>
                          {fmt(a.cashFlow)}/an
                        </p>
                      </div>
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                          <Banknote className="h-3 w-3" /> Charges
                        </p>
                        <p className="text-sm font-bold text-foreground">{fmt(a.annualCharges)}/an</p>
                      </div>
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                          <CreditCard className="h-3 w-3" /> Crédit
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {a.hasCredit ? `${fmt(a.annualCreditPayments)}/an` : "Aucun"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" /> CRD
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {a.hasCredit ? fmt(a.totalCRD) : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-1.5">
                      {a.recommendations.map((r, ri) => (
                        <div key={ri} className="flex items-start gap-2 text-xs rounded-md px-2.5 py-2"
                          style={{
                            backgroundColor: r.level === "critical" ? "hsl(0 72% 51% / 0.06)"
                              : r.level === "warning" ? "hsl(38 92% 50% / 0.06)"
                              : "hsl(var(--accent) / 0.06)",
                          }}>
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0"
                            style={{
                              color: r.level === "critical" ? "hsl(0,72%,51%)"
                                : r.level === "warning" ? "hsl(38,92%,50%)"
                                : "hsl(var(--accent))",
                            }} />
                          <span className="text-foreground">{r.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Verdict */}
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <span className={a.verdict.className}>{a.verdict.label}</span>
                        <p className="text-sm text-muted-foreground">{a.verdict.phrase}</p>
                      </div>
                      <Link to={`/assets/${a.asset.id}`}
                        className="text-xs font-medium text-accent hover:underline flex items-center gap-1 shrink-0">
                        Fiche actif <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
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
