import { corsHeaders } from '@supabase/supabase-js/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { conversa_id } = await req.json();
    if (!conversa_id) {
      return new Response(JSON.stringify({ error: 'conversa_id obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: msgs } = await supabase
      .from('mensagens').select('tipo_remetente, conteudo, created_at')
      .eq('conversa_id', conversa_id).order('created_at', { ascending: true }).limit(80);

    if (!msgs || msgs.length === 0) {
      return new Response(JSON.stringify({ error: 'Sem mensagens' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const transcript = msgs.map((m: any) =>
      `[${m.tipo_remetente}] ${m.conteudo || ''}`).join('\n');

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você analisa conversas de atendimento ao cliente em pt-BR. Responda SEMPRE em JSON válido.' },
          { role: 'user', content: `Analise a conversa abaixo e retorne JSON com:
{
  "nota": número de 0 a 10 da qualidade do atendimento,
  "tom": "amigável" | "neutro" | "tenso" | "frio",
  "pontos_fortes": ["..."],
  "a_melhorar": ["..."],
  "resumo": "1 frase",
  "intencao_cliente": "..."
}

CONVERSA:
${transcript}` },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: 'Limite de IA atingido. Tente novamente em instantes.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos no Lovable.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      return new Response(JSON.stringify({ error: 'Falha na IA', detail: t }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await aiResp.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const analise = JSON.parse(content);

    return new Response(JSON.stringify({ analise }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
