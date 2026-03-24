// INSEE index values for ILC, ILAT, ICC
// Source: INSEE - updated periodically

export interface IndexValue {
  quarter: string; // "T1", "T2", "T3", "T4"
  year: number;
  value: number;
}

export interface IndexSeries {
  [key: string]: IndexValue[]; // keyed by index name (ILC, ILAT, ICC)
}

export const indexValues: IndexSeries = {
  ILC: [
    { quarter: "T1", year: 2020, value: 116.24 },
    { quarter: "T2", year: 2020, value: 116.16 },
    { quarter: "T3", year: 2020, value: 116.19 },
    { quarter: "T4", year: 2020, value: 116.51 },
    { quarter: "T1", year: 2021, value: 117.00 },
    { quarter: "T2", year: 2021, value: 117.70 },
    { quarter: "T3", year: 2021, value: 118.62 },
    { quarter: "T4", year: 2021, value: 120.61 },
    { quarter: "T1", year: 2022, value: 122.35 },
    { quarter: "T2", year: 2022, value: 124.89 },
    { quarter: "T3", year: 2022, value: 127.47 },
    { quarter: "T4", year: 2022, value: 130.26 },
    { quarter: "T1", year: 2023, value: 132.63 },
    { quarter: "T2", year: 2023, value: 133.37 },
    { quarter: "T3", year: 2023, value: 133.66 },
    { quarter: "T4", year: 2023, value: 133.30 },
    { quarter: "T1", year: 2024, value: 133.67 },
    { quarter: "T2", year: 2024, value: 134.45 },
    { quarter: "T3", year: 2024, value: 135.20 },
    { quarter: "T4", year: 2024, value: 135.60 },
    { quarter: "T1", year: 2025, value: 136.10 },
    { quarter: "T2", year: 2025, value: 136.81 },
  ],
  ILAT: [
    { quarter: "T1", year: 2020, value: 112.37 },
    { quarter: "T2", year: 2020, value: 112.24 },
    { quarter: "T3", year: 2020, value: 112.21 },
    { quarter: "T4", year: 2020, value: 112.41 },
    { quarter: "T1", year: 2021, value: 112.76 },
    { quarter: "T2", year: 2021, value: 113.36 },
    { quarter: "T3", year: 2021, value: 114.07 },
    { quarter: "T4", year: 2021, value: 115.43 },
    { quarter: "T1", year: 2022, value: 117.06 },
    { quarter: "T2", year: 2022, value: 119.21 },
    { quarter: "T3", year: 2022, value: 121.56 },
    { quarter: "T4", year: 2022, value: 124.25 },
    { quarter: "T1", year: 2023, value: 126.39 },
    { quarter: "T2", year: 2023, value: 127.42 },
    { quarter: "T3", year: 2023, value: 127.77 },
    { quarter: "T4", year: 2023, value: 127.71 },
    { quarter: "T1", year: 2024, value: 127.97 },
    { quarter: "T2", year: 2024, value: 128.56 },
    { quarter: "T3", year: 2024, value: 129.10 },
    { quarter: "T4", year: 2024, value: 129.45 },
    { quarter: "T1", year: 2025, value: 129.90 },
    { quarter: "T2", year: 2025, value: 130.32 },
  ],
  ICC: [
    { quarter: "T1", year: 2020, value: 1753 },
    { quarter: "T2", year: 2020, value: 1750 },
    { quarter: "T3", year: 2020, value: 1765 },
    { quarter: "T4", year: 2020, value: 1791 },
    { quarter: "T1", year: 2021, value: 1822 },
    { quarter: "T2", year: 2021, value: 1886 },
    { quarter: "T3", year: 2021, value: 1886 },
    { quarter: "T4", year: 2021, value: 1923 },
    { quarter: "T1", year: 2022, value: 1985 },
    { quarter: "T2", year: 2022, value: 2037 },
    { quarter: "T3", year: 2022, value: 2091 },
    { quarter: "T4", year: 2022, value: 2130 },
    { quarter: "T1", year: 2023, value: 2148 },
    { quarter: "T2", year: 2023, value: 2154 },
    { quarter: "T3", year: 2023, value: 2162 },
    { quarter: "T4", year: 2023, value: 2162 },
    { quarter: "T1", year: 2024, value: 2170 },
    { quarter: "T2", year: 2024, value: 2182 },
    { quarter: "T3", year: 2024, value: 2195 },
    { quarter: "T4", year: 2024, value: 2200 },
    { quarter: "T1", year: 2025, value: 2210 },
    { quarter: "T2", year: 2025, value: 2220 },
  ],
};

export function getIndexValue(indexName: string, quarter: string, year: number): number | null {
  const series = indexValues[indexName];
  if (!series) return null;
  const entry = series.find(e => e.quarter === quarter && e.year === year);
  return entry?.value ?? null;
}

export function getLatestIndexValue(indexName: string): IndexValue | null {
  const series = indexValues[indexName];
  if (!series || series.length === 0) return null;
  return series[series.length - 1];
}

export function computeIndexedRent(
  initialRent: number,
  indexName: string,
  refQuarter: string,
  refYear: number
): { newRent: number; refValue: number; latestValue: number; latestQuarter: string; latestYear: number; variation: number } | null {
  const refValue = getIndexValue(indexName, refQuarter, refYear);
  const latest = getLatestIndexValue(indexName);
  if (refValue === null || !latest) return null;
  
  const variation = ((latest.value - refValue) / refValue) * 100;
  const newRent = Math.round(initialRent * (latest.value / refValue));
  
  return {
    newRent,
    refValue,
    latestValue: latest.value,
    latestQuarter: latest.quarter,
    latestYear: latest.year,
    variation,
  };
}
