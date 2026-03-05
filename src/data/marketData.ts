// Market reference data for comparative analysis
export interface MarketReference {
  assetType: string;
  city: string;
  capRateMarket: number; // %
  rentPerSqmMarket: number; // €/m²/an
}

export const marketReferences: MarketReference[] = [
  { assetType: "Bureau", city: "Paris", capRateMarket: 5.5, rentPerSqmMarket: 350 },
  { assetType: "Commerce", city: "IDF", capRateMarket: 6.0, rentPerSqmMarket: 250 },
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
