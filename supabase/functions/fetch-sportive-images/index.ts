import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractImageUrl(html: string, metadata: any): string | null {
  const imgMatches = html.match(
    /https:\/\/dcdn-us\.mitiendanube\.com\/stores\/006\/227\/971\/products\/[^"'\s>]+\.(?:webp|jpg|png)/g
  );
  if (imgMatches) {
    const unique = [...new Set(imgMatches)] as string[];
    return (
      unique.find((u) => u.includes("-1024-1024")) ||
      unique.find((u) => u.includes("-480-0")) ||
      unique[0]
    );
  }
  return metadata?.ogImage || null;
}

// Common abbreviations in the catalog
const ABBREVIATIONS: Record<string, string[]> = {
  "DIANT": ["DIANTEIRO", "DIANTEIRA"],
  "DIANT.": ["DIANTEIRO", "DIANTEIRA"],
  "TRAS": ["TRASEIRO", "TRASEIRA"],
  "TRAS.": ["TRASEIRO", "TRASEIRA"],
  "LAT": ["LATERAL"],
  "LAT.": ["LATERAL"],
  "S/": ["SEM"],
  "C/": ["COM"],
  "ESQ": ["ESQUERDO", "ESQUERDA"],
  "DIR": ["DIREITO", "DIREITA"],
  "SUP": ["SUPERIOR"],
  "INF": ["INFERIOR"],
  "INT": ["INTERNO", "INTERNA"],
  "EXT": ["EXTERNO", "EXTERNA"],
};

/**
 * Check if a product name matches the page title, considering abbreviations.
 * Returns true if all significant words in the product name appear (or their expansions).
 */
function nameMatches(productNome: string, pageTitle: string): boolean {
  const nome = productNome.toUpperCase().replace(/[()]/g, "").trim();
  const title = pageTitle.toUpperCase();
  
  const nameWords = nome.split(/\s+/).filter((w) => w.length > 1);
  if (nameWords.length === 0) return false;

  let hits = 0;
  for (const word of nameWords) {
    if (title.includes(word)) {
      hits++;
    } else {
      // Check abbreviation expansions
      const cleanWord = word.replace(/\./g, "");
      const expansions = ABBREVIATIONS[word] || ABBREVIATIONS[cleanWord] || [];
      if (expansions.some((exp) => title.includes(exp))) {
        hits++;
      }
    }
  }

  // At least 60% of name words must match
  return hits / nameWords.length >= 0.6;
}

/**
 * Check if any application matches the page title.
 * Extracts model name and year from both and compares.
 */
function applicationMatches(aplicacoes: string[] | null, pageTitle: string): boolean {
  if (!aplicacoes || aplicacoes.length === 0) return false;
  const title = pageTitle.toUpperCase();

  for (const app of aplicacoes) {
    const appUpper = app.toUpperCase();
    // Extract ALL model names (e.g., "TITAN", "BIZ", "FAN", "YBR")
    const modelWords = appUpper.split(/[\s\/\-]+/).filter((w) => w.length >= 2 && /^[A-Z]+$/.test(w));
    // Skip generic words
    const skipWords = new Set(["TODOS", "ESD", "EX", "KS", "ES", "MIX", "SPORT", "MOD", "PAR", "KIT", "SEM"]);
    const significantModels = modelWords.filter((w) => !skipWords.has(w) && w.length >= 3);
    
    if (significantModels.length === 0) continue;
    
    // At least one significant model word must appear in the title
    const modelMatched = significantModels.some((m) => title.includes(m));
    if (!modelMatched) continue;
    
    // Model matches! Check year range overlap
    const appYears = extractYears(appUpper);
    const titleYears = extractYears(title);
    
    if (appYears.length === 0 && titleYears.length === 0) {
      return true; // Both have no years, model match is enough
    }
    
    if (appYears.length === 0 || titleYears.length === 0) {
      continue; // One has years, other doesn't - skip to be safe
    }
    
    // Check if any year overlaps or is within range
    const titleRange = getYearRange(titleYears);
    for (const year of appYears) {
      if (year >= titleRange.min && year <= titleRange.max) return true;
    }
  }

  return false;
}

function extractYears(text: string): number[] {
  const years: number[] = [];
  // Match 4-digit years
  const fullYears = text.match(/\b(19\d{2}|20\d{2})\b/g);
  if (fullYears) {
    for (const y of fullYears) years.push(parseInt(y));
  }
  // Match 2-digit years after / (e.g., "2006/07" → 2007)
  const shortYears = text.match(/\/(0\d|1\d|2\d|9\d)/g);
  if (shortYears) {
    for (const y of shortYears) {
      const num = parseInt(y.substring(1));
      years.push(num >= 90 ? 1900 + num : 2000 + num);
    }
  }
  return [...new Set(years)];
}

function getYearRange(years: number[]): { min: number; max: number } {
  return { min: Math.min(...years), max: Math.max(...years) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { action } = body;

    if (action === "map") {
      const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
        method: "POST",
        headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://www.sportive.com.br", search: "produtos", limit: 5000 }),
      });
      const mapData = await mapRes.json();
      if (!mapRes.ok) {
        return new Response(JSON.stringify({ error: "Map failed", details: mapData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const productUrls = (mapData.links || []).filter((url: string) => url.includes("/produtos/"));
      return new Response(JSON.stringify({ success: true, total_urls: productUrls.length, urls: productUrls }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "batch_scrape") {
      const { urls } = body;
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return new Response(JSON.stringify({ error: "urls array required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Load ALL Sportive products without images (paginated to bypass 1000 limit)
      const products: any[] = [];
      let from = 0;
      const PAGE_SIZE = 1000;
      while (true) {
        const { data, error: fetchErr } = await supabase
          .from("produtos_catalogo")
          .select("id, nome, aplicacoes, cor")
          .eq("fornecedor", "SPORTIVE")
          .is("imagem_url", null)
          .range(from, from + PAGE_SIZE - 1);
        if (fetchErr || !data || data.length === 0) break;
        products.push(...data);
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      if (!products || products.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "All products have images", total_updated: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      console.log(`Loaded ${products.length} products without images`);
      let totalUpdated = 0;
      const results: any[] = [];

      for (const url of urls) {
        try {
          console.log(`Scraping: ${url}`);
          const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ url, formats: ["html"], onlyMainContent: false }),
          });

          const scrapeData = await scrapeRes.json();
          if (!scrapeRes.ok) { results.push({ url, error: "scrape failed" }); continue; }

          const html = scrapeData.data?.html || scrapeData.html || "";
          const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};
          const pageTitle = (metadata.title || "").replace(/ - Sportive.*$/i, "").trim();

          const imageUrl = extractImageUrl(html, metadata);
          if (!imageUrl) { results.push({ url, title: pageTitle, matched: false, reason: "no image" }); continue; }

          // Find products where BOTH name and application match
          const matched = products.filter((p) =>
            nameMatches(p.nome, pageTitle) && applicationMatches(p.aplicacoes, pageTitle)
          );

          if (matched.length > 0) {
            const matchIds = matched.map((m) => m.id);
            const { error: updateError } = await supabase
              .from("produtos_catalogo")
              .update({ imagem_url: imageUrl, atualizado_em: new Date().toISOString() })
              .in("id", matchIds);

            if (!updateError) {
              for (const m of matched) {
                const idx = products.findIndex((p) => p.id === m.id);
                if (idx >= 0) products.splice(idx, 1);
              }
              totalUpdated += matchIds.length;
            }

            results.push({
              url, title: pageTitle, matched: true, count: matchIds.length,
              samples: matched.slice(0, 3).map((m) => `${m.nome} [${(m.aplicacoes || [])[0] || ""}]`),
            });
          } else {
            results.push({ url, title: pageTitle, matched: false });
          }

          await new Promise((r) => setTimeout(r, 400));
        } catch (err) {
          results.push({ url, error: String(err) });
        }
      }

      return new Response(
        JSON.stringify({ success: true, total_updated: totalUpdated, remaining: products.length, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reset bad matches
    if (action === "reset_images") {
      const { error } = await supabase
        .from("produtos_catalogo")
        .update({ imagem_url: null })
        .eq("fornecedor", "SPORTIVE")
        .not("imagem_url", "is", null);

      return new Response(
        JSON.stringify({ success: !error, error: error?.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: map, batch_scrape, reset_images" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
