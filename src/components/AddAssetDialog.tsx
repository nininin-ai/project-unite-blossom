import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { useCreateAsset } from "@/hooks/useAssets";
import type { Asset } from "@/data/mockData";

const ASSET_TYPES = ["Bureau", "Commerce", "Résidentiel", "Logistique", "Mixte"];

const AddAssetDialog = () => {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateAsset();

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    type: "Bureau",
    acquisitionPrice: 0,
    acquisitionDate: "",
    constructionYear: 2000,
    isCopropriete: false,
  });

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const asset: Omit<Asset, "id"> = {
      ...form,
      totalSurface: 0,
      vacantSurface: 0,
      annualRent: 0,
      yield: 0,
      charges: [],
      floors: [],
    };
    createMutation.mutate(asset, {
      onSuccess: () => {
        setOpen(false);
        setForm({ name: "", address: "", city: "", type: "Bureau", acquisitionPrice: 0, acquisitionDate: "", constructionYear: 2000, isCopropriete: false });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Ajouter un actif</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouvel actif</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom de l'actif *</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Tour Montparnasse" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2"><Label htmlFor="address">Adresse</Label><Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="city">Ville</Label><Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Type de bien</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid gap-2"><Label htmlFor="constructionYear">Année construction</Label><Input id="constructionYear" type="number" value={form.constructionYear} onChange={(e) => set("constructionYear", +e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2"><Label htmlFor="acquisitionPrice">Prix d'acquisition (€)</Label><Input id="acquisitionPrice" type="number" value={form.acquisitionPrice || ""} onChange={(e) => set("acquisitionPrice", +e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="acquisitionDate">Date d'acquisition</Label><Input id="acquisitionDate" type="date" value={form.acquisitionDate} onChange={(e) => set("acquisitionDate", e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-3"><Switch checked={form.isCopropriete} onCheckedChange={(v) => set("isCopropriete", v)} /><Label>Copropriété</Label></div>
          <p className="text-xs text-muted-foreground">La surface totale et le loyer annuel seront calculés automatiquement à partir des lots et locataires que vous ajouterez ensuite via la fiche de l'actif.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={!form.name.trim() || createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}Créer l'actif
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssetDialog;
