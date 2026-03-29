import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WidgetConfig {
  kpis: boolean;
  typeChart: boolean;
  cityChart: boolean;
  performanceChart: boolean;
  leases: boolean;
  alerts: boolean;
  topYield: boolean;
  topVacancy: boolean;
}

export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  kpis: true,
  typeChart: true,
  cityChart: true,
  performanceChart: true,
  leases: true,
  alerts: true,
  topYield: true,
  topVacancy: true,
};

export interface Portfolio {
  id: string;
  name: string;
  assetIds: string[];
  widgetConfig: WidgetConfig;
}

export const usePortfolios = () =>
  useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
      const { data: portfolios, error } = await supabase
        .from("portfolios")
        .select("*")
        .order("name");
      if (error) throw error;

      const { data: links, error: linkErr } = await supabase
        .from("portfolio_assets")
        .select("portfolio_id, asset_id");
      if (linkErr) throw linkErr;

      return (portfolios ?? []).map((p: any): Portfolio => ({
        id: p.id,
        name: p.name,
        widgetConfig: { ...DEFAULT_WIDGET_CONFIG, ...(p.widget_config as any) },
        assetIds: (links ?? []).filter((l: any) => l.portfolio_id === p.id).map((l: any) => l.asset_id),
      }));
    },
  });

export const useCreatePortfolio = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, assetIds }: { name: string; assetIds: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const { data, error } = await supabase
        .from("portfolios")
        .insert({ user_id: user.id, name })
        .select("id")
        .single();
      if (error) throw error;
      if (assetIds.length > 0) {
        const rows = assetIds.map((aid) => ({ portfolio_id: data.id, asset_id: aid }));
        const { error: linkErr } = await supabase.from("portfolio_assets").insert(rows);
        if (linkErr) throw linkErr;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolios"] }); toast.success("Portefeuille créé"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdatePortfolio = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, assetIds, widgetConfig }: { id: string; name?: string; assetIds?: string[]; widgetConfig?: WidgetConfig }) => {
      if (name !== undefined || widgetConfig !== undefined) {
        const updates: Record<string, any> = {};
        if (name !== undefined) updates.name = name;
        if (widgetConfig !== undefined) updates.widget_config = widgetConfig;
        const { error } = await supabase.from("portfolios").update(updates).eq("id", id);
        if (error) throw error;
      }
      if (assetIds !== undefined) {
        // Delete all then re-insert
        const { error: delErr } = await supabase.from("portfolio_assets").delete().eq("portfolio_id", id);
        if (delErr) throw delErr;
        if (assetIds.length > 0) {
          const rows = assetIds.map((aid) => ({ portfolio_id: id, asset_id: aid }));
          const { error: insErr } = await supabase.from("portfolio_assets").insert(rows);
          if (insErr) throw insErr;
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolios"] }); toast.success("Portefeuille mis à jour"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeletePortfolio = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portfolios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolios"] }); toast.success("Portefeuille supprimé"); },
    onError: (e: Error) => toast.error(e.message),
  });
};
