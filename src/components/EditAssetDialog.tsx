import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, Loader2, Upload, FileText } from "lucide-react";
import { Asset, Tenant, Charge } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateAsset } from "@/hooks/useAssets";
import AssetDocuments from "@/components/AssetDocuments";

const ASSET_TYPES = ["Bureau", "Commerce", "Résidentiel", "Logistique", "Mixte"];
const LEASE_TYPES = ["3/6/9", "6/9", "Dérogatoire", "Précaire", "Professionnel"];


interface EditAssetDialogProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FloorRow = { floor: number; type: string; surface: number; vacant: boolean };

const emptyTenant = (): Tenant => ({
  id: crypto.randomUUID(),
  name: "",
  startDate: "",
  endDate: "",
  triennialDate: "",
  leaseType: "3/6/9",
  deposit: 0,
  currentRent: 0,
  index: "ILAT",
  indexRef: "",
  accompaniment: "",
  chargesManagement: "Forfait",
  unpaid: false,
  unpaidAmount: 0,
  surface: 0,
  floor: 0,
  siren: "",
});

const emptyCharge = (): Charge => ({
  id: crypto.randomUUID(),
  nature: "",
  annualAmount: 0,
  rebillable: false,
  rebillablePercent: 0,
  comment: "",
});

const emptyFloor = (nextFloor: number): FloorRow => ({
  floor: nextFloor,
  type: "Bureau",
  surface: 0,
  vacant: true,
});


const EditAssetDialog = ({ asset, open, onOpenChange }: EditAssetDialogProps) => {
  const updateMutation = useUpdateAsset();

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    type: "Bureau",
    acquisitionPrice: 0,
    acquisitionDate: "",
    constructionYear: 2000,
    isCopropriete: false,
    lastWorks: "",
    annualRent: 0,
    riskScore: 50,
  });

  const [floors, setFloors] = useState<FloorRow[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);

  useEffect(() => {
    if (open) {
      setForm({
        name: asset.name,
        address: asset.address,
        city: asset.city,
        type: asset.type,
        acquisitionPrice: asset.acquisitionPrice,
        acquisitionDate: asset.acquisitionDate,
        constructionYear: asset.constructionYear,
        isCopropriete: asset.isCopropriete,
        lastWorks: asset.lastWorks,
        annualRent: asset.annualRent,
        riskScore: asset.riskScore,
      });
      setFloors(asset.floors.map((f) => ({ ...f })));
      setTenants(asset.tenants.map((t) => ({ ...t })));
      setCharges(asset.charges.map((c) => ({ ...c })));
      setCredits((asset.credits || []).map((cr) => ({ ...cr })));
    }
  }, [open, asset]);

  const totalSurface = useMemo(() => floors.reduce((s, f) => s + f.surface, 0), [floors]);
  const vacantSurface = useMemo(() => floors.filter((f) => f.vacant).reduce((s, f) => s + f.surface, 0), [floors]);

  const setField = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const updateFloor = (idx: number, key: keyof FloorRow, value: any) => {
    setFloors((prev) => prev.map((f, i) => (i === idx ? { ...f, [key]: value } : f)));
  };

  const updateTenant = (idx: number, key: keyof Tenant, value: any) => {
    setTenants((prev) => prev.map((t, i) => (i === idx ? { ...t, [key]: value } : t)));
  };

  const updateCharge = (idx: number, key: keyof Charge, value: any) => {
    setCharges((prev) => prev.map((c, i) => (i === idx ? { ...c, [key]: value } : c)));
  };

  const updateCredit = (idx: number, key: keyof Credit, value: any) => {
    setCredits((prev) => prev.map((cr, i) => (i === idx ? { ...cr, [key]: value } : cr)));
  };

  const handleAmortizationUpload = async (creditIdx: number, file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const filePath = `${user.id}/${asset.id}/amort_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("asset-documents").upload(filePath, file);
    if (!error) {
      updateCredit(creditIdx, "amortizationDocPath", filePath);
      updateCredit(creditIdx, "amortizationDocName", file.name);
    }
  };

  const handleSave = () => {
    const yieldVal = form.acquisitionPrice > 0 ? +((form.annualRent / form.acquisitionPrice) * 100).toFixed(2) : 0;
    updateMutation.mutate(
      {
        id: asset.id,
        updates: {
          ...form,
          totalSurface,
          vacantSurface,
          yield: yieldVal,
          floors,
          tenants,
          charges,
          credits,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'actif</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="general" className="text-xs">Général</TabsTrigger>
            <TabsTrigger value="floors" className="text-xs">Étages ({floors.length})</TabsTrigger>
            <TabsTrigger value="tenants" className="text-xs">Locataires ({tenants.length})</TabsTrigger>
            <TabsTrigger value="charges" className="text-xs">Charges ({charges.length})</TabsTrigger>
            <TabsTrigger value="credits" className="text-xs">Crédits ({credits.length})</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
          </TabsList>

          {/* ── General ── */}
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Nom</Label>
                <Input value={form.name} onChange={(e) => setField("name", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Adresse</Label>
                <Input value={form.address} onChange={(e) => setField("address", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Ville</Label>
                <Input value={form.city} onChange={(e) => setField("city", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setField("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Prix d'acquisition (€)</Label>
                <Input type="number" value={form.acquisitionPrice} onChange={(e) => setField("acquisitionPrice", +e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Date d'acquisition</Label>
                <Input type="date" value={form.acquisitionDate} onChange={(e) => setField("acquisitionDate", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Année construction</Label>
                <Input type="number" value={form.constructionYear} onChange={(e) => setField("constructionYear", +e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Loyer annuel (€)</Label>
                <Input type="number" value={form.annualRent} onChange={(e) => setField("annualRent", +e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Derniers travaux</Label>
                <Input value={form.lastWorks} onChange={(e) => setField("lastWorks", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Score risque (0-100)</Label>
                <Input type="number" min={0} max={100} value={form.riskScore} onChange={(e) => setField("riskScore", +e.target.value)} />
              </div>
              <div className="flex items-center gap-3 col-span-full">
                <Switch checked={form.isCopropriete} onCheckedChange={(v) => setField("isCopropriete", v)} />
                <Label>Copropriété</Label>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Surface totale (calculée)</span><span className="font-semibold text-foreground">{totalSurface.toLocaleString("fr-FR")} m²</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Surface vacante (calculée)</span><span className="font-semibold text-warning">{vacantSurface.toLocaleString("fr-FR")} m²</span></div>
            </div>
          </TabsContent>

          {/* ── Floors ── */}
          <TabsContent value="floors" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Ajoutez les étages pour calculer automatiquement les surfaces.</p>
              <Button size="sm" variant="outline" onClick={() => setFloors((f) => [...f, emptyFloor(f.length)])} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </Button>
            </div>
            {floors.map((f, i) => (
              <div key={i} className="grid grid-cols-[60px_1fr_100px_80px_40px] gap-2 items-end">
                <div className="grid gap-1">
                  <Label className="text-[10px]">Étage</Label>
                  <Input type="number" value={f.floor} onChange={(e) => updateFloor(i, "floor", +e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label className="text-[10px]">Type</Label>
                  <Select value={f.type} onValueChange={(v) => updateFloor(i, "type", v)}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="text-[10px]">Surface m²</Label>
                  <Input type="number" value={f.surface} onChange={(e) => updateFloor(i, "surface", +e.target.value)} />
                </div>
                <div className="flex items-center gap-1.5 pb-1">
                  <Switch checked={f.vacant} onCheckedChange={(v) => updateFloor(i, "vacant", v)} />
                  <span className="text-xs text-muted-foreground">Vacant</span>
                </div>
                <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive" onClick={() => setFloors((p) => p.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {floors.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucun étage défini</p>}
          </TabsContent>

          {/* ── Tenants ── */}
          <TabsContent value="tenants" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Gérez les locataires de l'actif.</p>
              <Button size="sm" variant="outline" onClick={() => setTenants((t) => [...t, emptyTenant()])} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </Button>
            </div>
            {tenants.map((t, i) => (
              <div key={t.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{t.name || `Locataire ${i + 1}`}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setTenants((p) => p.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Nom</Label>
                    <Input value={t.name} onChange={(e) => updateTenant(i, "name", e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">SIREN</Label>
                    <Input value={t.siren || ""} onChange={(e) => updateTenant(i, "siren", e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Type de bail</Label>
                    <Select value={t.leaseType} onValueChange={(v) => updateTenant(i, "leaseType", v)}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LEASE_TYPES.map((lt) => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Début</Label>
                    <Input type="date" value={t.startDate} onChange={(e) => updateTenant(i, "startDate", e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Échéance</Label>
                    <Input type="date" value={t.endDate} onChange={(e) => updateTenant(i, "endDate", e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Triennale</Label>
                    <Input type="date" value={t.triennialDate} onChange={(e) => updateTenant(i, "triennialDate", e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Surface m²</Label>
                    <Input type="number" value={t.surface} onChange={(e) => updateTenant(i, "surface", +e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Étage</Label>
                    <Input type="number" value={t.floor} onChange={(e) => updateTenant(i, "floor", +e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Loyer annuel (€)</Label>
                    <Input type="number" value={t.currentRent} onChange={(e) => updateTenant(i, "currentRent", +e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Dépôt de garantie (€)</Label>
                    <Input type="number" value={t.deposit} onChange={(e) => updateTenant(i, "deposit", +e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Indice</Label>
                    <Input value={t.index} onChange={(e) => updateTenant(i, "index", e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Réf. indice</Label>
                    <Input value={t.indexRef} onChange={(e) => updateTenant(i, "indexRef", e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Accompagnement</Label>
                    <Input value={t.accompaniment} onChange={(e) => updateTenant(i, "accompaniment", e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Gestion charges</Label>
                    <Select value={t.chargesManagement} onValueChange={(v) => updateTenant(i, "chargesManagement", v)}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Forfait", "Réel", "Provision"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Switch checked={t.unpaid} onCheckedChange={(v) => updateTenant(i, "unpaid", v)} />
                    <span className="text-xs text-muted-foreground">Impayé</span>
                    {t.unpaid && (
                      <Input type="number" className="w-24 h-8 ml-2" placeholder="Montant" value={t.unpaidAmount || 0} onChange={(e) => updateTenant(i, "unpaidAmount", +e.target.value)} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {tenants.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucun locataire</p>}
          </TabsContent>

          {/* ── Charges ── */}
          <TabsContent value="charges" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Détaillez les charges et coûts de l'actif.</p>
              <Button size="sm" variant="outline" onClick={() => setCharges((c) => [...c, emptyCharge()])} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </Button>
            </div>
            {charges.map((c, i) => (
              <div key={c.id} className="grid grid-cols-[1fr_100px_80px_60px_1fr_40px] gap-2 items-end">
                <div className="grid gap-1">
                  <Label className="text-[10px]">Nature</Label>
                  <Input value={c.nature} onChange={(e) => updateCharge(i, "nature", e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label className="text-[10px]">Montant/an</Label>
                  <Input type="number" value={c.annualAmount} onChange={(e) => updateCharge(i, "annualAmount", +e.target.value)} />
                </div>
                <div className="flex items-center gap-1.5 pb-1">
                  <Switch checked={c.rebillable} onCheckedChange={(v) => updateCharge(i, "rebillable", v)} />
                  <span className="text-[10px] text-muted-foreground">Refact.</span>
                </div>
                <div className="grid gap-1">
                  <Label className="text-[10px]">%</Label>
                  <Input type="number" disabled={!c.rebillable} value={c.rebillablePercent || 0} onChange={(e) => updateCharge(i, "rebillablePercent", +e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label className="text-[10px]">Commentaire</Label>
                  <Input value={c.comment} onChange={(e) => updateCharge(i, "comment", e.target.value)} />
                </div>
                <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive" onClick={() => setCharges((p) => p.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {charges.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucune charge définie</p>}
            {charges.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm flex justify-between">
                <span className="text-muted-foreground">Total charges annuelles</span>
                <span className="font-semibold text-foreground">{charges.reduce((s, c) => s + c.annualAmount, 0).toLocaleString("fr-FR")} €</span>
              </div>
            )}
          </TabsContent>

          {/* ── Credits ── */}
          <TabsContent value="credits" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Gérez les crédits bancaires associés à cet actif.</p>
              <Button size="sm" variant="outline" onClick={() => setCredits((c) => [...c, emptyCredit()])} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </Button>
            </div>
            {credits.map((cr, i) => (
              <div key={cr.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{cr.bank || `Crédit ${i + 1}`}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setCredits((p) => p.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Banque</Label>
                    <Input value={cr.bank} onChange={(e) => updateCredit(i, "bank", e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Objet du prêt</Label>
                    <Select value={cr.purpose} onValueChange={(v) => updateCredit(i, "purpose", v)}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CREDIT_PURPOSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Capital emprunté (€)</Label>
                    <Input type="number" value={cr.totalCapital} onChange={(e) => updateCredit(i, "totalCapital", +e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Capital restant dû (€)</Label>
                    <Input type="number" value={cr.remainingCapital} onChange={(e) => updateCredit(i, "remainingCapital", +e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Mensualité (€)</Label>
                    <Input type="number" value={cr.monthlyPayment} onChange={(e) => updateCredit(i, "monthlyPayment", +e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Taux (%)</Label>
                    <Input type="number" step="0.01" value={cr.interestRate} onChange={(e) => updateCredit(i, "interestRate", +e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Type de taux</Label>
                    <Select value={cr.rateType} onValueChange={(v) => updateCredit(i, "rateType", v)}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RATE_TYPES.map((rt) => <SelectItem key={rt} value={rt}>{rt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Durée (mois)</Label>
                    <Input type="number" value={cr.duration} onChange={(e) => updateCredit(i, "duration", +e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Date de début</Label>
                    <Input type="date" value={cr.startDate} onChange={(e) => updateCredit(i, "startDate", e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]">Date de fin théorique</Label>
                    <Input type="date" value={cr.endDate} onChange={(e) => updateCredit(i, "endDate", e.target.value)} />
                  </div>
                  <div className="grid gap-1 col-span-2 sm:col-span-3">
                    <Label className="text-[10px]">Pénalités de remboursement anticipé</Label>
                    <Input value={cr.earlyRepaymentPenalty} onChange={(e) => updateCredit(i, "earlyRepaymentPenalty", e.target.value)} placeholder="Ex: 3% du capital restant dû" />
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <Label className="text-[10px]">Tableau d'amortissement (PDF)</Label>
                    {cr.amortizationDocName ? (
                      <div className="flex items-center gap-2 mt-1 p-2 rounded-lg bg-muted/50 border border-border/50">
                        <FileText className="h-4 w-4 text-accent" />
                        <span className="text-sm text-foreground flex-1">{cr.amortizationDocName}</span>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => { updateCredit(i, "amortizationDocPath", ""); updateCredit(i, "amortizationDocName", ""); }}>
                          Supprimer
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-muted cursor-pointer transition-colors">
                          <Upload className="h-3.5 w-3.5" /> Uploader un PDF
                          <input type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAmortizationUpload(i, f); }} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {credits.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucun crédit défini</p>}
            {credits.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Total emprunté</span><span className="font-semibold text-foreground">{credits.reduce((s, c) => s + c.totalCapital, 0).toLocaleString("fr-FR")} €</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Capital restant dû total</span><span className="font-semibold text-foreground">{credits.reduce((s, c) => s + c.remainingCapital, 0).toLocaleString("fr-FR")} €</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mensualités totales</span><span className="font-semibold text-foreground">{credits.reduce((s, c) => s + c.monthlyPayment, 0).toLocaleString("fr-FR")} €</span></div>
              </div>
            )}
          </TabsContent>

          {/* ── Documents ── */}
          <TabsContent value="documents">
            <AssetDocuments assetId={asset.id} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-1.5">
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAssetDialog;
