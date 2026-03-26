import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Asset } from "@/data/mockData";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

const dbRowToAsset = (row: any): Asset => ({
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
  annualRent: row.annual_rent,
  yield: row.yield,
  charges: (row.charges as unknown as Asset["charges"]) ?? [],
  floors: (row.floors as unknown as Asset["floors"]) ?? [],
  companyId: row.company_id ?? undefined,
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
  annual_rent: asset.annualRent,
  yield: asset.yield,
  risk_score: 50,
  last_works: "",
  tenants: [] as unknown as Json,
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

export const useAsset = (id: string | undefined) => {
  return useQuery({
    queryKey: ["assets", id],
    queryFn: async () => {
      if (!id) throw new Error("No ID");
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return dbRowToAsset(data);
    },
    enabled: !!id,
  });
};

export const useImportAssets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newAssets: Asset[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const { error: deleteError } = await supabase.from("assets").delete().eq("user_id", user.id);
      if (deleteError) throw deleteError;
      const rows = newAssets.map((a) => assetToDbRow(a, user.id));
      const { error: insertError } = await supabase.from("assets").insert(rows);
      if (insertError) throw insertError;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assets"] }); toast.success("Import terminé avec succès"); },
    onError: (err: Error) => { toast.error(`Erreur d'import : ${err.message}`); },
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (asset: Omit<Asset, "id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const row = assetToDbRow({ ...asset, id: "" } as Asset, user.id);
      delete (row as any).id;
      const { error } = await supabase.from("assets").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assets"] }); toast.success("Actif créé avec succès"); },
    onError: (err: Error) => { toast.error(`Erreur : ${err.message}`); },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Asset> }) => {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.totalSurface !== undefined) dbUpdates.total_surface = updates.totalSurface;
      if (updates.vacantSurface !== undefined) dbUpdates.vacant_surface = updates.vacantSurface;
      if (updates.acquisitionPrice !== undefined) dbUpdates.acquisition_price = updates.acquisitionPrice;
      if (updates.acquisitionDate !== undefined) dbUpdates.acquisition_date = updates.acquisitionDate;
      if (updates.constructionYear !== undefined) dbUpdates.construction_year = updates.constructionYear;
      if (updates.isCopropriete !== undefined) dbUpdates.is_copropriete = updates.isCopropriete;
      if (updates.annualRent !== undefined) dbUpdates.annual_rent = updates.annualRent;
      if (updates.yield !== undefined) dbUpdates.yield = updates.yield;
      if (updates.charges !== undefined) dbUpdates.charges = updates.charges as unknown as Json;
      if (updates.floors !== undefined) dbUpdates.floors = updates.floors as unknown as Json;
      if (updates.companyId !== undefined) dbUpdates.company_id = updates.companyId || null;

      const { error } = await supabase.from("assets").update(dbUpdates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets", id] });
      toast.success("Actif mis à jour");
    },
    onError: (err: Error) => { toast.error(`Erreur : ${err.message}`); },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", assetId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assets"] }); toast.success("Actif supprimé"); },
    onError: (err: Error) => { toast.error(`Erreur : ${err.message}`); },
  });
};

export const useAssetDocuments = (assetId: string | undefined) => {
  return useQuery({
    queryKey: ["asset-documents", assetId],
    queryFn: async () => {
      if (!assetId) return [];
      const { data, error } = await supabase.from("asset_documents").select("*").eq("asset_id", assetId).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!assetId,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assetId, file }: { assetId: string; file: File }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const filePath = `${user.id}/${assetId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("asset-documents").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { error: dbError } = await supabase.from("asset_documents").insert({ asset_id: assetId, user_id: user.id, name: file.name, file_path: filePath, file_size: file.size, mime_type: file.type });
      if (dbError) throw dbError;
    },
    onSuccess: (_, { assetId }) => { queryClient.invalidateQueries({ queryKey: ["asset-documents", assetId] }); toast.success("Document uploadé"); },
    onError: (err: Error) => { toast.error(`Erreur upload : ${err.message}`); },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath, assetId }: { id: string; filePath: string; assetId: string }) => {
      await supabase.storage.from("asset-documents").remove([filePath]);
      const { error } = await supabase.from("asset_documents").delete().eq("id", id);
      if (error) throw error;
      return assetId;
    },
    onSuccess: (assetId) => { queryClient.invalidateQueries({ queryKey: ["asset-documents", assetId] }); toast.success("Document supprimé"); },
    onError: (err: Error) => { toast.error(`Erreur : ${err.message}`); },
  });
};
