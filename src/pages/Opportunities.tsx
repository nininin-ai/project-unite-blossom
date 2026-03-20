import { mockNewOpportunities } from "@/data/mockData";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Calendar, MapPin, Mail, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import type { NewOpportunity } from "@/data/mockData";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

const statusBadge = (s: string) => s === "Nouveau" ? "badge-accent" : "badge-warning";

const parseExcelToOpportunities = (data: Record<string, unknown>[]): NewOpportunity[] => {
  return data
    .filter((row) => row["Nom"] || row["name"] || row["Nom de l'opportunité"])
    .map((row, i) => {
      const name = String(row["Nom"] || row["name"] || row["Nom de l'opportunité"] || "Sans nom");
      const city = String(row["Ville"] || row["city"] || "");
      const address = String(row["Adresse"] || row["address"] || "");
      const assetType = String(row["Type"] || row["type"] || "Bureau");
      const surface = Number(row["Surface"] || row["surface"] || 0);
      const askingPrice = Number(row["Prix demandé"] || row["askingPrice"] || row["Prix"] || 0);
      const currentRent = Number(row["Loyer actuel"] || row["currentRent"] || row["Loyer"] || 0);
      const yieldRate = Number(row["Rendement"] || row["yieldRate"] || row["Taux"] || 0);
      const source = String(row["Source"] || row["source"] || "Import Excel");
      const status = String(row["Statut"] || row["status"] || "Nouveau");

      return {
        id: `imp-opp-${Date.now()}-${i}`,
        code: `NOP-IMP-${String(i + 1).padStart(3, "0")}`,
        name,
        assetType,
        city,
        address,
        surface,
        askingPrice,
        currentRent,
        yieldRate,
        triEstimated: yieldRate * 1.15,
        score: 50,
        status,
        source,
        receptionDate: new Date().toISOString().slice(0, 10),
        keyFacts: { constructionYear: 2000, occupancyRate: 0, walt: 0, walb: 0, mainTenant: "", indexation: "" },
        tenants: [],
        investment: { acquisitionPrice: askingPrice, estimatedFees: 0, totalInvested: askingPrice, capexHistory: [], capexProjection: [] },
        triDetail: { investmentSummary: askingPrice, capexHistorique: 0, capexProjection: 0, projectedRents: 0, netCashflow: 0, exitValueHypothesis: 0 },
        aiSummary: "",
        strengths: [],
        weaknesses: [],
        analysisDecision: "",
        analysisDecisionStatus: "Neutre",
        portfolioImpact: "Positif",
        portfolioReasons: [],
        globalSummary: "",
      } as NewOpportunity;
    });
};

const Opportunities = () => {
  const [importedOpps, setImportedOpps] = useState<NewOpportunity[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<{ count: number; opps: NewOpportunity[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allOpps = [...mockNewOpportunities, ...importedOpps];

  const processFile = useCallback((f: File) => {
    setFile(f);
    setError(null);
    setParseResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
        if (json.length === 0) { setError("Le fichier est vide ou le format n'est pas reconnu."); return; }
        const opps = parseExcelToOpportunities(json);
        if (opps.length === 0) { setError("Aucune opportunité reconnue. Colonnes attendues : Nom, Ville, Type, Surface, Prix demandé, Loyer, Rendement."); return; }
        setParseResult({ count: opps.length, opps });
      } catch {
        setError("Impossible de lire le fichier. Vérifiez qu'il s'agit d'un fichier Excel valide.");
      }
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleConfirmImport = () => {
    if (!parseResult) return;
    setImportedOpps((prev) => [...prev, ...parseResult.opps]);
    toast.success(`${parseResult.count} opportunité(s) importée(s) avec succès`);
    setFile(null);
    setParseResult(null);
  };

  const resetImport = () => { setFile(null); setParseResult(null); setError(null); };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nouvelles Opportunités</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {allOpps.length} opportunités en attente d'analyse
        </p>
      </div>

      {/* Import block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Excel import */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="kpi-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Importer un fichier</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Importez vos opportunités depuis un fichier Excel</p>
            </div>
            <FileSpreadsheet className="h-4 w-4 text-accent" />
          </div>

          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-medium text-foreground">Glissez-déposez votre fichier Excel</p>
              <p className="text-[10px] text-muted-foreground mt-1">Colonnes : Nom, Ville, Type, Surface, Prix demandé, Loyer, Rendement</p>
              <Button variant="default" size="sm" className="mt-3 text-xs">Parcourir</Button>
              <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }} />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border">
                <FileSpreadsheet className="h-4 w-4 text-accent shrink-0" />
                <p className="text-xs font-medium text-foreground truncate flex-1">{file.name}</p>
                <button onClick={resetImport} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
              </div>
              {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-2">{error}</p>}
              {parseResult && (
                <>
                  <p className="text-xs text-[hsl(var(--success))] bg-[hsl(var(--success)/0.1)] rounded-lg p-2">
                    {parseResult.count} opportunité(s) détectée(s)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetImport} className="flex-1 text-xs">Annuler</Button>
                    <Button size="sm" onClick={handleConfirmImport} className="flex-1 text-xs">Importer {parseResult.count}</Button>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Email forward block */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }} className="kpi-card flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Transférer par email</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Transférez les opportunités reçues par mail</p>
            </div>
            <Mail className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed border-border p-6 gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Transférez les opportunités reçues par email directement à :
              </p>
              <p className="text-sm font-semibold text-foreground mt-1 select-all">
                demo-doc@equimmox.com
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground max-w-xs">
              Les documents seront automatiquement analysés et ajoutés à votre liste d'opportunités.
            </p>
          </div>
        </motion.div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: allOpps.length },
          { label: "Nouvelles", value: allOpps.filter(o => o.status === "Nouveau").length },
          { label: "En analyse", value: allOpps.filter(o => o.status === "En analyse").length },
          { label: "Rendement moyen", value: `${(allOpps.reduce((s, o) => s + o.yieldRate, 0) / allOpps.length).toFixed(1)}%` },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kpi-card text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{kpi.label}</p>
            <p className="text-lg font-bold text-foreground mt-1">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="kpi-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Code", "Nom", "Classe d'actif", "Localisation", "Statut", "Taux de rendement", "Date de réception", "Source", ""].map(h => (
                <th key={h} className="table-header text-left py-3 px-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allOpps.map((opp) => (
              <tr
                key={opp.id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{opp.code}</td>
                <td className="py-3 px-3">
                  <p className="font-medium text-foreground">{opp.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(opp.askingPrice)}</p>
                </td>
                <td className="py-3 px-3">
                  <span className="badge-neutral flex items-center gap-1 w-fit">
                    <Building2 className="h-3 w-3" />{opp.assetType}
                  </span>
                </td>
                <td className="py-3 px-3 text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{opp.city}</span>
                </td>
                <td className="py-3 px-3"><span className={statusBadge(opp.status)}>{opp.status}</span></td>
                <td className="py-3 px-3 font-semibold text-foreground">{opp.yieldRate.toFixed(1)}%</td>
                <td className="py-3 px-3 text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(opp.receptionDate).toLocaleDateString("fr-FR")}</span>
                </td>
                <td className="py-3 px-3 text-xs text-muted-foreground">{opp.source}</td>
                <td className="py-3 px-3">
                  <Link to={`/opportunities/${opp.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                    One-Pager <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default Opportunities;
