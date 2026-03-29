import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { WidgetConfig } from "@/hooks/usePortfolios";
import { useState } from "react";

const WIDGET_LABELS: { key: keyof WidgetConfig; label: string }[] = [
  { key: "kpis", label: "Indicateurs clés (KPIs)" },
  { key: "typeChart", label: "Répartition par type" },
  { key: "cityChart", label: "Répartition par ville" },
  { key: "performanceChart", label: "Performance par actif" },
  { key: "leases", label: "Échéances de baux" },
  { key: "alerts", label: "Alertes de risque" },
  { key: "topYield", label: "Top 5 rendements" },
  { key: "topVacancy", label: "Top 5 vacance" },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  config: WidgetConfig;
  onSave: (config: WidgetConfig) => void;
}

const PortfolioWidgetConfig = ({ open, onOpenChange, config, onSave }: Props) => {
  const [local, setLocal] = useState<WidgetConfig>(config);

  const activeCount = Object.values(local).filter(Boolean).length;

  const toggle = (key: keyof WidgetConfig) => {
    setLocal((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Minimum 2 widgets
      if (Object.values(next).filter(Boolean).length < 2) return prev;
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Personnaliser le dashboard</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground mb-3">Choisissez les widgets à afficher (minimum 2).</p>
        <div className="space-y-3">
          {WIDGET_LABELS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{label}</span>
              <Switch checked={local[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">{activeCount} widget{activeCount > 1 ? "s" : ""} actif{activeCount > 1 ? "s" : ""}</p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => { onSave(local); onOpenChange(false); }}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PortfolioWidgetConfig;
