import { useState, useEffect } from "react";
import { Building2, Plus, Trash2, Pencil, Save, X, User, Bell, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany, Company } from "@/hooks/useCompanies";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

/* ─── Profile Tab ─── */
const ProfileTab = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    role: "",
    avatarUrl: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const parts = (data.display_name ?? "").split(" ");
          setProfile({
            firstName: parts[0] ?? "",
            lastName: parts.slice(1).join(" ") ?? "",
            phone: (data as any).phone ?? "",
            role: data.company ?? "",
            avatarUrl: data.avatar_url ?? "",
          });
        }
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        company: profile.role,
        avatar_url: profile.avatarUrl,
      })
      .eq("user_id", user.id);
    setLoading(false);
    if (error) toast.error("Erreur lors de la sauvegarde");
    else toast.success("Profil mis à jour");
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) toast.error("Erreur lors de l'envoi");
    else toast.success("Email de réinitialisation envoyé");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `avatars/${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("asset-documents").upload(path, file);
    if (error) { toast.error("Erreur upload"); return; }
    const { data: urlData } = supabase.storage.from("asset-documents").getPublicUrl(path);
    setProfile(p => ({ ...p, avatarUrl: urlData.publicUrl }));
  };

  return (
    <div className="space-y-6 max-w-lg">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <label className="relative cursor-pointer group">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera className="h-4 w-4 text-white" />
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </label>
        <div>
          <p className="text-sm font-medium text-foreground">{profile.firstName || "Utilisateur"} {profile.lastName}</p>
          <p className="text-xs text-muted-foreground">{user?.email ?? ""}</p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label className="text-xs">Prénom</Label>
          <Input value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} className="h-9" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Nom</Label>
          <Input value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} className="h-9" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Email</Label>
          <Input value={user?.email ?? ""} disabled className="h-9 opacity-60" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Téléphone</Label>
          <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="h-9" placeholder="+33 6 …" />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label className="text-xs">Rôle dans l'organisation</Label>
          <Input value={profile.role} onChange={e => setProfile(p => ({ ...p, role: e.target.value }))} className="h-9" placeholder="Ex : Directeur, Gestionnaire…" />
        </div>
      </div>

      <div className="flex gap-3">
        <Button size="sm" onClick={handleSave} disabled={loading}>
          <Save className="h-3.5 w-3.5 mr-1" /> Enregistrer
        </Button>
        <Button size="sm" variant="outline" onClick={handlePasswordReset}>
          Modifier le mot de passe
        </Button>
      </div>
    </div>
  );
};

/* ─── Companies Tab ─── */
const CompaniesTab = () => {
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

  if (isLoading) return <p className="text-sm text-muted-foreground text-center py-8">Chargement…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Sociétés détenant vos actifs immobiliers. La quote-part représente votre part de détention.</p>
        </div>
        <Button size="sm" onClick={startAdd} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Ajouter</Button>
      </div>

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
    </div>
  );
};

/* ─── Notifications Tab ─── */
const NotificationsTab = () => {
  const [prefs, setPrefs] = useState({
    bailEcheance: true,
    bailEcheanceJours: 30,
    loyerImpaye: true,
    revisionIndexation: true,
    canal: "in-app" as string,
  });

  const handleSave = () => {
    localStorage.setItem("notification_prefs", JSON.stringify(prefs));
    toast.success("Préférences de notification enregistrées");
  };

  useEffect(() => {
    const saved = localStorage.getItem("notification_prefs");
    if (saved) setPrefs(JSON.parse(saved));
  }, []);

  return (
    <div className="space-y-6 max-w-lg">
      <p className="text-xs text-muted-foreground">Préférences de notification</p>

      {/* Bail échéance */}
      <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Alertes échéances de bail</p>
          <p className="text-xs text-muted-foreground mt-0.5">Recevez une alerte avant l'échéance</p>
          {prefs.bailEcheance && (
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                min={1}
                max={365}
                value={prefs.bailEcheanceJours}
                onChange={e => setPrefs(p => ({ ...p, bailEcheanceJours: +e.target.value }))}
                className="h-8 w-20"
              />
              <span className="text-xs text-muted-foreground">jours avant</span>
            </div>
          )}
        </div>
        <Switch checked={prefs.bailEcheance} onCheckedChange={v => setPrefs(p => ({ ...p, bailEcheance: v }))} />
      </div>

      {/* Loyer impayé */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Alertes loyers impayés</p>
          <p className="text-xs text-muted-foreground mt-0.5">Notification en cas de retard de paiement</p>
        </div>
        <Switch checked={prefs.loyerImpaye} onCheckedChange={v => setPrefs(p => ({ ...p, loyerImpaye: v }))} />
      </div>

      {/* Révision indexation */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Alertes révisions d'indexation</p>
          <p className="text-xs text-muted-foreground mt-0.5">Rappel pour les révisions de loyer</p>
        </div>
        <Switch checked={prefs.revisionIndexation} onCheckedChange={v => setPrefs(p => ({ ...p, revisionIndexation: v }))} />
      </div>

      {/* Canal */}
      <div className="rounded-lg border border-border p-4 space-y-2">
        <p className="text-sm font-medium text-foreground">Canal de notification</p>
        <p className="text-xs text-muted-foreground">Comment souhaitez-vous être notifié ?</p>
        <Select value={prefs.canal} onValueChange={v => setPrefs(p => ({ ...p, canal: v }))}>
          <SelectTrigger className="h-9 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in-app">In-app</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="both">In-app & Email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button size="sm" onClick={handleSave}>
        <Save className="h-3.5 w-3.5 mr-1" /> Enregistrer
      </Button>
    </div>
  );
};

/* ─── Main Settings Page ─── */
const Settings = () => {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez votre profil, vos entreprises et vos notifications</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" /> Mon profil</TabsTrigger>
          <TabsTrigger value="companies" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Mes entreprises</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" /> Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="companies" className="mt-6">
          <CompaniesTab />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
