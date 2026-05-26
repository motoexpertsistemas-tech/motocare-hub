import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";

// All Vipal motorcycle tire product pages
const VIPAL_PRODUCTS = [
  { slug: "st200", linha: "STREET", nome: "ST200" },
  { slug: "st300", linha: "STREET", nome: "ST300" },
  { slug: "st400", linha: "STREET", nome: "ST400" },
  { slug: "st500", linha: "STREET", nome: "ST500" },
  { slug: "st500-scooter", linha: "STREET", nome: "ST500 SCOOTER" },
  { slug: "st600", linha: "STREET", nome: "ST600" },
  { slug: "tr300", linha: "TRAIL", nome: "TR300" },
  { slug: "tr350", linha: "TRAIL", nome: "TR350" },
  { slug: "tr400", linha: "TRAIL", nome: "TR400" },
  { slug: "cx200", linha: "CROSS", nome: "CX200" },
  { slug: "cx300", linha: "CROSS", nome: "CX300" },
];

interface ParsedTire {
  codigo: string;
  descricao: string;
  aplicacao: string;
  eixo: string;
  montagem: string;
  estrutura: string;
  indice_carga_velocidade: string;
  modelos_sugeridos: string;
}

function parseProductTable(markdown: string): ParsedTire[] {
  const tires: ParsedTire[] = [];

  // Find table rows - format: | COD | DESC | APLIC | EIXO | MONT | ESTR | INDICE | MODELOS |
  const lines = markdown.split("\n");

  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    // Skip header and separator rows
    if (line.includes("CÓDIGO") || line.includes("---")) continue;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

    if (cells.length < 7) continue;

    // First cell should be a numeric code (6 digits)
    const codigo = cells[0];
    if (!/^\d{5,7}$/.test(codigo)) continue;

    tires.push({
      codigo,
      descricao: cells[1] || "",
      aplicacao: cells[2] || "",
      eixo: cells[3] || "",
      montagem: cells[4] || "",
      estrutura: cells[5] || "",
      indice_carga_velocidade: cells[6] || "",
      modelos_sugeridos: cells[7] || "",
    });
  }

  return tires;
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

    const { slug } = await req.json();

    // Find the product info
    const product = VIPAL_PRODUCTS.find((p) => p.slug === slug);
    if (!product) {
      return new Response(
        JSON.stringify({ error: `Unknown product slug: ${slug}`, available: VIPAL_PRODUCTS.map((p) => p.slug) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `https://vipal.com/br/produto/pneus-de-moto/${slug}`;
    console.log(`Scraping Vipal product: ${url}`);

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
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      console.error("Firecrawl error:", scrapeData);
      return new Response(
        JSON.stringify({ error: "Firecrawl scrape failed", details: scrapeData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const md = scrapeData.data?.markdown || scrapeData.markdown || "";

    // Extract product image from markdown
    const imgMatch = md.match(/!\[.*?\]\((https:\/\/new-vipal-prd\.s3[^)]+)\)/);
    const imagemUrl = imgMatch ? imgMatch[1] : null;

    // Parse the technical specs table
    const tires = parseProductTable(md);
    console.log(`Found ${tires.length} tire variants for ${product.nome}`);

    // Build products for upsert
    const products = tires.map((tire) => {
      // Parse modelos_sugeridos into aplicacoes array
      const aplicacoes = tire.modelos_sugeridos
        .split(/[,\/]/)
        .map((m) => m.trim())
        .filter((m) => m.length > 2);

      return {
        codigo_cpl: `VPL-${tire.codigo}`,
        nome: tire.descricao || `PNEU VIPAL ${product.nome}`,
        marca: "VIPAL",
        categoria: "PNEU",
        imagem_url: imagemUrl,
        aplicacoes,
        fornecedor: "VIPAL",
        descricao: `Linha: ${product.linha} | Eixo: ${tire.eixo} | Montagem: ${tire.montagem} | Estrutura: ${tire.estrutura} | Índice: ${tire.indice_carga_velocidade}`,
      };
    });

    // Upsert into catalogo_master
    let inserted = 0;
    if (products.length > 0) {
      const masterProducts = products.map((p) => ({
        codigo: p.codigo_cpl,
        nome: p.nome,
        marca: "VIPAL",
        categoria: p.categoria,
        imagem_url: p.imagem_url,
        aplicacoes: p.aplicacoes,
        fornecedor: "VIPAL",
        descricao: p.descricao,
      }));
      const { error } = await supabase
        .from("catalogo_master")
        .upsert(masterProducts, { onConflict: "codigo" });
      if (error) {
        console.error("DB upsert error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to save products", details: error }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      inserted = products.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        product: product.nome,
        linha: product.linha,
        tires_found: tires.length,
        products_inserted: inserted,
        image_url: imagemUrl,
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
