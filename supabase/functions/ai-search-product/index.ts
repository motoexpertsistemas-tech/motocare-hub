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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { image_base64, audio_text } = await req.json();

    // Step 1: Use Gemini to identify the part from image or audio text
    let identifyPrompt: any[];

    if (image_base64) {
      identifyPrompt = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Você é um especialista em peças de motos. Analise esta foto de uma peça (pode ser usada/velha) e identifique:
1. O nome da peça (em português, como é chamada no mercado de autopeças para motos)
2. Possíveis modelos de moto compatíveis
3. Palavras-chave para buscar no catálogo

Responda SOMENTE em formato JSON assim:
{"nome_peca": "nome da peça", "modelos": ["TITAN 150", "CG 160"], "palavras_chave": ["palavra1", "palavra2", "palavra3"]}

Se não conseguir identificar, retorne: {"nome_peca": "não identificada", "modelos": [], "palavras_chave": []}`,
            },
            {
              type: "image_url",
              image_url: { url: image_base64 },
            },
          ],
        },
      ];
    } else if (audio_text) {
      identifyPrompt = [
        {
          role: "user",
          content: `Você é um especialista em peças de motos. O cliente descreveu a peça assim: "${audio_text}"

Identifique:
1. O nome técnico da peça (em português, como é chamada no mercado de autopeças para motos)
2. Possíveis modelos de moto compatíveis
3. Palavras-chave para buscar no catálogo

Responda SOMENTE em formato JSON assim:
{"nome_peca": "nome da peça", "modelos": ["TITAN 150", "CG 160"], "palavras_chave": ["palavra1", "palavra2", "palavra3"]}`,
        },
      ];
    } else {
      return new Response(
        JSON.stringify({ error: "Envie uma foto ou texto de áudio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Gemini via Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: identifyPrompt,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas buscas por IA. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    console.log("AI raw response:", aiContent);

    // Parse JSON from response
    let parsed: { nome_peca: string; modelos: string[]; palavras_chave: string[] };
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { nome_peca: "não identificada", modelos: [], palavras_chave: [] };
    } catch {
      parsed = { nome_peca: "não identificada", modelos: [], palavras_chave: [] };
    }

    // Step 2: Search in the catalog
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const searchTerms = [parsed.nome_peca, ...parsed.palavras_chave, ...parsed.modelos]
      .filter(Boolean)
      .map((t) => t.toUpperCase());

    console.log("Searching terms:", searchTerms);

    // Build ilike search across name, description, aplicacoes
    let query = supabase
      .from("produtos_catalogo")
      .select("id, nome, codigo, preco_venda, preco_custo, foto_url, fornecedor, categoria, aplicacoes, estoque_atual")
      .limit(20);

    // Use OR search with the top keywords
    const orFilters = searchTerms
      .slice(0, 5)
      .flatMap((term) => [
        `nome.ilike.%${term}%`,
        `categoria.ilike.%${term}%`,
      ]);

    if (orFilters.length > 0) {
      query = query.or(orFilters.join(","));
    }

    const { data: products, error: dbError } = await query;

    if (dbError) {
      console.error("DB error:", dbError);
    }

    // Step 3: Generate a friendly response
    const hasResults = products && products.length > 0;

    let mensagem: string;
    if (hasResults) {
      mensagem = `Encontrei ${products.length} resultado(s) para "${parsed.nome_peca}". Confira abaixo! 👇`;
    } else if (parsed.nome_peca === "não identificada") {
      mensagem = "Não consegui identificar a peça. Tente tirar uma foto mais nítida ou descreva a peça por áudio.";
    } else {
      mensagem = `Identifiquei como "${parsed.nome_peca}", mas não encontrei no catálogo no momento. Entre em contato pelo WhatsApp para verificarmos disponibilidade!`;
    }

    return new Response(
      JSON.stringify({
        identificacao: parsed,
        mensagem,
        produtos: products || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ai-search-product error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
