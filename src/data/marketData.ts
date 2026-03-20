// Market reference data for comparative analysis
export interface MarketReference {
  assetType: string;
  city: string;
  capRateMarket: number; // %
  rentPerSqmMarket: number; // €/m²/an
}

export const marketReferences: MarketReference[] = [
  { assetType: "Logistique", city: "Marne-la-Vallée", capRateMarket: 5.5, rentPerSqmMarket: 80 },
  { assetType: "Commerce", city: "Paris 1er", capRateMarket: 4.0, rentPerSqmMarket: 250 },
  { assetType: "Bureau", city: "Paris 15e", capRateMarket: 5.0, rentPerSqmMarket: 320 },
  { assetType: "Commerce", city: "Mérignac", capRateMarket: 6.0, rentPerSqmMarket: 250 },
  { assetType: "Commerce", city: "Lieusaint", capRateMarket: 6.0, rentPerSqmMarket: 250 },
  { assetType: "Bureau", city: "Marseille", capRateMarket: 6.5, rentPerSqmMarket: 320 },
  { assetType: "Résidentiel", city: "Lyon", capRateMarket: 4.5, rentPerSqmMarket: 180 },
  { assetType: "Bureau", city: "Sophia Antipolis", capRateMarket: 7.0, rentPerSqmMarket: 220 },
];

// Fund target values
export const fundTargets = {
  yieldTarget: 7.0, // %
  vacancyTarget: 8.0, // %
};

export function getMarketRef(assetType: string, city: string): MarketReference {
  const exact = marketReferences.find(
    (m) => m.assetType === assetType && city.toLowerCase().includes(m.city.toLowerCase())
  );
  if (exact) return exact;
  const byType = marketReferences.find((m) => m.assetType === assetType);
  if (byType) return byType;
  return { assetType, city, capRateMarket: 6.0, rentPerSqmMarket: 250 };
}
