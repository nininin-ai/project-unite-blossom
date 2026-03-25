import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "fund_targets";
const defaults = { yieldTarget: 7.0, vacancyTarget: 8.0 };

export type FundTargets = typeof defaults;

export function useFundTargets() {
  const [targets, setTargets] = useState<FundTargets>(defaults);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setTargets(JSON.parse(stored));
    } catch {}
  }, []);

  const updateTargets = useCallback((newTargets: FundTargets) => {
    setTargets(newTargets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTargets));
  }, []);

  return { targets, updateTargets };
}
