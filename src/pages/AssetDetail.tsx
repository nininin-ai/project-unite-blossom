import { useParams, Link } from "react-router-dom";
import { mockAssets } from "@/data/mockData";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, FileSpreadsheet, MapPin, ExternalLink, FileText, Pencil, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAsset } from "@/hooks/useAssets";
import AssetDocuments from "@/components/AssetDocuments";
import EditAssetDialog from "@/components/EditAssetDialog";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

const getPappersUrl = (name: string, siren: string) => {
  const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `https://www.pappers.fr/entreprise/${slug}-${siren}`;
};

const AssetDetail = () => {
  const { id } = useParams();
  const { data: dbAsset, isLoading } = useAsset(id);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const mockAsset = mockAssets.find((a) => a.id === id);
  const asset = dbAsset ?? mockAsset;

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!asset) return <div className="p-8 text-center text-muted-foreground">Actif introuvable</div>;

  const vacancyRate = ((asset.vacantSurface / asset.totalSurface) * 100).toFixed(1);
  const chargeData = asset.charges.map((c) => ({ name: c.nature, value: c.annualAmount }));
  const COLORS = ["hsl(187,72%,40%)", "hsl(220,55%,18%)", "hsl(152,60%,40%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(270,50%,50%)"];
  const totalCharges = asset.charges.reduce((s, c) => s + c.annualAmount, 0);
  const totalFloorSurface = asset.floors.reduce((s, f) => s + f.surface, 0);
  const totalFloorVacant = asset.floors.reduce((s, f) => s + (f.vacant ? f.surface : 0), 0);

  const isDbAsset = !!dbAsset;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/assets" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour au parc
        </Link>
        <div className="flex items-center gap-2">
          {isDbAsset && (
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Modifier
            </Button>
          )}
          <Link to={`/assets/${id}/fiche-commerciale`} className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors">
            <FileSpreadsheet className="h-4 w-4" /> Fiche de commercialisation
          </Link>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{asset.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5" /> {asset.address}, {asset.city}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Loyer annuel", value: formatCurrency(asset.annualRent) },
          { label: "Rendement", value: `${asset.yield}%` },
          { label: "Vacance", value: `${vacancyRate}%` },
          { label: "Score risque", value: `${asset.riskScore}/100` },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="kpi-card text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
            <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="occupation" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="occupation" className="text-xs">Occupation</TabsTrigger>
          <TabsTrigger value="charges" className="text-xs">Charges / Coûts</TabsTrigger>
          <TabsTrigger value="info" className="text-xs">Informations</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="occupation" className="space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kpi-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Locataire", "Début", "Échéance", "Triennale", "Type", "Dépôt", "Loyer annuel", "Indice", "Accompagnement", "Charges", "Impayé"].map((h) => (
                    <th key={h} className="table-header text-left py-3 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {asset.tenants.map((t) => (
                  <Sheet key={t.id}>
                    <SheetTrigger asChild>
                      <tr className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedTenant(t.id)}>
                        <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">{t.name}</td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{new Date(t.startDate).toLocaleDateString("fr-FR")}</td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{new Date(t.endDate).toLocaleDateString("fr-FR")}</td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{new Date(t.triennialDate).toLocaleDateString("fr-FR")}</td>
                        <td className="py-3 px-3"><span className="badge-neutral">{t.leaseType}</span></td>
                        <td className="py-3 px-3 text-muted-foreground">{formatCurrency(t.deposit)}</td>
                        <td className="py-3 px-3 font-medium text-foreground">{formatCurrency(t.currentRent)}</td>
                        <td className="py-3 px-3 text-muted-foreground">{t.index} ({t.indexRef})</td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">{t.accompaniment}</td>
                        <td className="py-3 px-3"><span className="badge-neutral">{t.chargesManagement}</span></td>
                        <td className="py-3 px-3">
                          {t.unpaid ? <span className="badge-danger">{formatCurrency(t.unpaidAmount || 0)}</span> : <span className="badge-success">OK</span>}
                        </td>
                      </tr>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader><SheetTitle>{t.name}</SheetTitle></SheetHeader>
                      <div className="mt-6 space-y-4">
                        {t.siren && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-foreground">Informations entreprise</h4>
                            <a href={getPappersUrl(t.name, t.siren)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors">
                              <div className="h-10 w-10 rounded-lg bg-[hsl(220,55%,18%)] flex items-center justify-center text-white font-bold text-sm">P</div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">Voir sur Pappers</p>
                                <p className="text-xs text-muted-foreground">SIREN : {t.siren}</p>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                          </div>
                        )}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-foreground">Documents liés</h4>
                          <div className="space-y-2">
                            {["Bail commercial signé", "Avenant n°1", "État des lieux"].map((doc) => (
                              <div key={doc} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                                <FileText className="h-4 w-4 text-accent" />
                                <span className="text-sm text-foreground">{doc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-foreground">Détails du bail</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">Surface</div>
                            <div className="font-medium">{t.surface} m²</div>
                            <div className="text-muted-foreground">Étage</div>
                            <div className="font-medium">{t.floor}</div>
                            <div className="text-muted-foreground">Loyer €/m²</div>
                            <div className="font-medium">{(t.currentRent / t.surface).toFixed(0)} €</div>
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                ))}
              </tbody>
            </table>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kpi-card overflow-x-auto">
            <h3 className="text-sm font-semibold text-foreground mb-4">Surfaces vacantes par étage</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Étage", "Type", "Surface totale", "Surface vacante (m²)", "% Vacance"].map((h) => (
                    <th key={h} className="table-header text-left py-3 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {asset.floors.map((f) => {
                  const vacantSurface = f.vacant ? f.surface : 0;
                  const vacPct = ((vacantSurface / f.surface) * 100).toFixed(1);
                  return (
                    <tr key={f.floor} className="border-b border-border/50">
                      <td className="py-3 px-3 font-medium text-foreground">Étage {f.floor}</td>
                      <td className="py-3 px-3"><span className="badge-neutral">{f.type}</span></td>
                      <td className="py-3 px-3 text-foreground">{f.surface.toLocaleString("fr-FR")} m²</td>
                      <td className="py-3 px-3 text-muted-foreground">{vacantSurface > 0 ? `${vacantSurface.toLocaleString("fr-FR")} m²` : "–"}</td>
                      <td className="py-3 px-3"><span className={`font-semibold ${+vacPct > 0 ? "text-warning" : "text-success"}`}>{vacPct}%</span></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td className="py-3 px-3 font-semibold text-foreground">Total</td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3 font-semibold text-foreground">{totalFloorSurface.toLocaleString("fr-FR")} m²</td>
                  <td className="py-3 px-3 font-semibold text-foreground">{totalFloorVacant > 0 ? `${totalFloorVacant.toLocaleString("fr-FR")} m²` : "–"}</td>
                  <td className="py-3 px-3">
                    <span className={`font-semibold ${totalFloorVacant > 0 ? "text-warning" : "text-success"}`}>
                      {totalFloorSurface > 0 ? ((totalFloorVacant / totalFloorSurface) * 100).toFixed(1) : "0.0"}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </motion.div>

          <div className="kpi-card flex flex-col items-center justify-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Surfaces vacantes totales</p>
            <p className="text-3xl font-bold text-foreground">{asset.vacantSurface.toLocaleString("fr-FR")} m²</p>
            <p className="text-lg font-semibold text-warning mt-1">{vacancyRate}% de vacance</p>
          </div>
        </TabsContent>

        <TabsContent value="charges" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kpi-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Nature", "Montant annuel", "Refacturation", "Commentaire"].map((h) => (
                      <th key={h} className="table-header text-left py-3 px-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {asset.charges.map((c) => (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="py-3 px-3 font-medium text-foreground">{c.nature}</td>
                      <td className="py-3 px-3 text-foreground">{formatCurrency(c.annualAmount)}</td>
                      <td className="py-3 px-3">
                        {c.rebillable ? <span className="badge-success">{c.rebillablePercent}%</span> : <span className="badge-neutral">Non</span>}
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground">{c.comment || "–"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td className="py-3 px-3 font-semibold text-foreground">Total</td>
                    <td className="py-3 px-3 font-semibold text-foreground">{formatCurrency(totalCharges)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </motion.div>

            <div className="kpi-card">
              <h3 className="text-sm font-semibold text-foreground mb-4">Répartition des charges</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={chargeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {chargeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {chargeData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {c.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Credits tab ── */}
        <TabsContent value="credits" className="space-y-4">
          {(!asset.credits || asset.credits.length === 0) ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kpi-card text-center py-12">
              <Landmark className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Aucun crédit renseigné pour cet actif.</p>
              {isDbAsset && (
                <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Ajouter un crédit
                </Button>
              )}
            </motion.div>
          ) : (
            asset.credits.map((cr, idx) => (
              <motion.div key={cr.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="kpi-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Landmark className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{cr.bank || "Banque non renseignée"}</h3>
                    <p className="text-xs text-muted-foreground">{cr.purpose}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  {[
                    { label: "Capital emprunté", value: formatCurrency(cr.totalCapital) },
                    { label: "Capital restant dû", value: formatCurrency(cr.remainingCapital) },
                    { label: "Mensualité", value: formatCurrency(cr.monthlyPayment) },
                    { label: "Taux", value: `${cr.interestRate}%` },
                    { label: "Type de taux", value: cr.rateType },
                    { label: "Durée", value: `${cr.duration} mois` },
                    { label: "Début", value: cr.startDate ? new Date(cr.startDate).toLocaleDateString("fr-FR") : "–" },
                    { label: "Fin théorique", value: cr.endDate ? new Date(cr.endDate).toLocaleDateString("fr-FR") : "–" },
                    { label: "Pénalités RA", value: cr.earlyRepaymentPenalty || "–" },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{item.label}</span>
                      <span className="font-medium text-foreground mt-0.5">{item.value}</span>
                    </div>
                  ))}
                </div>
                {cr.amortizationDocName && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 border border-border/50">
                      <FileText className="h-4 w-4 text-accent" />
                      <span className="text-sm text-foreground flex-1">{cr.amortizationDocName}</span>
                      {cr.amortizationDocPath && (
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={async () => {
                          const { data } = await import("@/integrations/supabase/client").then(m => m.supabase.storage.from("asset-documents").createSignedUrl(cr.amortizationDocPath!, 60));
                          if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                        }}>
                          <Download className="h-3 w-3" /> Ouvrir
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
          {asset.credits && asset.credits.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kpi-card">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total emprunté</span>
                  <span className="font-bold text-foreground text-lg">{formatCurrency(asset.credits.reduce((s, c) => s + c.totalCapital, 0))}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Capital restant dû total</span>
                  <span className="font-bold text-foreground text-lg">{formatCurrency(asset.credits.reduce((s, c) => s + c.remainingCapital, 0))}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Mensualités totales</span>
                  <span className="font-bold text-foreground text-lg">{formatCurrency(asset.credits.reduce((s, c) => s + c.monthlyPayment, 0))}</span>
                </div>
              </div>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="info">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kpi-card max-w-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4">Informations du bien</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                { label: "Type de bien", value: asset.type },
                { label: "Copropriété", value: asset.isCopropriete ? "Oui" : "Non" },
                { label: "Année de construction", value: asset.constructionYear.toString() },
                { label: "Derniers travaux", value: asset.lastWorks },
                { label: "Prix d'acquisition", value: formatCurrency(asset.acquisitionPrice) },
                { label: "Date d'acquisition", value: new Date(asset.acquisitionDate).toLocaleDateString("fr-FR") },
                { label: "Surface totale", value: `${asset.totalSurface.toLocaleString("fr-FR")} m²` },
                { label: "Nombre de locataires", value: asset.tenants.length.toString() },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>

            <h4 className="text-sm font-semibold text-foreground mt-6 mb-3">Détail par étage</h4>
            <div className="space-y-2">
              {asset.floors.map((f) => (
                <div key={f.floor} className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">Étage {f.floor}</span>
                    <span className="badge-neutral">{f.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{f.surface} m²</span>
                    {f.vacant ? <span className="badge-warning">Vacant</span> : <span className="badge-success">Occupé</span>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="documents">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kpi-card max-w-2xl">
            {id ? <AssetDocuments assetId={id} /> : <p className="text-muted-foreground">ID manquant</p>}
          </motion.div>
        </TabsContent>
      </Tabs>

      {isDbAsset && asset && (
        <EditAssetDialog asset={asset} open={editOpen} onOpenChange={setEditOpen} />
      )}
    </div>
  );
};

export default AssetDetail;
