import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const slug = url.searchParams.get("slug");
      if (!slug) throw new Error("slug obrigatório");
      const { data, error } = await sb.from("empresas")
        .select("id, nome, slug, telefone, logo_url").eq("slug", slug).maybeSingle();
      if (error || !data) throw new Error("Empresa não encontrada");
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { slug, nome_cliente, telefone, veiculo, servico, data_agendada, observacoes } = body;
    if (!slug || !nome_cliente || !telefone || !data_agendada) throw new Error("Campos obrigatórios faltando");

    const { data: emp } = await sb.from("empresas").select("id").eq("slug", slug).maybeSingle();
    if (!emp) throw new Error("Empresa não encontrada");

    const { data, error } = await sb.from("agendamentos_publicos").insert({
      empresa_id: emp.id, nome_cliente, telefone, veiculo, servico,
      data_agendada, observacoes, status: "pendente",
    }).select().single();
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
