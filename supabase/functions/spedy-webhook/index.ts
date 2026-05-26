import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Spedy webhook received:", JSON.stringify(payload));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Real Spedy webhook format: { id, event, data: { id, status, ... } }
    const eventData = payload?.data || payload;
    const spedyNotaId = eventData?.id || payload?.invoiceId;

    if (!spedyNotaId) {
      console.log("No invoice ID in webhook payload");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the nota fiscal by spedy_nota_id
    const { data: nota } = await adminClient
      .from("notas_fiscais")
      .select("id, empresa_id, tipo_nota")
      .eq("spedy_nota_id", spedyNotaId)
      .single();

    if (!nota) {
      console.log("Nota fiscal not found for spedy_nota_id:", spedyNotaId);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map Spedy status to our status
    const spedyStatus = eventData?.status || "";
    const statusMap: Record<string, string> = {
      authorized: "autorizada",
      canceled: "cancelada",
      denied: "denegada",
      rejected: "rejeitada",
      enqueued: "processando",
      created: "processando",
      received: "processando",
    };

    const mappedStatus = statusMap[spedyStatus] || "processando";

    // Build update object
    const updateData: Record<string, any> = {
      status: mappedStatus,
      spedy_status: spedyStatus,
    };

    // processingDetail from webhook
    if (eventData.processingDetail) {
      updateData.processing_detail = eventData.processingDetail;
    }

    // accessKey (chave de acesso)
    if (eventData.accessKey) {
      updateData.chave_acesso = eventData.accessKey;
    }

    // number
    if (eventData.number) {
      updateData.numero_nota = eventData.number;
    }

    // authorization object (real format)
    if (eventData.authorization?.protocol) {
      updateData.protocolo_autorizacao = eventData.authorization.protocol;
    }
    if (eventData.authorization?.date) {
      updateData.data_autorizacao = eventData.authorization.date;
    }

    // Build XML/PDF URLs from the Spedy API (not in webhook payload)
    // Format: {baseUrl}/{endpoint}/{id}/xml or /pdf
    // We don't have baseUrl in webhook context, but we store the spedy_nota_id
    // so the frontend can request via proxy

    // Cancellation
    if (mappedStatus === "cancelada") {
      updateData.cancelada = true;
      updateData.cancelada_em = new Date().toISOString();
    }

    // Update the nota fiscal
    await adminClient
      .from("notas_fiscais")
      .update(updateData)
      .eq("id", nota.id);

    // Log the webhook
    await adminClient.from("spedy_logs").insert({
      empresa_id: nota.empresa_id,
      nota_fiscal_id: nota.id,
      operacao: "webhook",
      endpoint: `webhook/${payload?.event || "unknown"}`,
      metodo: "POST",
      request_body: payload,
      status_code: 200,
      response_body: updateData,
      sucesso: true,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Spedy webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
