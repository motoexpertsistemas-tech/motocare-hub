import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";

interface ScrapedProduct {
  codigo_cpl: string;
  nome: string;
  marca: string | null;
  categoria: string | null;
  imagem_url: string | null;
  aplicacoes: string[];
  fornecedor: string;
}

/**
 * Parse products from HTML (listing page or AJAX response).
 */
function parseProductsFromHtml(html: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  const seen = new Set<string>();

  const cardRegex = /<div class="conteudo-img-produtos[^"]*">\s*<a\s+href="[^"]*?\/produto\/(\d+)"[^>]*>[\s\S]*?<img\s+src="([^"]*)"[^>]*>[\s\S]*?<p class="titulo-produtos">([^<]+)<\/p>\s*<p class="marca-produtos">([^<]*)<\/p>\s*<p class="referencia-produtos">[^:]*:\s*(\d+)<\/p>/g;

  let match;
  while ((match = cardRegex.exec(html)) !== null) {
    const productId = match[1];
    let imgUrl = match[2].trim();
    const nome = match[3].trim();
    const marca = match[4].trim();
    const referencia = match[5];

    const key = referencia || productId;
    if (seen.has(key)) continue;
    seen.add(key);

    if (!nome || nome.length < 3) continue;

    if (imgUrl && !imgUrl.startsWith("http")) {
      imgUrl = `https://perere.com.br${imgUrl.startsWith("/") ? "" : "/"}${imgUrl}`;
    }

    products.push({
      codigo_cpl: `PRR-${referencia}`,
      nome: nome.toUpperCase(),
      marca: marca && marca.length > 1 && marca !== "." ? marca.toUpperCase() : null,
      categoria: null,
      imagem_url: imgUrl || null,
      aplicacoes: [],
      fornecedor: "PERERÊ",
    });
  }

  return products;
}

/**
 * Extract all product URL IDs from HTML
 */
function extractProductUrlIds(html: string): string[] {
  const ids: string[] = [];
  const regex = /href="[^"]*\/produto\/(\d+)"/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    ids.push(m[1]);
  }
  return ids;
}

/**
 * Fetch "load more" products via AJAX endpoint with retry
 */
async function fetchMoreProducts(lastId: string, subcategoria: string, retries = 3, searchTerm = ""): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const formData = new URLSearchParams();
      formData.append("id", lastId);
      formData.append("buscar", searchTerm);
      formData.append("marca", "");
      formData.append("pagina", searchTerm ? "busca" : "produtos");
      formData.append("categoria", searchTerm ? "" : "1");
      formData.append("subcategoria", searchTerm ? "" : (subcategoria || ""));

      const res = await fetch("https://perere.com.br/includes/ajax_more-produtos-page-produtos.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": `https://perere.com.br/produtos/1/moto${subcategoria ? '/' + subcategoria : ''}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: formData.toString(),
      });

      if (!res.ok) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        return "";
      }
      return await res.text();
    } catch {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      return "";
    }
  }
  return "";
}

/**
 * Directly fetch HTML of listing page
 */
async function fetchListingPageDirect(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml",
        },
      });
      if (!res.ok) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        return "";
      }
      return await res.text();
    } catch {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      return "";
    }
  }
  return "";
}

/**
 * Scrape a listing page via Firecrawl (fallback)
 */
async function scrapeListingPage(firecrawlKey: string, url: string, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, formats: ["html"], waitFor: 5000 }),
      });

      if (res.status === 429 || res.status >= 500) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
          continue;
        }
        return "";
      }
      if (!res.ok) return "";

      const data = await res.json();
      return data.data?.html || data.html || "";
    } catch {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
        continue;
      }
      return "";
    }
  }
  return "";
}

/**
 * Scrape a single subcategory with deep AJAX pagination
 */
async function scrapeSubcategoryFull(
  subcat: string,
  firecrawlKey: string,
): Promise<{ products: ScrapedProduct[]; pagesScraped: number }> {
  const url = subcat
    ? `https://perere.com.br/produtos/1/moto/${subcat}`
    : `https://perere.com.br/produtos/1/moto`;

  // Step 1: Fetch initial page
  let html = await fetchListingPageDirect(url);
  if (!html || html.length < 500) {
    html = await scrapeListingPage(firecrawlKey, url);
  }
  if (!html || html.length < 500) {
    return { products: [], pagesScraped: 0 };
  }

  let allProducts = parseProductsFromHtml(html);

  // Step 2: AJAX pagination
  const showMoreMatch = html.match(/<span\s+id="(\d+)"\s+class="show_more[^"]*"/)
    || html.match(/id="show_more_main(\d+)"/);
  
  let currentLastId = showMoreMatch?.[1] || "";
  
  // If no show_more found, try last product URL ID
  if (!currentLastId) {
    const ids = extractProductUrlIds(html);
    if (ids.length > 0) currentLastId = ids[ids.length - 1];
  }

  let pageCount = 1;
  const maxPages = 200;
  let consecutiveEmpty = 0;

  while (currentLastId && pageCount < maxPages && consecutiveEmpty < 2) {
    const ajaxHtml = await fetchMoreProducts(currentLastId, subcat);
    
    if (!ajaxHtml || ajaxHtml.trim().length < 50) {
      consecutiveEmpty++;
      // Try with a slightly offset ID
      const numId = parseInt(currentLastId);
      if (!isNaN(numId)) {
        currentLastId = String(numId + 1);
        continue;
      }
      break;
    }

    const newProducts = parseProductsFromHtml(ajaxHtml);
    if (newProducts.length === 0) {
      consecutiveEmpty++;
      // Extract IDs and try next
      const ids = extractProductUrlIds(ajaxHtml);
      if (ids.length > 0 && ids[ids.length - 1] !== currentLastId) {
        currentLastId = ids[ids.length - 1];
        continue;
      }
      break;
    }

    consecutiveEmpty = 0;
    allProducts = [...allProducts, ...newProducts];
    pageCount++;

    // Find next cursor
    const newShowMore = ajaxHtml.match(/<span\s+id="(\d+)"\s+class="show_more[^"]*"/)
      || ajaxHtml.match(/id="show_more_main(\d+)"/);

    if (newShowMore && newShowMore[1] !== currentLastId) {
      currentLastId = newShowMore[1];
    } else {
      const ids = extractProductUrlIds(ajaxHtml);
      const lastProdId = ids.length > 0 ? ids[ids.length - 1] : null;
      if (lastProdId && lastProdId !== currentLastId) {
        currentLastId = lastProdId;
      } else {
        break;
      }
    }

    await new Promise(r => setTimeout(r, 200));
  }

  // Deduplicate
  const uniqueMap = new Map<string, ScrapedProduct>();
  for (const p of allProducts) {
    if (!uniqueMap.has(p.codigo_cpl)) uniqueMap.set(p.codigo_cpl, p);
  }

  return { products: Array.from(uniqueMap.values()), pagesScraped: pageCount };
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
    const { action, subcategory, subcategories: batchSubcats, search_term } = body;

    // ACTION: map
    if (action === "map") {
      console.log("Mapping Perere subcategory URLs...");

      const mapRes = await fetch(`${FIRECRAWL_API_URL}/map`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: "https://perere.com.br/produtos/1/moto",
          limit: 5000,
          includeSubdomains: false,
        }),
      });

      const mapData = await mapRes.json();
      if (!mapRes.ok) {
        return new Response(
          JSON.stringify({ error: "Firecrawl map failed", details: mapData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const allLinks = mapData.links || [];
      const subcats = new Set<string>();
      for (const link of allLinks) {
        const m = link.match(/perere\.com\.br\/produtos\/1\/moto\/([^/?#]+)/);
        if (m) subcats.add(m[1]);
      }

      console.log(`Map found: ${subcats.size} subcategories`);

      return new Response(
        JSON.stringify({
          success: true,
          subcategories: Array.from(subcats),
          subcategory_count: subcats.size,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: scrape_subcategory - single subcategory
    if (action === "scrape_subcategory") {
      const subcat = subcategory || "";
      console.log(`Scraping subcategory: ${subcat || "main"}`);

      const { products, pagesScraped } = await scrapeSubcategoryFull(subcat, firecrawlKey);

      let inserted = 0;
      if (products.length > 0) {
        for (let i = 0; i < products.length; i += 500) {
          const chunk = products.slice(i, i + 500).map((p) => ({
            codigo: p.codigo_cpl,
            nome: p.nome,
            marca: p.marca,
            categoria: p.categoria,
            imagem_url: p.imagem_url,
            aplicacoes: p.aplicacoes,
            fornecedor: p.fornecedor || "PERERÊ",
          }));
          const { error: dbError } = await supabase
            .from("catalogo_master")
            .upsert(chunk, { onConflict: "codigo" });
          if (dbError) console.error("DB upsert error:", dbError);
          else inserted += chunk.length;
        }
      }

      console.log(`${subcat || "main"}: ${products.length} found, ${inserted} upserted, ${pagesScraped} pages`);

      return new Response(
        JSON.stringify({
          success: true,
          subcategory: subcat || "main",
          products_found: products.length,
          pages_scraped: pagesScraped,
          inserted,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: scrape_batch - process multiple subcategories in one call
    if (action === "scrape_batch") {
      const subcatList: string[] = batchSubcats || [];
      if (subcatList.length === 0) {
        return new Response(
          JSON.stringify({ error: "No subcategories provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Batch scraping ${subcatList.length} subcategories: ${subcatList.join(", ")}`);

      let totalFound = 0;
      let totalInserted = 0;
      const results: Array<{ subcategory: string; found: number; inserted: number; pages: number }> = [];

      for (const subcat of subcatList) {
        try {
          const { products, pagesScraped } = await scrapeSubcategoryFull(subcat, firecrawlKey);

          let inserted = 0;
          if (products.length > 0) {
            for (let i = 0; i < products.length; i += 500) {
              const chunk = products.slice(i, i + 500).map((p) => ({
                codigo: p.codigo_cpl,
                nome: p.nome,
                marca: p.marca,
                categoria: p.categoria,
                imagem_url: p.imagem_url,
                aplicacoes: p.aplicacoes,
                fornecedor: p.fornecedor || "PERERÊ",
              }));
              const { error: dbError } = await supabase
                .from("catalogo_master")
                .upsert(chunk, { onConflict: "codigo" });
              if (dbError) console.error(`DB error for ${subcat}:`, dbError);
              else inserted += chunk.length;
            }
          }

          totalFound += products.length;
          totalInserted += inserted;
          results.push({ subcategory: subcat, found: products.length, inserted, pages: pagesScraped });
          console.log(`  ${subcat}: ${products.length} found, ${inserted} upserted`);
        } catch (err) {
          console.warn(`  ${subcat}: error - ${err}`);
          results.push({ subcategory: subcat, found: 0, inserted: 0, pages: 0 });
        }

        // Small delay between subcategories
        await new Promise(r => setTimeout(r, 150));
      }

      console.log(`Batch done: ${totalFound} found, ${totalInserted} upserted from ${subcatList.length} subcats`);

      return new Response(
        JSON.stringify({
          success: true,
          total_found: totalFound,
          total_inserted: totalInserted,
          completed: results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: search - search by term
    if (action === "search") {
      const term = search_term || "";
      if (!term) {
        return new Response(
          JSON.stringify({ error: "search_term is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Searching Perere for: "${term}"`);

      const url = `https://perere.com.br/busca?buscar=${encodeURIComponent(term)}`;
      let html = await fetchListingPageDirect(url);
      if (!html || html.length < 500) {
        html = await scrapeListingPage(firecrawlKey, url);
      }
      if (!html || html.length < 500) {
        return new Response(
          JSON.stringify({ success: true, search_term: term, products_found: 0, inserted: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let allProducts = parseProductsFromHtml(html);

      // AJAX pagination for search
      const showMoreMatch = html.match(/<span\s+id="(\d+)"\s+class="show_more[^"]*"/);
      let currentLastId = showMoreMatch?.[1] || "";
      if (!currentLastId) {
        const ids = extractProductUrlIds(html);
        if (ids.length > 0) currentLastId = ids[ids.length - 1];
      }

      let pageCount = 1;
      const maxPages = 200;
      let consecutiveEmpty = 0;

      while (currentLastId && pageCount < maxPages && consecutiveEmpty < 2) {
        const ajaxHtml = await fetchMoreProducts(currentLastId, "", 3, term);
        if (!ajaxHtml || ajaxHtml.trim().length < 50) {
          consecutiveEmpty++;
          const numId = parseInt(currentLastId);
          if (!isNaN(numId)) { currentLastId = String(numId + 1); continue; }
          break;
        }

        const newProducts = parseProductsFromHtml(ajaxHtml);
        if (newProducts.length === 0) {
          consecutiveEmpty++;
          const ids = extractProductUrlIds(ajaxHtml);
          if (ids.length > 0 && ids[ids.length - 1] !== currentLastId) {
            currentLastId = ids[ids.length - 1]; continue;
          }
          break;
        }

        consecutiveEmpty = 0;
        allProducts = [...allProducts, ...newProducts];
        pageCount++;

        const newShowMore = ajaxHtml.match(/<span\s+id="(\d+)"\s+class="show_more[^"]*"/);
        if (newShowMore && newShowMore[1] !== currentLastId) {
          currentLastId = newShowMore[1];
        } else {
          const ids = extractProductUrlIds(ajaxHtml);
          const lastProdId = ids.length > 0 ? ids[ids.length - 1] : null;
          if (lastProdId && lastProdId !== currentLastId) { currentLastId = lastProdId; }
          else break;
        }

        await new Promise(r => setTimeout(r, 200));
      }

      // Deduplicate
      const uniqueMap = new Map<string, ScrapedProduct>();
      for (const p of allProducts) {
        if (!uniqueMap.has(p.codigo_cpl)) uniqueMap.set(p.codigo_cpl, p);
      }
      const products = Array.from(uniqueMap.values());

      let inserted = 0;
      if (products.length > 0) {
        for (let i = 0; i < products.length; i += 500) {
          const chunk = products.slice(i, i + 500).map((p) => ({
            codigo: p.codigo_cpl,
            nome: p.nome,
            marca: p.marca,
            categoria: p.categoria,
            imagem_url: p.imagem_url,
            aplicacoes: p.aplicacoes,
            fornecedor: p.fornecedor || "PERERÊ",
          }));
          const { error: dbError } = await supabase
            .from("catalogo_master")
            .upsert(chunk, { onConflict: "codigo" });
          if (dbError) console.error("DB upsert error:", dbError);
          else inserted += chunk.length;
        }
      }

      console.log(`Search "${term}": ${products.length} found, ${inserted} upserted, ${pageCount} pages`);

      return new Response(
        JSON.stringify({
          success: true,
          search_term: term,
          products_found: products.length,
          pages_scraped: pageCount,
          inserted,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: map, scrape_subcategory, scrape_batch, search" }),
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
