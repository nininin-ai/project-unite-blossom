import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Asset, Floor, Lot, Lease, Charge, LEASE_TYPES, INDEX_TYPES, INDEX_QUARTERS, LOT_TYPES, VAT_RATES, getAssetLeases } from "@/data/mockData";
import { useUpdateAsset } from "@/hooks/useAssets";
import AssetDocuments from "@/components/AssetDocuments";

const ASSET_TYPES = ["Bureau", "Commerce", "Résidentiel", "Logistique", "Mixte"];

interface EditAssetDialogProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyLease = (): Lease => ({
  id: crypto.randomUUID(), tenantName: "", tenantSiren: "", startDate: "", endDate: "", triennialDate: "",
  leaseType: "3/6/9", deposit: 0, currentRent: 0, index: "ILAT", indexQuarter: "T1", indexYear: new Date().getFullYear(),
  accompaniment: "", chargesManagement: "Réel", unpaid: false, isVatApplicable: false, vatRate: 20,
});

const emptyLot = (): Lot => ({ id: crypto.randomUUID(), name: "", surface: 0, type: "Bureau" });

const emptyFloor = (level: number): Floor => ({ id: crypto.randomUUID(), name: `Étage ${level}`, level, lots: [] });

const emptyCharge = (): Charge => ({ id: crypto.randomUUID(), nature: "", annualAmount: 0, rebillable: false, rebillablePercent: 0, comment: "" });

const EditAssetDialog = ({ asset, open, onOpenChange }: EditAssetDialogProps) => {
  const updateMutation = useUpdateAsset();

  const [form, setForm] = useState({ name: "", address: "", city: "", type: "Bureau", acquisitionPrice: 0, acquisitionDate: "", constructionYear: 2000, isCopropriete: false, annualRent: 0 });
  const [floors, setFloors] = useState<Floor[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setForm({ name: asset.name, address: asset.address, city: asset.city, type: asset.type, acquisitionPrice: asset.acquisitionPrice, acquisitionDate: asset.acquisitionDate, constructionYear: asset.constructionYear, isCopropriete: asset.isCopropriete, annualRent: asset.annualRent });
      setFloors(JSON.parse(JSON.stringify(asset.floors ?? [])));
      setCharges((asset.charges ?? []).map(c => ({ ...c })));
      setExpandedFloors(new Set());
      setExpandedLots(new Set());
    }
  }, [open, asset]);

  const totalSurface = useMemo(() => floors.reduce((s, f) => s + f.lots.reduce((ls, l) => ls + l.surface, 0), 0), [floors]);
  const vacantSurface = useMemo(() => floors.reduce((s, f) => s + f.lots.filter(l => !l.lease).reduce((ls, l) => ls + l.surface, 0), 0), [floors]);

  const setField = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const toggleFloor = (id: string) => setExpandedFloors(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleLot = (id: string) => setExpandedLots(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const updateFloor = (fi: number, key: keyof Floor, value: any) => setFloors(prev => prev.map((f, i) => i === fi ? { ...f, [key]: value } : f));
  const addLot = (fi: number) => setFloors(prev => prev.map((f, i) => i === fi ? { ...f, lots: [...f.lots, emptyLot()] } : f));
  const updateLot = (fi: number, li: number, key: keyof Lot, value: any) => setFloors(prev => prev.map((f, i) => i === fi ? { ...f, lots: f.lots.map((l, j) => j === li ? { ...l, [key]: value } : l) } : f));
  const removeLot = (fi: number, li: number) => setFloors(prev => prev.map((f, i) => i === fi ? { ...f, lots: f.lots.filter((_, j) => j !== li) } : f));
  const addLease = (fi: number, li: number) => setFloors(prev => prev.map((f, i) => i === fi ? { ...f, lots: f.lots.map((l, j) => j === li ? { ...l, lease: emptyLease() } : l) } : f));
  const removeLease = (fi: number, li: number) => setFloors(prev => prev.map((f, i) => i === fi ? { ...f, lots: f.lots.map((l, j) => j === li ? { ...l, lease: undefined } : l) } : f));
  const updateLease = (fi: number, li: number, key: keyof Lease, value: any) => setFloors(prev => prev.map((f, i) => i === fi ? { ...f, lots: f.lots.map((l, j) => j === li && l.lease ? { ...l, lease: { ...l.lease, [key]: value } } : l) } : f));

  const updateCharge = (idx: number, key: keyof Charge, value: any) => setCharges(prev => prev.map((c, i) => i === idx ? { ...c, [key]: value } : c));

  const handleSave = () => {
    const yieldVal = form.acquisitionPrice > 0 ? +((form.annualRent / form.acquisitionPrice) * 100).toFixed(2) : 0;
    updateMutation.mutate({ id: asset.id, updates: { ...form, totalSurface, vacantSurface, yield: yieldVal, floors, charges } }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Modifier l'actif</DialogTitle></DialogHeader>
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="general" className="text-xs">Général</TabsTrigger>
            <TabsTrigger value="surfaces" className="text-xs">Surfaces ({floors.length})</TabsTrigger>
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
              <div className="grid gap-1.5"><Label>Loyer annuel (€)</Label><Input type="number" value={form.annualRent} onChange={e => setField("annualRent", +e.target.value)} /></div>
              <div className="flex items-center gap-3 col-span-full"><Switch checked={form.isCopropriete} onCheckedChange={v => setField("isCopropriete", v)} /><Label>Copropriété</Label></div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Surface totale (calculée)</span><span className="font-semibold text-foreground">{totalSurface.toLocaleString("fr-FR")} m²</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Surface vacante (calculée)</span><span className="font-semibold text-warning">{vacantSurface.toLocaleString("fr-FR")} m²</span></div>
            </div>
          </TabsContent>

          {/* ── Surfaces (Floor → Lot → Lease hierarchy) ── */}
          <TabsContent value="surfaces" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Actif → Étage / Niveau → Lot → Bail</p>
              <Button size="sm" variant="outline" onClick={() => setFloors(f => [...f, emptyFloor(f.length)])} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Étage</Button>
            </div>

            {floors.map((floor, fi) => (
              <div key={floor.id} className="rounded-lg border border-border">
                {/* Floor header */}
                <div className="flex items-center gap-2 p-3 bg-muted/30 cursor-pointer" onClick={() => toggleFloor(floor.id)}>
                  {expandedFloors.has(floor.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Input value={floor.name} onClick={e => e.stopPropagation()} onChange={e => updateFloor(fi, "name", e.target.value)} className="h-8 w-40 text-sm font-semibold" />
                  <span className="text-xs text-muted-foreground">Niv. {floor.level}</span>
                  <Input type="number" value={floor.level} onClick={e => e.stopPropagation()} onChange={e => updateFloor(fi, "level", +e.target.value)} className="h-8 w-16 text-xs" />
                  <span className="text-xs text-muted-foreground ml-auto">{floor.lots.length} lot(s) · {floor.lots.reduce((s, l) => s + l.surface, 0)} m²</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setFloors(p => p.filter((_, i) => i !== fi)); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>

                {expandedFloors.has(floor.id) && (
                  <div className="p-3 space-y-2">
                    <Button size="sm" variant="outline" onClick={() => addLot(fi)} className="gap-1.5 text-xs"><Plus className="h-3 w-3" /> Lot</Button>

                    {floor.lots.map((lot, li) => (
                      <div key={lot.id} className="rounded-md border border-border/60 bg-background">
                        {/* Lot header */}
                        <div className="flex items-center gap-2 p-2 cursor-pointer" onClick={() => toggleLot(lot.id)}>
                          {expandedLots.has(lot.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          <Input value={lot.name} onClick={e => e.stopPropagation()} onChange={e => updateLot(fi, li, "name", e.target.value)} className="h-7 w-32 text-xs" placeholder="Nom du lot" />
                          <Input type="number" value={lot.surface || ""} onClick={e => e.stopPropagation()} onChange={e => updateLot(fi, li, "surface", +e.target.value)} className="h-7 w-20 text-xs" placeholder="m²" />
                          <Select value={lot.type} onValueChange={v => updateLot(fi, li, "type", v)}>
                            <SelectTrigger className="h-7 w-28 text-xs" onClick={e => e.stopPropagation()}><SelectValue /></SelectTrigger>
                            <SelectContent>{LOT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                          <span className={`text-[10px] font-medium ${lot.lease ? "text-success" : "text-warning"}`}>{lot.lease ? "Loué" : "Vacant"}</span>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive ml-auto" onClick={e => { e.stopPropagation(); removeLot(fi, li); }}><Trash2 className="h-3 w-3" /></Button>
                        </div>

                        {expandedLots.has(lot.id) && (
                          <div className="p-3 border-t border-border/40 bg-muted/20">
                            {!lot.lease ? (
                              <Button size="sm" variant="outline" onClick={() => addLease(fi, li)} className="gap-1.5 text-xs"><Plus className="h-3 w-3" /> Ajouter un bail</Button>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-foreground">Bail – {lot.lease.tenantName || "Nouveau"}</span>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => removeLease(fi, li)}><Trash2 className="h-3 w-3 mr-1" /> Supprimer bail</Button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  <div className="grid gap-0.5"><Label className="text-[10px]">Locataire</Label><Input value={lot.lease.tenantName} onChange={e => updateLease(fi, li, "tenantName", e.target.value)} className="h-8 text-xs" /></div>
                                  <div className="grid gap-0.5"><Label className="text-[10px]">SIREN</Label><Input value={lot.lease.tenantSiren || ""} onChange={e => updateLease(fi, li, "tenantSiren", e.target.value)} className="h-8 text-xs" /></div>
                                  <div className="grid gap-0.5"><Label className="text-[10px]">Type de bail</Label>
                                    <Select value={lot.lease.leaseType} onValueChange={v => updateLease(fi, li, "leaseType", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{LEASE_TYPES.map(lt => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}</SelectContent></Select>
                                  </div>
                                  <div className="grid gap-0.5"><Label className="text-[10px]">Début</Label><Input type="date" value={lot.lease.startDate} onChange={e => updateLease(fi, li, "startDate", e.target.value)} className="h-8 text-xs" /></div>
                                  <div className="grid gap-0.5"><Label className="text-[10px]">Échéance</Label><Input type="date" value={lot.lease.endDate} onChange={e => updateLease(fi, li, "endDate", e.target.value)} className="h-8 text-xs" /></div>
                                  <div className="grid gap-0.5"><Label className="text-[10px]">Triennale</Label><Input type="date" value={lot.lease.triennialDate} onChange={e => updateLease(fi, li, "triennialDate", e.target.value)} className="h-8 text-xs" /></div>
                                  <div className="grid gap-0.5"><Label className="text-[10px]">Loyer annuel (€)</Label><Input type="number" value={lot.lease.currentRent} onChange={e => updateLease(fi, li, "currentRent", +e.target.value)} className="h-8 text-xs" /></div>
                                  <div className="grid gap-0.5"><Label className="text-[10px]">Dépôt de garantie (€)</Label><Input type="number" value={lot.lease.deposit} onChange={e => updateLease(fi, li, "deposit", +e.target.value)} className="h-8 text-xs" /></div>
                                  <div className="grid gap-0.5"><Label className="text-[10px]">Indice</Label>
                                    <Select value={lot.lease.index} onValueChange={v => updateLease(fi, li, "index", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{INDEX_TYPES.map(idx => <SelectItem key={idx} value={idx}>{idx}</SelectItem>)}</SelectContent></Select>
                                  </div>
                                  {lot.lease.index !== "Aucun" && (
                                    <>
                                      <div className="grid gap-0.5"><Label className="text-[10px]">Trimestre réf.</Label>
                                        <Select value={lot.lease.indexQuarter} onValueChange={v => updateLease(fi, li, "indexQuarter", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{INDEX_QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent></Select>
                                      </div>
                                      <div className="grid gap-0.5"><Label className="text-[10px]">Année réf.</Label><Input type="number" value={lot.lease.indexYear} onChange={e => updateLease(fi, li, "indexYear", +e.target.value)} className="h-8 text-xs" /></div>
                                    </>
                                  )}
                                  <div className="grid gap-0.5"><Label className="text-[10px]">Accompagnement</Label><Input value={lot.lease.accompaniment} onChange={e => updateLease(fi, li, "accompaniment", e.target.value)} className="h-8 text-xs" /></div>
                                  <div className="grid gap-0.5"><Label className="text-[10px]">Gestion charges</Label>
                                    <Select value={lot.lease.chargesManagement} onValueChange={v => updateLease(fi, li, "chargesManagement", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{["Forfait", "Réel", "Provision", "Triple net"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                                  </div>
                                  <div className="flex items-center gap-2 pt-4">
                                    <Switch checked={lot.lease.unpaid} onCheckedChange={v => updateLease(fi, li, "unpaid", v)} />
                                    <span className="text-xs text-muted-foreground">Impayé</span>
                                    {lot.lease.unpaid && <Input type="number" className="w-24 h-7 text-xs ml-1" placeholder="Montant" value={lot.lease.unpaidAmount || 0} onChange={e => updateLease(fi, li, "unpaidAmount", +e.target.value)} />}
                                  </div>
                                  <div className="flex items-center gap-2 pt-4">
                                    <Switch checked={lot.lease.isVatApplicable} onCheckedChange={v => updateLease(fi, li, "isVatApplicable", v)} />
                                    <span className="text-xs text-muted-foreground">Assujetti TVA</span>
                                    {lot.lease.isVatApplicable && (
                                      <Select value={String(lot.lease.vatRate || 20)} onValueChange={v => updateLease(fi, li, "vatRate", +v)}>
                                        <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>{VAT_RATES.map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {floor.lots.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Aucun lot sur cet étage</p>}
                  </div>
                )}
              </div>
            ))}
            {floors.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucun étage défini</p>}
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
