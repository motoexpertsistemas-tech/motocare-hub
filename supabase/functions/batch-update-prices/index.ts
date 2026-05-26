import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { produtos } = await req.json();
    // produtos = [{ codigo: "24812", preco: 64.70 }, ...]

    if (!Array.isArray(produtos) || produtos.length === 0) {
      return new Response(
        JSON.stringify({ error: "Array de produtos vazio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let atualizados = 0;
    let nao_encontrados: string[] = [];
    let erros: string[] = [];

    // Process in batches of 10 for parallel updates
    const batchSize = 10;
    for (let i = 0; i < produtos.length; i += batchSize) {
      const batch = produtos.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (p: { codigo: string; preco: number }) => {
          const { data, error } = await supabase
            .from("produtos_catalogo")
            .update({ 
              preco_custo: p.preco,
              atualizado_em: new Date().toISOString()
            })
            .eq("codigo_cpl", p.codigo)
            .select("id");

          if (error) {
            erros.push(`${p.codigo}: ${error.message}`);
            return 0;
          }
          if (!data || data.length === 0) {
            nao_encontrados.push(p.codigo);
            return 0;
          }
          return data.length;
        })
      );
      atualizados += results.reduce((a, b) => a + b, 0);
    }

    console.log(`Atualizados: ${atualizados}, Não encontrados: ${nao_encontrados.length}, Erros: ${erros.length}`);

    return new Response(
      JSON.stringify({
        atualizados,
        total_enviados: produtos.length,
        nao_encontrados,
        erros,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("batch-update-prices error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
