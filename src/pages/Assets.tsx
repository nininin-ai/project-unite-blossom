import { useState } from "react";
import { mockAssets, Asset } from "@/data/mockData";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, MapPin, TrendingUp } from "lucide-react";
import ExcelImport from "@/components/ExcelImport";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

const Assets = () => {
  const [assets, setAssets] = useState<Asset[]>(mockAssets);

  const handleImport = (newAssets: Asset[]) => {
    setAssets((prev) => [...prev, ...newAssets]);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parc Immobilier</h1>
          <p className="text-sm text-muted-foreground mt-1">{assets.length} actifs sous gestion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {assets.map((asset, i) => {
          const vacancyRate = (asset.vacantSurface / asset.totalSurface * 100).toFixed(1);
          const hasUnpaid = asset.tenants.some(t => t.unpaid);
          return (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={`/assets/${asset.id}`}
                className="block kpi-card group hover:border-accent/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-accent" />
                  </div>
                  {hasUnpaid && <span className="badge-danger">Impayé</span>}
                </div>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">{asset.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />{asset.address}, {asset.city}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Loyer annuel</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(asset.annualRent)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Rendement</p>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-accent" />
                      {asset.yield}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Surface</p>
                    <p className="text-sm font-semibold text-foreground">{asset.totalSurface.toLocaleString("fr-FR")} m²</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Vacance</p>
                    <p className={`text-sm font-semibold ${+vacancyRate > 15 ? "text-destructive" : +vacancyRate > 8 ? "text-warning" : "text-success"}`}>
                      {vacancyRate}% ({asset.vacantSurface.toLocaleString("fr-FR")} m²)
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="badge-neutral">{asset.type}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">Score risque</span>
                    <span className={`text-xs font-bold ${asset.riskScore >= 70 ? "text-destructive" : asset.riskScore >= 50 ? "text-warning" : "text-success"}`}>
                      {asset.riskScore}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Import Excel */}
      <ExcelImport onImport={handleImport} />
    </div>
  );
};

export default Assets;
