

# Plan de fusion : "Mon parc immo VF" + "Remix of Deal Flow V1"

## Analyse des deux projets

**Mon parc immo VF** -- Gestion du parc immobilier existant
- Pages : Dashboard, Assets, AssetDetail, Arbitrage
- Composants : ExcelImport, Layout, NavLink
- Données : mockData.ts, marketData.ts
- Deps spécifiques : `xlsx` (import Excel)

**Remix of Deal Flow V1** -- Pipeline d'opportunités d'investissement
- Pages : DealFlow, InvestmentCommittee, Opportunities, OpportunityDetail (+ pages non utilisées dans les routes : Dashboard, Assets, AssetDetail, Arbitrage, ExecutiveOverview)
- Composants : DealMap, Layout, NavLink
- Données : mockData.ts
- Deps spécifiques : `leaflet`, `@types/leaflet`, `jspdf` (carte + export PDF)

Les deux projets partagent le meme design system (couleurs EquimmoX vertes, sidebar, badges) et la meme stack technique.

## Strategie de fusion

**Base** : "Mon parc immo VF" sera le projet principal (gestion de parc = coeur metier). On y ajoute les fonctionnalites Deal Flow.

### Etape 1 -- Setup des dependances
Ajouter au projet actuel les deps manquantes des deux projets :
- `framer-motion`, `xlsx`, `leaflet`, `@types/leaflet`, `jspdf`

### Etape 2 -- Copier les assets
- Logo depuis "Mon parc immo VF" (`logo-equimmox.png`)
- Logo depuis "Deal Flow" si different (`logo_equimmox.png`)

### Etape 3 -- Copier les donnees
- `src/data/mockData.ts` depuis "Mon parc immo VF"
- `src/data/marketData.ts` depuis "Mon parc immo VF"
- `src/data/dealFlowData.ts` (renomme depuis mockData.ts de Deal Flow pour eviter le conflit)

### Etape 4 -- Copier les pages
Depuis **Mon parc immo VF** :
- Dashboard.tsx, Assets.tsx, AssetDetail.tsx, Arbitrage.tsx

Depuis **Remix of Deal Flow V1** :
- DealFlow.tsx, InvestmentCommittee.tsx, Opportunities.tsx, OpportunityDetail.tsx

Les pages en doublon (Dashboard, Assets, etc. dans Deal Flow) seront ignorees car non utilisees dans ses routes.

### Etape 5 -- Copier les composants metier
- `ExcelImport.tsx` depuis Mon parc immo VF
- `DealMap.tsx` depuis Deal Flow
- Ne PAS copier les composants `ui/` (identiques)

### Etape 6 -- Creer le Layout unifie
Un seul Layout.tsx avec la navigation combinee :
- Dashboard Parc (/)
- Parc Immobilier (/assets)
- Arbitrage Parc (/arbitrage)
- Deal Flow (/deals)
- Nouvelle Opportunite (/opportunities)

### Etape 7 -- Configurer le routeur (App.tsx)
```text
/               → Dashboard
/assets         → Assets
/assets/:id     → AssetDetail
/arbitrage      → Arbitrage
/deals          → DealFlow
/deals/:id      → InvestmentCommittee
/opportunities  → Opportunities
/opportunities/:id → OpportunityDetail
```

### Etape 8 -- Appliquer le design system
Utiliser le `index.css` de "Mon parc immo VF" comme base (plus complet avec les utility classes partagees). Les deux sont quasi identiques.

## Points de vigilance
- Les deux `mockData.ts` seront renommes pour eviter les conflits
- Les imports dans les pages Deal Flow devront etre mis a jour pour pointer vers `dealFlowData.ts`
- Un seul logo sera utilise (celui de Mon parc immo VF)

## Volume estime
~15-20 fichiers a creer/modifier. Aucune recreation de fonctionnalite, juste du copier-integrer.

