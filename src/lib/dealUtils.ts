import type { Deal } from "@/data/mockData";

/** Calculates auto-priority based on reception date vs now */
export function getAutoPriority(receptionDate?: string): "Élevée" | "Moyenne" | "Faible" {
  if (!receptionDate) return "Faible";
  const diffMs = Date.now() - new Date(receptionDate).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 2) return "Élevée";
  if (diffDays <= 7) return "Moyenne";
  return "Faible";
}

/** Calculates estimated value via cap rate */
export function getCapRateValue(annualRent: number, capRate: number): number {
  if (capRate <= 0) return 0;
  return annualRent / capRate;
}

/** Returns valuation label */
export function getValuationLabel(askingPrice: number, estimatedValue: number): { label: string; type: "success" | "warning" | "danger" } {
  const ratio = askingPrice / estimatedValue;
  if (ratio < 0.95) return { label: "Sous-évalué", type: "success" };
  if (ratio <= 1.05) return { label: "Proche valeur estimée", type: "warning" };
  return { label: "Surévalué", type: "danger" };
}

/** Calculates rental potential */
export function getRentalPotential(totalSurface: number, occupiedSurface: number, rentPerSqm: number) {
  const currentRent = occupiedSurface * rentPerSqm;
  const potentialRent = totalSurface * rentPerSqm;
  const uplift = potentialRent - currentRent;
  const upliftPercent = currentRent > 0 ? (uplift / currentRent) * 100 : 0;
  return { currentRent, potentialRent, uplift, upliftPercent };
}

/** Simplified IRR calculation using Newton's method */
export function calculateIRR(cashflows: number[]): number {
  let rate = 0.1;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += cashflows[t] / factor;
      dnpv -= (t * cashflows[t]) / (factor * (1 + rate));
    }
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 0.00001) return newRate;
    rate = newRate;
  }
  return rate;
}

/** Asset-type-specific market parameters */
function getAssetTypeParams(assetType?: string) {
  const type = (assetType || "Bureau").toLowerCase();
  if (type.includes("commerce") || type.includes("retail")) {
    return { acquisitionFeesRate: 0.075, indexation: 0.02, capexRate: 0.0125, exitCapRate: 0.055, plusValueRate: 0.15, indexLabel: "ILC" };
  }
  if (type.includes("logistique")) {
    return { acquisitionFeesRate: 0.07, indexation: 0.02, capexRate: 0.01, exitCapRate: 0.045, plusValueRate: 0.20, indexLabel: "ILAT" };
  }
  if (type.includes("data") || type.includes("datacenter")) {
    return { acquisitionFeesRate: 0.065, indexation: 0.025, capexRate: 0.0075, exitCapRate: 0.055, plusValueRate: 0.125, indexLabel: "Contractuelle" };
  }
  // Bureaux (default)
  return { acquisitionFeesRate: 0.075, indexation: 0.02, capexRate: 0.025, exitCapRate: 0.0525, plusValueRate: 0.15, indexLabel: "ILAT" };
}

export { getAssetTypeParams };

/** Generate mini business plan cashflows */
export function generateBusinessPlan(deal: Deal) {
  const params = getAssetTypeParams(deal.assetType);
  const holdingPeriod = deal.holdingPeriod || 10;
  const acquisitionPrice = deal.amount;

  // Use deal-specific values or derive from asset type params
  const acquisitionFees = deal.acquisitionFees || Math.round(acquisitionPrice * params.acquisitionFeesRate);
  const annualRent = deal.annualRent || Math.round((deal.amount * deal.yield) / 100);
  const charges = deal.charges || Math.round(annualRent * 0.08);
  const annualCapex = deal.capex || Math.round(acquisitionPrice * params.capexRate);
  const surface = deal.surface || 1;
  const occupiedSurface = deal.occupiedSurface || surface;
  const rentPerSqm = deal.rentPerSqm || (annualRent / occupiedSurface);

  // Exit price: use deal value or calculate from cap rate + plus-value
  const exitPrice = deal.exitPrice || Math.round(
    Math.max(
      (annualRent * Math.pow(1 + params.indexation, holdingPeriod)) / params.exitCapRate,
      acquisitionPrice * (1 + params.plusValueRate)
    )
  );

  const potentialRent = surface * rentPerSqm;
  const totalInvestment = acquisitionPrice + acquisitionFees;

  const years: Array<{
    year: number;
    rent: number;
    charges: number;
    capex: number;
    netCashflow: number;
    exitValue: number;
  }> = [];

  const irrCashflows = [-totalInvestment];

  for (let i = 0; i < holdingPeriod; i++) {
    const yearRent = annualRent * Math.pow(1 + params.indexation, i);
    const yearCharges = charges * Math.pow(1.015, i);
    // CAPEX: heavier at mid-life and year 1
    const yearCapex = i === 0
      ? annualCapex * 1.5
      : i === Math.floor(holdingPeriod / 2)
        ? annualCapex * 2
        : annualCapex;
    const exitValue = i === holdingPeriod - 1 ? exitPrice : 0;
    const netCashflow = yearRent - yearCharges - yearCapex;

    years.push({
      year: i + 1,
      rent: Math.round(yearRent),
      charges: Math.round(yearCharges),
      capex: Math.round(yearCapex),
      netCashflow: Math.round(netCashflow),
      exitValue: Math.round(exitValue),
    });

    irrCashflows.push(netCashflow + exitValue);
  }

  const irr = calculateIRR(irrCashflows) * 100;
  const totalCashflow = years.reduce((s, y) => s + y.netCashflow, 0);
  const totalReturn = totalCashflow + exitPrice - totalInvestment;
  const globalYield = (totalReturn / totalInvestment) * 100;

  return {
    years,
    irr: isFinite(irr) ? +irr.toFixed(2) : deal.triEstimated,
    totalInvestment,
    totalCashflow: Math.round(totalCashflow),
    globalYield: isFinite(globalYield) ? +globalYield.toFixed(1) : 0,
    potentialRent: Math.round(potentialRent),
    currentRent: annualRent,
    exitPrice,
    params,
  };
}
