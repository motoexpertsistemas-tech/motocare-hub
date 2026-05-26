import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { codigo_cpl } = await req.json();

    if (!codigo_cpl) {
      return new Response(
        JSON.stringify({ error: "codigo_cpl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const productUrl = `https://app.cplmotoparts.com.br/catalogo-cpl-web/produto/${codigo_cpl}`;
    console.log(`Fetching color from: ${productUrl}`);

    const scrapeRes = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ["markdown"],
        waitFor: 2000,
      }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      console.error("Firecrawl error:", scrapeData);
      return new Response(
        JSON.stringify({ error: "Firecrawl scrape failed", details: scrapeData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const md = scrapeData.data?.markdown || scrapeData.markdown || "";

    // Extract color from the product detail table: | **Cor** | VALUE |
    const corMatch = md.match(/\*\*Cor\*\*\s*\|\s*([^|\n]+)/);
    const corRaw = corMatch ? corMatch[1].trim().replace(/\*+/g, "").replace(/\\+/g, "").trim() : null;
    const cor = corRaw && corRaw.length > 0 ? corRaw : null;

    console.log(`Product ${codigo_cpl} color: ${cor}`);

    // Update the product in the database
    if (cor && cor !== "***" && cor !== "---" && cor.length > 0) {
      const { error } = await supabase
        .from("produtos_catalogo")
        .update({ cor })
        .eq("codigo_cpl", codigo_cpl);

      if (error) {
        console.error("DB update error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update product color", details: error }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, codigo_cpl, cor }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
