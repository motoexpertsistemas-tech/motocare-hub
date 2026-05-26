import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function chunkText(text: string, size = 1000, overlap = 150): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks;
}

async function embed(input: string[]): Promise<number[][]> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "openai/text-embedding-3-small", input, dimensions: 1536 }),
  });
  if (!r.ok) throw new Error(`embed ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.data.map((d: any) => d.embedding);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { fonte_id } = await req.json();
    if (!fonte_id) throw new Error("fonte_id obrigatório");

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: fonte, error } = await sb.from("brain_fontes").select("*").eq("id", fonte_id).single();
    if (error || !fonte) throw new Error("Fonte não encontrada");

    await sb.from("brain_fontes").update({ status: "processando" }).eq("id", fonte_id);
    await sb.from("brain_chunks").delete().eq("fonte_id", fonte_id);

    const chunks = chunkText(fonte.conteudo);
    // process in batches of 20
    let total = 0;
    for (let i = 0; i < chunks.length; i += 20) {
      const slice = chunks.slice(i, i + 20);
      const embs = await embed(slice);
      const rows = slice.map((c, idx) => ({
        empresa_id: fonte.empresa_id, fonte_id, conteudo: c, embedding: embs[idx] as any,
      }));
      const { error: e2 } = await sb.from("brain_chunks").insert(rows);
      if (e2) throw e2;
      total += rows.length;
    }

    await sb.from("brain_fontes").update({ status: "pronto", total_chunks: total }).eq("id", fonte_id);
    return new Response(JSON.stringify({ success: true, total }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
