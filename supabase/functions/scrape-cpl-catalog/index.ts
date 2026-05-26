import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";
const PRODUCT_BASE_URL = "https://app.cplmotoparts.com.br/catalogo-cpl-web/produto";

const CATEGORIES = [
  "ACESSÓRIOS",
  "CABOS",
  "CARBURADOR/INJEÇÃO",
  "CARENAGEM/PLÁSTICO",
  "CHASSI",
  "ELÉTRICA",
  "FERRAMENTA/EQUIPAMENTOS",
  "FIXAÇÃO",
  "MOTOR",
  "RODA",
  "SUSPENSÃO",
  "TRANSMISSÃO",
];

interface ProductData {
  codigo_cpl: string;
  nome: string;
  marca: string | null;
  categoria: string;
  imagem_url: string | null;
  aplicacoes: string[];
  cor: string | null;
}

interface CatalogProductPayload extends ProductData {
  empresa_id: string;
  branch_id: string | null;
  fornecedor: string;
}

async function fetchProductColor(codigoCpl: string, firecrawlKey: string): Promise<string | null> {
  try {
    const url = `${PRODUCT_BASE_URL}/${codigoCpl}`;
    const res = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"], waitFor: 2000 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const md = data.data?.markdown || data.markdown || "";
    const corMatch = md.match(/\*\*Cor\*\*\s*\|\s*([^|\n]+)/);
    const corRaw = corMatch ? corMatch[1].trim().replace(/\*+/g, "").replace(/\\+/g, "").trim() : null;
    if (corRaw && corRaw.length > 0 && corRaw !== "***" && corRaw !== "---") {
      return corRaw;
    }
    return null;
  } catch (e) {
    console.error(`Error fetching color for ${codigoCpl}:`, e);
    return null;
  }
}

function parseProducts(markdown: string, categoria: string): ProductData[] {
  const products: ProductData[] = [];

  // Products appear as markdown links: [content](url)
  // Content uses \\ as line breaks
  // Match everything between [ and ](product-url)
  const regex = /\[([\s\S]*?)\]\(https:\/\/app\.cplmotoparts\.com\.br\/catalogo-cpl-web\/produto\/(\d+)\)/g;

  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const block = match[1];
    const codigoCpl = match[2];

    // Split block by \\ or newlines
    const lines = block
      .split(/\\\\|\n/)
      .map((l: string) => l.trim())
      .filter((l: string) => l && l !== "* * *");

    // First meaningful line is the product name
    const nome = lines[0] || "";

    // Find marca
    const marcaLine = lines.find((l: string) => l.startsWith("MARCA:"));
    const marca = marcaLine ? marcaLine.replace("MARCA:", "").trim() : null;

    // Find image
    const imgLine = lines.find((l: string) => l.includes("cdn.cplmotoparts.com.br"));
    const imgMatch = imgLine ? imgLine.match(/\((https:\/\/cdn[^)]+)\)/) : null;
    const imagem_url = imgMatch ? imgMatch[1] : null;

    // Find aplicações
    const appLine = lines.find((l: string) => l.startsWith("APLICAÇÃO:"));
    const aplicacoes = appLine
      ? appLine
          .replace("APLICAÇÃO:", "")
          .trim()
          .split("/")
          .map((a: string) => a.trim())
          .filter(Boolean)
      : [];

    if (nome && codigoCpl && !nome.startsWith("CATEGORIA") && !nome.includes("magnify") && !nome.startsWith("![") && nome.length > 2) {
      products.push({
        codigo_cpl: codigoCpl,
        nome,
        marca,
        categoria,
        imagem_url,
        aplicacoes,
        cor: null,
      });
    }
  }

  return products;
}

function isMissingConflictConstraint(error: any) {
  return error?.code === "42P10" || String(error?.message || "").includes("ON CONFLICT");
}

async function saveWithLegacyCodigoConflict(supabase: any, products: CatalogProductPayload[]) {
  const uniqueProducts = Array.from(new Map(products.map((p) => [p.codigo_cpl, p])).values());
  const codes = uniqueProducts.map((p) => p.codigo_cpl);
  const empresaId = uniqueProducts[0]?.empresa_id;
  const branchId = uniqueProducts[0]?.branch_id;

  console.log(`[CPL-LEGACY] Iniciando fallback legacy | empresa_id=${empresaId} | branch_id=${branchId} | total_codigos=${codes.length}`);

  const { data: existingRows, error: selectError } = await supabase
    .from("produtos_catalogo")
    .select("id,codigo_cpl,empresa_id,branch_id")
    .in("codigo_cpl", codes);

  if (selectError) {
    console.error(`[CPL-LEGACY] Erro ao consultar existentes | empresa_id=${empresaId} | erro=${selectError.message} | code=${selectError.code}`);
    return { error: selectError };
  }

  const existingByCode = new Map((existingRows || []).map((row: any) => [row.codigo_cpl, row]));
  const inserts: CatalogProductPayload[] = [];
  const updates: Array<{ id: string; payload: CatalogProductPayload }> = [];
  const skippedDetails: Array<{ codigo: string; owner_empresa: string; owner_branch: string | null }> = [];

  for (const product of uniqueProducts) {
    const existing = existingByCode.get(product.codigo_cpl) as any;
    if (!existing) {
      inserts.push(product);
      continue;
    }

    if (!existing.empresa_id || existing.empresa_id === product.empresa_id) {
      updates.push({ id: existing.id, payload: product });
    } else {
      skippedDetails.push({
        codigo: product.codigo_cpl,
        owner_empresa: existing.empresa_id,
        owner_branch: existing.branch_id ?? null,
      });
    }
  }

  console.log(`[CPL-LEGACY] Plano | empresa_id=${empresaId} | inserts=${inserts.length} | updates=${updates.length} | skipped=${skippedDetails.length}`);

  if (inserts.length > 0) {
    const { error } = await supabase.from("produtos_catalogo").insert(inserts);
    if (error) {
      console.error(`[CPL-LEGACY] Falha ao inserir | empresa_id=${empresaId} | branch_id=${branchId} | qtd=${inserts.length} | code=${error.code} | msg=${error.message} | detail=${error.details ?? ''} | hint=${error.hint ?? ''}`);
      return { error };
    }
  }

  for (const { id, payload } of updates) {
    const { error } = await supabase
      .from("produtos_catalogo")
      .update(payload)
      .eq("id", id);
    if (error) {
      console.error(`[CPL-LEGACY] Falha ao atualizar | empresa_id=${empresaId} | id=${id} | codigo=${payload.codigo_cpl} | code=${error.code} | msg=${error.message}`);
      return { error };
    }
  }

  if (skippedDetails.length > 0) {
    console.warn(`[CPL-LEGACY] Pulados ${skippedDetails.length} produtos pertencentes a outra empresa | requester_empresa=${empresaId}`);
    const sample = skippedDetails.slice(0, 10);
    for (const s of sample) {
      console.warn(`[CPL-LEGACY] SKIP codigo=${s.codigo} owner_empresa=${s.owner_empresa} owner_branch=${s.owner_branch}`);
    }
    if (skippedDetails.length > 10) {
      console.warn(`[CPL-LEGACY] ... +${skippedDetails.length - 10} conflitos adicionais omitidos`);
    }
  }

  return { error: null };
}

async function saveProducts(supabase: any, products: CatalogProductPayload[]) {
  const empresaId = products[0]?.empresa_id;
  const branchId = products[0]?.branch_id;
  console.log(`[CPL-UPSERT] Tentando upsert composto | empresa_id=${empresaId} | branch_id=${branchId} | qtd=${products.length}`);

  const { error } = await supabase
    .from("produtos_catalogo")
    .upsert(products, { onConflict: "empresa_id,codigo_cpl" });

  if (!error) {
    console.log(`[CPL-UPSERT] Upsert composto OK | empresa_id=${empresaId} | branch_id=${branchId} | qtd=${products.length}`);
    return { error: null };
  }

  console.error(`[CPL-UPSERT] Erro no upsert | empresa_id=${empresaId} | branch_id=${branchId} | code=${error.code} | msg=${error.message} | detail=${error.details ?? ''} | hint=${error.hint ?? ''}`);

  if (!isMissingConflictConstraint(error)) return { error };

  console.warn(`[CPL-UPSERT] Constraint composta ausente — acionando fallback legacy | empresa_id=${empresaId}`);
  return saveWithLegacyCodigoConflict(supabase, products);
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

    const { categoria, page, text, url: directUrl, empresa_id, branch_id } = await req.json();

    if (!empresa_id) {
      return new Response(
        JSON.stringify({ error: "empresa_id é obrigatório para importar o catálogo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const catFilter = categoria || CATEGORIES[0];
    const pageNum = page || 1;

    let url: string;
    if (directUrl) {
      url = directUrl;
    } else {
      const catAlias = catFilter.replace(/\//g, " / ");
      const searchText = text || catFilter;
      const textParam = searchText
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-");
      url = `https://app.cplmotoparts.com.br/catalogo-cpl-web/pesquisa/${pageNum}?text=${textParam}&filters=CATEGORIA%23${encodeURIComponent(catFilter)}&by_index=true&alias=${encodeURIComponent(catAlias)}`;
    }

    console.log(`Scraping: ${url}`);

    // Use Firecrawl to scrape the page
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
    const products = parseProducts(md, catFilter);

    console.log(`Found ${products.length} products for ${catFilter} page ${pageNum}`);

    // Skip individual color fetching to avoid timeouts
    // Colors can be fetched later via fetch-product-color function
    console.log(`Skipping color fetch for ${products.length} products (use fetch-product-color for batch color updates)`);

    // Check if there are more pages by looking for pagination indicators
    const hasMore = md.includes(`pesquisa/${pageNum + 1}`);

    // Upsert products into produtos_catalogo (per-empresa catalog)
    if (products.length > 0) {
      const empresaProducts = products.map((p) => ({
        empresa_id,
        branch_id: branch_id ?? null,
        codigo_cpl: p.codigo_cpl,
        nome: p.nome,
        marca: p.marca || "CPL",
        categoria: p.categoria,
        imagem_url: p.imagem_url,
        aplicacoes: p.aplicacoes,
        fornecedor: "CPL MOTOPARTS",
      }));

      for (let i = 0; i < empresaProducts.length; i += 500) {
        const chunk = empresaProducts.slice(i, i + 500);
        const { error } = await saveProducts(supabase, chunk);
        if (error) {
          console.error("DB upsert error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to save products", details: error }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        categoria: catFilter,
        page: pageNum,
        products_found: products.length,
        has_more: hasMore,
        categories: CATEGORIES,
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
