import { useRef } from "react";
import { FileText, Upload, Trash2, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const TenantDocuments = ({ assetId, leaseId }: { assetId: string; leaseId: string }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: docs, isLoading } = useQuery({
    queryKey: ["tenant-documents", assetId, leaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_documents")
        .select("*")
        .eq("asset_id", assetId)
        .eq("lease_id", leaseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const filePath = `${user.id}/${assetId}/tenants/${leaseId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("asset-documents").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { error: dbError } = await supabase.from("asset_documents").insert({
        asset_id: assetId, user_id: user.id, name: file.name, file_path: filePath,
        file_size: file.size, mime_type: file.type, lease_id: leaseId,
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-documents", assetId, leaseId] });
      toast.success("Document uploadé");
    },
    onError: (err: Error) => toast.error(`Erreur : ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      await supabase.storage.from("asset-documents").remove([filePath]);
      const { error } = await supabase.from("asset_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-documents", assetId, leaseId] });
      toast.success("Document supprimé");
    },
    onError: (err: Error) => toast.error(`Erreur : ${err.message}`),
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => uploadMutation.mutate(file));
    e.target.value = "";
  };

  const handleDownload = async (filePath: string, name: string) => {
    const { data, error } = await supabase.storage.from("asset-documents").download(filePath);
    if (error) { toast.error("Erreur téléchargement"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground">Documents du locataire</h4>
        <div>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending} className="gap-1.5 h-7 text-xs">
            {uploadMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Ajouter
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : !docs?.length ? (
        <p className="text-xs text-muted-foreground py-2 text-center">Aucun document</p>
      ) : (
        <div className="space-y-1.5">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border/50 group">
              <FileText className="h-3.5 w-3.5 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatFileSize(doc.file_size ?? 0)}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDownload(doc.file_path, doc.name)}>
                <Download className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate({ id: doc.id, filePath: doc.file_path })}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TenantDocuments;
