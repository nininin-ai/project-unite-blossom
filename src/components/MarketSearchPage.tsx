import { useState, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, SlidersHorizontal, ArrowUpDown, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { marketListings, type MarketListing } from "@/data/marketMockData";
import "leaflet/dist/leaflet.css";

// Fix leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const ASSET_CLASSES = ["Bureaux", "Commerces", "Hôtels", "Local d'activité", "Entrepôts"];

interface Props {
  pageType: "offres" | "comparables";
}

function createPriceIcon(price: number, isHighlighted: boolean) {
  const bg = isHighlighted ? "hsl(156,78%,47%)" : "hsl(220,40%,13%)";
  return L.divIcon({
    className: "custom-price-marker",
    html: `<div style="background:${bg};color:#fff;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3);transform:translate(-50%,-50%)">${Math.round(price).toLocaleString("fr-FR")} €/m²</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function ListingCard({ listing, isHovered, onHover, onLeave, onClick }: {
  listing: MarketListing;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={`p-3 border rounded-lg cursor-pointer transition-all duration-150 ${
        isHovered ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-muted-foreground/30"
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <p className="text-sm font-semibold text-foreground truncate flex-1">
          {listing.enseigne || "N/C"}
        </p>
        <Badge variant="secondary" className="text-[10px] ml-2 shrink-0">
          {listing.prix_m2?.toLocaleString("fr-FR")} €/m²
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground truncate">{listing.adresse}, {listing.ville}</p>
      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
        <span>{listing.surface_totale} m²</span>
        {listing.etage && <span>· {listing.etage}</span>}
        <span>· {listing.loyer.toLocaleString("fr-FR")} €/an</span>
      </div>
      {listing.activite && (
        <Badge variant="outline" className="mt-2 text-[10px]">{listing.activite}</Badge>
      )}
    </div>
  );
}

function DetailPanel({ listing, onClose }: { listing: MarketListing; onClose: () => void }) {
  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{listing.enseigne || "N/C"}</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-muted rounded-lg h-40 flex items-center justify-center text-muted-foreground text-xs">
          Photo non disponible
        </div>
        <div className="space-y-3">
          <InfoRow label="Adresse" value={`${listing.adresse}, ${listing.ville}`} />
          <InfoRow label="Surface totale" value={`${listing.surface_totale} m²`} />
          {listing.surface_ponderee && <InfoRow label="Surface pondérée" value={`${listing.surface_ponderee} m²`} />}
          <InfoRow label="Loyer annuel" value={`${listing.loyer.toLocaleString("fr-FR")} €`} />
          {listing.prix_m2 && <InfoRow label="Loyer pondéré /m²" value={`${listing.prix_m2.toLocaleString("fr-FR")} €/m²/an`} />}
          {listing.etage && <InfoRow label="Étage" value={listing.etage} />}
          {listing.activite && <InfoRow label="Activité" value={listing.activite} />}
          <InfoRow label="Début de bail" value={new Date(listing.debut_bail).toLocaleDateString("fr-FR")} />
          <InfoRow label="Statut" value={listing.actif ? "Actif" : "Inactif"} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function MarketSearchPage({ pageType }: Props) {
  const [transactionType, setTransactionType] = useState<"location" | "vente">("location");
  const [selectedClasses, setSelectedClasses] = useState<string[]>(["Commerces"]);
  const [searchAddress, setSearchAddress] = useState("Cannes");
  const [radius, setRadius] = useState(2); // km
  const [surfaceMin, setSurfaceMin] = useState(0);
  const [surfaceMax, setSurfaceMax] = useState(500);
  const [prixMin, setPrixMin] = useState(0);
  const [prixMax, setPrixMax] = useState(5000);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<"surface" | "prix" | "date">("date");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);

  const toggleClass = useCallback((cls: string) => {
    setSelectedClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  }, []);

  const filteredListings = useMemo(() => {
    if (!hasSearched) return [];
    let items = marketListings.filter(l => {
      if (pageType === "offres" && l.type !== "offre") return true; // show all for demo
      if (pageType === "comparables" && l.type !== "comparable") return true;
      return true;
    });
    items = items.filter(l =>
      l.surface_totale >= surfaceMin &&
      l.surface_totale <= surfaceMax &&
      (l.prix_m2 ?? 0) >= prixMin &&
      (l.prix_m2 ?? 0) <= prixMax
    );
    items.sort((a, b) => {
      if (sortBy === "surface") return b.surface_totale - a.surface_totale;
      if (sortBy === "prix") return (b.prix_m2 ?? 0) - (a.prix_m2 ?? 0);
      return new Date(b.debut_bail).getTime() - new Date(a.debut_bail).getTime();
    });
    return items;
  }, [hasSearched, pageType, surfaceMin, surfaceMax, prixMin, prixMax, sortBy]);

  const stats = useMemo(() => {
    if (!filteredListings.length) return null;
    const avgPrix = Math.round(filteredListings.reduce((s, l) => s + (l.prix_m2 ?? 0), 0) / filteredListings.length);
    const avgSurface = Math.round(filteredListings.reduce((s, l) => s + l.surface_totale, 0) / filteredListings.length);
    const count = filteredListings.length;
    const activeCount = filteredListings.filter(l => l.actif).length;
    return { avgPrix, avgSurface, count, activeCount };
  }, [filteredListings]);

  const mapCenter: [number, number] = [43.552, 7.022];

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="p-4 bg-card border-b border-border space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Transaction type */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setTransactionType("location")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                transactionType === "location" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"
              }`}
            >
              Location
            </button>
            <button
              onClick={() => setTransactionType("vente")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                transactionType === "vente" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"
              }`}
            >
              Vente
            </button>
          </div>

          {/* Asset classes */}
          <div className="flex gap-1 flex-wrap">
            {ASSET_CLASSES.map(cls => (
              <button
                key={cls}
                onClick={() => toggleClass(cls)}
                className={`px-2 py-1 text-[10px] font-medium rounded-md border transition-colors ${
                  selectedClasses.includes(cls)
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Address */}
          <div className="flex-1 min-w-[180px]">
            <Input
              placeholder="Adresse de recherche..."
              value={searchAddress}
              onChange={e => setSearchAddress(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Radius */}
          <div className="flex items-center gap-2 min-w-[180px]">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Rayon:</span>
            <Slider
              value={[radius]}
              onValueChange={v => setRadius(v[0])}
              min={0.5}
              max={50}
              step={0.5}
              className="flex-1"
            />
            <Input
              type="number"
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              className="h-8 w-16 text-xs"
              min={0.5}
              max={50}
              step={0.5}
            />
            <span className="text-xs text-muted-foreground">km</span>
          </div>

          {/* Filter toggle */}
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="h-8">
            <SlidersHorizontal className="h-3 w-3 mr-1" />
            <span className="text-xs">Filtres</span>
          </Button>

          {/* Search button */}
          <Button size="sm" onClick={() => setHasSearched(true)} className="h-8">
            <Search className="h-3 w-3 mr-1" />
            <span className="text-xs">Rechercher</span>
          </Button>
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Surface (m²):</span>
              <Input type="number" value={surfaceMin} onChange={e => setSurfaceMin(Number(e.target.value))} className="h-7 w-16 text-xs" placeholder="Min" />
              <span className="text-xs text-muted-foreground">-</span>
              <Input type="number" value={surfaceMax} onChange={e => setSurfaceMax(Number(e.target.value))} className="h-7 w-16 text-xs" placeholder="Max" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{transactionType === "location" ? "Loyer" : "Prix"} (€/m²):</span>
              <Input type="number" value={prixMin} onChange={e => setPrixMin(Number(e.target.value))} className="h-7 w-16 text-xs" placeholder="Min" />
              <span className="text-xs text-muted-foreground">-</span>
              <Input type="number" value={prixMax} onChange={e => setPrixMax(Number(e.target.value))} className="h-7 w-16 text-xs" placeholder="Max" />
            </div>
          </div>
        )}

        {/* Stats tags */}
        {stats && (
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">{stats.count} biens</Badge>
            {pageType === "offres" && <Badge variant="secondary" className="text-[10px]">{stats.activeCount} actifs</Badge>}
            <Badge variant="secondary" className="text-[10px]">Prix moy. {stats.avgPrix.toLocaleString("fr-FR")} €/m²</Badge>
            <Badge variant="secondary" className="text-[10px]">Surface moy. {stats.avgSurface} m²</Badge>
          </div>
        )}
      </div>

      {/* Map + List */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {!hasSearched ? (
            <div className="h-full flex items-center justify-center bg-muted/30">
              <div className="text-center space-y-2">
                <Search className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">Lancez une recherche pour afficher les résultats</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              <Circle center={mapCenter} radius={radius * 1000} pathOptions={{ color: "hsl(156,78%,47%)", fillColor: "hsl(156,78%,47%)", fillOpacity: 0.05, weight: 1 }} />
              {filteredListings.map(listing => (
                <Marker
                  key={listing.id}
                  position={[listing.coordonnees.latitude, listing.coordonnees.longitude]}
                  icon={createPriceIcon(listing.prix_m2 ?? 0, hoveredId === listing.id)}
                  eventHandlers={{
                    mouseover: () => setHoveredId(listing.id),
                    mouseout: () => setHoveredId(null),
                    click: () => setSelectedListing(listing),
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold">{listing.enseigne || "N/C"}</p>
                      <p>{listing.adresse}</p>
                      <p>{listing.surface_totale} m² · {listing.prix_m2?.toLocaleString("fr-FR")} €/m²</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* List panel */}
        {hasSearched && !selectedListing && (
          <div className="w-[320px] border-l border-border flex flex-col bg-card">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">{filteredListings.length} résultats</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="h-7 w-[130px] text-xs">
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">{pageType === "offres" ? "Date publication" : "Date émission"}</SelectItem>
                  <SelectItem value="prix">Prix /m²</SelectItem>
                  <SelectItem value="surface">Surface</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isHovered={hoveredId === listing.id}
                  onHover={() => setHoveredId(listing.id)}
                  onLeave={() => setHoveredId(null)}
                  onClick={() => setSelectedListing(listing)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Detail panel */}
        {selectedListing && (
          <div className="w-[360px]">
            <DetailPanel listing={selectedListing} onClose={() => setSelectedListing(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
