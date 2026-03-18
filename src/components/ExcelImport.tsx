import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Asset } from "@/data/mockData";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface ExcelImportProps {
  onImport: (assets: Asset[]) => void;
}

const generateId = () => `imp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const parseExcelToAssets = (data: Record<string, unknown>[]): Asset[] => {
  return data
    .filter((row) => row["Nom"] || row["name"] || row["Nom de l'actif"])
    .map((row) => {
      const name = String(row["Nom"] || row["name"] || row["Nom de l'actif"] || "Sans nom");
      const address = String(row["Adresse"] || row["address"] || "");
      const city = String(row["Ville"] || row["city"] || "");
      const type = String(row["Type"] || row["type"] || "Bureau");
      const totalSurface = Number(row["Surface totale"] || row["totalSurface"] || row["Surface"] || 0);
      const vacantSurface = Number(row["Surface vacante"] || row["vacantSurface"] || 0);
      const acquisitionPrice = Number(row["Prix d'acquisition"] || row["acquisitionPrice"] || row["Prix"] || 0);
      const acquisitionDate = String(row["Date d'acquisition"] || row["acquisitionDate"] || new Date().toISOString().slice(0, 10));
      const constructionYear = Number(row["Année de construction"] || row["constructionYear"] || 2000);
      const annualRent = Number(row["Loyer annuel"] || row["annualRent"] || row["Loyer"] || 0);
      const yieldVal = Number(row["Rendement"] || row["yield"] || 0);
      const riskScore = Number(row["Score risque"] || row["riskScore"] || 50);

      return {
        id: generateId(),
        name,
        address,
        city,
        type,
        totalSurface,
        vacantSurface,
        acquisitionPrice,
        acquisitionDate,
        constructionYear,
        isCopropriete: false,
        lastWorks: "",
        annualRent,
        yield: yieldVal,
        riskScore,
        tenants: [],
        charges: [],
        credits: [],
        floors: [],
      } satisfies Asset;
    });
};

const ExcelImport = ({ onImport }: ExcelImportProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<{ count: number; assets: Asset[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((f: File) => {
    setFile(f);
    setError(null);
    setParseResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        if (json.length === 0) {
          setError("Le fichier est vide ou le format n'est pas reconnu.");
          return;
        }

        const assets = parseExcelToAssets(json);
        if (assets.length === 0) {
          setError("Aucun actif reconnu. Vérifiez que les colonnes contiennent : Nom, Adresse, Ville, Type, Surface totale, Loyer annuel, etc.");
          return;
        }

        setParseResult({ count: assets.length, assets });
      } catch {
        setError("Impossible de lire le fichier. Vérifiez qu'il s'agit d'un fichier Excel valide (.xlsx, .xls).");
      }
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const handleConfirmImport = () => {
    if (!parseResult) return;
    onImport(parseResult.assets);
    toast.success(`${parseResult.count} actif(s) importé(s) avec succès`);
    setFile(null);
    setParseResult(null);
  };

  const reset = () => {
    setFile(null);
    setParseResult(null);
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="kpi-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Importer des actifs</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Importez un fichier Excel pour ajouter des actifs à votre parc
          </p>
        </div>
        <FileSpreadsheet className="h-5 w-5 text-accent" />
      </div>

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/40"
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">
            Glissez-déposez votre fichier Excel ici
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Formats supportés : .xlsx, .xls · Max 20MB
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            📋 Colonnes attendues : Nom, Adresse, Ville, Type, Surface totale, Loyer annuel, Rendement, etc.
          </p>
          <Button variant="default" size="sm" className="mt-4">
            Parcourir les fichiers
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) processFile(f);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <FileSpreadsheet className="h-5 w-5 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(0)} Ko
              </p>
            </div>
            <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {parseResult && (
            <>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[hsl(var(--success)/0.1)] border border-[hsl(var(--success)/0.2)]">
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />
                <p className="text-xs text-[hsl(var(--success))]">
                  {parseResult.count} actif(s) détecté(s) et prêts à être importés
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={reset} className="flex-1">
                  Annuler
                </Button>
                <Button size="sm" onClick={handleConfirmImport} className="flex-1">
                  Importer {parseResult.count} actif(s)
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ExcelImport;
