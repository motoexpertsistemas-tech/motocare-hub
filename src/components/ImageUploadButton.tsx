import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadButtonProps {
  productId: string;
  onUploaded?: (url: string) => void;
  variant?: "button" | "icon" | "area";
  className?: string;
}

export function ImageUploadButton({ productId, onUploaded, variant = "button", className }: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const { empresaId } = useEmpresa();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem (JPG, PNG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${empresaId}/${productId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("produtos_catalogo")
        .update({ imagem_url: publicUrl, atualizado_em: new Date().toISOString() })
        .eq("id", productId);

      if (updateError) throw updateError;

      toast.success("Foto atualizada!");
      queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
      onUploaded?.(publicUrl);
    } catch (err: any) {
      toast.error("Erro no upload: " + (err.message || err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleUpload}
      />
      {variant === "area" ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-secondary/60 transition-colors rounded-lg ${className || ""}`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground/60" />
              <span className="text-[10px] text-muted-foreground">Upload</span>
            </>
          )}
        </button>
      ) : variant === "icon" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`h-7 px-2 text-xs gap-1 ${className || ""}`}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {uploading ? "..." : "Upload"}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`gap-1.5 ${className || ""}`}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Enviando..." : "Enviar Foto"}
        </Button>
      )}
    </>
  );
}
