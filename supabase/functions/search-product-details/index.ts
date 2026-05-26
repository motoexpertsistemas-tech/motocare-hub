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
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    // Step 1: Try to scrape CPL Motoparts for real product data + image
    let scrapedContent = "";
    let scrapedImageUrl: string | null = null;

    if (FIRECRAWL_API_KEY) {
      try {
        const searchUrl = `https://app.cplmotoparts.com.br/catalogo-cpl-web/pesquisa/1?text=${encodeURIComponent(query)}`;
        console.log("Scraping CPL:", searchUrl);

        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: searchUrl,
            formats: ["markdown", "html"],
            waitFor: 8000,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
          const html = scrapeData?.data?.html || scrapeData?.html || "";
          scrapedContent = markdown;
          console.log("CPL scrape successful, content length:", markdown.length);

          // Extract product images from HTML - try multiple patterns
          const imgPatterns = [
            // src="..." pattern
            /src=["'](https?:\/\/[^"']*\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi,
            // data-src or data-original (lazy-loaded images)
            /data-(?:src|original|lazy|image)=["'](https?:\/\/[^"']*\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi,
            // background-image: url(...)
            /url\(["']?(https?:\/\/[^"')]*\.(?:jpg|jpeg|png|webp)(?:\?[^"')]*)?)["']?\)/gi,
            // Plain URLs in content
            /(https?:\/\/[^\s"'<>]*\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?)/gi,
          ];

          const skipTerms = ["logo", "icon", "favicon", "banner", "sprite", "pixel", "tracking", "1x1"];
          let match;

          for (const regex of imgPatterns) {
            if (scrapedImageUrl) break;
            while ((match = regex.exec(html)) !== null) {
              const url = match[1];
              if (skipTerms.some(t => url.toLowerCase().includes(t))) continue;
              scrapedImageUrl = url;
              console.log("Found product image:", url);
              break;
            }
          }

          // Also try markdown image syntax from the markdown content
          if (!scrapedImageUrl && markdown) {
            const mdImgRegex = /!\[[^\]]*\]\((https?:\/\/[^)]*\.(?:jpg|jpeg|png|webp)(?:\?[^)]*)?)\)/gi;
            while ((match = mdImgRegex.exec(markdown)) !== null) {
              const url = match[1];
              if (skipTerms.some(t => url.toLowerCase().includes(t))) continue;
              scrapedImageUrl = url;
              console.log("Found image from markdown:", url);
              break;
            }
          }

          if (!scrapedImageUrl) {
            console.log("No product image found in scraped content. HTML length:", html.length, "MD length:", markdown.length);
          }
        } else {
          console.error("CPL scrape failed:", scrapeResponse.status, await scrapeResponse.text());
        }
      } catch (scrapeErr) {
        console.error("Firecrawl error:", scrapeErr);
      }
    } else {
      console.log("FIRECRAWL_API_KEY not configured, skipping scrape");
    }

    // Step 1b: If no image found via CPL, try Google Images as fallback
    if (!scrapedImageUrl && FIRECRAWL_API_KEY) {
      try {
        const simpleQuery = query.replace(/\(.*?\)/g, "").replace(/-PAR|-UN|-CX/gi, "").trim();
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(simpleQuery + " peça moto")}&tbm=isch`;
        console.log("Trying Google Images fallback:", googleUrl);

        const googleResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: googleUrl, formats: ["html"], waitFor: 5000 }),
        });

        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          const gHtml = googleData?.data?.html || googleData?.html || "";
          const googleImgPatterns = [
            /\["(https?:\/\/[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)",\s*\d+,\s*\d+\]/gi,
            /src=["'](https?:\/\/(?!www\.gstatic|encrypted)[^"']*\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi,
          ];
          const gSkip = ["gstatic", "google", "favicon", "icon", "logo", "1x1", "pixel"];
          let gMatch;
          for (const regex of googleImgPatterns) {
            if (scrapedImageUrl) break;
            while ((gMatch = regex.exec(gHtml)) !== null) {
              const url = gMatch[1];
              if (gSkip.some(t => url.toLowerCase().includes(t))) continue;
              if (url.length > 30) {
                scrapedImageUrl = url;
                console.log("Found image via Google fallback:", url);
                break;
              }
            }
          }
          if (!scrapedImageUrl) console.log("No image in Google fallback. HTML len:", gHtml.length);
        }
      } catch (gErr) {
        console.error("Google Images fallback error:", gErr);
      }
    }

    // Step 2: Use Gemini to generate description + image URL
    const needsImage = !scrapedImageUrl;
    const systemPrompt = `Você é um assistente especializado em peças e acessórios para motos e veículos.
O usuário vai informar o nome de um produto. Você deve retornar informações detalhadas sobre esse produto.

${scrapedContent ? `Use as informações abaixo do catálogo CPL Motoparts como referência:\n\n${scrapedContent.substring(0, 3000)}` : ""}

Responda APENAS com um JSON válido (sem markdown, sem backticks) com a seguinte estrutura:
{
  "descricao": "descrição detalhada do produto (máx 500 caracteres), explicando o que é, para que serve, material, características principais"${needsImage ? `,
  "imagem_url": "URL direta de uma imagem real do produto (JPG/PNG/WebP). Procure em sites como cplmotoparts.com.br, mercadolivre.com.br, shopee.com.br. Se não encontrar uma URL válida, use null"` : ""}
}

${needsImage ? "IMPORTANTE: Para imagem_url, forneça a URL DIRETA do arquivo de imagem (que termina em .jpg, .png, .webp ou contém image no path). NÃO forneça URLs de páginas web." : ""}
Seja preciso e conciso na descrição.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Busque detalhes sobre o produto: ${query}` },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Erro no gateway de IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      parsed = { descricao: content };
    }

    // Use scraped image if found, otherwise use AI-suggested image
    if (scrapedImageUrl) {
      parsed.imagem_url = scrapedImageUrl;
    }
    // Validate AI-provided image URL
    if (parsed.imagem_url && typeof parsed.imagem_url === "string") {
      if (!parsed.imagem_url.startsWith("http")) {
        parsed.imagem_url = null;
      }
    }
    console.log("Final image URL:", parsed.imagem_url);

    // Download the image and re-upload to Supabase Storage for reliability
    if (parsed.imagem_url) {
      try {
        console.log("Downloading image to re-upload to storage...");
        const imgRes = await fetch(parsed.imagem_url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": new URL(parsed.imagem_url).origin + "/",
          },
          redirect: "follow",
        });
        if (imgRes.ok) {
          const blob = await imgRes.blob();
          const contentType = imgRes.headers.get("content-type") || "image/jpeg";
          const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
          const fileName = `ai-search/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

          const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
          const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          console.log("Service role key length:", SUPABASE_SERVICE_ROLE_KEY?.length, "URL:", SUPABASE_URL);

          const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          const arrayBuffer = await blob.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);

          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from("product-images")
            .upload(fileName, uint8, {
              contentType,
              upsert: true,
            });

          if (uploadError) {
            console.error("Storage upload failed:", JSON.stringify(uploadError));
          } else {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from("product-images")
              .getPublicUrl(fileName);
            console.log("Image re-uploaded to storage:", publicUrlData.publicUrl);
            parsed.imagem_url = publicUrlData.publicUrl;
          }
        } else {
          console.error("Image download failed:", imgRes.status);
        }
      } catch (imgErr) {
        console.error("Image re-upload error:", imgErr);
      }
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-product-details error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
