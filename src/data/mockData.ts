export interface Tenant {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  triennialDate: string;
  leaseType: string;
  deposit: number;
  currentRent: number;
  index: string;
  indexRef: string;
  accompaniment: string;
  chargesManagement: string;
  unpaid: boolean;
  unpaidAmount?: number;
  surface: number;
  floor: number;
  siren?: string;
}

export interface Charge {
  id: string;
  nature: string;
  annualAmount: number;
  rebillable: boolean;
  rebillablePercent?: number;
  comment: string;
  document?: string;
}

export interface Asset {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  totalSurface: number;
  vacantSurface: number;
  acquisitionPrice: number;
  acquisitionDate: string;
  constructionYear: number;
  isCopropriete: boolean;
  lastWorks: string;
  annualRent: number;
  yield: number;
  riskScore: number;
  tenants: Tenant[];
  charges: Charge[];
  
  floors: { floor: number; type: string; surface: number; vacant: boolean }[];
}

export interface BrokerContact {
  name: string;
  company: string;
  email: string;
  phone: string;
}

export interface Deal {
  id: string;
  code: string;
  opportunity: string;
  stage: DealStage;
  status: DealStatus;
  dealStatus: DealFlowStatus;
  triEstimated: number;
  yield: number;
  priority: "Élevée" | "Moyenne" | "Faible";
  responsible: string;
  estimatedDate: string;
  score: number;
  amount: number;
  rejectReason?: string;
  keyStrengths?: string;
  daysInPipeline: number;
  assetType?: string;
  city?: string;
  address?: string;
  surface?: number;
  broker?: string;
  brokerContact?: BrokerContact;
  receptionDate?: string;
  annualRent?: number;
  rentPerSqm?: number;
  occupiedSurface?: number;
  capRate?: number;
  acquisitionFees?: number;
  charges?: number;
  capex?: number;
  holdingPeriod?: number;
  exitPrice?: number;
  imageUrl?: string;
}

export type DealStage = "Sourcing" | "Qualification" | "Éligible" | "Pré-analyse" | "LOI" | "Due Diligence" | "Comité" | "Closing";
export type DealStatus = "Éligible" | "Non éligible" | "En analyse";
export type DealFlowStatus = "Nouveau deal" | "En analyse" | "Étudié" | "Archivé";
export const DEAL_FLOW_STATUSES: DealFlowStatus[] = ["Nouveau deal", "En analyse", "Étudié", "Archivé"];

export const DEAL_STAGES: DealStage[] = ["Sourcing", "Qualification", "Éligible", "Pré-analyse", "LOI", "Due Diligence", "Comité", "Closing"];

export interface OpportunityTenant {
  name: string;
  startDate: string;
  endDate: string;
  leaseType: string;
  annualRent: number;
  indexation: string;
  walt: number;
  walb: number;
}

export interface InvestmentCapex {
  acquisitionPrice: number;
  estimatedFees: number;
  totalInvested: number;
  capexHistory: { year: string; amount: number; description: string }[];
  capexProjection: { year: string; amount: number; description: string }[];
}

export interface TriDetail {
  investmentSummary: number;
  capexHistorique: number;
  capexProjection: number;
  projectedRents: number;
  netCashflow: number;
  exitValueHypothesis: number;
}

export interface NewOpportunity {
  id: string;
  code: string;
  name: string;
  assetType: string;
  city: string;
  address: string;
  surface: number;
  askingPrice: number;
  currentRent: number;
  yieldRate: number;
  triEstimated: number;
  score: number;
  status: "Nouveau" | "En analyse";
  source: string;
  receptionDate: string;
  imageUrl?: string;
  keyFacts: {
    constructionYear: number;
    occupancyRate: number;
    walt: number;
    walb: number;
    mainTenant: string;
    indexation: string;
  };
  tenants: OpportunityTenant[];
  investment: InvestmentCapex;
  triDetail: TriDetail;
  aiSummary: string;
  strengths: string[];
  weaknesses: string[];
  analysisDecision: string;
  analysisDecisionStatus: "Positif" | "Négatif" | "Neutre";
  portfolioImpact: "Positif" | "Négatif";
  portfolioReasons: string[];
  globalSummary: string;
}

export const mockAssets: Asset[] = [
  {
    id: "a1",
    name: "Tour Montparnasse Office",
    address: "33 Avenue du Maine",
    city: "Paris 15e",
    type: "Bureau",
    totalSurface: 4200,
    vacantSurface: 380,
    acquisitionPrice: 18500000,
    acquisitionDate: "2019-03-15",
    constructionYear: 1973,
    isCopropriete: true,
    lastWorks: "Rénovation façade 2022",
    annualRent: 1260000,
    yield: 6.8,
    riskScore: 72,
    tenants: [
      { id: "t1", name: "Deloitte France", startDate: "2020-01-01", endDate: "2028-12-31", triennialDate: "2026-01-01", leaseType: "3/6/9", deposit: 85000, currentRent: 420000, index: "ILAT", indexRef: "Q3 2024", accompaniment: "Franchise 3 mois", chargesManagement: "Forfaitaire", unpaid: false, surface: 1400, floor: 12, siren: "434209797" },
      { id: "t2", name: "Mercer France", startDate: "2021-06-01", endDate: "2027-05-31", triennialDate: "2024-06-01", leaseType: "3/6/9", deposit: 62000, currentRent: 310000, index: "ILAT", indexRef: "Q3 2024", accompaniment: "Aucune", chargesManagement: "Réel", unpaid: false, surface: 1050, floor: 10, siren: "390589455" },
      { id: "t3", name: "StartupFlow SAS", startDate: "2023-01-01", endDate: "2025-12-31", triennialDate: "2025-01-01", leaseType: "Dérogatoire", deposit: 22000, currentRent: 130000, index: "ILC", indexRef: "Q2 2024", accompaniment: "Loyers progressifs", chargesManagement: "Forfaitaire", unpaid: true, unpaidAmount: 12500, surface: 420, floor: 8, siren: "912345678" },
      { id: "t4", name: "LegalTech Corp", startDate: "2022-03-01", endDate: "2031-02-28", triennialDate: "2025-03-01", leaseType: "3/6/9", deposit: 75000, currentRent: 400000, index: "ILAT", indexRef: "Q3 2024", accompaniment: "Travaux preneur 50k€", chargesManagement: "Réel", unpaid: false, surface: 950, floor: 11, siren: "823456789" },
    ],
    charges: [
      { id: "c1", nature: "Taxe foncière", annualAmount: 125000, rebillable: false, comment: "Augmentation +5% prévue" },
      { id: "c2", nature: "Charges copropriété", annualAmount: 210000, rebillable: true, rebillablePercent: 85, comment: "Inclut chauffage collectif" },
      { id: "c3", nature: "Assurance PNO", annualAmount: 32000, rebillable: false, comment: "" },
      { id: "c4", nature: "Gestion locative", annualAmount: 63000, rebillable: false, comment: "5% des loyers" },
      { id: "c5", nature: "Entretien technique", annualAmount: 48000, rebillable: true, rebillablePercent: 100, comment: "Contrat multi-technique" },
    ],
    credits: [],
    floors: [
      { floor: 8, type: "Bureau", surface: 420, vacant: false },
      { floor: 9, type: "Bureau", surface: 380, vacant: true },
      { floor: 10, type: "Bureau", surface: 1050, vacant: false },
      { floor: 11, type: "Bureau", surface: 950, vacant: false },
      { floor: 12, type: "Bureau", surface: 1400, vacant: false },
    ],
  },
  {
    id: "a2",
    name: "Carré Sénart Retail",
    address: "12 Boulevard de l'Europe",
    city: "Lieusaint 77",
    type: "Commerce",
    totalSurface: 2800,
    vacantSurface: 600,
    acquisitionPrice: 9200000,
    acquisitionDate: "2021-07-20",
    constructionYear: 2005,
    isCopropriete: false,
    lastWorks: "Ravalement 2023",
    annualRent: 620000,
    yield: 6.7,
    riskScore: 58,
    tenants: [
      { id: "t5", name: "Boulanger", startDate: "2021-09-01", endDate: "2030-08-31", triennialDate: "2027-09-01", leaseType: "3/6/9", deposit: 45000, currentRent: 280000, index: "ILC", indexRef: "Q3 2024", accompaniment: "Aucune", chargesManagement: "Réel", unpaid: false, surface: 1200, floor: 0, siren: "347384570" },
      { id: "t6", name: "Pharmacie du Centre", startDate: "2022-01-01", endDate: "2031-12-31", triennialDate: "2025-01-01", leaseType: "3/6/9", deposit: 35000, currentRent: 180000, index: "ILC", indexRef: "Q2 2024", accompaniment: "Franchise 2 mois", chargesManagement: "Forfaitaire", unpaid: false, surface: 600, floor: 0, siren: "451234567" },
      { id: "t7", name: "Fitness Park", startDate: "2023-06-01", endDate: "2032-05-31", triennialDate: "2026-06-01", leaseType: "3/6/9", deposit: 25000, currentRent: 160000, index: "ILC", indexRef: "Q3 2024", accompaniment: "Aucune", chargesManagement: "Réel", unpaid: true, unpaidAmount: 8200, surface: 400, floor: 1, siren: "327126827" },
    ],
    charges: [
      { id: "c6", nature: "Taxe foncière", annualAmount: 72000, rebillable: false, comment: "" },
      { id: "c7", nature: "Assurance PNO", annualAmount: 18000, rebillable: false, comment: "" },
      { id: "c8", nature: "Entretien espaces verts", annualAmount: 15000, rebillable: true, rebillablePercent: 100, comment: "" },
      { id: "c9", nature: "Gestion locative", annualAmount: 31000, rebillable: false, comment: "5% des loyers" },
    ],
    credits: [],
    floors: [
      { floor: 0, type: "Commerce", surface: 1800, vacant: false },
      { floor: 1, type: "Commerce/Sport", surface: 1000, vacant: false },
    ],
  },
  {
    id: "a3",
    name: "Résidence Les Jardins",
    address: "8 Rue des Lilas",
    city: "Lyon 6e",
    type: "Résidentiel",
    totalSurface: 1500,
    vacantSurface: 250,
    acquisitionPrice: 5800000,
    acquisitionDate: "2020-11-10",
    constructionYear: 1998,
    isCopropriete: true,
    lastWorks: "Isolation thermique 2021",
    annualRent: 348000,
    yield: 6.0,
    riskScore: 45,
    tenants: [
      { id: "t8", name: "Particulier - Dupont", startDate: "2021-01-01", endDate: "2024-12-31", triennialDate: "2024-01-01", leaseType: "Habitation", deposit: 3200, currentRent: 18000, index: "IRL", indexRef: "Q3 2024", accompaniment: "Aucune", chargesManagement: "Provisions", unpaid: false, surface: 75, floor: 2 },
      { id: "t9", name: "Particulier - Martin", startDate: "2022-06-01", endDate: "2025-05-31", triennialDate: "2025-06-01", leaseType: "Habitation", deposit: 4100, currentRent: 24000, index: "IRL", indexRef: "Q3 2024", accompaniment: "Aucune", chargesManagement: "Provisions", unpaid: true, unpaidAmount: 3600, surface: 95, floor: 3 },
    ],
    charges: [
      { id: "c10", nature: "Taxe foncière", annualAmount: 38000, rebillable: false, comment: "" },
      { id: "c11", nature: "Charges copropriété", annualAmount: 52000, rebillable: true, rebillablePercent: 70, comment: "" },
      { id: "c12", nature: "Assurance PNO", annualAmount: 8500, rebillable: false, comment: "" },
    ],
    credits: [],
    floors: [
      { floor: 0, type: "Commerce", surface: 200, vacant: true },
      { floor: 1, type: "Résidentiel", surface: 300, vacant: false },
      { floor: 2, type: "Résidentiel", surface: 350, vacant: false },
      { floor: 3, type: "Résidentiel", surface: 350, vacant: false },
      { floor: 4, type: "Résidentiel", surface: 300, vacant: true },
    ],
  },
  {
    id: "a4",
    name: "Campus Tech Sophia",
    address: "2400 Route des Dolines",
    city: "Sophia Antipolis 06",
    type: "Bureau",
    totalSurface: 6500,
    vacantSurface: 1200,
    acquisitionPrice: 22000000,
    acquisitionDate: "2018-05-22",
    constructionYear: 2010,
    isCopropriete: false,
    lastWorks: "Aucun récent",
    annualRent: 1750000,
    yield: 7.9,
    riskScore: 82,
    tenants: [
      { id: "t10", name: "SAP France", startDate: "2019-01-01", endDate: "2028-12-31", triennialDate: "2025-01-01", leaseType: "3/6/9", deposit: 200000, currentRent: 1200000, index: "ILAT", indexRef: "Q3 2024", accompaniment: "Aucune", chargesManagement: "Réel", unpaid: false, surface: 4000, floor: 1, siren: "379821994" },
      { id: "t11", name: "DataViz SAS", startDate: "2023-03-01", endDate: "2026-02-28", triennialDate: "2026-03-01", leaseType: "Dérogatoire", deposit: 45000, currentRent: 280000, index: "ILAT", indexRef: "Q2 2024", accompaniment: "Franchise 6 mois", chargesManagement: "Forfaitaire", unpaid: false, surface: 800, floor: 2, siren: "534567890" },
      { id: "t12", name: "BioTech Lab", startDate: "2022-09-01", endDate: "2025-08-31", triennialDate: "2025-09-01", leaseType: "3/6/9", deposit: 30000, currentRent: 270000, index: "ILAT", indexRef: "Q3 2024", accompaniment: "Travaux bailleur 80k€", chargesManagement: "Réel", unpaid: false, surface: 500, floor: 3, siren: "645678901" },
    ],
    charges: [
      { id: "c13", nature: "Taxe foncière", annualAmount: 165000, rebillable: false, comment: "" },
      { id: "c14", nature: "Assurance PNO", annualAmount: 42000, rebillable: false, comment: "" },
      { id: "c15", nature: "Entretien multi-technique", annualAmount: 95000, rebillable: true, rebillablePercent: 100, comment: "" },
      { id: "c16", nature: "Gestion locative", annualAmount: 87500, rebillable: false, comment: "5% des loyers" },
      { id: "c17", nature: "Sécurité / gardiennage", annualAmount: 56000, rebillable: true, rebillablePercent: 50, comment: "" },
    ],
    credits: [],
    floors: [
      { floor: 0, type: "Accueil / Services", surface: 500, vacant: false },
      { floor: 1, type: "Bureau", surface: 2000, vacant: false },
      { floor: 2, type: "Bureau", surface: 2000, vacant: false },
      { floor: 3, type: "Laboratoire", surface: 1000, vacant: false },
      { floor: 4, type: "Bureau", surface: 1000, vacant: true },
    ],
  },
  {
    id: "a5",
    name: "Entrepôt Logistique A4",
    address: "ZAC du Parc des Sablons",
    city: "Marne-la-Vallée 77",
    type: "Logistique",
    totalSurface: 12000,
    vacantSurface: 0,
    acquisitionPrice: 14200000,
    acquisitionDate: "2020-02-10",
    constructionYear: 2015,
    isCopropriete: false,
    lastWorks: "Mise aux normes ICPE 2023",
    annualRent: 1100000,
    yield: 7.7,
    riskScore: 35,
    tenants: [
      { id: "t13", name: "Geodis Logistics", startDate: "2020-04-01", endDate: "2032-03-31", triennialDate: "2026-04-01", leaseType: "3/6/9", deposit: 180000, currentRent: 720000, index: "ILAT", indexRef: "Q3 2024", accompaniment: "Aucune", chargesManagement: "Réel", unpaid: false, surface: 8000, floor: 0, siren: "383474825" },
      { id: "t14", name: "Amazon France Log", startDate: "2021-01-01", endDate: "2030-12-31", triennialDate: "2027-01-01", leaseType: "Ferme 9 ans", deposit: 95000, currentRent: 380000, index: "ILAT", indexRef: "Q3 2024", accompaniment: "Aucune", chargesManagement: "Triple net", unpaid: false, surface: 4000, floor: 0, siren: "487482018" },
    ],
    charges: [
      { id: "c18", nature: "Taxe foncière", annualAmount: 98000, rebillable: false, comment: "" },
      { id: "c19", nature: "Assurance PNO", annualAmount: 22000, rebillable: false, comment: "" },
      { id: "c20", nature: "Gestion locative", annualAmount: 55000, rebillable: false, comment: "5% des loyers" },
    ],
    credits: [],
    floors: [
      { floor: 0, type: "Entrepôt", surface: 11000, vacant: false },
      { floor: 1, type: "Bureaux annexes", surface: 1000, vacant: false },
    ],
  },
  {
    id: "a6",
    name: "Galerie Rivoli",
    address: "145 Rue de Rivoli",
    city: "Paris 1er",
    type: "Commerce",
    totalSurface: 850,
    vacantSurface: 0,
    acquisitionPrice: 12500000,
    acquisitionDate: "2017-09-01",
    constructionYear: 1885,
    isCopropriete: true,
    lastWorks: "Rénovation intérieure 2022",
    annualRent: 780000,
    yield: 6.2,
    riskScore: 28,
    tenants: [
      { id: "t15", name: "Sephora", startDate: "2018-01-01", endDate: "2030-12-31", triennialDate: "2027-01-01", leaseType: "3/6/9", deposit: 130000, currentRent: 520000, index: "ILC", indexRef: "Q3 2024", accompaniment: "Aucune", chargesManagement: "Réel", unpaid: false, surface: 550, floor: 0, siren: "393712286" },
      { id: "t16", name: "Maison Ladurée", startDate: "2019-06-01", endDate: "2028-05-31", triennialDate: "2025-06-01", leaseType: "3/6/9", deposit: 45000, currentRent: 260000, index: "ILC", indexRef: "Q3 2024", accompaniment: "Aucune", chargesManagement: "Forfaitaire", unpaid: false, surface: 300, floor: 0, siren: "775670284" },
    ],
    charges: [
      { id: "c21", nature: "Taxe foncière", annualAmount: 95000, rebillable: false, comment: "" },
      { id: "c22", nature: "Charges copropriété", annualAmount: 42000, rebillable: true, rebillablePercent: 80, comment: "" },
      { id: "c23", nature: "Assurance PNO", annualAmount: 15000, rebillable: false, comment: "" },
    ],
    credits: [],
    floors: [
      { floor: 0, type: "Commerce", surface: 850, vacant: false },
    ],
  },
  {
    id: "a7",
    name: "Parc d'Activités Euromed",
    address: "Boulevard de Dunkerque",
    city: "Marseille 2e",
    type: "Bureau",
    totalSurface: 3200,
    vacantSurface: 800,
    acquisitionPrice: 8900000,
    acquisitionDate: "2022-01-15",
    constructionYear: 2018,
    isCopropriete: false,
    lastWorks: "Aucun",
    annualRent: 580000,
    yield: 6.5,
    riskScore: 65,
    tenants: [
      { id: "t17", name: "CMA CGM Services", startDate: "2022-04-01", endDate: "2031-03-31", triennialDate: "2025-04-01", leaseType: "3/6/9", deposit: 70000, currentRent: 380000, index: "ILAT", indexRef: "Q3 2024", accompaniment: "Aucune", chargesManagement: "Réel", unpaid: false, surface: 1600, floor: 1, siren: "562024422" },
      { id: "t18", name: "Startup Medtech", startDate: "2023-09-01", endDate: "2026-08-31", triennialDate: "2026-09-01", leaseType: "Dérogatoire", deposit: 15000, currentRent: 200000, index: "ILAT", indexRef: "Q2 2024", accompaniment: "Franchise 3 mois", chargesManagement: "Forfaitaire", unpaid: false, surface: 800, floor: 2, siren: "923456781" },
    ],
    charges: [
      { id: "c24", nature: "Taxe foncière", annualAmount: 62000, rebillable: false, comment: "" },
      { id: "c25", nature: "Assurance PNO", annualAmount: 14000, rebillable: false, comment: "" },
      { id: "c26", nature: "Gestion locative", annualAmount: 29000, rebillable: false, comment: "5% des loyers" },
    ],
    credits: [],
    floors: [
      { floor: 0, type: "Hall / Services", surface: 400, vacant: false },
      { floor: 1, type: "Bureau", surface: 1600, vacant: false },
      { floor: 2, type: "Bureau", surface: 800, vacant: false },
      { floor: 3, type: "Bureau", surface: 400, vacant: true },
    ],
  },
  {
    id: "a8",
    name: "Retail Park Mérignac",
    address: "Avenue de la Somme",
    city: "Mérignac 33",
    type: "Commerce",
    totalSurface: 5500,
    vacantSurface: 950,
    acquisitionPrice: 11000000,
    acquisitionDate: "2019-11-20",
    constructionYear: 2008,
    isCopropriete: false,
    lastWorks: "Parking réfection 2023",
    annualRent: 820000,
    yield: 7.4,
    riskScore: 55,
    tenants: [
      { id: "t19", name: "Decathlon", startDate: "2020-01-01", endDate: "2029-12-31", triennialDate: "2026-01-01", leaseType: "3/6/9", deposit: 75000, currentRent: 420000, index: "ILC", indexRef: "Q3 2024", accompaniment: "Aucune", chargesManagement: "Réel", unpaid: false, surface: 2500, floor: 0, siren: "306138900" },
      { id: "t20", name: "Cultura", startDate: "2021-03-01", endDate: "2030-02-28", triennialDate: "2027-03-01", leaseType: "3/6/9", deposit: 40000, currentRent: 250000, index: "ILC", indexRef: "Q3 2024", accompaniment: "Aucune", chargesManagement: "Réel", unpaid: false, surface: 1200, floor: 0, siren: "410383626" },
      { id: "t21", name: "Action", startDate: "2023-01-01", endDate: "2032-12-31", triennialDate: "2026-01-01", leaseType: "3/6/9", deposit: 20000, currentRent: 150000, index: "ILC", indexRef: "Q2 2024", accompaniment: "Franchise 1 mois", chargesManagement: "Forfaitaire", unpaid: false, surface: 850, floor: 0, siren: "521809498" },
    ],
    charges: [
      { id: "c27", nature: "Taxe foncière", annualAmount: 88000, rebillable: false, comment: "" },
      { id: "c28", nature: "Assurance PNO", annualAmount: 20000, rebillable: false, comment: "" },
      { id: "c29", nature: "ASL / Charges communes", annualAmount: 65000, rebillable: true, rebillablePercent: 100, comment: "" },
      { id: "c30", nature: "Gestion locative", annualAmount: 41000, rebillable: false, comment: "5% des loyers" },
    ],
    credits: [],
    floors: [
      { floor: 0, type: "Commerce", surface: 5500, vacant: false },
    ],
  },
];

export const mockDeals: Deal[] = [
  { id: "d1", code: "EQ-2024-001", opportunity: "Immeuble Haussmann Opéra", stage: "Due Diligence", status: "Éligible", dealStatus: "En analyse", triEstimated: 8.2, yield: 6.8, priority: "Élevée", responsible: "A. Durand", estimatedDate: "2024-06-15", score: 85, amount: 14500000, keyStrengths: "Emplacement prime, loyers sécurisés", daysInPipeline: 45, assetType: "Bureau", city: "Paris 9e", address: "25 Boulevard Haussmann", surface: 3200, broker: "BNP Paribas RE", brokerContact: { name: "Jean Dupont", company: "BNP Paribas RE", email: "j.dupont@bnpre.fr", phone: "+33 1 42 56 78 90" }, receptionDate: "2026-03-03", annualRent: 986000, rentPerSqm: 308, occupiedSurface: 2800, capRate: 0.06, acquisitionFees: 1087500, holdingPeriod: 10 },
  { id: "d2", code: "EQ-2024-002", opportunity: "Entrepôt logistique A86", stage: "Pré-analyse", status: "En analyse", dealStatus: "Nouveau deal", triEstimated: 9.5, yield: 7.7, priority: "Moyenne", responsible: "M. Lefèvre", estimatedDate: "2024-08-01", score: 68, amount: 8200000, daysInPipeline: 22, assetType: "Logistique", city: "Créteil 94", address: "ZAC Europarc", surface: 9500, broker: "CBRE", brokerContact: { name: "Marie Leroy", company: "CBRE", email: "m.leroy@cbre.fr", phone: "+33 1 53 64 22 10" }, receptionDate: "2026-03-02", annualRent: 631400, rentPerSqm: 66, occupiedSurface: 9500, capRate: 0.075, acquisitionFees: 574000, holdingPeriod: 8 },
  { id: "d3", code: "EQ-2024-003", opportunity: "Retail Park Mérignac", stage: "Qualification", status: "Non éligible", dealStatus: "Archivé", triEstimated: 5.1, yield: 5.1, priority: "Faible", responsible: "S. Bernard", estimatedDate: "2024-07-10", score: 32, amount: 6700000, rejectReason: "Rendement insuffisant – marché saturé", daysInPipeline: 12, assetType: "Commerce", city: "Mérignac 33", address: "Avenue de la Somme", surface: 4200, broker: "Cushman & Wakefield", brokerContact: { name: "Paul Martin", company: "Cushman & Wakefield", email: "p.martin@cushwake.com", phone: "+33 1 43 65 98 20" }, receptionDate: "2026-02-10", annualRent: 341700, rentPerSqm: 81, occupiedSurface: 3300, capRate: 0.065, acquisitionFees: 502500, holdingPeriod: 10 },
  { id: "d4", code: "EQ-2024-004", opportunity: "Tour La Défense CBD", stage: "LOI", status: "Éligible", dealStatus: "En analyse", triEstimated: 7.8, yield: 6.5, priority: "Élevée", responsible: "A. Durand", estimatedDate: "2024-05-30", score: 78, amount: 32000000, keyStrengths: "Locataire investment grade, WALB 7 ans", daysInPipeline: 60, assetType: "Bureau", city: "Puteaux 92", address: "1 Place de la Défense", surface: 8500, broker: "JLL", brokerContact: { name: "Sophie Blanc", company: "JLL", email: "s.blanc@jll.com", phone: "+33 1 40 55 18 20" }, receptionDate: "2026-02-25", annualRent: 2080000, rentPerSqm: 245, occupiedSurface: 7800, capRate: 0.055, acquisitionFees: 2400000, holdingPeriod: 10 },
  { id: "d5", code: "EQ-2024-005", opportunity: "Résidence étudiante Bordeaux", stage: "Sourcing", status: "En analyse", dealStatus: "Nouveau deal", triEstimated: 6.3, yield: 5.8, priority: "Moyenne", responsible: "C. Moreau", estimatedDate: "2024-09-15", score: 55, amount: 4100000, daysInPipeline: 5, assetType: "Résidentiel", city: "Bordeaux 33", address: "12 Rue Sainte-Catherine", surface: 2100, broker: "Savills", brokerContact: { name: "Luc Renard", company: "Savills", email: "l.renard@savills.fr", phone: "+33 1 44 51 73 00" }, receptionDate: "2026-03-01", annualRent: 237800, rentPerSqm: 113, occupiedSurface: 1680, capRate: 0.055, acquisitionFees: 307500, holdingPeriod: 12 },
  { id: "d6", code: "EQ-2024-006", opportunity: "Bureau Flex Lyon Part-Dieu", stage: "Comité", status: "Éligible", dealStatus: "Étudié", triEstimated: 8.9, yield: 7.2, priority: "Élevée", responsible: "M. Lefèvre", estimatedDate: "2024-04-20", score: 91, amount: 11300000, keyStrengths: "Forte demande locative, rendement supérieur", daysInPipeline: 78, assetType: "Bureau", city: "Lyon 3e", address: "47 Boulevard Vivier Merle", surface: 4500, broker: "Colliers", brokerContact: { name: "Claire Dubois", company: "Colliers", email: "c.dubois@colliers.com", phone: "+33 4 72 60 89 00" }, receptionDate: "2025-12-15", annualRent: 813600, rentPerSqm: 181, occupiedSurface: 4050, capRate: 0.065, acquisitionFees: 847500, holdingPeriod: 10 },
  { id: "d7", code: "EQ-2024-007", opportunity: "Portefeuille Commerce Lille", stage: "Éligible", status: "Éligible", dealStatus: "En analyse", triEstimated: 7.1, yield: 6.4, priority: "Moyenne", responsible: "S. Bernard", estimatedDate: "2024-07-30", score: 72, amount: 19500000, keyStrengths: "Diversification géographique", daysInPipeline: 30, assetType: "Commerce", city: "Lille 59", address: "Centre commercial Grand Place", surface: 6800, broker: "Cushman & Wakefield", brokerContact: { name: "Paul Martin", company: "Cushman & Wakefield", email: "p.martin@cushwake.com", phone: "+33 1 43 65 98 20" }, receptionDate: "2026-02-01", annualRent: 1248000, rentPerSqm: 184, occupiedSurface: 6120, capRate: 0.06, acquisitionFees: 1462500, holdingPeriod: 10 },
  { id: "d8", code: "EQ-2024-008", opportunity: "Clinique privée Nantes", stage: "Closing", status: "Éligible", dealStatus: "Étudié", triEstimated: 7.5, yield: 6.9, priority: "Élevée", responsible: "A. Durand", estimatedDate: "2024-04-01", score: 88, amount: 7800000, keyStrengths: "Bail ferme 12 ans, indexation santé", daysInPipeline: 120, assetType: "Bureau", city: "Nantes 44", address: "15 Quai de la Fosse", surface: 2800, broker: "BNP Paribas RE", brokerContact: { name: "Jean Dupont", company: "BNP Paribas RE", email: "j.dupont@bnpre.fr", phone: "+33 1 42 56 78 90" }, receptionDate: "2025-11-01", annualRent: 538200, rentPerSqm: 192, occupiedSurface: 2800, capRate: 0.065, acquisitionFees: 585000, holdingPeriod: 12 },
  { id: "d9", code: "EQ-2024-009", opportunity: "Data Center Marseille", stage: "Qualification", status: "En analyse", dealStatus: "Nouveau deal", triEstimated: 10.2, yield: 8.5, priority: "Élevée", responsible: "C. Moreau", estimatedDate: "2024-10-01", score: 60, amount: 25000000, daysInPipeline: 8, assetType: "Data Center", city: "Marseille 16e", address: "Zone Euroméd", surface: 3500, broker: "CBRE", brokerContact: { name: "Marie Leroy", company: "CBRE", email: "m.leroy@cbre.fr", phone: "+33 1 53 64 22 10" }, receptionDate: "2026-03-04", annualRent: 2125000, rentPerSqm: 607, occupiedSurface: 3325, capRate: 0.07, acquisitionFees: 1625000, holdingPeriod: 10 },
  { id: "d10", code: "EQ-2024-010", opportunity: "Immeuble mixte Strasbourg", stage: "Pré-analyse", status: "Non éligible", dealStatus: "Archivé", triEstimated: 4.8, yield: 4.8, priority: "Faible", responsible: "M. Lefèvre", estimatedDate: "2024-08-15", score: 28, amount: 3200000, rejectReason: "Structure juridique complexe, risque amiante", daysInPipeline: 18, assetType: "Bureau", city: "Strasbourg 67", address: "Place Kléber", surface: 1800, broker: "Savills", brokerContact: { name: "Luc Renard", company: "Savills", email: "l.renard@savills.fr", phone: "+33 1 44 51 73 00" }, receptionDate: "2026-01-15", annualRent: 153600, rentPerSqm: 85, occupiedSurface: 1440, capRate: 0.055, acquisitionFees: 240000, holdingPeriod: 10 },
  { id: "d11", code: "EQ-2024-011", opportunity: "Parc Logistique Roissy", stage: "Due Diligence", status: "Éligible", dealStatus: "En analyse", triEstimated: 8.8, yield: 7.4, priority: "Élevée", responsible: "A. Durand", estimatedDate: "2024-07-20", score: 82, amount: 18700000, keyStrengths: "Proximité CDG, locataire AA", daysInPipeline: 35, assetType: "Logistique", city: "Roissy 95", address: "Zone Aéroportuaire", surface: 15000, broker: "JLL", brokerContact: { name: "Sophie Blanc", company: "JLL", email: "s.blanc@jll.com", phone: "+33 1 40 55 18 20" }, receptionDate: "2026-02-20", annualRent: 1383800, rentPerSqm: 92, occupiedSurface: 15000, capRate: 0.07, acquisitionFees: 1309000, holdingPeriod: 10 },
  { id: "d12", code: "EQ-2024-012", opportunity: "Hôtel particulier Marais", stage: "LOI", status: "Éligible", dealStatus: "Étudié", triEstimated: 6.9, yield: 5.9, priority: "Moyenne", responsible: "S. Bernard", estimatedDate: "2024-06-30", score: 74, amount: 9800000, keyStrengths: "Actif patrimonial prime, rareté", daysInPipeline: 52, assetType: "Bureau", city: "Paris 3e", address: "15 Rue des Francs-Bourgeois", surface: 1200, broker: "Knight Frank", brokerContact: { name: "Antoine Girard", company: "Knight Frank", email: "a.girard@knightfrank.com", phone: "+33 1 43 16 55 00" }, receptionDate: "2026-01-20", annualRent: 578200, rentPerSqm: 482, occupiedSurface: 1200, capRate: 0.05, acquisitionFees: 735000, holdingPeriod: 15 },
  { id: "d13", code: "EQ-2024-013", opportunity: "Campus Tertiaire Toulouse", stage: "Sourcing", status: "En analyse", dealStatus: "Nouveau deal", triEstimated: 7.6, yield: 6.2, priority: "Moyenne", responsible: "C. Moreau", estimatedDate: "2024-11-01", score: 58, amount: 15200000, daysInPipeline: 3, assetType: "Bureau", city: "Toulouse 31", address: "Labège Innopole", surface: 7200, broker: "Colliers", brokerContact: { name: "Claire Dubois", company: "Colliers", email: "c.dubois@colliers.com", phone: "+33 4 72 60 89 00" }, receptionDate: "2026-03-03", annualRent: 942400, rentPerSqm: 131, occupiedSurface: 5760, capRate: 0.06, acquisitionFees: 1140000, holdingPeriod: 10 },
  { id: "d14", code: "EQ-2024-014", opportunity: "Pied d'immeuble Rue de Rennes", stage: "Comité", status: "Éligible", dealStatus: "Étudié", triEstimated: 5.8, yield: 5.3, priority: "Élevée", responsible: "A. Durand", estimatedDate: "2024-05-15", score: 80, amount: 4500000, keyStrengths: "Flux piéton exceptionnel, bail ferme", daysInPipeline: 90, assetType: "Commerce", city: "Paris 6e", address: "78 Rue de Rennes", surface: 380, broker: "BNP Paribas RE", brokerContact: { name: "Jean Dupont", company: "BNP Paribas RE", email: "j.dupont@bnpre.fr", phone: "+33 1 42 56 78 90" }, receptionDate: "2025-12-01", annualRent: 238500, rentPerSqm: 628, occupiedSurface: 380, capRate: 0.045, acquisitionFees: 337500, holdingPeriod: 10 },
  { id: "d15", code: "EQ-2024-015", opportunity: "Résidence Seniors Nice", stage: "Éligible", status: "Éligible", dealStatus: "En analyse", triEstimated: 6.5, yield: 5.7, priority: "Moyenne", responsible: "M. Lefèvre", estimatedDate: "2024-09-30", score: 66, amount: 6200000, keyStrengths: "Demographie favorable Côte d'Azur", daysInPipeline: 20, assetType: "Résidentiel", city: "Nice 06", address: "Promenade des Anglais", surface: 3100, broker: "Savills", brokerContact: { name: "Luc Renard", company: "Savills", email: "l.renard@savills.fr", phone: "+33 1 44 51 73 00" }, receptionDate: "2026-02-15", annualRent: 353400, rentPerSqm: 114, occupiedSurface: 2790, capRate: 0.055, acquisitionFees: 465000, holdingPeriod: 12 },
  { id: "d16", code: "EQ-2024-016", opportunity: "Centre Commercial Régional Evry", stage: "Qualification", status: "En analyse", dealStatus: "Nouveau deal", triEstimated: 7.2, yield: 6.1, priority: "Moyenne", responsible: "S. Bernard", estimatedDate: "2024-10-15", score: 52, amount: 28000000, daysInPipeline: 10, assetType: "Commerce", city: "Evry 91", address: "Centre commercial Evry 2", surface: 12000, broker: "CBRE", brokerContact: { name: "Marie Leroy", company: "CBRE", email: "m.leroy@cbre.fr", phone: "+33 1 53 64 22 10" }, receptionDate: "2026-02-28", annualRent: 1708000, rentPerSqm: 142, occupiedSurface: 10800, capRate: 0.06, acquisitionFees: 2100000, holdingPeriod: 10 },
  { id: "d17", code: "EQ-2024-017", opportunity: "Portefeuille Bureaux Nanterre", stage: "Pré-analyse", status: "En analyse", dealStatus: "Nouveau deal", triEstimated: 8.1, yield: 6.8, priority: "Élevée", responsible: "A. Durand", estimatedDate: "2024-08-30", score: 70, amount: 21000000, daysInPipeline: 15, assetType: "Bureau", city: "Nanterre 92", address: "Terrasses de l'Arche", surface: 9000, broker: "JLL", brokerContact: { name: "Sophie Blanc", company: "JLL", email: "s.blanc@jll.com", phone: "+33 1 40 55 18 20" }, receptionDate: "2026-03-01", annualRent: 1428000, rentPerSqm: 159, occupiedSurface: 7650, capRate: 0.065, acquisitionFees: 1575000, holdingPeriod: 10 },
];

export const mockNewOpportunities: NewOpportunity[] = [
  {
    id: "no1", code: "NOP-2024-001", name: "Immeuble de bureaux Châtelet", assetType: "Bureau", city: "Paris 1er", address: "15 Rue de Rivoli", surface: 2800, askingPrice: 16200000, currentRent: 980000, yieldRate: 6.0, triEstimated: 7.4, score: 78, status: "En analyse", source: "BNP Paribas RE", receptionDate: "2024-04-15",
    keyFacts: { constructionYear: 2001, occupancyRate: 92, walt: 5.2, walb: 3.8, mainTenant: "Ernst & Young", indexation: "ILAT" },
    tenants: [
      { name: "Ernst & Young", startDate: "2020-01-01", endDate: "2029-12-31", leaseType: "3/6/9", annualRent: 620000, indexation: "ILAT", walt: 5.8, walb: 3.8 },
      { name: "Cabinet Mazars", startDate: "2021-06-01", endDate: "2027-05-31", leaseType: "3/6/9", annualRent: 240000, indexation: "ILAT", walt: 3.2, walb: 2.1 },
      { name: "StartupFlow SAS", startDate: "2023-03-01", endDate: "2026-02-28", leaseType: "Dérogatoire", annualRent: 120000, indexation: "ILC", walt: 1.8, walb: 1.8 },
    ],
    investment: { acquisitionPrice: 16200000, estimatedFees: 1134000, totalInvested: 17334000, capexHistory: [{ year: "2022", amount: 180000, description: "Rénovation hall d'entrée" }], capexProjection: [{ year: "2026", amount: 350000, description: "Rafraîchissement plateaux" }, { year: "2029", amount: 520000, description: "Mise aux normes ESG" }] },
    triDetail: { investmentSummary: 17334000, capexHistorique: 180000, capexProjection: 870000, projectedRents: 10200000, netCashflow: 8950000, exitValueHypothesis: 17800000 },
    aiSummary: "Actif de bureau prime en cœur de Paris avec un locataire de premier plan (EY). Le rendement de 6.0% est au-dessus du cap rate marché bureaux Paris QCA. La WALT de 5.2 ans offre une visibilité correcte.",
    strengths: ["Emplacement prime Châtelet", "Locataire investment grade (EY)", "Rendement supérieur au marché QCA", "Faible capex prévisible"],
    weaknesses: ["Break locataire EY dans 3.8 ans", "Vacance résiduelle 8%", "Prix au m² élevé", "Copropriété"],
    analysisDecision: "Opportunité intéressante à approfondir.", analysisDecisionStatus: "Positif",
    portfolioImpact: "Positif", portfolioReasons: ["Renforce l'exposition Paris QCA", "Améliore le rendement moyen"],
    globalSummary: "Actif éligible au pipeline – recommandation d'intégration en étape Qualification.",
  },
  {
    id: "no2", code: "NOP-2024-002", name: "Entrepôt XXL Sénart", assetType: "Logistique", city: "Sénart 77", address: "ZAC de la Pyramide", surface: 22000, askingPrice: 19800000, currentRent: 1650000, yieldRate: 8.3, triEstimated: 9.1, score: 85, status: "Nouveau", source: "CBRE", receptionDate: "2024-05-02",
    keyFacts: { constructionYear: 2019, occupancyRate: 100, walt: 7.5, walb: 4.5, mainTenant: "XPO Logistics", indexation: "ILAT" },
    tenants: [
      { name: "XPO Logistics", startDate: "2019-09-01", endDate: "2031-08-31", leaseType: "Ferme 12 ans", annualRent: 1650000, indexation: "ILAT", walt: 7.5, walb: 4.5 },
    ],
    investment: { acquisitionPrice: 19800000, estimatedFees: 1386000, totalInvested: 21186000, capexHistory: [], capexProjection: [{ year: "2027", amount: 280000, description: "Maintenance toiture et quais" }] },
    triDetail: { investmentSummary: 21186000, capexHistorique: 0, capexProjection: 280000, projectedRents: 17200000, netCashflow: 16920000, exitValueHypothesis: 21500000 },
    aiSummary: "Plateforme logistique de dernière génération occupée à 100% par XPO Logistics. TRI exceptionnel de 9.1% avec bail ferme résiduel de 4.5 ans.",
    strengths: ["TRI exceptionnel à 9.1%", "100% occupé", "Bâtiment dernière génération", "Accès autoroutier direct"],
    weaknesses: ["Monolocataire", "Marché logistique compétitif", "WALB 4.5 ans"],
    analysisDecision: "Opportunité prioritaire.", analysisDecisionStatus: "Positif",
    portfolioImpact: "Positif", portfolioReasons: ["Diversification logistique", "Améliore le TRI portefeuille"],
    globalSummary: "Intégration immédiate recommandée au Deal Flow.",
  },
  {
    id: "no3", code: "NOP-2024-003", name: "Retail Park Avenue de Flandre", assetType: "Commerce", city: "Dunkerque 59", address: "Avenue de Flandre, ZC Les Dunes", surface: 4800, askingPrice: 5900000, currentRent: 420000, yieldRate: 7.1, triEstimated: 5.8, score: 38, status: "En analyse", source: "Cushman & Wakefield", receptionDate: "2024-05-18",
    keyFacts: { constructionYear: 2003, occupancyRate: 78, walt: 3.1, walb: 1.2, mainTenant: "Kiabi", indexation: "ILC" },
    tenants: [
      { name: "Kiabi", startDate: "2020-03-01", endDate: "2026-02-28", leaseType: "3/6/9", annualRent: 190000, indexation: "ILC", walt: 1.8, walb: 1.2 },
      { name: "Centrakor", startDate: "2021-01-01", endDate: "2027-12-31", leaseType: "3/6/9", annualRent: 130000, indexation: "ILC", walt: 3.8, walb: 2.5 },
      { name: "La Halle", startDate: "2022-06-01", endDate: "2028-05-31", leaseType: "3/6/9", annualRent: 100000, indexation: "ILC", walt: 4.2, walb: 1.8 },
    ],
    investment: { acquisitionPrice: 5900000, estimatedFees: 413000, totalInvested: 6313000, capexHistory: [{ year: "2023", amount: 95000, description: "Réfection parking" }], capexProjection: [{ year: "2025", amount: 250000, description: "Ravalement façade" }] },
    triDetail: { investmentSummary: 6313000, capexHistorique: 95000, capexProjection: 250000, projectedRents: 4380000, netCashflow: 3835000, exitValueHypothesis: 5200000 },
    aiSummary: "Retail park de périphérie en zone secondaire avec une vacance de 22%. Mix enseignes moyen avec forte dépendance à Kiabi. TRI de 5.8% insuffisant au regard du risque.",
    strengths: ["Prix au m² attractif", "Parking 180 places"],
    weaknesses: ["Vacance de 22%", "WALB très court", "Zone en déclin", "TRI insuffisant vs risque"],
    analysisDecision: "Non éligible. Profil risque/rendement défavorable.", analysisDecisionStatus: "Négatif",
    portfolioImpact: "Négatif", portfolioReasons: ["Augmenterait la vacance moyenne", "Rendement insuffisant"],
    globalSummary: "Rejet recommandé.",
  },
  {
    id: "no4", code: "NOP-2024-004", name: "Pied d'immeuble Faubourg Saint-Honoré", assetType: "Commerce", city: "Paris 8e", address: "78 Rue du Faubourg Saint-Honoré", surface: 320, askingPrice: 8500000, currentRent: 480000, yieldRate: 5.6, triEstimated: 5.6, score: 72, status: "Nouveau", source: "Knight Frank", receptionDate: "2024-04-28",
    keyFacts: { constructionYear: 1920, occupancyRate: 100, walt: 6.8, walb: 3.8, mainTenant: "Maison de luxe (confidentiel)", indexation: "ILC" },
    tenants: [
      { name: "Maison de luxe (confidentiel)", startDate: "2019-01-01", endDate: "2031-12-31", leaseType: "3/6/9", annualRent: 480000, indexation: "ILC", walt: 6.8, walb: 3.8 },
    ],
    investment: { acquisitionPrice: 8500000, estimatedFees: 595000, totalInvested: 9095000, capexHistory: [], capexProjection: [{ year: "2028", amount: 120000, description: "Ravalement façade" }] },
    triDetail: { investmentSummary: 9095000, capexHistorique: 0, capexProjection: 120000, projectedRents: 5000000, netCashflow: 4880000, exitValueHypothesis: 9500000 },
    aiSummary: "Murs de boutique de luxe sur l'un des axes les plus prisés de Paris. Locataire solide avec bail ferme résiduel. TRI de 5.6% compensé par le caractère patrimonial.",
    strengths: ["Emplacement trophy", "Locataire luxe solide", "Bail ferme 3.8 ans", "Actif patrimonial"],
    weaknesses: ["TRI modeste", "Prix unitaire élevé", "Surface limitée"],
    analysisDecision: "Intéressant pour stratégie patrimoniale.", analysisDecisionStatus: "Positif",
    portfolioImpact: "Positif", portfolioReasons: ["Actif trophy", "Revenus sécurisés long terme"],
    globalSummary: "Éligible pour les stratégies patrimoniales / core.",
  },
  {
    id: "no5", code: "NOP-2024-005", name: "Programme neuf résidentiel Villeurbanne", assetType: "Résidentiel", city: "Villeurbanne 69", address: "42 Cours Emile Zola", surface: 3800, askingPrice: 9200000, currentRent: 0, yieldRate: 4.5, triEstimated: 5.2, score: 45, status: "En analyse", source: "Savills", receptionDate: "2024-06-01",
    keyFacts: { constructionYear: 2025, occupancyRate: 0, walt: 0, walb: 0, mainTenant: "Aucun (VEFA)", indexation: "IRL" },
    tenants: [],
    investment: { acquisitionPrice: 9200000, estimatedFees: 644000, totalInvested: 9844000, capexHistory: [], capexProjection: [] },
    triDetail: { investmentSummary: 9844000, capexHistorique: 0, capexProjection: 0, projectedRents: 5520000, netCashflow: 5520000, exitValueHypothesis: 9800000 },
    aiSummary: "Programme VEFA résidentiel de 48 logements. Pas de pré-commercialisation locative. TRI estimé à 5.2% sur hypothèses de marché. Risque de développement.",
    strengths: ["Forte demande locative", "Neuf – faible maintenance", "Dispositif fiscal potentiel"],
    weaknesses: ["Aucun revenu actuel", "TRI hypothétique", "Risque planning", "Rendement structurellement bas"],
    analysisDecision: "Non prioritaire. Risque de développement significatif.", analysisDecisionStatus: "Neutre",
    portfolioImpact: "Négatif", portfolioReasons: ["Aucun revenu immédiat", "TRI sous cible fonds"],
    globalSummary: "Mise en veille – revoir à la livraison.",
  },
  {
    id: "no6", code: "NOP-2024-006", name: "Centre de données Tier III Pantin", assetType: "Logistique", city: "Pantin 93", address: "12 Avenue Edouard Vaillant", surface: 4200, askingPrice: 28000000, currentRent: 2400000, yieldRate: 8.6, triEstimated: 9.8, score: 82, status: "Nouveau", source: "JLL", receptionDate: "2024-05-10",
    keyFacts: { constructionYear: 2021, occupancyRate: 95, walt: 8.2, walb: 5.2, mainTenant: "Equinix", indexation: "ILAT" },
    tenants: [
      { name: "Equinix", startDate: "2021-06-01", endDate: "2033-05-31", leaseType: "Ferme 12 ans", annualRent: 2100000, indexation: "ILAT", walt: 8.2, walb: 5.2 },
      { name: "OVHcloud", startDate: "2022-01-01", endDate: "2028-12-31", leaseType: "3/6/9", annualRent: 300000, indexation: "ILAT", walt: 4.8, walb: 3.2 },
    ],
    investment: { acquisitionPrice: 28000000, estimatedFees: 1960000, totalInvested: 29960000, capexHistory: [], capexProjection: [{ year: "2028", amount: 800000, description: "Upgrade infrastructure électrique" }] },
    triDetail: { investmentSummary: 29960000, capexHistorique: 0, capexProjection: 800000, projectedRents: 25000000, netCashflow: 24200000, exitValueHypothesis: 31000000 },
    aiSummary: "Data center Tier III avec Equinix comme locataire principal. TRI exceptionnel de 9.8% avec WALT de 8.2 ans. Actif rare et stratégique.",
    strengths: ["TRI exceptionnel", "Locataire Equinix", "WALT longue", "Croissance structurelle"],
    weaknesses: ["Ticket élevé (28 M€)", "Risque obsolescence techno", "Coûts énergétiques volatils"],
    analysisDecision: "Opportunité prioritaire.", analysisDecisionStatus: "Positif",
    portfolioImpact: "Positif", portfolioReasons: ["Diversification sectorielle", "Améliore le TRI", "Revenus long terme"],
    globalSummary: "Intégration immédiate recommandée.",
  },
  {
    id: "no7", code: "NOP-2024-007", name: "Bureaux flexibles Gare de Lyon", assetType: "Bureau", city: "Paris 12e", address: "3 Place Henri Frenay", surface: 1800, askingPrice: 7400000, currentRent: 520000, yieldRate: 7.0, triEstimated: 7.0, score: 65, status: "En analyse", source: "Colliers", receptionDate: "2024-05-25",
    keyFacts: { constructionYear: 2016, occupancyRate: 88, walt: 3.5, walb: 2.0, mainTenant: "WeWork", indexation: "ILAT" },
    tenants: [
      { name: "WeWork", startDate: "2020-01-01", endDate: "2026-12-31", leaseType: "3/6/9", annualRent: 380000, indexation: "ILAT", walt: 2.8, walb: 2.0 },
      { name: "Startup Tech", startDate: "2023-06-01", endDate: "2026-05-31", leaseType: "Dérogatoire", annualRent: 140000, indexation: "ILAT", walt: 2.2, walb: 2.2 },
    ],
    investment: { acquisitionPrice: 7400000, estimatedFees: 518000, totalInvested: 7918000, capexHistory: [{ year: "2023", amount: 150000, description: "Aménagement flex" }], capexProjection: [{ year: "2027", amount: 300000, description: "Rénovation plateaux" }] },
    triDetail: { investmentSummary: 7918000, capexHistorique: 150000, capexProjection: 300000, projectedRents: 5420000, netCashflow: 4970000, exitValueHypothesis: 7800000 },
    aiSummary: "Bureaux exploités en flex par WeWork près de la Gare de Lyon. Rendement de 7% correct mais dépendance à WeWork. Vacance de 12% à surveiller.",
    strengths: ["Localisation Gare de Lyon", "Immeuble récent", "Rendement correct"],
    weaknesses: ["Dépendance WeWork", "WALB court", "Vacance 12%"],
    analysisDecision: "À suivre avec prudence.", analysisDecisionStatus: "Neutre",
    portfolioImpact: "Positif", portfolioReasons: ["Exposition Paris intra-muros", "Diversification flex"],
    globalSummary: "En veille active – conditionné à la renégociation WeWork.",
  },
  {
    id: "no8", code: "NOP-2024-008", name: "Portefeuille résidentiel Rennes", assetType: "Résidentiel", city: "Rennes 35", address: "Multisites – centre-ville", surface: 4500, askingPrice: 11500000, currentRent: 690000, yieldRate: 6.0, triEstimated: 6.0, score: 60, status: "Nouveau", source: "Savills", receptionDate: "2024-06-05",
    keyFacts: { constructionYear: 1995, occupancyRate: 96, walt: 2.8, walb: 1.5, mainTenant: "Divers particuliers", indexation: "IRL" },
    tenants: [
      { name: "Divers particuliers (62 lots)", startDate: "2020-01-01", endDate: "2026-12-31", leaseType: "Habitation", annualRent: 690000, indexation: "IRL", walt: 2.8, walb: 1.5 },
    ],
    investment: { acquisitionPrice: 11500000, estimatedFees: 805000, totalInvested: 12305000, capexHistory: [{ year: "2022", amount: 220000, description: "Ravalement 2 immeubles" }], capexProjection: [{ year: "2026", amount: 380000, description: "Rénovation parties communes" }, { year: "2029", amount: 450000, description: "Mise aux normes DPE" }] },
    triDetail: { investmentSummary: 12305000, capexHistorique: 220000, capexProjection: 830000, projectedRents: 7200000, netCashflow: 6150000, exitValueHypothesis: 12000000 },
    aiSummary: "Portefeuille de 62 logements en centre-ville de Rennes. Taux d'occupation élevé (96%). Dynamique démographique forte. Maintenance à prévoir.",
    strengths: ["Taux d'occupation 96%", "Dynamique démographique", "Mutualisation risque locatif"],
    weaknesses: ["Rendement modeste", "Maintenance à anticiper", "WALB court", "Gestion intensive"],
    analysisDecision: "Correcte pour stratégie résidentielle défensive.", analysisDecisionStatus: "Positif",
    portfolioImpact: "Positif", portfolioReasons: ["Diversification géographique", "Mutualisation du risque"],
    globalSummary: "Éligible sous conditions de confirmation de la stratégie résidentielle.",
  },
];
