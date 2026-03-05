import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

async function geocode(address: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "User-Agent": "Equimmox/1.0" } }
    );
    const data = await res.json();
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}
  return null;
}

interface DealMapProps {
  address: string;
  city: string;
  name?: string;
  className?: string;
}

const DealMap = ({ address, city, name, className = "" }: DealMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapRef.current) return;

    const query = `${address}, ${city}, France`;

    const initMap = async () => {
      let pos = await geocode(query);
      if (!pos) pos = await geocode(`${city}, France`);
      if (!pos) pos = [48.8566, 2.3522];

      setLoading(false);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current!, { scrollWheelZoom: true }).setView(pos, 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.marker(pos)
        .addTo(map)
        .bindPopup(`<strong>${name || "Bien"}</strong><br/>${address}, ${city}`);

      mapInstanceRef.current = map;

      setTimeout(() => map.invalidateSize(), 100);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [address, city, name]);

  return (
    <div className={`rounded-xl overflow-hidden border border-border/60 relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
          <p className="text-xs text-muted-foreground animate-pulse">Chargement de la carte…</p>
        </div>
      )}
      <div ref={mapRef} style={{ height: "100%", width: "100%", minHeight: "200px" }} />
    </div>
  );
};

export default DealMap;
