import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2, Upload, FileText, X } from "lucide-react";
import { useCreateAsset } from "@/hooks/useAssets";
import type { Asset } from "@/data/mockData";

const ASSET_TYPES = ["Bureau", "Commerce", "Résidentiel", "Logistique", "Local d'activité", "Mixte"];

const AddAssetDialog = () => {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateAsset();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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

  const resetForm = () => {
    setForm({
      name: "",
      address: "",
      city: "",
      type: "Bureau",
      acquisitionPrice: 0,
      acquisitionDate: "",
      constructionYear: 2000,
      isCopropriete: false,
    });
    setUploadedFile(null);
  };

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
        resetForm();
      },
    });
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setUploadedFile(f);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Ajouter un actif
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvel actif</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side: Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Remplir le formulaire</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom de l'actif *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ex: Tour Montparnasse"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Type de bien</Label>
                  <Select value={form.type} onValueChange={(v) => set("type", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="constructionYear">Année construction</Label>
                  <Input
                    id="constructionYear"
                    type="number"
                    value={form.constructionYear}
                    onChange={(e) => set("constructionYear", +e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="acquisitionPrice">Prix d'acquisition (€)</Label>
                  <Input
                    id="acquisitionPrice"
                    type="number"
                    value={form.acquisitionPrice || ""}
                    onChange={(e) => set("acquisitionPrice", +e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="acquisitionDate">Date d'acquisition</Label>
                  <Input
                    id="acquisitionDate"
                    type="date"
                    value={form.acquisitionDate}
                    onChange={(e) => set("acquisitionDate", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isCopropriete} onCheckedChange={(v) => set("isCopropriete", v)} />
                <Label>Copropriété</Label>
              </div>
            </div>
          </div>

          {/* Right side: Document import */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              Ou importer un document
            </h3>
            {!uploadedFile ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer border-border hover:border-accent/40 h-[calc(100%-2.5rem)] flex flex-col items-center justify-center"
              >
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">Glissez-déposez un document</p>
                <p className="text-xs text-muted-foreground mt-1">Bail, acte de vente, taxe foncière…</p>
                <p className="text-xs text-muted-foreground">PDF, Word, images</p>
                <Button variant="outline" size="sm" className="mt-4">
                  Parcourir
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setUploadedFile(f);
                    e.target.value = "";
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <FileText className="h-5 w-5 text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(0)} Ko</p>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="text-xs text-muted-foreground">
                    Le document sera analysé pour pré-remplir les informations de l'actif. Vous pourrez compléter ou
                    corriger ensuite.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          La surface totale et le loyer annuel seront calculés automatiquement à partir des lots et locataires que vous
          ajouterez ensuite via la fiche de l'actif.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!form.name.trim() || createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}Créer l'actif
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssetDialog;
