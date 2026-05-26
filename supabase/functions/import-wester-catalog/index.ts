import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { products } = await req.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(
        JSON.stringify({ error: "products array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create queue job
    const { data: job, error: jobError } = await supabase
      .from("import_queue")
      .insert({
        fornecedor: "Wester",
        status: "processando",
        total_produtos: products.length,
      })
      .select()
      .single();

    if (jobError) {
      console.error("Failed to create queue job:", jobError);
      return new Response(
        JSON.stringify({ error: "Failed to create import job" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check existing codes to count duplicates
    const codes = products.map((p: any) => p.codigo_cpl);
    const { data: existing } = await supabase
      .from("produtos_catalogo")
      .select("codigo_cpl")
      .in("codigo_cpl", codes);

    const existingCodes = new Set((existing || []).map((r: any) => r.codigo_cpl));
    const duplicates = products.filter((p: any) => existingCodes.has(p.codigo_cpl)).length;
    const newProducts = products.length - duplicates;

    // 3. Batch upsert into catalogo_master in chunks of 500
    let inserted = 0;
    let errorMsg: string | null = null;

    for (let i = 0; i < products.length; i += 500) {
      const chunk = products.slice(i, i + 500).map((p: any) => ({
        codigo: p.codigo_cpl,
        nome: p.nome,
        marca: p.marca || "WESTER",
        categoria: p.categoria,
        imagem_url: p.imagem_url,
        aplicacoes: p.aplicacoes,
        fornecedor: p.fornecedor || "WESTER",
        descricao: p.descricao,
      }));
      const { error } = await supabase
        .from("catalogo_master")
        .upsert(chunk, { onConflict: "codigo" });
      if (error) {
        console.error("DB upsert error:", error);
        errorMsg = error.message;
      } else {
        inserted += chunk.length;
      }
    }

    // 4. Update queue job with results
    await supabase
      .from("import_queue")
      .update({
        status: errorMsg ? "erro" : "concluido",
        produtos_inseridos: newProducts,
        produtos_duplicados: duplicates,
        erro: errorMsg,
        finalizado_em: new Date().toISOString(),
      })
      .eq("id", job.id);

    console.log(`Wester catalog: ${inserted} upserted (${newProducts} new, ${duplicates} updated)`);

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        inserted,
        new_products: newProducts,
        duplicates,
        total: products.length,
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
