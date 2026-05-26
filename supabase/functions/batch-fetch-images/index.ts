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
    const { batch_size = 10, offset = 0 } = await req.json();
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get products without images
    const { data: products, error: fetchError } = await supabase
      .from("produtos_catalogo")
      .select("id, nome, codigo_cpl")
      .or("imagem_url.is.null,imagem_url.eq.")
      .order("nome", { ascending: true })
      .range(offset, offset + batch_size - 1);

    if (fetchError) throw fetchError;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0, found: 0, remaining: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count remaining
    const { count: remaining } = await supabase
      .from("produtos_catalogo")
      .select("id", { count: "exact", head: true })
      .or("imagem_url.is.null,imagem_url.eq.");

    let found = 0;
    const results: { id: string; nome: string; image_url: string | null }[] = [];

    for (const product of products) {
      try {
        // Clean product name for search
        const searchName = product.nome
          .replace(/\(.*?\)/g, "")
          .replace(/-PAR|-UN|-CX|-UND/gi, "")
          .replace(/\s+/g, " ")
          .trim();

        // Try Google Images search via Firecrawl
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchName + " peça moto")}&tbm=isch`;
        
        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: googleUrl, formats: ["html"], waitFor: 3000 }),
        });

        let imageUrl: string | null = null;

        if (scrapeRes.ok) {
          const scrapeData = await scrapeRes.json();
          const html = scrapeData?.data?.html || scrapeData?.html || "";
          
          const imgPatterns = [
            /\["(https?:\/\/[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)",\s*\d+,\s*\d+\]/gi,
            /src=["'](https?:\/\/(?!www\.gstatic|encrypted)[^"']*\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi,
          ];
          const skip = ["gstatic", "google", "favicon", "icon", "logo", "1x1", "pixel", "tracking"];

          for (const regex of imgPatterns) {
            if (imageUrl) break;
            let match;
            while ((match = regex.exec(html)) !== null) {
              const url = match[1];
              if (skip.some(t => url.toLowerCase().includes(t))) continue;
              if (url.length > 30) {
                imageUrl = url;
                break;
              }
            }
          }
        }

        // If we found an image, download and re-upload to Supabase Storage
        if (imageUrl) {
          try {
            const imgRes = await fetch(imageUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "image/*,*/*;q=0.8",
                "Referer": new URL(imageUrl).origin + "/",
              },
              redirect: "follow",
            });

            if (imgRes.ok) {
              const blob = await imgRes.blob();
              const contentType = imgRes.headers.get("content-type") || "image/jpeg";
              const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
              const fileName = `batch/${product.codigo_cpl}-${Date.now()}.${ext}`;

              const arrayBuffer = await blob.arrayBuffer();
              const uint8 = new Uint8Array(arrayBuffer);

              const { error: uploadError } = await supabase.storage
                .from("product-images")
                .upload(fileName, uint8, { contentType, upsert: true });

              if (!uploadError) {
                const { data: publicUrlData } = supabase.storage
                  .from("product-images")
                  .getPublicUrl(fileName);

                const finalUrl = publicUrlData.publicUrl;

                // Update product
                await supabase
                  .from("produtos_catalogo")
                  .update({ imagem_url: finalUrl })
                  .eq("id", product.id);

                found++;
                results.push({ id: product.id, nome: product.nome, image_url: finalUrl });
                console.log(`✅ ${product.codigo_cpl}: image saved`);
              }
            }
          } catch (imgErr) {
            console.error(`Image download error for ${product.codigo_cpl}:`, imgErr);
          }
        } else {
          console.log(`❌ ${product.codigo_cpl}: no image found`);
          results.push({ id: product.id, nome: product.nome, image_url: null });
        }

        // Small delay between requests to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`Error processing ${product.codigo_cpl}:`, err);
        results.push({ id: product.id, nome: product.nome, image_url: null });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: products.length,
      found,
      remaining: (remaining || 0) - found,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("batch-fetch-images error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
