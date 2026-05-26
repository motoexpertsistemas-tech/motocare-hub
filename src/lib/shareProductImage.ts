import { supabase } from "@/integrations/supabase/client";

/**
 * Draws the product image on a canvas with the product code overlaid,
 * uploads to Supabase Storage, and returns the public URL.
 */
export async function generateProductShareImage(
  imageUrl: string,
  codigoCpl: string,
  empresaId?: string | null
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const bandHeight = Math.max(40, Math.round(h * 0.1));
      canvas.width = w;
      canvas.height = h + bandHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }

      // Draw product image
      ctx.drawImage(img, 0, 0, w, h);

      // Draw bottom band
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, h, w, bandHeight);

      // Draw code text
      const fontSize = Math.max(14, Math.min(28, w * 0.045));
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = "#ef4444";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Código: ${codigoCpl}`, w / 2, h + bandHeight / 2);

      canvas.toBlob(async (blob) => {
        if (!blob) { resolve(null); return; }

        const fileName = `share_${codigoCpl.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.png`;
        const filePath = `${empresaId || 'shared'}/compartilhamentos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, blob, { contentType: "image/png", upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          resolve(null);
          return;
        }

        const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
        resolve(data?.publicUrl || null);
      }, "image/png");
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}
