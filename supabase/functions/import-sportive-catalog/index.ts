import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface ExtractedProduct {
  codigo: string;
  nome: string;
  cor: string | null;
  aplicacoes: string[];
}

async function extractProductsFromPage(
  pageMarkdown: string,
  apiKey: string
): Promise<ExtractedProduct[]> {
  const prompt = `Analyze this motorcycle parts catalog page and extract ALL product codes.

For each product code found, return:
- codigo: the product code (e.g. "007 1003") - keep spaces as-is
- nome: the part type name in Portuguese (e.g. "BICO FRONTAL", "PARALAMA DIANTEIRO", "CARENAGEM DO FAROL")
- cor: the color if available (e.g. "AMARELO", "AZUL METÁLICO"), null if not specified
- aplicacoes: array of motorcycle model + year strings (e.g. ["BIZ 100 1998/99", "BIZ 125 2006"])

Important rules:
- Extract EVERY code that matches the pattern of 3 digits + space + 4 digits (e.g. "007 1003", "061 0004", "168 1014")
- Also extract codes with letter suffix like "061 0011A", "140 1052C"
- Each code is a SEPARATE product entry
- In tables with multiple CÓDIGO columns, each column corresponds to a different part type listed in the header above
- Codes that appear as annotations like "(PRETA)" or "(PRATA FOSCO)" after a code are color notes, NOT separate codes
- Do NOT include codes from image references or page numbers
- The motorcycle model comes from the page header (e.g. "# 100 - BIZ (1998 a 2005)")

Return ONLY a valid JSON array, no other text. Example:
[{"codigo":"007 1003","nome":"BICO FRONTAL","cor":"AMARELO","aplicacoes":["BIZ 100 1998/99"]}]

If no products found, return []

Page content:
${pageMarkdown}`;

  try {
    const res = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      console.error(`AI Gateway error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response (may be wrapped in ```json ... ```)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in AI response");
      return [];
    }

    const products = JSON.parse(jsonMatch[0]);
    return products.filter(
      (p: any) => p.codigo && typeof p.codigo === "string" && p.codigo.match(/\d{3}\s?\d{4}/)
    );
  } catch (e) {
    console.error("Error extracting products:", e);
    return [];
  }
}

function splitIntoPages(markdown: string): string[] {
  // Split by "## Page X" headers
  const pages = markdown.split(/## Page \d+/).filter((p) => p.trim().length > 50);
  return pages;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { markdown, page_index } = await req.json();

    if (!markdown) {
      return new Response(
        JSON.stringify({ error: "markdown is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If page_index is provided, process just that page
    // Otherwise, split and process all pages
    let pages: string[];
    if (typeof page_index === "number") {
      pages = [markdown]; // Already a single page
    } else {
      pages = splitIntoPages(markdown);
    }

    console.log(`Processing ${pages.length} page(s)`);

    let totalProducts = 0;
    const allProducts: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      // Skip image-only sections and very short pages
      if (page.length < 100) continue;
      
      // Remove image references to reduce token usage
      const cleanPage = page
        .split("\n")
        .filter((line) => !line.includes("parsed-documents://") && !line.includes("(full page screenshot)"))
        .join("\n");

      if (cleanPage.trim().length < 50) continue;

      console.log(`Processing page ${i + 1}/${pages.length} (${cleanPage.length} chars)`);

      try {
        const products = await extractProductsFromPage(cleanPage, apiKey);
        console.log(`Page ${i + 1}: found ${products.length} products`);

        for (const product of products) {
          // Normalize code - remove spaces for codigo_cpl
          const codigoCpl = `SPT-${product.codigo.replace(/\s/g, "")}`;

          allProducts.push({
            codigo_cpl: codigoCpl,
            nome: product.nome || "PEÇA SPORTIVE",
            marca: "SPORTIVE",
            categoria: "CARENAGEM/PLÁSTICO",
            cor: product.cor || null,
            aplicacoes: product.aplicacoes || [],
            fornecedor: "SPORTIVE",
          });
        }

        totalProducts += products.length;
      } catch (err) {
        const msg = `Error on page ${i + 1}: ${err instanceof Error ? err.message : "unknown"}`;
        console.error(msg);
        errors.push(msg);
      }

      // Small delay between API calls to avoid rate limiting
      if (i < pages.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Deduplicate by codigo_cpl - merge aplicacoes
    const deduped = new Map<string, any>();
    for (const p of allProducts) {
      if (deduped.has(p.codigo_cpl)) {
        const existing = deduped.get(p.codigo_cpl);
        // Merge aplicacoes
        const mergedApps = [...new Set([...existing.aplicacoes, ...p.aplicacoes])];
        existing.aplicacoes = mergedApps;
        // Keep the first non-null cor
        if (!existing.cor && p.cor) existing.cor = p.cor;
      } else {
        deduped.set(p.codigo_cpl, { ...p });
      }
    }

    const uniqueProducts = Array.from(deduped.values());
    console.log(`Total unique products: ${uniqueProducts.length}`);

    // Upsert into catalogo_master in batches of 50
    let inserted = 0;
    for (let i = 0; i < uniqueProducts.length; i += 50) {
      const batch = uniqueProducts.slice(i, i + 50).map((p) => ({
        codigo: p.codigo_cpl,
        nome: p.nome,
        marca: p.marca || "SPORTIVE",
        categoria: p.categoria,
        imagem_url: null,
        aplicacoes: p.aplicacoes,
        fornecedor: p.fornecedor || "SPORTIVE",
      }));
      const { error } = await supabase
        .from("catalogo_master")
        .upsert(batch, { onConflict: "codigo" });

      if (error) {
        console.error(`Batch upsert error at ${i}:`, error);
        errors.push(`DB error at batch ${i}: ${error.message}`);
      } else {
        inserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        pages_processed: pages.length,
        products_extracted: totalProducts,
        unique_products: uniqueProducts.length,
        products_inserted: inserted,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
