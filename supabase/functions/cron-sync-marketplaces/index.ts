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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all active integrations
    const { data: integracoes } = await supabase
      .from("marketplace_integracoes")
      .select("id, marketplace")
      .eq("ativo", true);

    const resultados: any[] = [];

    for (const integracao of integracoes || []) {
      try {
        // Call sync-mercado-livre for each ML integration
        if (integracao.marketplace === "mercado_livre") {
          const syncUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-mercado-livre`;
          const res = await fetch(syncUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              action: "sincronizar",
              integracao_id: integracao.id,
            }),
          });
          const data = await res.json();
          resultados.push({ marketplace: "mercado_livre", ...data });
        }
        // Add other marketplaces here as needed
      } catch (error) {
        console.error(`Erro ${integracao.marketplace}:`, error);
        resultados.push({
          marketplace: integracao.marketplace,
          success: false,
          error: String(error),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sincronizacoes: resultados.length,
        resultados,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no cron:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
