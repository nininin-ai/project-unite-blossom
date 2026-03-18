import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Asset } from "@/data/mockData";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

const dbRowToAsset = (row: {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  total_surface: number;
  vacant_surface: number;
  acquisition_price: number;
  acquisition_date: string;
  construction_year: number;
  is_copropriete: boolean;
  last_works: string;
  annual_rent: number;
  yield: number;
  risk_score: number;
  tenants: Json;
  charges: Json;
  floors: Json;
}): Asset => ({
  id: row.id,
  name: row.name,
  address: row.address,
  city: row.city,
  type: row.type,
  totalSurface: row.total_surface,
  vacantSurface: row.vacant_surface,
  acquisitionPrice: row.acquisition_price,
  acquisitionDate: row.acquisition_date,
  constructionYear: row.construction_year,
  isCopropriete: row.is_copropriete,
  lastWorks: row.last_works,
  annualRent: row.annual_rent,
  yield: row.yield,
  riskScore: row.risk_score,
  tenants: (row.tenants as Asset["tenants"]) ?? [],
  charges: (row.charges as Asset["charges"]) ?? [],
  floors: (row.floors as Asset["floors"]) ?? [],
});

const assetToDbRow = (asset: Asset, userId: string) => ({
  user_id: userId,
  name: asset.name,
  address: asset.address,
  city: asset.city,
  type: asset.type,
  total_surface: asset.totalSurface,
  vacant_surface: asset.vacantSurface,
  acquisition_price: asset.acquisitionPrice,
  acquisition_date: asset.acquisitionDate,
  construction_year: asset.constructionYear,
  is_copropriete: asset.isCopropriete,
  last_works: asset.lastWorks,
  annual_rent: asset.annualRent,
  yield: asset.yield,
  risk_score: asset.riskScore,
  tenants: asset.tenants as unknown as Json,
  charges: asset.charges as unknown as Json,
  floors: asset.floors as unknown as Json,
});

export const useAssets = () => {
  return useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(dbRowToAsset);
    },
  });
};

export const useImportAssets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newAssets: Asset[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Delete existing assets for this user
      const { error: deleteError } = await supabase
        .from("assets")
        .delete()
        .eq("user_id", user.id);
      if (deleteError) throw deleteError;

      // Insert new assets
      const rows = newAssets.map((a) => assetToDbRow(a, user.id));
      const { error: insertError } = await supabase.from("assets").insert(rows);
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Import terminé avec succès");
    },
    onError: (err: Error) => {
      toast.error(`Erreur d'import : ${err.message}`);
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", assetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Actif supprimé");
    },
    onError: (err: Error) => {
      toast.error(`Erreur : ${err.message}`);
    },
  });
};
