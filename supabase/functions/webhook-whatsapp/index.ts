import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    console.log("Webhook WhatsApp payload:", JSON.stringify(payload).slice(0, 500));

    // Evolution API envia eventos com estrutura: { event, data, ... }
    const event = payload.event;
    const data = payload.data || payload;

    // Só processar mensagens recebidas
    if (event && event !== "messages.upsert") {
      return new Response(JSON.stringify({ ok: true, ignored: event }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extrair dados da mensagem (Evolution API v2 format)
    const messageData = data.message || data;
    const key = messageData.key || data.key;
    const pushName = messageData.pushName || data.pushName || "Visitante";

    if (!key || key.fromMe) {
      return new Response(JSON.stringify({ ok: true, skipped: "own_message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const from = key.remoteJid?.replace("@s.whatsapp.net", "") || "";
    const conteudo =
      messageData.message?.conversation ||
      messageData.message?.extendedTextMessage?.text ||
      data.message?.conversation ||
      data.message?.extendedTextMessage?.text;

    if (!from || !conteudo) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_content" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Mensagem de ${from} (${pushName}): ${conteudo}`);

    // 1. Buscar ou criar canal WhatsApp
    let { data: canal } = await supabase
      .from("canais_comunicacao")
      .select("id")
      .eq("tipo", "whatsapp")
      .eq("ativo", true)
      .limit(1)
      .single();

    if (!canal) {
      const { data: novoCan } = await supabase
        .from("canais_comunicacao")
        .insert({ tipo: "whatsapp", nome_exibicao: "WhatsApp", ativo: true, conectado: true })
        .select("id")
        .single();
      canal = novoCan;
    }

    if (!canal) throw new Error("Falha ao obter canal WhatsApp");

    // 2. Buscar ou criar conversa
    let { data: conversa } = await supabase
      .from("conversas")
      .select("id")
      .eq("contato_externo_id", from)
      .eq("canal_id", canal.id)
      .neq("status", "encerrada")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!conversa) {
      // Tentar vincular a cliente existente pelo telefone
      const { data: cliente } = await supabase
        .from("clientes")
        .select("id")
        .or(`telefone.eq.${from},whatsapp.eq.${from}`)
        .limit(1)
        .single();

      const { data: novaConversa } = await supabase
        .from("conversas")
        .insert({
          canal_id: canal.id,
          canal_tipo: "whatsapp",
          contato_externo_id: from,
          contato_nome: pushName,
          cliente_id: cliente?.id || null,
          status: "bot",
        })
        .select("id")
        .single();

      conversa = novaConversa;
    }

    if (!conversa) throw new Error("Falha ao criar conversa");

    // 3. Salvar mensagem do cliente
    await supabase.from("mensagens").insert({
      conversa_id: conversa.id,
      tipo_remetente: "cliente",
      tipo_mensagem: "texto",
      conteudo,
      id_externo: key.id || null,
      status_envio: "recebido",
    });

    // 4. Processar com IA via processar-mensagem
    const processarUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/processar-mensagem`;
    const respostaIA = await fetch(processarUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversa_id: conversa.id,
        mensagem_cliente: conteudo,
      }),
    });

    const iaData = await respostaIA.json();
    const respostaBot = iaData.resposta || "Desculpe, não consegui processar sua mensagem.";

    // 5. Enviar resposta via Evolution API
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE");

    if (EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE) {
      // Detectar botões no formato [texto]
      const temBotoes = respostaBot.match(/\[(.*?)\]/g);

      if (temBotoes && temBotoes.length <= 3) {
        const botoes = temBotoes.map((b: string) => b.replace(/\[|\]/g, ""));
        const textoLimpo = respostaBot.replace(/\[(.*?)\]/g, "").trim();

        await fetch(`${EVOLUTION_API_URL}/message/sendButtons/${EVOLUTION_INSTANCE}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
          body: JSON.stringify({
            number: from,
            text: textoLimpo,
            buttons: botoes.map((btn: string, i: number) => ({
              buttonId: `btn_${i}`,
              buttonText: { displayText: btn },
            })),
          }),
        });
      } else {
        await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
          body: JSON.stringify({ number: from, text: respostaBot }),
        });
      }

      console.log(`Resposta enviada para ${from}`);
    } else {
      console.warn("Evolution API não configurada — resposta salva mas não enviada via WhatsApp");
    }

    return new Response(
      JSON.stringify({ ok: true, conversa_id: conversa.id, resposta: respostaBot }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("webhook-whatsapp error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
