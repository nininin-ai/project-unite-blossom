import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCHEMAS: Record<string, { system: string; fields: string }> = {
  quittance: {
    system: "Tu es un expert en immobilier. Extrais les données d'une quittance de loyer.",
    fields: `{
      "loyer_mensuel": number|null,
      "charges_locatives": number|null,
      "impaye": boolean,
      "montant_impaye": number|null,
      "locataire_nom": string|null,
      "locataire_siren": string|null,
      "periode": string|null
    }`,
  },
  bail: {
    system: "Tu es un expert en immobilier. Extrais les données d'un bail commercial ou d'habitation.",
    fields: `{
      "locataire_nom": string|null,
      "locataire_siren": string|null,
      "date_debut": string|null (format YYYY-MM-DD),
      "date_fin": string|null (format YYYY-MM-DD),
      "duree_ferme_mois": number|null,
      "loyer_annuel_initial": number|null,
      "indice_indexation": "ILC"|"ILAT"|"ICC"|null,
      "frequence_revision": string|null,
      "depot_garantie": number|null,
      "franchise_loyer_mois": number|null,
      "franchise_loyer_montant": number|null,
      "surface_contractuelle_m2": number|null,
      "destination_locaux": string|null,
      "charges_recuperables": number|null,
      "charges_non_recuperables": number|null,
      "caution_garant": string|null,
      "caution_montant": number|null
    }`,
  },
  charges: {
    system: "Tu es un expert en immobilier. Extrais les données d'un relevé de charges.",
    fields: `{
      "montant_total_charges": number|null,
      "periode_couverte": string|null,
      "charges_recuperables": number|null,
      "charges_non_recuperables": number|null,
      "honoraires_gestion": number|null,
      "assurance_pno": number|null,
      "teom": number|null,
      "charges_copropriete": number|null,
      "charges_travaux": number|null
    }`,
  },
  taxe_fonciere: {
    system: "Tu es un expert en immobilier. Extrais les données d'un avis de taxe foncière.",
    fields: `{
      "montant_taxe_fonciere": number|null,
      "annee_imposition": number|null
    }`,
  },
  amortissement: {
    system: "Tu es un expert en immobilier. Extrais les données d'un tableau d'amortissement de prêt immobilier.",
    fields: `{
      "capital_emprunte": number|null,
      "capital_restant_du": number|null,
      "taux_interet": number|null,
      "mensualite": number|null,
      "date_premiere_echeance": string|null (format YYYY-MM-DD),
      "date_derniere_echeance": string|null (format YYYY-MM-DD),
      "etablissement_preteur": string|null
    }`,
  },
  acte_vente: {
    system: "Tu es un expert en immobilier. Extrais les données d'un acte de vente immobilier.",
    fields: `{
      "adresse": string|null,
      "etages": [{"nom": string, "niveau": number, "surface_m2": number}]|null,
      "surface_globale_m2": number|null,
      "type_usage": string|null,
      "date_acquisition": string|null (format YYYY-MM-DD),
      "prix_acquisition_net_vendeur": number|null,
      "credit_taux": number|null,
      "credit_capital_emprunte": number|null,
      "credit_etablissement_preteur": string|null,
      "locataire_en_place": string|null,
      "loyer_annuel_mentionne": number|null,
      "date_fin_bail": string|null (format YYYY-MM-DD)
    }`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { base64, mimeType, docType, assetName } = await req.json();

    const schema = SCHEMAS[docType];
    if (!schema) {
      return new Response(JSON.stringify({ error: "Type de document non supporté" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Clé API manquante" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Analyse ce document pour l'actif "${assetName}". Extrais les données au format JSON suivant. Renvoie UNIQUEMENT le JSON, sans texte autour.\n\nFormat attendu:\n${schema.fields}`;

    const messages: any[] = [
      { role: "system", content: schema.system },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", errText);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Clean markdown code blocks
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let extracted;
    try {
      extracted = JSON.parse(content);
    } catch {
      return new Response(JSON.stringify({ error: "Impossible de parser la réponse IA", raw: content }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ extracted, docType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
