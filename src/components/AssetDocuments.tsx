import { useRef } from "react";
import { FileText, Upload, Trash2, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssetDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/useAssets";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const AssetDocuments = ({ assetId }: { assetId: string }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: docs, isLoading } = useAssetDocuments(assetId);
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      uploadMutation.mutate({ assetId, file });
    });
    e.target.value = "";
  };

  const handleDownload = async (filePath: string, name: string) => {
    const { data, error } = await supabase.storage
      .from("asset-documents")
      .download(filePath);
    if (error) { toast.error("Erreur téléchargement"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Documents</h3>
        <div>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending} className="gap-1.5">
            {uploadMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Ajouter
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !docs?.length ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Aucun document uploadé</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 group">
              <FileText className="h-4 w-4 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(doc.file_size ?? 0)}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleDownload(doc.file_path, doc.name)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate({ id: doc.id, filePath: doc.file_path, assetId })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssetDocuments;
