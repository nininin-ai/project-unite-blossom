import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Company {
  id: string;
  name: string;
  siren: string;
  quotePart: number; // 0-100
}

const rowToCompany = (row: any): Company => ({
  id: row.id,
  name: row.name,
  siren: row.siren ?? "",
  quotePart: Number(row.quote_part) ?? 100,
});

export const useCompanies = () =>
  useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").order("name");
      if (error) throw error;
      return (data ?? []).map(rowToCompany);
    },
  });

export const useCreateCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (company: Omit<Company, "id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const { error } = await supabase.from("companies").insert({
        user_id: user.id,
        name: company.name,
        siren: company.siren,
        quote_part: company.quotePart,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["companies"] }); toast.success("Société ajoutée"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Company> & { id: string }) => {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.siren !== undefined) dbUpdates.siren = updates.siren;
      if (updates.quotePart !== undefined) dbUpdates.quote_part = updates.quotePart;
      const { error } = await supabase.from("companies").update(dbUpdates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["companies"] }); toast.success("Société mise à jour"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["companies"] }); toast.success("Société supprimée"); },
    onError: (e: Error) => toast.error(e.message),
  });
};
