import { useParams, Link } from "react-router-dom";
import { mockDeals, type Deal } from "@/data/mockData";
import { getAutoPriority, getCapRateValue, getValuationLabel, getRentalPotential, generateBusinessPlan } from "@/lib/dealUtils";
import { getAssetImage } from "@/lib/assetImages";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Calculator, ChevronDown, FileText, Mail, MapPin, Phone, Plus, Printer, TrendingUp, User } from "lucide-react";
import DealMap from "@/components/DealMap";
import logoEquimmox from "@/assets/logo-equimmox.png";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fmt = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

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
    {
      name: assetType === "Logistique" ? "DB Schenker" : assetType === "Commerce" ? "Unibail" : "Gecina SA",
      startDate: "2021-01-01", endDate: "2030-12-31", leaseType: "3/6/9",
      annualRent: Math.round(annualRent * 0.6), indexation: assetType === "Commerce" ? "ILC" : "ILAT", walt, walb,
    },
    {
      name: assetType === "Logistique" ? "Kuehne+Nagel" : assetType === "Commerce" ? "Leroy Merlin" : "BNP Paribas",
      startDate: "2022-06-01", endDate: "2028-05-31", leaseType: "3/6/9",
      annualRent: Math.round(annualRent * 0.4), indexation: assetType === "Commerce" ? "ILC" : "ILAT",
      walt: +(walt * 0.7).toFixed(1), walb: +(walb * 0.8).toFixed(1),
    },
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

  const documents = [
    { name: "Teaser – " + deal.opportunity, type: "Teaser", uploadDate: "2024-04-15" },
    { name: "Information Memorandum", type: "IM", uploadDate: "2024-04-20" },
    { name: "Business Plan prévisionnel", type: "Business Plan", uploadDate: "2024-05-01" },
  ];

  return { assetType, city, surface, broker, receptionDate, rentPerSqm, occupancyRate: +occupancyRate.toFixed(1), walt, walb, annualRent, tenants, estimatedFees, totalInvested, capexHistory, capexProjection, location, documents };
}

const InvestmentCommittee = () => {
  const { id } = useParams();
  const deal = mockDeals.find((d) => d.id === id);
  const [showBusinessPlan, setShowBusinessPlan] = useState(false);
  const [customCapRate, setCustomCapRate] = useState<string>("");

  if (!deal) return <div className="p-8 text-center text-muted-foreground">Deal introuvable</div>;

  const data = getCommitteeData(deal);
  const autoPriority = getAutoPriority(deal.receptionDate);
  const anim = (i: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

  const capRate = customCapRate ? parseFloat(customCapRate) / 100 : (deal.capRate || 0.06);
  const annualRent = deal.annualRent || data.annualRent;
  const capRateValue = getCapRateValue(annualRent, capRate);
  const valuation = getValuationLabel(deal.amount, capRateValue);

  const rental = getRentalPotential(deal.surface || data.surface, deal.occupiedSurface || Math.round((deal.surface || data.surface) * 0.85), deal.rentPerSqm || data.rentPerSqm);

  const bp = generateBusinessPlan(deal);

  const priorityBadgeClass = autoPriority === "Élevée" ? "badge-danger" : autoPriority === "Moyenne" ? "badge-warning" : "badge-neutral";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto print-area">
      <div className="flex items-center justify-between no-print">
        <Link to="/deals" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour au Deal Flow
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
        >
          <Printer className="h-4 w-4" /> Imprimer One Pager
        </button>
      </div>

      {/* Print header with logo */}
      <div className="hidden print-only">
        <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: '#e5e5e5' }}>
          <img src={logoEquimmox} alt="EquimmoX" style={{ width: '105px' }} />
          <div className="text-right">
            <p style={{ fontSize: '10px', color: '#999' }}>Investment Committee — One Pager Confidentiel</p>
            <p style={{ fontSize: '10px', color: '#999' }}>{new Date().toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
      </div>

      {/* Header with photo */}
      <motion.div {...anim(0)}>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-80 shrink-0 space-y-3">
            <img
              src={getAssetImage(data.assetType)}
              alt={deal.opportunity}
              className="w-full h-44 rounded-xl object-cover border border-border/60"
            />
            <DealMap
              address={deal.address || data.city}
              city={data.city}
              name={deal.opportunity}
              className="h-32"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Investment Committee</p>
              <span className={priorityBadgeClass}>Priorité {autoPriority}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{deal.opportunity}</h1>
            <p className="text-sm text-muted-foreground mt-1">{data.assetType} • {data.city}</p>
          </div>
        </div>
      </motion.div>

      {/* A. Informations Générales */}
      <motion.div {...anim(1)} className="kpi-card">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" /> A. Informations Générales
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {[
            { label: "Code", value: deal.code },
            { label: "Nom actif", value: deal.opportunity },
            { label: "Adresse", value: deal.address || data.city },
            { label: "Classe d'actif", value: data.assetType },
            { label: "Broker", value: data.broker },
            { label: "Date réception", value: new Date(data.receptionDate).toLocaleDateString("fr-FR") },
            { label: "Statut pipeline", value: deal.dealStatus },
            { label: "Priorité auto", value: autoPriority },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{item.label}</p>
              <p className="font-medium text-foreground mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* B. Contact Broker */}
      {deal.brokerContact && (
        <motion.div {...anim(1.5)} className="kpi-card">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-accent" /> B. Contact Broker / Apporteur d'affaires
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Nom</p>
              <p className="font-medium text-foreground mt-0.5 flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-accent" />{deal.brokerContact.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Société</p>
              <p className="font-medium text-foreground mt-0.5 flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-accent" />{deal.brokerContact.company}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Email</p>
              <a href={`mailto:${deal.brokerContact.email}`} className="font-medium text-accent mt-0.5 flex items-center gap-1.5 hover:underline"><Mail className="h-3.5 w-3.5" />{deal.brokerContact.email}</a>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Téléphone</p>
              <a href={`tel:${deal.brokerContact.phone}`} className="font-medium text-accent mt-0.5 flex items-center gap-1.5 hover:underline"><Phone className="h-3.5 w-3.5" />{deal.brokerContact.phone}</a>
            </div>
          </div>
        </motion.div>
      )}

      {/* C. Localisation & Marché */}
      <motion.div {...anim(2)} className="kpi-card">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent" /> C. Localisation & Marché
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {[
            { label: "Adresse", value: deal.address || data.city },
            { label: "Accessibilité", value: data.location.accessibility },
            { label: "Dynamique secteur", value: data.location.sectorDynamics },
            { label: "Taux vacance", value: data.location.vacancySubmarket },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{item.label}</p>
              <p className="font-medium text-foreground mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* D. Données Locatives */}
      <motion.div {...anim(3)} className="kpi-card">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" /> D. Données Locatives
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Locataire", "Début", "Échéance", "Type", "Loyer annuel", "Indexation", "WALT", "WALB"].map(h => (
                  <th key={h} className="table-header text-left py-2 px-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.tenants.map((t, i) => (
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

      {/* E. Potentiel Locatif */}
      <motion.div {...anim(3.5)} className="kpi-card">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" /> E. Potentiel Locatif
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Loyer actuel</p>
            <p className="text-lg font-bold text-foreground mt-1">{fmt(rental.currentRent)}</p>
            <p className="text-xs text-muted-foreground">{deal.occupiedSurface || Math.round((deal.surface || data.surface) * 0.85)} m² occupés</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Loyer potentiel plein</p>
            <p className="text-lg font-bold text-accent mt-1">{fmt(rental.potentialRent)}</p>
            <p className="text-xs text-muted-foreground">{deal.surface || data.surface} m² total</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Potentiel d'augmentation</p>
            <p className="text-lg font-bold text-foreground mt-1">{fmt(rental.uplift)}</p>
            <p className="text-xs text-muted-foreground">+{rental.upliftPercent.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Loyer / m² / an</p>
            <p className="text-lg font-bold text-foreground mt-1">{deal.rentPerSqm || data.rentPerSqm} €</p>
          </div>
        </div>
      </motion.div>

      {/* F. Valeur via Cap Rate */}
      <motion.div {...anim(4)} className="kpi-card">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-accent" /> F. Valeur via Taux de Capitalisation
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Taux de capitalisation (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="20"
                  placeholder={((deal.capRate || 0.06) * 100).toFixed(1)}
                  value={customCapRate}
                  onChange={(e) => setCustomCapRate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Loyer annuel</p>
                <p className="text-lg font-bold text-foreground">{fmt(annualRent)}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Formule : Loyer annuel ÷ Taux de capitalisation</p>
              <p className="text-xs text-muted-foreground">{fmt(annualRent)} ÷ {(capRate * 100).toFixed(1)}% = <span className="font-bold text-foreground">{fmt(capRateValue)}</span></p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Prix demandé</span>
              <span className="text-sm font-semibold text-foreground">{fmt(deal.amount)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Valeur estimée</span>
              <span className="text-sm font-semibold text-accent">{fmt(capRateValue)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Écart</span>
              <span className={`text-sm font-semibold ${capRateValue > deal.amount ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                {fmt(capRateValue - deal.amount)} ({((capRateValue - deal.amount) / deal.amount * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Diagnostic</span>
              <span className={valuation.type === "success" ? "badge-success" : valuation.type === "warning" ? "badge-warning" : "badge-danger"}>{valuation.label}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* G. Investissement & CAPEX */}
      <motion.div {...anim(5)} className="kpi-card">
        <h2 className="text-sm font-semibold text-foreground mb-4">G. Investissement & CAPEX</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            {[
              { label: "Prix acquisition", value: fmt(deal.amount) },
              { label: "Frais estimés", value: fmt(data.estimatedFees) },
              { label: "Montant total investi", value: fmt(data.totalInvested) },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">CAPEX historique</p>
            {data.capexHistory.map((c, i) => (
              <div key={i} className="flex justify-between py-1 border-b border-border/30">
                <span className="text-xs text-muted-foreground">{c.year} – {c.description}</span>
                <span className="text-xs font-medium text-foreground">{fmt(c.amount)}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-3 mb-2">CAPEX futur estimé</p>
            {data.capexProjection.map((c, i) => (
              <div key={i} className="flex justify-between py-1 border-b border-border/30">
                <span className="text-xs text-muted-foreground">{c.year} – {c.description}</span>
                <span className="text-xs font-medium text-foreground">{fmt(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* H. TRI */}
      <motion.div {...anim(6)} className="kpi-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">H. TRI & Mini Business Plan</h2>
            <p className="text-xs text-muted-foreground">TRI calculé – horizon {deal.holdingPeriod || 10} ans</p>
            <p className="text-3xl font-bold text-accent mt-1">{bp.irr}%</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBusinessPlan(!showBusinessPlan)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
            >
              Business Plan <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showBusinessPlan ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Investissement total</p>
            <p className="text-sm font-bold text-foreground mt-1">{fmt(bp.totalInvestment)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Cashflow total</p>
            <p className="text-sm font-bold text-foreground mt-1">{fmt(bp.totalCashflow)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Rendement global</p>
            <p className="text-sm font-bold text-foreground mt-1">{bp.globalYield}%</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Prix de sortie</p>
            <p className="text-sm font-bold text-foreground mt-1">{fmt(bp.exitPrice)}</p>
          </div>
        </div>

        {showBusinessPlan && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 overflow-x-auto border-t border-border/50 pt-4"
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["Année", "Loyers", "Charges", "Capex", "Net Cashflow", "Valeur de sortie"].map(h => (
                    <th key={h} className="table-header text-right py-2 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bp.years.map(row => (
                  <tr key={row.year} className="border-b border-border/30">
                    <td className="py-2 px-2 text-center font-medium text-foreground">{row.year}</td>
                    <td className="py-2 px-2 text-right text-foreground">{fmt(row.rent)}</td>
                    <td className="py-2 px-2 text-right text-destructive">{row.charges > 0 ? `-${fmt(row.charges)}` : "–"}</td>
                    <td className="py-2 px-2 text-right text-destructive">{row.capex > 0 ? `-${fmt(row.capex)}` : "–"}</td>
                    <td className="py-2 px-2 text-right font-medium text-foreground">{fmt(row.netCashflow)}</td>
                    <td className="py-2 px-2 text-right text-[hsl(var(--success))]">{row.exitValue > 0 ? fmt(row.exitValue) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </motion.div>

      {/* Documents */}
      <motion.div {...anim(7)} className="kpi-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Documents associés</h2>
          <button className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline">
            <Plus className="h-3.5 w-3.5" /> Ajouter un document
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Nom document", "Type", "Date upload"].map(h => (
                <th key={h} className="table-header text-left py-2 px-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.documents.map((doc, i) => (
              <tr key={i} className="border-b border-border/30">
                <td className="py-2 px-3 font-medium text-foreground">{doc.name}</td>
                <td className="py-2 px-3"><span className="badge-neutral">{doc.type}</span></td>
                <td className="py-2 px-3 text-muted-foreground">{new Date(doc.uploadDate).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default InvestmentCommittee;
