import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";

// Known Pro Tork color suffixes
const COLOR_MAP: Record<string, string> = {
  AMARELO: "AM",
  AZUL: "AZ",
  BRANCO: "BC",
  VERMELHO: "VM",
  PRETO: "PT",
  PRATA: "PR",
  ROSA: "RS",
  PINK: "PK",
  LARANJA: "LJ",
  VERDE: "VD",
  CINZA: "CZ",
  GRAFITE: "GF",
  DOURADO: "DR",
};

const COLORS = Object.keys(COLOR_MAP);

// Map image position to likely color based on Pro Tork's typical image ordering
// Pro Tork usually shows colors in a consistent order in their product pages
function extractColorsFromImages(imageUrls: string[]): string[] {
  // We can't determine colors from image URLs on Wix (they're hashed)
  // Return the standard colors - user will select which ones to import
  return COLORS;
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

    const { url, base_code, colors, tamanhos, categoria } = await req.json();

    if (!url || !base_code) {
      return new Response(
        JSON.stringify({ error: "url e base_code são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Scraping Pro Tork: ${url}`);

    // Scrape the product page
    const scrapeRes = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        waitFor: 5000,
      }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      console.error("Firecrawl error:", scrapeData);
      return new Response(
        JSON.stringify({ error: "Falha no scraping", details: scrapeData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const md = scrapeData.data?.markdown || scrapeData.markdown || "";
    const metadata = scrapeData.data?.metadata || {};

    // Extract product name from markdown heading
    const nameMatch = md.match(/^# (.+)$/m);
    const productName = nameMatch ? nameMatch[1].trim().toUpperCase() : metadata.ogTitle?.split("|")[0]?.trim().toUpperCase() || "PRODUTO PRO TORK";

    // Extract main image
    const ogImage = metadata.ogImage || metadata["og:image"] || null;

    // Extract all product images from markdown
    const imgRegex = /!\[(?!Miniatura)[^\]]*\]\((https:\/\/static\.wixstatic\.com\/media\/[^)]+)\)/g;
    const images: string[] = [];
    let imgMatch;
    while ((imgMatch = imgRegex.exec(md)) !== null) {
      images.push(imgMatch[1]);
    }

    // Extract description
    const descLines: string[] = [];
    const bulletRegex = /^- (.+)$/gm;
    let bulletMatch;
    while ((bulletMatch = bulletRegex.exec(md)) !== null) {
      descLines.push(bulletMatch[1].trim());
    }
    const descricao = descLines.join("; ") || metadata.ogDescription || "";

    // Colors to create variants for
    const selectedColors: string[] = colors && colors.length > 0 ? colors : COLORS;
    
    // Sizes to create variants for (e.g. 56, 58, 60 for helmets)
    const selectedTamanhos: string[] = tamanhos && tamanhos.length > 0 ? tamanhos : [""];

    // Build products
    const products: any[] = [];

    for (const cor of selectedColors) {
      const suffix = COLOR_MAP[cor.toUpperCase()] || cor.substring(0, 2).toUpperCase();
      
      for (const tamanho of selectedTamanhos) {
        const code = tamanho 
          ? `${base_code}${suffix}` 
          : `${base_code}${suffix}`;
        
        // Try to match an image to this color position
        const colorIndex = selectedColors.indexOf(cor);
        const imageUrl = images[colorIndex] || ogImage;

        products.push({
          codigo_cpl: code,
          nome: `${productName} ${cor.toUpperCase()}`,
          marca: "PRO TORK",
          categoria: categoria || "ACESSÓRIOS",
          cor: cor.toUpperCase(),
          imagem_url: imageUrl,
          aplicacoes: [],
          fornecedor: "PRO TORK",
          descricao: descricao.toUpperCase(),
        });
      }
    }

    console.log(`Generated ${products.length} product variants`);

    // Upsert into catalogo_master
    let inserted = 0;
    if (products.length > 0) {
      const masterProducts = products.map((p: any) => ({
        codigo: p.codigo_cpl,
        nome: p.nome,
        marca: "PRO TORK",
        categoria: p.categoria,
        imagem_url: p.imagem_url,
        aplicacoes: p.aplicacoes,
        fornecedor: "PRO TORK",
        descricao: p.descricao,
      }));
      const { error } = await supabase
        .from("catalogo_master")
        .upsert(masterProducts, { onConflict: "codigo" });
      if (error) {
        console.error("DB upsert error:", error);
        return new Response(
          JSON.stringify({ error: "Falha ao salvar produtos", details: error }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      inserted = products.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        product_name: productName,
        description: descricao,
        images_found: images.length,
        products_created: inserted,
        codes: products.map((p) => p.codigo_cpl),
        colors_available: Object.keys(COLOR_MAP),
        color_suffixes: COLOR_MAP,
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
