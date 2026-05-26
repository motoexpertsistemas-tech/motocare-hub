import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { objecao, contexto, empresa_id } = await req.json();
    if (!objecao || typeof objecao !== "string") {
      return new Response(JSON.stringify({ error: "Objeção é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    // Consulta brain da empresa para enriquecer resposta
    let brainContexto = "";
    if (empresa_id) {
      try {
        const supaUrl = Deno.env.get("SUPABASE_URL");
        const r = await fetch(`${supaUrl}/functions/v1/consultar-brain`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: Deno.env.get("SUPABASE_ANON_KEY") || "" },
          body: JSON.stringify({ empresa_id, query: objecao, top_k: 3 }),
        });
        if (r.ok) {
          const j = await r.json();
          if (j.contexto) brainContexto = `\n\nBase de conhecimento da empresa:\n${j.contexto}`;
        }
      } catch {}
    }

    const prompt = `Você é um especialista em vendas de oficina mecânica/auto peças no Brasil.
Cliente disse: "${objecao}"
${contexto ? `Contexto: ${contexto}` : ""}${brainContexto}

Gere uma resposta CURTA (max 3 frases), empática, profissional, em português, que contorne a objeção sem ser agressivo.
Use linguagem natural de WhatsApp. Não invente dados nem prometa preço.
Responda APENAS o texto da mensagem para enviar ao cliente, sem aspas, sem rótulos.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Muitas requisições. Tente em instantes." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "Créditos AI esgotados. Adicione no workspace." }),
      { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: `AI Gateway: ${r.status} ${t.slice(0,200)}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await r.json();
    const resposta = data.choices?.[0]?.message?.content?.trim() || "";
    return new Response(JSON.stringify({ resposta }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
