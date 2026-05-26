import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { prompt, count = 1, images = [] } = await req.json();
    if (!prompt) throw new Error("prompt is required");

    const results: { imageUrl?: string; text: string }[] = [];

    for (let i = 0; i < Math.min(count, 10); i++) {
      // Build user message content — multimodal if images provided
      let userContent: any;
      const textPart = `${prompt}\n\nVariação ${i + 1} de ${count}. Gere uma imagem criativa e profissional única para este anúncio/foto.`;

      if (images.length > 0) {
        userContent = [
          { type: "text", text: textPart },
          ...images.slice(0, 3).map((img: string) => ({
            type: "image_url",
            image_url: { url: img },
          })),
        ];
      } else {
        userContent = textPart;
      }

      const systemPrompt = `Você é um diretor criativo especialista em publicidade digital e geração de conteúdo visual.
Gere imagens criativas e profissionais para campanhas publicitárias.
Crie visuais impactantes, inovadores e focados em conversão.
Sempre gere uma IMAGEM visual do criativo/anúncio, nunca apenas texto.${images.length > 0 ? "\nQuando imagens de referência forem fornecidas, mantenha o estilo visual, cores, composição e identidade visual dessas referências. Crie variações que preservem a essência visual original." : ""}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          return new Response(
            JSON.stringify({ error: "Muitas requisições! Aguarde alguns segundos e tente novamente. ⏳" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (status === 402) {
          return new Response(
            JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errText = await response.text();
        console.error("AI Gateway error:", status, errText);
        throw new Error(`AI error: ${status}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || "";
      const imageBase64 = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      let imageUrl: string | undefined;

      if (imageBase64) {
        try {
          // Extract base64 data (remove data:image/png;base64, prefix if present)
          const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }

          const fileName = `criativos/${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}.png`;

          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(fileName, bytes, { contentType: "image/png", upsert: true });

          if (uploadError) {
            console.error("Upload error:", uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from("product-images")
              .getPublicUrl(fileName);
            imageUrl = urlData?.publicUrl;
          }
        } catch (uploadErr) {
          console.error("Image processing error:", uploadErr);
        }
      }

      results.push({ imageUrl, text });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gerar-criativos error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
