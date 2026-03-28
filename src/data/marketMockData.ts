export interface MarketListing {
  id: string;
  adresse: string;
  ville: string;
  coordonnees: { longitude: number; latitude: number };
  enseigne: string | null;
  activite: string | null;
  surface_totale: number;
  surface_ponderee: number | null;
  loyer: number;
  loyer_pondere: number | null;
  debut_bail: string;
  type: "offre" | "comparable";
  transaction: "location" | "vente";
  classe: string;
  actif: boolean;
  prix_m2?: number;
  photos?: string[];
  etage?: string;
}

const rawData = [
  { adresse: "Rue du commandant andré, 8", ville: "Cannes", coordonnees: { longitude: 7.022979, latitude: 43.551988 }, enseigne: "Sprezzatura", activite: "PAP", surface_totale: 46, surface_ponderee: 36, loyer: 56000, loyer_pondere: 1521, debut_bail: "2025-01-01" },
  { adresse: "Rue d'antibes, 87", ville: "Cannes", coordonnees: { longitude: 7.024184, latitude: 43.552428 }, enseigne: "Vacant --> recom en cours", activite: null, surface_totale: 174, surface_ponderee: 130, loyer: 250000, loyer_pondere: 1923, debut_bail: "2021-01-01" },
  { adresse: "Rue hoche, 9", ville: "Cannes", coordonnees: { longitude: 7.019679, latitude: 43.553126 }, enseigne: "Okaïdi", activite: "PAP", surface_totale: 108, surface_ponderee: 52, loyer: 80215, loyer_pondere: 1542, debut_bail: "2020-01-01" },
  { adresse: "Rue du commandant andré", ville: "Cannes", coordonnees: { longitude: 7.022994, latitude: 43.551427 }, enseigne: "Forte forte", activite: "PAP", surface_totale: 100, surface_ponderee: 65, loyer: 100000, loyer_pondere: 1538, debut_bail: "2021-01-01" },
  { adresse: "Rue d'antibes", ville: "Cannes", coordonnees: { longitude: 7.023204, latitude: 43.552379 }, enseigne: "Sakaré", activite: "Cosmétiques", surface_totale: 29, surface_ponderee: 29, loyer: 120000, loyer_pondere: 4138, debut_bail: "2024-01-01" },
  { adresse: "Rue du commandant-andré", ville: "Cannes", coordonnees: { longitude: 7.022994, latitude: 43.551427 }, enseigne: "Sprezzatura", activite: "PAP", surface_totale: 46, surface_ponderee: 38, loyer: 53000, loyer_pondere: 1394, debut_bail: "2025-01-01" },
  { adresse: "56 rue d'antibes", ville: "Cannes", coordonnees: { longitude: 7.020884, latitude: 43.552459 }, enseigne: "Sakare", activite: null, surface_totale: 29, surface_ponderee: 31, loyer: 135780, loyer_pondere: 4380, debut_bail: "2024-01-01" },
  { adresse: "Rue d'antibes, 122-124", ville: "Cannes", coordonnees: { longitude: 7.02666, latitude: 43.551963 }, enseigne: "Daniel guidat", activite: "Galerie d'Art", surface_totale: 27, surface_ponderee: 27, loyer: 40302, loyer_pondere: 1492, debut_bail: "2020-01-01" },
  { adresse: "Rue d'antibes, 56", ville: "Cannes", coordonnees: { longitude: 7.020884, latitude: 43.552459 }, enseigne: "Glacier du festival", activite: "Restauration", surface_totale: 31, surface_ponderee: 34, loyer: 117402, loyer_pondere: 3453, debut_bail: "2021-01-01" },
  { adresse: "Rue d'antibes, 125", ville: "Cannes", coordonnees: { longitude: 7.027451, latitude: 43.551891 }, enseigne: "Clinique des champs", activite: "Soins beauté", surface_totale: 287, surface_ponderee: 229, loyer: 170000, loyer_pondere: 740, debut_bail: "2023-01-01" },
  { adresse: "Rue macé, 6", ville: "Cannes", coordonnees: { longitude: 7.022229, latitude: 43.552044 }, enseigne: "Chynoax", activite: "PAP", surface_totale: 61, surface_ponderee: 30, loyer: 30000, loyer_pondere: 981, debut_bail: "2023-01-01" },
  { adresse: "Rue du commandant andré, 12", ville: "Cannes", coordonnees: { longitude: 7.022968, latitude: 43.551858 }, enseigne: "Tresse", activite: "PAP", surface_totale: 118, surface_ponderee: 72, loyer: 140000, loyer_pondere: 1939, debut_bail: "2023-01-01" },
  { adresse: "Rue meynadier, 7", ville: "Cannes", coordonnees: { longitude: 7.015352, latitude: 43.552755 }, enseigne: "Euronet services (atm)", activite: "Services", surface_totale: 42, surface_ponderee: 31, loyer: 36776, loyer_pondere: 1152, debut_bail: "2023-01-01" },
  { adresse: "Rue buttura, 9", ville: "Cannes", coordonnees: { longitude: 7.017955, latitude: 43.552768 }, enseigne: "Animalis", activite: "Autres", surface_totale: 294, surface_ponderee: 125, loyer: 140000, loyer_pondere: 1117, debut_bail: "2024-01-01" },
  { adresse: "Rue d'antibes, 122-124", ville: "Cannes", coordonnees: { longitude: 7.02666, latitude: 43.551963 }, enseigne: "Gold union", activite: "Services", surface_totale: 30, surface_ponderee: 27, loyer: 42036, loyer_pondere: 1556, debut_bail: "2022-01-01" },
  { adresse: "Rue des états-unis, 40", ville: "Cannes", coordonnees: { longitude: 7.02146, latitude: 43.551309 }, enseigne: "Geox", activite: "Chaussures", surface_totale: 114, surface_ponderee: 80, loyer: 82084, loyer_pondere: 1014, debut_bail: "2022-01-01" },
  { adresse: "Rue bivouac napoléon, 33", ville: "Cannes", coordonnees: { longitude: 7.018877, latitude: 43.552092 }, enseigne: "Tuk tuk thai", activite: "Restauration", surface_totale: 108, surface_ponderee: 77, loyer: 60000, loyer_pondere: 769, debut_bail: "2024-01-01" },
  { adresse: "Rue d'antibes, 91", ville: "Cannes", coordonnees: { longitude: 7.024582, latitude: 43.552409 }, enseigne: "L-reve bijoux", activite: "Accessoires", surface_totale: 78, surface_ponderee: 40, loyer: 154418, loyer_pondere: 3775, debut_bail: "2024-01-01" },
  { adresse: "Rue bivouac napoléon, 33", ville: "Cannes", coordonnees: { longitude: 7.018877, latitude: 43.552092 }, enseigne: "Tuk tuk thaï", activite: "Restauration", surface_totale: 102, surface_ponderee: 81, loyer: 59774, loyer_pondere: 732, debut_bail: "2024-01-01" },
  { adresse: "Rue d'antibes, 29", ville: "Cannes", coordonnees: { longitude: 7.018928, latitude: 43.552585 }, enseigne: "N/c", activite: null, surface_totale: 194, surface_ponderee: 98, loyer: 250000, loyer_pondere: 2530, debut_bail: "2025-01-01" },
  { adresse: "Rue du commandant andré, 30", ville: "Cannes", coordonnees: { longitude: 7.0229, latitude: 43.551005 }, enseigne: "N/c", activite: null, surface_totale: 151, surface_ponderee: 113, loyer: 240000, loyer_pondere: 2118, debut_bail: "2025-01-01" },
  { adresse: "Rue meynadier", ville: "Cannes", coordonnees: { longitude: 7.013575, latitude: 43.552372 }, enseigne: "Caniris", activite: "Services", surface_totale: 25, surface_ponderee: null, loyer: 36000, loyer_pondere: null, debut_bail: "2022-01-01" },
  { adresse: "Gare de cannes", ville: "Cannes", coordonnees: { longitude: 7.0196915, latitude: 43.5539692 }, enseigne: "O'tacos", activite: "Restauration", surface_totale: 140, surface_ponderee: 98, loyer: 76000, loyer_pondere: 775, debut_bail: "2025-01-01" },
  { adresse: "Rue d'antibes, 29", ville: "Cannes", coordonnees: { longitude: 7.018928, latitude: 43.552585 }, enseigne: "Solaris", activite: "Accessoires", surface_totale: 194, surface_ponderee: 101, loyer: 220000, loyer_pondere: 2173, debut_bail: "2025-01-01" },
  { adresse: "Rue d'antibes, 65", ville: "Cannes", coordonnees: { longitude: 7.021833, latitude: 43.552557 }, enseigne: "Ralph lauren", activite: "PAP", surface_totale: 145, surface_ponderee: 101, loyer: 186298, loyer_pondere: 1844, debut_bail: "2024-01-01" },
  { adresse: "Rue d'antibes, 66", ville: "Cannes", coordonnees: { longitude: 7.021665, latitude: 43.552445 }, enseigne: "Montale", activite: "Soins beauté", surface_totale: 255, surface_ponderee: 132, loyer: 373592, loyer_pondere: 2358, debut_bail: "2024-01-01" },
  { adresse: "Rue d'antibes, 61", ville: "Cannes", coordonnees: { longitude: 7.021382, latitude: 43.552553 }, enseigne: "Lola & liza", activite: "PAP", surface_totale: 65, surface_ponderee: 40, loyer: 134493, loyer_pondere: 3362, debut_bail: "2024-01-01" },
  { adresse: "Rue du commandant andré, 30", ville: "Cannes", coordonnees: { longitude: 7.0229, latitude: 43.551005 }, enseigne: "Carter and white", activite: "PAP", surface_totale: 137, surface_ponderee: 99, loyer: 240000, loyer_pondere: 2421, debut_bail: "2025-01-01" },
  { adresse: "Rue du commandant andré, 32", ville: "Cannes", coordonnees: { longitude: 7.022881, latitude: 43.550772 }, enseigne: "Carha", activite: "Bijouterie", surface_totale: 21, surface_ponderee: 21, loyer: 53797, loyer_pondere: 2561, debut_bail: "2024-01-01" },
  { adresse: "77-79, avenue maréchal juin", ville: "Cannes", coordonnees: { longitude: 7.040792, latitude: 43.548287 }, enseigne: "Casino shop", activite: null, surface_totale: 197, surface_ponderee: 126, loyer: 48062, loyer_pondere: 381, debut_bail: "2022-01-01" },
  { adresse: "77-79, avenue maréchal juin", ville: "Cannes", coordonnees: { longitude: 7.040792, latitude: 43.548287 }, enseigne: null, activite: null, surface_totale: 197, surface_ponderee: 126, loyer: 48062, loyer_pondere: 381, debut_bail: "2022-01-01" },
  { adresse: "Rue jean jaurès (gare de cannes)", ville: "Cannes", coordonnees: { longitude: 7.022156, latitude: 43.553609 }, enseigne: "Gomu", activite: "Restauration", surface_totale: 100, surface_ponderee: 80, loyer: 76000, loyer_pondere: 950, debut_bail: "2023-01-01" },
  { adresse: "Rue du commandant andré, 15", ville: "Cannes", coordonnees: { longitude: 7.023064, latitude: 43.551544 }, enseigne: "New", activite: "Chaussures", surface_totale: 90, surface_ponderee: 36, loyer: 76000, loyer_pondere: 2111, debut_bail: "2025-01-01" },
  { adresse: "Rue du commandant andré, 14", ville: "Cannes", coordonnees: { longitude: 7.022963, latitude: 43.551798 }, enseigne: "Cp company", activite: "PAP", surface_totale: 118, surface_ponderee: 77, loyer: 125341, loyer_pondere: 1615, debut_bail: "2023-01-01" },
  { adresse: "Rue du commandant andré, 29", ville: "Cannes", coordonnees: { longitude: 7.022995, latitude: 43.550699 }, enseigne: "Peserico", activite: "PAP", surface_totale: 108, surface_ponderee: 72, loyer: 200000, loyer_pondere: 2777, debut_bail: "2025-01-01" },
];

export const marketListings: MarketListing[] = rawData.map((item, index) => ({
  id: `market-${index + 1}`,
  ...item,
  type: index % 3 === 0 ? "offre" as const : "comparable" as const,
  transaction: "location" as const,
  classe: "Commerces",
  actif: index % 4 !== 0,
  prix_m2: item.loyer_pondere ?? Math.round(item.loyer / item.surface_totale),
  etage: index % 5 === 0 ? "RDC" : index % 5 === 1 ? "1er" : index % 5 === 2 ? "2ème" : index % 5 === 3 ? "RDC + Sous-sol" : "RDC",
}));
