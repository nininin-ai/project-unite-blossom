import assetBureau from "@/assets/asset-bureau.jpg";
import assetLogistique from "@/assets/asset-logistique.jpg";
import assetCommerce from "@/assets/asset-commerce.jpg";
import assetMixte from "@/assets/asset-mixte.jpg";

const imageMap: Record<string, string> = {
  bureau: assetBureau,
  bureaux: assetBureau,
  logistique: assetLogistique,
  commerce: assetCommerce,
  retail: assetCommerce,
  mixte: assetMixte,
};

export function getAssetImage(assetType?: string): string {
  if (!assetType) return assetBureau;
  const key = assetType.toLowerCase();
  for (const [keyword, img] of Object.entries(imageMap)) {
    if (key.includes(keyword)) return img;
  }
  return assetBureau;
}
