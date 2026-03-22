import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Asset, Floor, Lot, Lease, Charge, LEASE_TYPES, INDEX_TYPES, INDEX_QUARTERS, LOT_TYPES, VAT_RATES, getAssetAnnualRent, getAssetOccupiedSurface, leaseHasTrienniale, getLeaseAnnualRent } from "@/data/mockData";
import { useUpdateAsset } from "@/hooks/useAssets";
import AssetDocuments from "@/components/AssetDocuments";

const ASSET_TYPES = ["Bureau", "Commerce", "Résidentiel", "Logistique", "Mixte"];

interface EditAssetDialogProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyLot = (): Lot => ({ id: crypto.randomUUID(), name: "", surface: 0, type: "Bureau" });
const emptyFloor = (level: number): Floor => ({ id: crypto.randomUUID(), name: `Étage ${level}`, level, lots: [] });
const emptyLease = (): Lease => ({
  id: crypto.randomUUID(), tenantName: "", isParticulier: false, tenantSiren: "", startDate: "", endDate: "", triennialDate: "",
  leaseType: "3/6/9", deposit: 0, currentRent: 0, rentInputMode: "annual",
  index: "ILAT", indexQuarter: "T1", indexYear: new Date().getFullYear(),
  accompaniment: "", chargesManagement: "Réel", unpaid: false, isVatApplicable: false, vatRate: 20, floors: [],
});
const emptyCharge = (): Charge => ({ id: crypto.randomUUID(), nature: "", annualAmount: 0, rebillable: false, rebillablePercent: 0, comment: "" });

const formatCurrency = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

const EditAssetDialog = ({ asset, open, onOpenChange }: EditAssetDialogProps) => {
  const updateMutation = useUpdateAsset();

  const [form, setForm] = useState({ name: "", address: "", city: "", type: "Bureau", acquisitionPrice: 0, acquisitionDate: "", constructionYear: 2000, isCopropriete: false, totalSurface: 0 });
  const [leases, setLeases] = useState<Lease[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [expandedLeases, setExpandedLeases] = useState<Set<string>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setForm({ name: asset.name, address: asset.address, city: asset.city, type: asset.type, acquisitionPrice: asset.acquisitionPrice, acquisitionDate: asset.acquisitionDate, constructionYear: asset.constructionYear, isCopropriete: asset.isCopropriete, totalSurface: asset.totalSurface });
      setLeases(JSON.parse(JSON.stringify(asset.leases ?? [])));
      setCharges((asset.charges ?? []).map(c => ({ ...c })));
      setExpandedLeases(new Set());
      setExpandedFloors(new Set());
    }
  }, [open, asset]);

  const computedAnnualRent = useMemo(() => {
    return leases.reduce((s, l) => s + getLeaseAnnualRent(l), 0);
  }, [leases]);

  const occupiedSurface = useMemo(() => {
    return leases.reduce((s, l) => s + (l.floors ?? []).reduce((fs, f) => fs + f.lots.reduce((ls, lot) => ls + lot.surface, 0), 0), 0);
  }, [leases]);

  const vacantSurface = Math.max(0, form.totalSurface - occupiedSurface);

  const setField = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => set(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Lease operations
  const updateLease = (li: number, key: keyof Lease, value: any) => setLeases(prev => prev.map((l, i) => i === li ? { ...l, [key]: value } : l));
  const removeLease = (li: number) => setLeases(prev => prev.filter((_, i) => i !== li));

  // Floor operations within a lease
  const addFloorToLease = (li: number) => setLeases(prev => prev.map((l, i) => i === li ? { ...l, floors: [...l.floors, emptyFloor(l.floors.length)] } : l));
  const updateFloorInLease = (li: number, fi: number, key: keyof Floor, value: any) => setLeases(prev => prev.map((l, i) => i === li ? { ...l, floors: l.floors.map((f, j) => j === fi ? { ...f, [key]: value } : f) } : l));
  const removeFloorFromLease = (li: number, fi: number) => setLeases(prev => prev.map((l, i) => i === li ? { ...l, floors: l.floors.filter((_, j) => j !== fi) } : l));

  // Lot operations within a floor within a lease
  const addLotToFloor = (li: number, fi: number) => setLeases(prev => prev.map((l, i) => i === li ? { ...l, floors: l.floors.map((f, j) => j === fi ? { ...f, lots: [...f.lots, emptyLot()] } : f) } : l));
  const updateLotInFloor = (li: number, fi: number, loi: number, key: keyof Lot, value: any) => setLeases(prev => prev.map((l, i) => i === li ? { ...l, floors: l.floors.map((f, j) => j === fi ? { ...f, lots: f.lots.map((lot, k) => k === loi ? { ...lot, [key]: value } : lot) } : f) } : l));
  const removeLotFromFloor = (li: number, fi: number, loi: number) => setLeases(prev => prev.map((l, i) => i === li ? { ...l, floors: l.floors.map((f, j) => j === fi ? { ...f, lots: f.lots.filter((_, k) => k !== loi) } : f) } : l));

  const updateCharge = (idx: number, key: keyof Charge, value: any) => setCharges(prev => prev.map((c, i) => i === idx ? { ...c, [key]: value } : c));

  const handleSave = () => {
    const yieldVal = form.acquisitionPrice > 0 ? +((computedAnnualRent / form.acquisitionPrice) * 100).toFixed(2) : 0;
    updateMutation.mutate({
      id: asset.id,
      updates: { ...form, annualRent: computedAnnualRent, vacantSurface, yield: yieldVal, leases, charges },
    }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Modifier l'actif</DialogTitle></DialogHeader>
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="general" className="text-xs">Général</TabsTrigger>
            <TabsTrigger value="locataires" className="text-xs">Locataires ({leases.length})</TabsTrigger>
            <TabsTrigger value="charges" className="text-xs">Charges ({charges.length})</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
          </TabsList>

          {/* ── General ── */}
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-1.5"><Label>Nom</Label><Input value={form.name} onChange={e => setField("name", e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Adresse</Label><Input value={form.address} onChange={e => setField("address", e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Ville</Label><Input value={form.city} onChange={e => setField("city", e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Type</Label><Select value={form.type} onValueChange={v => setField("type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-1.5"><Label>Prix d'acquisition (€)</Label><Input type="number" value={form.acquisitionPrice} onChange={e => setField("acquisitionPrice", +e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Date d'acquisition</Label><Input type="date" value={form.acquisitionDate} onChange={e => setField("acquisitionDate", e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Année construction</Label><Input type="number" value={form.constructionYear} onChange={e => setField("constructionYear", +e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Surface totale (m²)</Label><Input type="number" value={form.totalSurface} onChange={e => setField("totalSurface", +e.target.value)} /></div>
              <div className="flex items-center gap-3 col-span-full"><Switch checked={form.isCopropriete} onCheckedChange={v => setField("isCopropriete", v)} /><Label>Copropriété</Label></div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Loyer annuel (calculé)</span><span className="font-semibold text-foreground">{formatCurrency(computedAnnualRent)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Surface occupée</span><span className="font-semibold text-foreground">{occupiedSurface.toLocaleString("fr-FR")} m²</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Surface vacante</span><span className="font-semibold text-warning">{vacantSurface.toLocaleString("fr-FR")} m²</span></div>
            </div>
          </TabsContent>

          {/* ── Locataires (Lease → Floor → Lot) ── */}
          <TabsContent value="locataires" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Locataire → Étage → Lot</p>
              <Button size="sm" variant="outline" onClick={() => setLeases(l => [...l, emptyLease()])} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Locataire</Button>
            </div>

            {leases.map((lease, li) => (
              <div key={lease.id} className="rounded-lg border border-border">
                {/* Lease header */}
                <div className="flex items-center gap-2 p-3 bg-muted/30 cursor-pointer" onClick={() => toggle(setExpandedLeases, lease.id)}>
                  {expandedLeases.has(lease.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="text-sm font-semibold text-foreground">{lease.tenantName || "Nouveau locataire"}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{formatCurrency(getLeaseAnnualRent(lease))}/an</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={e => { e.stopPropagation(); removeLease(li); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>

                {expandedLeases.has(lease.id) && (
                  <div className="p-3 space-y-3">
                    {/* Lease fields */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="grid gap-0.5"><Label className="text-[10px]">Nom du locataire</Label><Input value={lease.tenantName} onChange={e => updateLease(li, "tenantName", e.target.value)} className="h-8 text-xs" /></div>
                      <div className="grid gap-0.5">
                        <div className="flex items-center gap-2">
                          <Label className="text-[10px]">SIREN</Label>
                          <div className="flex items-center gap-1"><Switch checked={lease.isParticulier} onCheckedChange={v => updateLease(li, "isParticulier", v)} className="scale-75" /><span className="text-[10px] text-muted-foreground">Particulier</span></div>
                        </div>
                        {!lease.isParticulier && <Input value={lease.tenantSiren || ""} onChange={e => updateLease(li, "tenantSiren", e.target.value)} className="h-8 text-xs" placeholder="SIREN" />}
                        {lease.isParticulier && <p className="text-[10px] text-muted-foreground italic pt-1">Pas de SIREN</p>}
                      </div>
                      <div className="grid gap-0.5"><Label className="text-[10px]">Type de bail</Label>
                        <Select value={lease.leaseType} onValueChange={v => updateLease(li, "leaseType", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{LEASE_TYPES.map(lt => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}</SelectContent></Select>
                      </div>
                      <div className="grid gap-0.5"><Label className="text-[10px]">Début</Label><Input type="date" value={lease.startDate} onChange={e => updateLease(li, "startDate", e.target.value)} className="h-8 text-xs" /></div>
                      <div className="grid gap-0.5"><Label className="text-[10px]">Échéance</Label><Input type="date" value={lease.endDate} onChange={e => updateLease(li, "endDate", e.target.value)} className="h-8 text-xs" /></div>
                      {leaseHasTrienniale(lease.leaseType) && (
                        <div className="grid gap-0.5"><Label className="text-[10px]">Prochaine triennale</Label><Input type="date" value={lease.triennialDate} onChange={e => updateLease(li, "triennialDate", e.target.value)} className="h-8 text-xs" /></div>
                      )}
                      <div className="grid gap-0.5">
                        <div className="flex items-center gap-2">
                          <Label className="text-[10px]">Loyer ({lease.rentInputMode === "monthly" ? "mensuel" : "annuel"}) €</Label>
                          <div className="flex items-center gap-1"><Switch checked={lease.rentInputMode === "monthly"} onCheckedChange={v => updateLease(li, "rentInputMode", v ? "monthly" : "annual")} className="scale-75" /><span className="text-[10px] text-muted-foreground">Mensuel</span></div>
                        </div>
                        <Input type="number" value={lease.currentRent} onChange={e => updateLease(li, "currentRent", +e.target.value)} className="h-8 text-xs" />
                        {lease.rentInputMode === "monthly" && <p className="text-[10px] text-muted-foreground">= {formatCurrency(lease.currentRent * 12)}/an</p>}
                      </div>
                      <div className="grid gap-0.5"><Label className="text-[10px]">Dépôt de garantie (€)</Label><Input type="number" value={lease.deposit} onChange={e => updateLease(li, "deposit", +e.target.value)} className="h-8 text-xs" /></div>
                      <div className="grid gap-0.5"><Label className="text-[10px]">Indice</Label>
                        <Select value={lease.index} onValueChange={v => updateLease(li, "index", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{INDEX_TYPES.map(idx => <SelectItem key={idx} value={idx}>{idx}</SelectItem>)}</SelectContent></Select>
                      </div>
                      {lease.index !== "Aucun" && (
                        <>
                          <div className="grid gap-0.5"><Label className="text-[10px]">Trimestre réf.</Label>
                            <Select value={lease.indexQuarter} onValueChange={v => updateLease(li, "indexQuarter", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{INDEX_QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent></Select>
                          </div>
                          <div className="grid gap-0.5"><Label className="text-[10px]">Année réf.</Label><Input type="number" value={lease.indexYear} onChange={e => updateLease(li, "indexYear", +e.target.value)} className="h-8 text-xs" /></div>
                        </>
                      )}
                      <div className="grid gap-0.5"><Label className="text-[10px]">Accompagnement</Label><Input value={lease.accompaniment} onChange={e => updateLease(li, "accompaniment", e.target.value)} className="h-8 text-xs" /></div>
                      <div className="grid gap-0.5"><Label className="text-[10px]">Gestion charges</Label>
                        <Select value={lease.chargesManagement} onValueChange={v => updateLease(li, "chargesManagement", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{["Forfait", "Réel", "Provision", "Triple net"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <Switch checked={lease.unpaid} onCheckedChange={v => updateLease(li, "unpaid", v)} />
                        <span className="text-xs text-muted-foreground">Impayé</span>
                        {lease.unpaid && <Input type="number" className="w-24 h-7 text-xs ml-1" placeholder="Montant" value={lease.unpaidAmount || 0} onChange={e => updateLease(li, "unpaidAmount", +e.target.value)} />}
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <Switch checked={lease.isVatApplicable} onCheckedChange={v => updateLease(li, "isVatApplicable", v)} />
                        <span className="text-xs text-muted-foreground">Assujetti TVA</span>
                        {lease.isVatApplicable && (
                          <Select value={String(lease.vatRate || 20)} onValueChange={v => updateLease(li, "vatRate", +v)}>
                            <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{VAT_RATES.map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    {/* Floors inside this lease */}
                    <div className="border-t border-border/40 pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">Surfaces occupées</span>
                        <Button size="sm" variant="outline" onClick={() => addFloorToLease(li)} className="gap-1.5 text-xs h-7"><Plus className="h-3 w-3" /> Étage</Button>
                      </div>

                      {lease.floors.map((floor, fi) => (
                        <div key={floor.id} className="rounded-md border border-border/60 bg-background">
                          <div className="flex items-center gap-2 p-2 cursor-pointer" onClick={() => toggle(setExpandedFloors, floor.id)}>
                            {expandedFloors.has(floor.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            <Input value={floor.name} onClick={e => e.stopPropagation()} onChange={e => updateFloorInLease(li, fi, "name", e.target.value)} className="h-7 w-32 text-xs" />
                            <span className="text-[10px] text-muted-foreground">Niv.</span>
                            <Input type="number" value={floor.level} onClick={e => e.stopPropagation()} onChange={e => updateFloorInLease(li, fi, "level", +e.target.value)} className="h-7 w-14 text-xs" />
                            <span className="text-[10px] text-muted-foreground ml-auto">{floor.lots.length} lot(s) · {floor.lots.reduce((s, l) => s + l.surface, 0)} m²</span>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); removeFloorFromLease(li, fi); }}><Trash2 className="h-3 w-3" /></Button>
                          </div>

                          {expandedFloors.has(floor.id) && (
                            <div className="p-2 border-t border-border/40 space-y-1.5">
                              <Button size="sm" variant="outline" onClick={() => addLotToFloor(li, fi)} className="gap-1.5 text-[10px] h-6"><Plus className="h-2.5 w-2.5" /> Lot</Button>
                              {floor.lots.map((lot, loi) => (
                                <div key={lot.id} className="flex items-center gap-2">
                                  <Input value={lot.name} onChange={e => updateLotInFloor(li, fi, loi, "name", e.target.value)} className="h-7 w-28 text-xs" placeholder="Nom" />
                                  <Input type="number" value={lot.surface || ""} onChange={e => updateLotInFloor(li, fi, loi, "surface", +e.target.value)} className="h-7 w-20 text-xs" placeholder="m²" />
                                  <Select value={lot.type} onValueChange={v => updateLotInFloor(li, fi, loi, "type", v)}>
                                    <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>{LOT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                  </Select>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeLotFromFloor(li, fi, loi)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                              ))}
                              {floor.lots.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">Aucun lot</p>}
                            </div>
                          )}
                        </div>
                      ))}
                      {lease.floors.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">Aucun étage défini</p>}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {leases.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucun locataire défini</p>}
          </TabsContent>

          {/* ── Charges ── */}
          <TabsContent value="charges" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Détaillez les charges et coûts de l'actif.</p>
              <Button size="sm" variant="outline" onClick={() => setCharges(c => [...c, emptyCharge()])} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Ajouter</Button>
            </div>
            {charges.map((c, i) => (
              <div key={c.id} className="grid grid-cols-[1fr_100px_80px_60px_1fr_40px] gap-2 items-end">
                <div className="grid gap-1"><Label className="text-[10px]">Nature</Label><Input value={c.nature} onChange={e => updateCharge(i, "nature", e.target.value)} /></div>
                <div className="grid gap-1"><Label className="text-[10px]">Montant/an</Label><Input type="number" value={c.annualAmount} onChange={e => updateCharge(i, "annualAmount", +e.target.value)} /></div>
                <div className="flex items-center gap-1.5 pb-1"><Switch checked={c.rebillable} onCheckedChange={v => updateCharge(i, "rebillable", v)} /><span className="text-[10px] text-muted-foreground">Refact.</span></div>
                <div className="grid gap-1"><Label className="text-[10px]">%</Label><Input type="number" disabled={!c.rebillable} value={c.rebillablePercent || 0} onChange={e => updateCharge(i, "rebillablePercent", +e.target.value)} /></div>
                <div className="grid gap-1"><Label className="text-[10px]">Commentaire</Label><Input value={c.comment} onChange={e => updateCharge(i, "comment", e.target.value)} /></div>
                <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive" onClick={() => setCharges(p => p.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
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

          {/* ── Documents ── */}
          <TabsContent value="documents"><AssetDocuments assetId={asset.id} /></TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-1.5">
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAssetDialog;
