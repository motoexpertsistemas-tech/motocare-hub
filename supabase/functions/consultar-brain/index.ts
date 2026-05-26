import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { empresa_id, query, top_k = 4 } = await req.json();
    if (!empresa_id || !query) throw new Error("empresa_id e query obrigatórios");

    const er = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/text-embedding-3-small", input: query, dimensions: 1536 }),
    });
    if (!er.ok) throw new Error(`embed ${er.status}`);
    const ej = await er.json();
    const queryEmbedding = ej.data[0].embedding;

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data, error } = await sb.rpc("match_brain", {
      p_empresa_id: empresa_id, query_embedding: queryEmbedding, match_count: top_k,
    });
    if (error) throw error;

    const contexto = (data || []).map((r: any, i: number) => `[${i + 1}] ${r.conteudo}`).join("\n\n");
    return new Response(JSON.stringify({ matches: data, contexto }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
