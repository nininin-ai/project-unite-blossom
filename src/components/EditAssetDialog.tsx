import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Asset, Floor, Lot, Lease, Charge, LEASE_TYPES, INDEX_TYPES, INDEX_QUARTERS, LOT_TYPES, VAT_RATES, getNextTriennialDate } from "@/data/mockData";
import { useUpdateAsset } from "@/hooks/useAssets";
import { useCompanies } from "@/hooks/useCompanies";
import AIDocumentImport from "@/components/AIDocumentImport";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ASSET_TYPES = ["Bureau", "Commerce", "Résidentiel", "Logistique", "Mixte"];

interface EditAssetDialogProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

const emptyLease = (): Lease => ({
  id: crypto.randomUUID(), tenantName: "", tenantSiren: "", isParticulier: false, startDate: "", endDate: "",
  leaseType: "3/6/9", deposit: 0, initialRent: 0, currentRent: 0, rentInputMode: "annual", index: "ILAT", indexQuarter: "T1", indexYear: new Date().getFullYear(),
  accompaniment: "", chargesManagement: "Réel", unpaid: false, isVatApplicable: false, vatRate: 20,
});

const defaultLotName = (level: number, index: number): string => {
  const letter = String.fromCharCode(65 + index); // A, B, C...
  return `${level}${letter}`;
};

const emptyLot = (level: number, existingCount: number): Lot => ({
  id: crypto.randomUUID(), name: defaultLotName(level, existingCount), surface: 0, type: "Bureau",
});

const emptyFloor = (level: number): Floor => ({ id: crypto.randomUUID(), name: `Étage ${level}`, level, lots: [] });

const emptyCharge = (): Charge => ({ id: crypto.randomUUID(), nature: "", annualAmount: 0, rebillable: false, rebillablePercent: 0, comment: "" });

const EditAssetDialog = ({ asset, open, onOpenChange, defaultTab = "general" }: EditAssetDialogProps) => {
  const updateMutation = useUpdateAsset();
  const { data: companies = [] } = useCompanies();

  const [form, setForm] = useState({ name: "", address: "", city: "", type: "Bureau", acquisitionPrice: 0, acquisitionDate: "", constructionYear: 2000, isCopropriete: false, companyId: "" });
  const [companyOpen, setCompanyOpen] = useState(false);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);

  useEffect(() => {
    if (open) {
      setForm({ name: asset.name, address: asset.address, city: asset.city, type: asset.type, acquisitionPrice: asset.acquisitionPrice, acquisitionDate: asset.acquisitionDate, constructionYear: asset.constructionYear, isCopropriete: asset.isCopropriete, companyId: asset.companyId || "" });
      setFloors(JSON.parse(JSON.stringify(asset.floors ?? [])));
      setCharges((asset.charges ?? []).map(c => ({ ...c })));
    }
  }, [open, asset]);

  const totalSurface = useMemo(() => floors.reduce((s, f) => s + f.lots.reduce((ls, l) => ls + l.surface, 0), 0), [floors]);
  const vacantSurface = useMemo(() => floors.reduce((s, f) => s + f.lots.filter(l => !l.lease).reduce((ls, l) => ls + l.surface, 0), 0), [floors]);
  const annualRent = useMemo(() => floors.reduce((s, f) => s + f.lots.reduce((ls, l) => ls + (l.lease?.currentRent ?? 0), 0), 0), [floors]);

  const setField = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const updateFloor = (fi: number, key: keyof Floor, value: any) => setFloors(prev => prev.map((f, i) => i === fi ? { ...f, [key]: value } : f));
  const addLot = (fi: number) => setFloors(prev => prev.map((f, i) => i === fi ? { ...f, lots: [...f.lots, emptyLot(f.level, f.lots.length)] } : f));
  const updateLot = (fi: number, li: number, key: keyof Lot, value: any) => setFloors(prev => prev.map((f, i) => i === fi ? { ...f, lots: f.lots.map((l, j) => j === li ? { ...l, [key]: value } : l) } : f));
  const removeLot = (fi: number, li: number) => setFloors(prev => prev.map((f, i) => i === fi ? { ...f, lots: f.lots.filter((_, j) => j !== li) } : f));
  const addLease = (fi: number, li: number) => setFloors(prev => prev.map((f, i) => i === fi ? { ...f, lots: f.lots.map((l, j) => j === li ? { ...l, lease: emptyLease() } : l) } : f));
  const removeLease = (fi: number, li: number) => setFloors(prev => prev.map((f, i) => i === fi ? { ...f, lots: f.lots.map((l, j) => j === li ? { ...l, lease: undefined } : l) } : f));
  const updateLease = (fi: number, li: number, key: keyof Lease, value: any) => setFloors(prev => prev.map((f, i) => i === fi ? { ...f, lots: f.lots.map((l, j) => j === li && l.lease ? { ...l, lease: { ...l.lease, [key]: value } } : l) } : f));

  const updateCharge = (idx: number, key: keyof Charge, value: any) => setCharges(prev => prev.map((c, i) => i === idx ? { ...c, [key]: value } : c));

  const handleSave = () => {
    const yieldVal = form.acquisitionPrice > 0 ? +((annualRent / form.acquisitionPrice) * 100).toFixed(2) : 0;
    updateMutation.mutate({ id: asset.id, updates: { ...form, companyId: form.companyId || undefined, annualRent, totalSurface, vacantSurface, yield: yieldVal, floors, charges } }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Modifier l'actif</DialogTitle></DialogHeader>
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="general" className="text-xs">Général</TabsTrigger>
            <TabsTrigger value="surfaces" className="text-xs">Locataires et Surfaces</TabsTrigger>
            <TabsTrigger value="charges" className="text-xs">Charges ({charges.length})</TabsTrigger>
            <TabsTrigger value="ai-import" className="text-xs gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Modification par IA
            </TabsTrigger>
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
              <div className="grid gap-1.5">
                <Label>Société détentrice</Label>
                <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="justify-between font-normal">
                      {form.companyId ? companies.find(c => c.id === form.companyId)?.name ?? "Sélectionner…" : "Aucune société"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Rechercher une société…" />
                      <CommandList>
                        <CommandEmpty>Aucune société trouvée</CommandEmpty>
                        <CommandGroup>
                          <CommandItem value="__none__" onSelect={() => { setField("companyId", ""); setCompanyOpen(false); }}>Aucune société</CommandItem>
                          {companies.map(c => (
                            <CommandItem key={c.id} value={c.name} onSelect={() => { setField("companyId", c.id); setCompanyOpen(false); }}>
                              {c.name} <span className="ml-auto text-xs text-muted-foreground">QP {c.quotePart}%</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-3 col-span-full"><Switch checked={form.isCopropriete} onCheckedChange={v => setField("isCopropriete", v)} /><Label>Copropriété</Label></div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Surface totale (calculée)</span><span className="font-semibold text-foreground">{totalSurface.toLocaleString("fr-FR")} m²</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Surface vacante (calculée)</span><span className="font-semibold text-warning">{vacantSurface.toLocaleString("fr-FR")} m²</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Loyer annuel (calculé)</span><span className="font-semibold text-foreground">{annualRent.toLocaleString("fr-FR")} €</span></div>
            </div>
          </TabsContent>

          {/* ── Locataires et Surfaces ── */}
          <TabsContent value="surfaces" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Actif → Étage / Niveau → Lot → Locataire</p>
              <Button size="sm" variant="outline" onClick={() => setFloors(f => [...f, emptyFloor(f.length)])} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Étage</Button>
            </div>

            {floors.map((floor, fi) => (
              <div key={floor.id} className="rounded-lg border border-border">
                {/* Floor header */}
                <div className="flex items-center gap-2 p-3 bg-muted/30">
                  <Input value={floor.name} onChange={e => updateFloor(fi, "name", e.target.value)} className="h-8 w-40 text-sm font-semibold" />
                  <span className="text-xs text-muted-foreground">Niv.</span>
                  <Input type="number" value={floor.level} onChange={e => updateFloor(fi, "level", +e.target.value)} className="h-8 w-16 text-xs" />
                  <span className="text-xs text-muted-foreground ml-auto">{floor.lots.length} lot(s) · {floor.lots.reduce((s, l) => s + l.surface, 0)} m²</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setFloors(p => p.filter((_, i) => i !== fi))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>

                <div className="p-3 space-y-2">
                  <Button size="sm" variant="outline" onClick={() => addLot(fi)} className="gap-1.5 text-xs"><Plus className="h-3 w-3" /> Lot</Button>

                  {floor.lots.map((lot, li) => (
                    <div key={lot.id} className="rounded-md border border-border/60 bg-background">
                      {/* Lot header */}
                      <div className="flex items-center gap-2 p-2">
                        <Input value={lot.name} onChange={e => updateLot(fi, li, "name", e.target.value)} className="h-7 w-32 text-xs" placeholder="Nom du lot" />
                        <Input type="number" value={lot.surface || ""} onChange={e => updateLot(fi, li, "surface", +e.target.value)} className="h-7 w-20 text-xs" placeholder="m²" />
                        <Select value={lot.type} onValueChange={v => updateLot(fi, li, "type", v)}>
                          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{LOT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <span className={`text-[10px] font-medium ${lot.lease ? "text-success" : "text-warning"}`}>{lot.lease ? "Loué" : "Vacant"}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive ml-auto" onClick={() => removeLot(fi, li)}><Trash2 className="h-3 w-3" /></Button>
                      </div>

                      <div className="p-3 border-t border-border/40 bg-muted/20">
                        {!lot.lease ? (
                          <Button size="sm" variant="outline" onClick={() => addLease(fi, li)} className="gap-1.5 text-xs"><Plus className="h-3 w-3" /> Ajouter un locataire</Button>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">Locataire – {lot.lease.tenantName || "Nouveau"}</span>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => removeLease(fi, li)}><Trash2 className="h-3 w-3 mr-1" /> Supprimer locataire</Button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <div className="grid gap-0.5"><Label className="text-[10px]">Locataire</Label><Input value={lot.lease.tenantName} onChange={e => updateLease(fi, li, "tenantName", e.target.value)} className="h-8 text-xs" /></div>
                              <div className="flex items-center gap-2 pt-4">
                                <Checkbox checked={lot.lease.isParticulier} onCheckedChange={v => updateLease(fi, li, "isParticulier", !!v)} />
                                <span className="text-xs text-muted-foreground">Particulier</span>
                              </div>
                              {!lot.lease.isParticulier && (
                                <div className="grid gap-0.5"><Label className="text-[10px]">SIREN</Label><Input value={lot.lease.tenantSiren || ""} onChange={e => updateLease(fi, li, "tenantSiren", e.target.value)} className="h-8 text-xs" /></div>
                              )}
                              <div className="grid gap-0.5"><Label className="text-[10px]">Type de bail</Label>
                                <Select value={lot.lease.leaseType} onValueChange={v => updateLease(fi, li, "leaseType", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{LEASE_TYPES.map(lt => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}</SelectContent></Select>
                              </div>
                              <div className="grid gap-0.5"><Label className="text-[10px]">Début</Label><Input type="date" value={lot.lease.startDate} onChange={e => updateLease(fi, li, "startDate", e.target.value)} className="h-8 text-xs" /></div>
                              <div className="grid gap-0.5"><Label className="text-[10px]">Échéance</Label><Input type="date" value={lot.lease.endDate} onChange={e => updateLease(fi, li, "endDate", e.target.value)} className="h-8 text-xs" /></div>
                              {(lot.lease.leaseType === "3/6/9" || lot.lease.leaseType === "6/9") && (
                                <div className="grid gap-0.5">
                                  <Label className="text-[10px]">Prochaine triennale</Label>
                                  <div className="h-8 flex items-center text-xs text-muted-foreground bg-muted/30 rounded-md px-3 border border-border">
                                    {getNextTriennialDate(lot.lease) ? new Date(getNextTriennialDate(lot.lease)!).toLocaleDateString("fr-FR") : "–"}
                                  </div>
                                </div>
                              )}
                              <div className="grid gap-0.5">
                                <Label className="text-[10px]">Loyer initial à la signature (€/an)</Label>
                                <Input type="number" value={lot.lease.initialRent || ""} onChange={e => updateLease(fi, li, "initialRent", +e.target.value)} className="h-8 text-xs" placeholder="Loyer à la signature" />
                              </div>
                              <div className="grid gap-0.5">
                                <Label className="text-[10px]">Loyer actuel {lot.lease.rentInputMode === "monthly" ? "mensuel" : "annuel"} (€)</Label>
                                <div className="flex gap-1">
                                  <Input type="number" value={lot.lease.rentInputMode === "monthly" ? Math.round(lot.lease.currentRent / 12) : lot.lease.currentRent} onChange={e => {
                                    const val = +e.target.value;
                                    updateLease(fi, li, "currentRent", lot.lease!.rentInputMode === "monthly" ? val * 12 : val);
                                  }} className="h-8 text-xs flex-1" />
                                  <Select value={lot.lease.rentInputMode || "annual"} onValueChange={v => updateLease(fi, li, "rentInputMode", v)}>
                                    <SelectTrigger className="h-8 w-20 text-[10px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="annual">Annuel</SelectItem>
                                      <SelectItem value="monthly">Mensuel</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
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
                                <Checkbox checked={lot.lease.isVatApplicable} onCheckedChange={v => updateLease(fi, li, "isVatApplicable", !!v)} />
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
                    </div>
                  ))}
                  {floor.lots.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Aucun lot sur cet étage</p>}
                </div>
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

          {/* ── AI Import ── */}
          <TabsContent value="ai-import">
            <AIDocumentImport
              asset={asset}
              onDataExtracted={(data, docType) => {
                // Apply extracted data based on doc type
                if (docType === "acte_vente") {
                  if (data.adresse) setField("address", data.adresse);
                  if (data.surface_globale_m2) {/* computed from floors */}
                  if (data.type_usage) setField("type", data.type_usage);
                  if (data.date_acquisition) setField("acquisitionDate", data.date_acquisition);
                  if (data.prix_acquisition_net_vendeur) setField("acquisitionPrice", data.prix_acquisition_net_vendeur);
                  if (data.etages && Array.isArray(data.etages)) {
                    const newFloors = data.etages.map((e: any, i: number) => ({
                      id: crypto.randomUUID(),
                      name: e.nom || `Étage ${e.niveau ?? i}`,
                      level: e.niveau ?? i,
                      lots: e.surface_m2 ? [{ id: crypto.randomUUID(), name: `${e.niveau ?? i}A`, surface: e.surface_m2, type: "Bureau" as const }] : [],
                    }));
                    setFloors(newFloors);
                  }
                }
                if (docType === "taxe_fonciere") {
                  if (data.montant_taxe_fonciere) {
                    const existing = charges.find(c => c.nature.toLowerCase().includes("taxe foncière"));
                    if (existing) {
                      setCharges(prev => prev.map(c => c.id === existing.id ? { ...c, annualAmount: data.montant_taxe_fonciere } : c));
                    } else {
                      setCharges(prev => [...prev, { id: crypto.randomUUID(), nature: "Taxe foncière", annualAmount: data.montant_taxe_fonciere, rebillable: false, rebillablePercent: 0, comment: data.annee_imposition ? `Année ${data.annee_imposition}` : "" }]);
                    }
                  }
                }
                if (docType === "charges") {
                  const chargeMap: Record<string, string> = {
                    honoraires_gestion: "Honoraires de gestion",
                    assurance_pno: "Assurance PNO",
                    teom: "TEOM",
                    charges_copropriete: "Charges de copropriété",
                    charges_travaux: "Charges travaux",
                  };
                  Object.entries(chargeMap).forEach(([key, label]) => {
                    if (data[key]) {
                      const existing = charges.find(c => c.nature.toLowerCase() === label.toLowerCase());
                      if (existing) {
                        setCharges(prev => prev.map(c => c.id === existing.id ? { ...c, annualAmount: data[key] } : c));
                      } else {
                        setCharges(prev => [...prev, { id: crypto.randomUUID(), nature: label, annualAmount: data[key], rebillable: key === "teom", rebillablePercent: key === "teom" ? 100 : 0, comment: "" }]);
                      }
                    }
                  });
                }
                if (docType === "bail" || docType === "quittance") {
                  // Try to find or create tenant in first available lot
                  const tenantName = data.locataire_nom;
                  if (tenantName) {
                    let found = false;
                    setFloors(prev => prev.map(f => ({
                      ...f,
                      lots: f.lots.map(l => {
                        if (l.lease?.tenantName === tenantName) {
                          found = true;
                          const updates: any = {};
                          if (docType === "bail") {
                            if (data.date_debut) updates.startDate = data.date_debut;
                            if (data.date_fin) updates.endDate = data.date_fin;
                            if (data.loyer_annuel_initial) updates.initialRent = data.loyer_annuel_initial;
                            if (data.loyer_annuel_initial) updates.currentRent = data.loyer_annuel_initial;
                            if (data.indice_indexation) updates.index = data.indice_indexation;
                            if (data.depot_garantie) updates.deposit = data.depot_garantie;
                            if (data.locataire_siren) updates.tenantSiren = data.locataire_siren;
                          }
                          if (docType === "quittance") {
                            if (data.loyer_mensuel) updates.currentRent = data.loyer_mensuel * 12;
                            if (data.impaye !== undefined) updates.unpaid = data.impaye;
                            if (data.montant_impaye) updates.unpaidAmount = data.montant_impaye;
                          }
                          return { ...l, lease: { ...l.lease!, ...updates } };
                        }
                        return l;
                      }),
                    })));
                    // If tenant not found, create in first vacant lot or first lot
                    if (!found) {
                      setFloors(prev => {
                        const newFloors = [...prev];
                        let placed = false;
                        for (const f of newFloors) {
                          for (let li = 0; li < f.lots.length; li++) {
                            if (!f.lots[li].lease) {
                              const lease = emptyLease();
                              lease.tenantName = tenantName;
                              if (data.locataire_siren) lease.tenantSiren = data.locataire_siren;
                              if (docType === "bail") {
                                if (data.date_debut) lease.startDate = data.date_debut;
                                if (data.date_fin) lease.endDate = data.date_fin;
                                if (data.loyer_annuel_initial) { lease.initialRent = data.loyer_annuel_initial; lease.currentRent = data.loyer_annuel_initial; }
                                if (data.indice_indexation) lease.index = data.indice_indexation;
                                if (data.depot_garantie) lease.deposit = data.depot_garantie;
                              }
                              if (docType === "quittance") {
                                if (data.loyer_mensuel) lease.currentRent = data.loyer_mensuel * 12;
                                if (data.impaye !== undefined) lease.unpaid = data.impaye;
                                if (data.montant_impaye) lease.unpaidAmount = data.montant_impaye;
                              }
                              f.lots[li].lease = lease;
                              placed = true;
                              break;
                            }
                          }
                          if (placed) break;
                        }
                        return newFloors;
                      });
                    }
                  }
                }
              }}
            />
          </TabsContent>
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
