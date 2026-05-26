import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE");

async function enviarWhatsapp(numero: string, texto: string) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) return false;
  const r = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
    body: JSON.stringify({ number: numero, text: texto }),
  });
  return r.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const agora = new Date().toISOString();

    const { data: pendentes } = await sb
      .from("cadencia_execucoes")
      .select("*, cadencia:cadencias(*, passos:cadencia_passos(*))")
      .eq("status", "ativa")
      .lte("proximo_envio", agora)
      .limit(50);

    let enviados = 0;
    for (const exec of pendentes || []) {
      const passos = (exec.cadencia?.passos || []).sort((a: any, b: any) => a.ordem - b.ordem);
      const passo = passos[exec.passo_atual];
      if (!passo) {
        await sb.from("cadencia_execucoes").update({ status: "concluida" }).eq("id", exec.id);
        continue;
      }
      if (passo.canal === "whatsapp" && exec.contato_telefone) {
        const ok = await enviarWhatsapp(exec.contato_telefone, passo.mensagem);
        if (ok) enviados++;
      }
      const proximoIdx = exec.passo_atual + 1;
      const proximoPasso = passos[proximoIdx];
      if (proximoPasso) {
        const proximoEnvio = new Date(Date.now() + proximoPasso.delay_horas * 3600 * 1000).toISOString();
        await sb.from("cadencia_execucoes").update({ passo_atual: proximoIdx, proximo_envio: proximoEnvio }).eq("id", exec.id);
      } else {
        await sb.from("cadencia_execucoes").update({ status: "concluida", passo_atual: proximoIdx }).eq("id", exec.id);
      }
    }

    return new Response(JSON.stringify({ processados: pendentes?.length || 0, enviados }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
