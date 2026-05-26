import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const { nome, marca, codigo, categoria } = await req.json();
    if (!nome) {
      return new Response(JSON.stringify({ error: "nome é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const cleanName = String(nome)
      .replace(/\(.*?\)/g, "")
      .replace(/-PAR|-UN|-CX|-UND/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    const queryParts = [cleanName];
    if (marca) queryParts.push(String(marca));
    if (categoria) queryParts.push(String(categoria));
    const baseQuery = queryParts.join(" ");

    console.log("[fetch-single-product-image] query:", baseQuery);

    let imageUrl: string | null = null;

    // Strategy 1: Firecrawl v2 search with images source
    try {
      const searchRes = await fetch("https://api.firecrawl.dev/v2/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: baseQuery,
          limit: 8,
          sources: ["images"],
        }),
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        console.log("[fetch-single-product-image] firecrawl search keys:", Object.keys(searchData?.data || {}));
        const images = searchData?.data?.images || searchData?.images || [];
        const skip = ["gstatic", "favicon", "logo", "1x1", "pixel", "tracking", "sprite"];
        for (const img of images) {
          const url = img?.imageUrl || img?.url || img?.src;
          if (!url || typeof url !== "string") continue;
          if (skip.some((t) => url.toLowerCase().includes(t))) continue;
          if (url.length > 30) {
            imageUrl = url;
            break;
          }
        }
      } else {
        const errBody = await searchRes.text();
        console.log("[fetch-single-product-image] firecrawl search failed:", searchRes.status, errBody.slice(0, 300));
      }
    } catch (e) {
      console.log("[fetch-single-product-image] firecrawl search error:", e instanceof Error ? e.message : e);
    }

    // Strategy 2: Fallback - scrape Bing Images (more scrape-friendly than Google)
    if (!imageUrl) {
      try {
        const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(baseQuery)}&form=HDRSC2`;
        const scrapeRes = await fetch("https://api.firecrawl.dev/v2/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: bingUrl, formats: ["html"], waitFor: 2000, onlyMainContent: false }),
        });

        if (scrapeRes.ok) {
          const scrapeData = await scrapeRes.json();
          const html = scrapeData?.data?.html || scrapeData?.html || "";
          // Bing embeds image URLs in murl="https://..."
          const murlRegex = /murl&quot;:&quot;(https?:\/\/[^"&]+\.(?:jpg|jpeg|png|webp)[^"&]*)/gi;
          const altRegex = /"murl":"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi;
          const skip = ["bing.com", "favicon", "logo", "1x1", "pixel", "sprite"];
          for (const regex of [murlRegex, altRegex]) {
            if (imageUrl) break;
            let m;
            while ((m = regex.exec(html)) !== null) {
              const url = m[1].replace(/\\u002f/g, "/");
              if (skip.some((t) => url.toLowerCase().includes(t))) continue;
              if (url.length > 30) { imageUrl = url; break; }
            }
          }
        }
      } catch (e) {
        console.log("[fetch-single-product-image] bing scrape error:", e instanceof Error ? e.message : e);
      }
    }

    if (!imageUrl) {
      return new Response(JSON.stringify({ success: false, error: "Nenhuma imagem encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[fetch-single-product-image] found image:", imageUrl.slice(0, 120));

    // Download and re-upload to Supabase Storage
    try {
      const imgRes = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "image/*,*/*;q=0.8",
          "Referer": new URL(imageUrl).origin + "/",
        },
        redirect: "follow",
      });

      if (!imgRes.ok) throw new Error(`Falha ao baixar imagem (status ${imgRes.status})`);

      const blob = await imgRes.blob();
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const safeCode = (codigo || "ai").toString().replace(/[^a-zA-Z0-9-_]/g, "");
      const fileName = `ai-search/${safeCode}-${Date.now()}.${ext}`;

      const arrayBuffer = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, uint8, { contentType, upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      return new Response(
        JSON.stringify({ success: true, image_url: publicUrlData.publicUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (imgErr) {
      console.log("[fetch-single-product-image] reupload failed, returning external URL:", imgErr instanceof Error ? imgErr.message : imgErr);
      return new Response(
        JSON.stringify({ success: true, image_url: imageUrl, warning: "URL externa (não rehospedada)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("fetch-single-product-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
