import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sandbox base URL
const ASAAS_BASE_URL = "https://api-sandbox.asaas.com/v3";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
  if (!asaasApiKey) {
    return new Response(
      JSON.stringify({ error: "ASAAS_API_KEY não configurada" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    const headers = {
      "Content-Type": "application/json",
      access_token: asaasApiKey,
    };

    // ── Action: criar_cliente ──
    if (action === "criar_cliente") {
      const { nome, cpfCnpj, email, telefone } = body;
      const res = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: nome,
          cpfCnpj,
          email,
          mobilePhone: telefone,
        }),
      });
      const resText = await res.text();
      console.log("Asaas criar_cliente status:", res.status, "body:", resText);
      let data;
      try { data = JSON.parse(resText); } catch { data = { raw: resText }; }
      if (!res.ok) throw new Error(`Asaas ${res.status}: ${resText}`);
      return new Response(JSON.stringify({ success: true, cliente: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Action: criar_cobranca ──
    if (action === "criar_cobranca") {
      const { customerId, valor, descricao, formaPagamento } = body;

      // formaPagamento: BOLETO, PIX, CREDIT_CARD
      const payload: Record<string, unknown> = {
        customer: customerId,
        billingType: formaPagamento,
        value: valor,
        description: descricao || "Compra e-commerce",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      };

      const res = await fetch(`${ASAAS_BASE_URL}/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));

      // If PIX, get QR code
      let pixData = null;
      if (formaPagamento === "PIX" && data.id) {
        const pixRes = await fetch(
          `${ASAAS_BASE_URL}/payments/${data.id}/pixQrCode`,
          { headers }
        );
        if (pixRes.ok) {
          pixData = await pixRes.json();
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          cobranca: data,
          pix: pixData,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Action: consultar_cobranca ──
    if (action === "consultar_cobranca") {
      const { paymentId } = body;
      const res = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
        headers,
      });
      const data = await res.json();
      return new Response(JSON.stringify({ success: true, cobranca: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Ação não reconhecida. Use: criar_cliente, criar_cobranca, consultar_cobranca" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro Asaas:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
