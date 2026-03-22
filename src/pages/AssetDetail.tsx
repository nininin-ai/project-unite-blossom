import { useParams, Link } from "react-router-dom";
import { mockAssets, getAssetLeases, getNextTriennialDate, formatIndexRef } from "@/data/mockData";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, FileSpreadsheet, MapPin, ExternalLink, Pencil, Loader2, Plus, Users, LayoutGrid, Receipt } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
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
  const [editOpen, setEditOpen] = useState(false);
  const [editDefaultTab, setEditDefaultTab] = useState("general");

  const openEditOn = (tab: string) => {
    setEditDefaultTab(tab);
    setEditOpen(true);
  };

  const mockAsset = mockAssets.find((a) => a.id === id);
  const asset = dbAsset ?? mockAsset;

  if (isLoading) return <div className="p-8 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!asset) return <div className="p-8 text-center text-muted-foreground">Actif introuvable</div>;

  const vacancyRate = asset.totalSurface > 0 ? ((asset.vacantSurface / asset.totalSurface) * 100).toFixed(1) : "0.0";
  const chargeData = asset.charges.map((c) => ({ name: c.nature, value: c.annualAmount }));
  const COLORS = ["hsl(187,72%,40%)", "hsl(220,55%,18%)", "hsl(152,60%,40%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(270,50%,50%)"];
  const totalCharges = asset.charges.reduce((s, c) => s + c.annualAmount, 0);

  const leases = getAssetLeases(asset);
  const allLots = (asset.floors ?? []).flatMap(f => (f.lots ?? []).map(l => ({ ...l, floorName: f.name, floorLevel: f.level })));
  const totalLotSurface = allLots.reduce((s, l) => s + l.surface, 0);
  const totalLotVacant = allLots.filter(l => !l.lease).reduce((s, l) => s + l.surface, 0);

  const isDbAsset = !!dbAsset;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/assets" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-4 w-4" /> Retour au parc</Link>
        <div className="flex items-center gap-2">
          {isDbAsset && <Button size="sm" variant="outline" onClick={() => openEditOn("general")} className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> Modifier</Button>}
          <Link to={`/assets/${id}/fiche-commerciale`} className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"><FileSpreadsheet className="h-4 w-4" /> Fiche de commercialisation</Link>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center"><Building2 className="h-6 w-6 text-accent" /></div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{asset.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3.5 w-3.5" /> {asset.address}, {asset.city}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Loyer annuel", value: formatCurrency(asset.annualRent) },
          { label: "Rendement", value: `${asset.yield}%` },
          { label: "Vacance", value: `${vacancyRate}%` },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="kpi-card text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
            <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="locataire" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="locataire" className="text-xs">Locataire</TabsTrigger>
          <TabsTrigger value="surfaces" className="text-xs">Surfaces</TabsTrigger>
          <TabsTrigger value="charges" className="text-xs">Charges / Coûts</TabsTrigger>
          <TabsTrigger value="info" className="text-xs">Informations</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="locataire" className="space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kpi-card overflow-x-auto">
            <h3 className="text-sm font-semibold text-foreground mb-3">Locataires actifs</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Locataire", "Lot", "Étage", "Début", "Échéance", "Triennale", "Type bail", "Loyer annuel", "Indice", "TVA", "Impayé"].map(h => (
                    <th key={h} className="table-header text-left py-3 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leases.map(l => {
                  const triDate = getNextTriennialDate(l);
                  return (
                    <Sheet key={l.id}>
                      <SheetTrigger asChild>
                        <tr className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors">
                          <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">{l.tenantName}</td>
                          <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{l.lotName}</td>
                          <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{l.floorName}</td>
                          <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{l.startDate ? new Date(l.startDate).toLocaleDateString("fr-FR") : "–"}</td>
                          <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{l.endDate ? new Date(l.endDate).toLocaleDateString("fr-FR") : "–"}</td>
                          <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{triDate ? new Date(triDate).toLocaleDateString("fr-FR") : "–"}</td>
                          <td className="py-3 px-3"><span className="badge-neutral">{l.leaseType}</span></td>
                          <td className="py-3 px-3 font-medium text-foreground">{formatCurrency(l.currentRent)}</td>
                          <td className="py-3 px-3 text-muted-foreground">{l.index !== "Aucun" ? `${l.index} (${formatIndexRef(l)})` : "–"}</td>
                          <td className="py-3 px-3">{l.isVatApplicable ? <span className="badge-neutral">{l.vatRate}%</span> : <span className="text-muted-foreground">Non</span>}</td>
                          <td className="py-3 px-3">{l.unpaid ? <span className="badge-danger">{formatCurrency(l.unpaidAmount || 0)}</span> : <span className="badge-success">OK</span>}</td>
                        </tr>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader><SheetTitle>{l.tenantName}</SheetTitle></SheetHeader>
                        <div className="mt-6 space-y-4">
                          {l.tenantSiren && !l.isParticulier && (
                            <a href={getPappersUrl(l.tenantName, l.tenantSiren)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors">
                              <div className="h-10 w-10 rounded-lg bg-[hsl(220,55%,18%)] flex items-center justify-center text-white font-bold text-sm">P</div>
                              <div className="flex-1"><p className="text-sm font-medium text-foreground">Voir sur Pappers</p><p className="text-xs text-muted-foreground">SIREN : {l.tenantSiren}</p></div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                          )}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">Lot</div><div className="font-medium">{l.lotName} ({l.lotType})</div>
                            <div className="text-muted-foreground">Surface</div><div className="font-medium">{l.lotSurface} m²</div>
                            <div className="text-muted-foreground">Étage</div><div className="font-medium">{l.floorName}</div>
                            <div className="text-muted-foreground">Loyer €/m²</div><div className="font-medium">{l.lotSurface > 0 ? (l.currentRent / l.lotSurface).toFixed(0) : "–"} €</div>
                            {triDate && <><div className="text-muted-foreground">Prochaine triennale</div><div className="font-medium">{new Date(triDate).toLocaleDateString("fr-FR")}</div></>}
                            {l.isVatApplicable && <><div className="text-muted-foreground">TVA</div><div className="font-medium">{l.vatRate}%</div></>}
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  );
                })}
                {leases.length === 0 && (
                  <tr><td colSpan={11} className="py-10 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Aucun locataire actif</p>
                      {isDbAsset && <Button size="sm" variant="outline" onClick={() => openEditOn("surfaces")} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Ajouter un locataire</Button>}
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </motion.div>
        </TabsContent>

        <TabsContent value="surfaces" className="space-y-4">
          {allLots.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kpi-card flex flex-col items-center justify-center py-12 gap-3">
              <LayoutGrid className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Aucune surface renseignée</p>
              {isDbAsset && <Button size="sm" variant="outline" onClick={() => openEditOn("surfaces")} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Ajouter des surfaces</Button>}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kpi-card overflow-x-auto">
              <h3 className="text-sm font-semibold text-foreground mb-4">Répartition des surfaces</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Étage", "Lot", "Type", "Surface", "Statut"].map(h => (
                      <th key={h} className="table-header text-left py-3 px-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allLots.map(l => (
                    <tr key={l.id} className="border-b border-border/50">
                      <td className="py-3 px-3 font-medium text-foreground">{l.floorName}</td>
                      <td className="py-3 px-3 text-foreground">{l.name}</td>
                      <td className="py-3 px-3"><span className="badge-neutral">{l.type}</span></td>
                      <td className="py-3 px-3 text-foreground">{l.surface.toLocaleString("fr-FR")} m²</td>
                      <td className="py-3 px-3">{l.lease ? <span className="badge-success">Occupé – {l.lease.tenantName}</span> : <span className="badge-warning">Vacant</span>}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td className="py-3 px-3 font-semibold text-foreground" colSpan={3}>Total</td>
                    <td className="py-3 px-3 font-semibold text-foreground">{totalLotSurface.toLocaleString("fr-FR")} m²</td>
                    <td className="py-3 px-3"><span className={`font-semibold ${totalLotVacant > 0 ? "text-warning" : "text-success"}`}>{totalLotVacant > 0 ? `${totalLotVacant.toLocaleString("fr-FR")} m² vacant` : "100% occupé"}</span></td>
                  </tr>
                </tfoot>
              </table>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="charges" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kpi-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">{["Nature", "Montant annuel", "Refacturation", "Commentaire"].map(h => <th key={h} className="table-header text-left py-3 px-3">{h}</th>)}</tr></thead>
                <tbody>
                  {asset.charges.map(c => (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="py-3 px-3 font-medium text-foreground">{c.nature}</td>
                      <td className="py-3 px-3 text-foreground">{formatCurrency(c.annualAmount)}</td>
                      <td className="py-3 px-3">{c.rebillable ? <span className="badge-success">{c.rebillablePercent}%</span> : <span className="badge-neutral">Non</span>}</td>
                      <td className="py-3 px-3 text-xs text-muted-foreground">{c.comment || "–"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t-2 border-border"><td className="py-3 px-3 font-semibold text-foreground">Total</td><td className="py-3 px-3 font-semibold text-foreground">{formatCurrency(totalCharges)}</td><td colSpan={2}></td></tr></tfoot>
              </table>
            </motion.div>
            <div className="kpi-card">
              <h3 className="text-sm font-semibold text-foreground mb-4">Répartition des charges</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={chargeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">{chargeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 8, fontSize: 12 }} /></PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">{chargeData.map((c, i) => <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{c.name}</div>)}</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="info">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kpi-card max-w-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4">Informations du bien</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                { label: "Type de bien", value: asset.type },
                { label: "Copropriété", value: asset.isCopropriete ? "Oui" : "Non" },
                { label: "Année de construction", value: asset.constructionYear.toString() },
                { label: "Prix d'acquisition", value: formatCurrency(asset.acquisitionPrice) },
                { label: "Date d'acquisition", value: asset.acquisitionDate ? new Date(asset.acquisitionDate).toLocaleDateString("fr-FR") : "–" },
                { label: "Surface totale", value: `${asset.totalSurface.toLocaleString("fr-FR")} m²` },
                { label: "Nombre de locataires", value: leases.length.toString() },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
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

      {isDbAsset && asset && <EditAssetDialog asset={asset} open={editOpen} onOpenChange={setEditOpen} />}
    </div>
  );
};

export default AssetDetail;
