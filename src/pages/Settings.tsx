import { useState } from "react";
import { Building2, Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany, Company } from "@/hooks/useCompanies";
import { motion } from "framer-motion";

const Settings = () => {
  const { data: companies = [], isLoading } = useCompanies();
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", siren: "", quotePart: 100 });

  const startAdd = () => { setForm({ name: "", siren: "", quotePart: 100 }); setAdding(true); setEditingId(null); };
  const startEdit = (c: Company) => { setForm({ name: c.name, siren: c.siren, quotePart: c.quotePart }); setEditingId(c.id); setAdding(false); };
  const cancel = () => { setAdding(false); setEditingId(null); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (adding) {
      createMutation.mutate(form, { onSuccess: () => setAdding(false) });
    } else if (editingId) {
      updateMutation.mutate({ id: editingId, ...form }, { onSuccess: () => setEditingId(null) });
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Mon entreprise</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Mes entreprises</h2>
            <p className="text-xs text-muted-foreground">Sociétés détenant vos actifs immobiliers. La quote-part représente votre part de détention.</p>
          </div>
          <Button size="sm" onClick={startAdd} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Ajouter</Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Chargement…</p>
        ) : (
          <div className="space-y-2">
            {companies.map((c) => (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card p-4">
                {editingId === c.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="grid gap-1"><Label className="text-xs">Nom</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9" /></div>
                      <div className="grid gap-1"><Label className="text-xs">SIREN</Label><Input value={form.siren} onChange={e => setForm(f => ({ ...f, siren: e.target.value }))} className="h-9" placeholder="Optionnel" /></div>
                      <div className="grid gap-1"><Label className="text-xs">Quote-part (%)</Label><Input type="number" min={0} max={100} value={form.quotePart} onChange={e => setForm(f => ({ ...f, quotePart: +e.target.value }))} className="h-9" /></div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={cancel}><X className="h-3.5 w-3.5 mr-1" /> Annuler</Button>
                      <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}><Save className="h-3.5 w-3.5 mr-1" /> Enregistrer</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center"><Building2 className="h-5 w-5 text-accent" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.siren ? `SIREN : ${c.siren}` : "Pas de SIREN"} · QP : {c.quotePart}%</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => startEdit(c)} className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                )}
              </motion.div>
            ))}

            {adding && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="grid gap-1"><Label className="text-xs">Nom</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9" autoFocus /></div>
                  <div className="grid gap-1"><Label className="text-xs">SIREN</Label><Input value={form.siren} onChange={e => setForm(f => ({ ...f, siren: e.target.value }))} className="h-9" placeholder="Optionnel" /></div>
                  <div className="grid gap-1"><Label className="text-xs">Quote-part (%)</Label><Input type="number" min={0} max={100} value={form.quotePart} onChange={e => setForm(f => ({ ...f, quotePart: +e.target.value }))} className="h-9" /></div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={cancel}><X className="h-3.5 w-3.5 mr-1" /> Annuler</Button>
                  <Button size="sm" onClick={handleSave} disabled={createMutation.isPending}><Save className="h-3.5 w-3.5 mr-1" /> Enregistrer</Button>
                </div>
              </motion.div>
            )}

            {companies.length === 0 && !adding && (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p>Aucune société enregistrée</p>
                <Button size="sm" variant="outline" onClick={startAdd} className="mt-3 gap-1.5"><Plus className="h-3.5 w-3.5" /> Ajouter une société</Button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Settings;
