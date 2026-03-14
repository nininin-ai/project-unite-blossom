import { useParams, Link } from "react-router-dom";
import { mockAssets } from "@/data/mockData";
import { ArrowLeft, Printer, Building2, MapPin, Ruler, Calendar, Euro, Zap, Car, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import logoEquimmox from "@/assets/logo-equimmox.png";

interface SheetData {
  designation: string;
  address: string;
  city: string;
  assetType: string;
  totalSurface: string;
  floorDetail: string;
  destination: string;
  usagesPossibles: string;
  etatGeneral: string;
  vitrine: string;
  acces: string;
  hauteur: string;
  parking: string;
  exterieur: string;
  equipements: string;
  disponibilite: string;
  loyer: string;
  charges: string;
  taxeFonciere: string;
  honoraires: string;
  typeBail: string;
  dureeBail: string;
  depotGarantie: string;
  dpe: string;
  ges: string;
  // Commerce specifics
  lineaireVitrine: string;
  surfaceVente: string;
  surfaceReserve: string;
  erpPmr: string;
  // Bureau specifics
  cloisonnement: string;
  climatisation: string;
  ascenseur: string;
  // Activité specifics
  hauteurLibre: string;
  porteSectionnelle: string;
  quai: string;
  aireManoeuvre: string;
}

const CommercialSheet = () => {
  const { id } = useParams();
  const asset = mockAssets.find((a) => a.id === id);

  if (!asset) return <div className="p-8 text-center text-muted-foreground">Actif introuvable</div>;

  const totalCharges = asset.charges.reduce((s, c) => s + c.annualAmount, 0);
  const floorStr = asset.floors.map((f) => `Ét. ${f.floor}: ${f.surface} m² (${f.type})`).join(" | ");
  const vacantFloors = asset.floors.filter((f) => f.vacant);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

  const [data, setData] = useState<SheetData>({
    designation: asset.name,
    address: asset.address,
    city: asset.city,
    assetType: asset.type,
    totalSurface: `${asset.totalSurface.toLocaleString("fr-FR")} m²`,
    floorDetail: floorStr,
    destination: asset.type === "Commerce" ? "Commerce / Activité commerciale" : asset.type === "Bureau" ? "Bureaux" : "Activité / Logistique",
    usagesPossibles: "",
    etatGeneral: asset.lastWorks ? `Derniers travaux : ${asset.lastWorks}` : "Bon état",
    vitrine: "",
    acces: "",
    hauteur: "",
    parking: "",
    exterieur: "",
    equipements: "",
    disponibilite: vacantFloors.length > 0 ? "Immédiate" : "À convenir",
    loyer: vacantFloors.length > 0
      ? `${formatCurrency(Math.round(asset.annualRent / asset.totalSurface * (vacantFloors.reduce((s, f) => s + f.surface, 0))))} /an`
      : `${formatCurrency(asset.annualRent)} /an`,
    charges: `${formatCurrency(totalCharges)} /an`,
    taxeFonciere: "À définir",
    honoraires: "Selon barème",
    typeBail: "Bail commercial 3/6/9",
    dureeBail: "9 ans ferme",
    depotGarantie: "3 mois de loyer HT/HC",
    dpe: "À renseigner",
    ges: "À renseigner",
    lineaireVitrine: "",
    surfaceVente: "",
    surfaceReserve: "",
    erpPmr: "",
    cloisonnement: "",
    climatisation: "",
    ascenseur: "",
    hauteurLibre: "",
    porteSectionnelle: "",
    quai: "",
    aireManoeuvre: "",
  });

  const [isPrintMode, setIsPrintMode] = useState(false);

  const update = (key: keyof SheetData, value: string) => setData((prev) => ({ ...prev, [key]: value }));

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  const EditableField = ({ label, field, icon }: { label: string; field: keyof SheetData; icon?: React.ReactNode }) => (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      {isPrintMode ? (
        <p className="text-sm text-foreground font-medium">{data[field] || "–"}</p>
      ) : (
        <Input
          value={data[field]}
          onChange={(e) => update(field, e.target.value)}
          className="h-8 text-sm border-border/60 bg-card"
        />
      )}
    </div>
  );

  const EditableTextarea = ({ label, field }: { label: string; field: keyof SheetData }) => (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</label>
      {isPrintMode ? (
        <p className="text-sm text-foreground font-medium whitespace-pre-line">{data[field] || "–"}</p>
      ) : (
        <Textarea
          value={data[field]}
          onChange={(e) => update(field, e.target.value)}
          className="text-sm min-h-[48px] border-border/60 bg-card"
        />
      )}
    </div>
  );

  const isCommerce = asset.type === "Commerce";
  const isBureau = asset.type === "Bureau";
  const isActivite = asset.type === "Logistique" || asset.type === "Mixte";

  return (
    <>
      {/* Controls — hidden on print */}
      <div className="p-4 flex items-center justify-between print:hidden sticky top-0 z-50 bg-background border-b border-border">
        <Link to={`/assets/${id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour à la fiche
        </Link>
        <Button onClick={handlePrint} size="sm" className="gap-2">
          <Printer className="h-4 w-4" /> Imprimer / PDF
        </Button>
      </div>

      {/* Sheet — landscape A4 */}
      <div className="print:p-0 p-4 flex justify-center">
        <div
          className="bg-card border border-border rounded-xl shadow-sm w-full max-w-[1120px] print:max-w-none print:border-0 print:shadow-none print:rounded-none"
          style={{ aspectRatio: "1.414 / 1" }}
        >
          {/* Header band */}
          <div className="bg-[hsl(220,55%,13%)] text-white px-8 py-5 rounded-t-xl print:rounded-none flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logoEquimmox} alt="Equimmox" className="h-8 object-contain brightness-0 invert" />
              <div className="h-8 w-px bg-white/20" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-medium">Fiche de commercialisation</p>
                <h1 className="text-lg font-bold">{data.designation}</h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium flex items-center gap-1.5 justify-end">
                <MapPin className="h-3.5 w-3.5" />
                {data.address}
              </p>
              <p className="text-xs text-white/60">{data.city}</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 grid grid-cols-3 gap-5 text-sm overflow-y-auto" style={{ maxHeight: "calc(100% - 80px)" }}>
            {/* Column 1 — Désignation & Surfaces */}
            <div className="space-y-4">
              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-accent" />
                  Désignation
                </h3>
                <EditableField label="Type d'actif" field="assetType" />
                <EditableField label="Adresse" field="address" />
                <EditableField label="Ville" field="city" />
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Ruler className="h-3.5 w-3.5 text-accent" />
                  Surfaces
                </h3>
                <EditableField label="Surface totale" field="totalSurface" />
                <EditableTextarea label="Détail par étage" field="floorDetail" />
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-accent" />
                  Énergie
                </h3>
                <EditableField label="DPE" field="dpe" />
                <EditableField label="GES" field="ges" />
              </div>
            </div>

            {/* Column 2 — Caractéristiques */}
            <div className="space-y-4">
              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Destination & État</h3>
                <EditableField label="Destination" field="destination" />
                <EditableField label="Usages possibles" field="usagesPossibles" />
                <EditableField label="État général" field="etatGeneral" />
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Caractéristiques</h3>
                <EditableField label="Vitrine / Façade" field="vitrine" />
                <EditableField label="Accès" field="acces" />
                <EditableField label="Hauteur sous plafond" field="hauteur" />
                <EditableField label="Parking" field="parking" icon={<Car className="h-3 w-3" />} />
                <EditableField label="Extérieur" field="exterieur" />
                <EditableField label="Équipements" field="equipements" />
              </div>

              {/* Type-specific section */}
              {isCommerce && (
                <div className="space-y-3 p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent">Spécificités Commerce</h3>
                  <EditableField label="Linéaire vitrine" field="lineaireVitrine" />
                  <EditableField label="Surface de vente" field="surfaceVente" />
                  <EditableField label="Surface réserve" field="surfaceReserve" />
                  <EditableField label="ERP / PMR" field="erpPmr" />
                </div>
              )}

              {isBureau && (
                <div className="space-y-3 p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent">Spécificités Bureau</h3>
                  <EditableField label="Cloisonnement" field="cloisonnement" />
                  <EditableField label="Climatisation" field="climatisation" icon={<Wind className="h-3 w-3" />} />
                  <EditableField label="Ascenseur" field="ascenseur" />
                  <EditableField label="ERP / PMR" field="erpPmr" />
                </div>
              )}

              {isActivite && (
                <div className="space-y-3 p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent">Spécificités Activité</h3>
                  <EditableField label="Hauteur libre" field="hauteurLibre" />
                  <EditableField label="Porte sectionnelle" field="porteSectionnelle" />
                  <EditableField label="Quai" field="quai" />
                  <EditableField label="Aire de manœuvre" field="aireManoeuvre" />
                </div>
              )}
            </div>

            {/* Column 3 — Conditions financières & locatives */}
            <div className="space-y-4">
              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Euro className="h-3.5 w-3.5 text-accent" />
                  Conditions financières
                </h3>
                <EditableField label="Loyer" field="loyer" />
                <EditableField label="Charges" field="charges" />
                <EditableField label="Taxe foncière" field="taxeFonciere" />
                <EditableField label="Honoraires" field="honoraires" />
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-accent" />
                  Conditions locatives
                </h3>
                <EditableField label="Type de bail" field="typeBail" />
                <EditableField label="Durée" field="dureeBail" />
                <EditableField label="Dépôt de garantie" field="depotGarantie" />
                <EditableField label="Disponibilité" field="disponibilite" />
              </div>

              {/* Recap box */}
              <div className="p-4 rounded-lg bg-[hsl(220,55%,13%)] text-white space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/60">Récapitulatif</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Surface</span>
                    <span className="font-semibold">{data.totalSurface}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Loyer</span>
                    <span className="font-semibold">{data.loyer}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Charges</span>
                    <span className="font-semibold">{data.charges}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Disponibilité</span>
                    <span className="font-semibold">{data.disponibilite}</span>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="text-[10px] text-muted-foreground leading-relaxed">
                <p>Les informations contenues dans cette fiche sont données à titre indicatif et ne constituent pas un engagement contractuel. Elles sont susceptibles d'être modifiées sans préavis.</p>
                <p className="mt-1 font-medium text-foreground">© Equimmox — {new Date().getFullYear()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommercialSheet;
