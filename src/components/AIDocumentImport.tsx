import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, FileText, AlertTriangle, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Asset } from "@/data/mockData";
import { toast } from "sonner";

const DOCUMENT_TYPES = [
  { value: "quittance", label: "Quittance de loyer" },
  { value: "bail", label: "Bail" },
  { value: "amortissement", label: "Tableau d'amortissement" },
  { value: "charges", label: "Charges" },
  { value: "taxe_fonciere", label: "Taxe foncière" },
  { value: "acte_vente", label: "Acte de vente" },
] as const;

type DocType = typeof DOCUMENT_TYPES[number]["value"];

interface ExtractedData {
  [key: string]: any;
}

interface AIDocumentImportProps {
  asset: Asset;
  onDataExtracted: (data: ExtractedData, docType: DocType, filePath: string) => void;
}

const AIDocumentImport = ({ asset, onDataExtracted }: AIDocumentImportProps) => {
  const [docType, setDocType] = useState<DocType | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setExtractedData(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setExtractedData(null);
      setError(null);
    }
  };

  const handleExtract = async () => {
    if (!file || !docType) return;
    setLoading(true);
    setError(null);

    try {
      // Upload file to storage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const filePath = `${user.id}/${asset.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("asset-documents").upload(filePath, file);
      if (uploadError) throw uploadError;

      // Save document record
      await supabase.from("asset_documents").insert({
        asset_id: asset.id,
        user_id: user.id,
        name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      });

      // Convert file to base64 for AI
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });

      // Call edge function
      const { data, error: fnError } = await supabase.functions.invoke("extract-document-data", {
        body: { base64, mimeType: file.type, docType, assetName: asset.name },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setExtractedData(data.extracted);
      toast.success("Données extraites avec succès");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'extraction");
      toast.error("Erreur lors de l'extraction");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (extractedData && docType) {
      onDataExtracted(extractedData, docType as DocType, "");
      toast.success("Données appliquées");
    }
  };

  const renderExtractedFields = () => {
    if (!extractedData) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-success">
          <Check className="h-3.5 w-3.5" /> Données extraites — vérifiez avant d'appliquer
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 max-h-[300px] overflow-y-auto">
          {Object.entries(extractedData).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs py-1.5 border-b border-border/30 last:border-0">
              <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
              <span className="font-medium text-foreground text-right max-w-[60%] truncate">
                {typeof value === "object" ? JSON.stringify(value) : String(value ?? "–")}
              </span>
            </div>
          ))}
        </div>
        <Button size="sm" onClick={handleApply} className="w-full gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Appliquer les modifications
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
        <Sparkles className="h-4 w-4 text-accent shrink-0" />
        <p className="text-xs text-muted-foreground">
          Importez un document et l'IA extraira automatiquement les données pour mettre à jour l'actif ou ses locataires.
        </p>
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-medium text-foreground">Type de document</label>
        <Select value={docType} onValueChange={v => setDocType(v as DocType)}>
          <SelectTrigger className="text-sm"><SelectValue placeholder="Choisir le type de document" /></SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map(dt => (
              <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed border-border hover:border-accent/50 p-8 text-center transition-colors"
      >
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-8 w-8 text-accent" />
            <p className="text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(0)} Ko</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Glissez-déposez ou cliquez pour importer</p>
            <p className="text-[10px] text-muted-foreground">PDF, JPG, PNG</p>
          </div>
        )}
      </div>

      {file && docType && !extractedData && (
        <Button onClick={handleExtract} disabled={loading} className="w-full gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Analyse en cours…" : "Analyser le document"}
        </Button>
      )}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {renderExtractedFields()}
    </div>
  );
};

export default AIDocumentImport;
