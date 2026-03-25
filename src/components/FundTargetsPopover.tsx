import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, Check } from "lucide-react";
import { FundTargets } from "@/hooks/useFundTargets";

interface Props {
  targets: FundTargets;
  onUpdate: (t: FundTargets) => void;
}

const FundTargetsPopover = ({ targets, onUpdate }: Props) => {
  const [open, setOpen] = useState(false);
  const [yieldTarget, setYieldTarget] = useState(targets.yieldTarget);
  const [vacancyTarget, setVacancyTarget] = useState(targets.vacancyTarget);

  const handleOpen = (o: boolean) => {
    if (o) {
      setYieldTarget(targets.yieldTarget);
      setVacancyTarget(targets.vacancyTarget);
    }
    setOpen(o);
  };

  const handleSave = () => {
    onUpdate({ yieldTarget, vacancyTarget });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center transition-colors" title="Modifier les objectifs">
          <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 space-y-3" align="start">
        <p className="text-xs font-semibold text-foreground">Objectifs du fonds</p>
        <div className="grid gap-1.5">
          <Label className="text-[10px]">Rendement cible (%)</Label>
          <Input type="number" step="0.1" value={yieldTarget} onChange={e => setYieldTarget(+e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-[10px]">Vacance cible (%)</Label>
          <Input type="number" step="0.1" value={vacancyTarget} onChange={e => setVacancyTarget(+e.target.value)} className="h-8 text-xs" />
        </div>
        <Button size="sm" onClick={handleSave} className="w-full gap-1.5 h-8 text-xs">
          <Check className="h-3 w-3" /> Enregistrer
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default FundTargetsPopover;
