import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronsRight } from "lucide-react";

interface MarketplaceOption {
  slug: string;
  nome: string;
}

interface MigracaoLojaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketplaces: MarketplaceOption[];
  currentSlug: string;
  onConfirm: (config: {
    lojaOrigem: string;
    estadoAnuncio: string;
    duplicarAnuncios: string;
    plataformaDestino: string;
    lojaDestino: string;
  }) => void;
}

export default function MigracaoLojaDialog({
  open,
  onOpenChange,
  marketplaces,
  currentSlug,
  onConfirm,
}: MigracaoLojaDialogProps) {
  const [lojaOrigem, setLojaOrigem] = useState("");
  const [estadoAnuncio, setEstadoAnuncio] = useState("ativos");
  const [duplicarAnuncios, setDuplicarAnuncios] = useState("ignorar");
  const [plataformaDestino, setPlataformaDestino] = useState("");
  const [lojaDestino, setLojaDestino] = useState("");

  const handleConfirm = () => {
    onConfirm({
      lojaOrigem,
      estadoAnuncio,
      duplicarAnuncios,
      plataformaDestino,
      lojaDestino,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Migração de Loja</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 py-6">
          {/* Copiar de */}
          <div className="border border-border rounded-lg p-5 space-y-5">
            <h3 className="font-semibold text-sm text-foreground">Copiar de</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Loja</label>
                <Select value={lojaOrigem} onValueChange={setLojaOrigem}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Por favor selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {marketplaces.map((mk) => (
                      <SelectItem key={mk.slug} value={mk.slug}>
                        {mk.nome}
                      </SelectItem>
                    ))}
                    <SelectItem value="estoque">Meu Estoque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Estado do Anúncio</label>
                <Select value={estadoAnuncio} onValueChange={setEstadoAnuncio}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativos">Ativos</SelectItem>
                    <SelectItem value="rascunhos">Rascunhos</SelectItem>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Duplicar Anúncios</label>
                <Select value={duplicarAnuncios} onValueChange={setDuplicarAnuncios}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ignorar">Ignorar</SelectItem>
                    <SelectItem value="substituir">Substituir</SelectItem>
                    <SelectItem value="duplicar">Duplicar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <ChevronsRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Copiar a */}
          <div className="border border-border rounded-lg p-5 space-y-5">
            <h3 className="font-semibold text-sm text-foreground">Copiar a</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Plataforma</label>
                <Select value={plataformaDestino} onValueChange={setPlataformaDestino}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Por favor selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {marketplaces.map((mk) => (
                      <SelectItem key={mk.slug} value={mk.slug}>
                        {mk.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Loja</label>
                <Select value={lojaDestino} onValueChange={setLojaDestino}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Por favor selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Loja Principal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
