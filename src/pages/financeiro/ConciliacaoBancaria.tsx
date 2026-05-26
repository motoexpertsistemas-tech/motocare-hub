import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeftRight, Upload, Check, FileText } from "lucide-react";
import { ContaBancariaCombobox } from "@/components/ContaBancariaCombobox";
import { toast } from "sonner";

export default function ConciliacaoBancaria() {
  const [contaBancaria, setContaBancaria] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImportar = () => {
    if (!contaBancaria) { toast.error("Selecione uma conta bancária"); return; }
    if (!arquivo) { toast.error("Selecione um arquivo OFX"); return; }
    toast.success("Extrato importado com sucesso! Processando conciliação...");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ArrowLeftRight className="h-6 w-6" /> Conciliação bancária
        </h1>
        <p className="text-sm text-muted-foreground">Compare extratos bancários com lançamentos do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Upload */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-4 py-2 text-sm">
              Insira seu um arquivo OFX no botão abaixo.
            </div>

            <div>
              <Label>Conta bancária *</Label>
              <ContaBancariaCombobox value={contaBancaria} onChange={setContaBancaria} />
            </div>

            <input
              type="file"
              ref={fileRef}
              accept=".ofx,.OFX"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) setArquivo(e.target.files[0]); }}
            />

            <Button
              variant="outline"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white border-0"
              onClick={() => fileRef.current?.click()}
            >
              <FileText className="h-4 w-4 mr-2" />
              {arquivo ? arquivo.name : "Selecionar arquivo"}
            </Button>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={handleImportar}
            >
              <Check className="h-4 w-4 mr-2" /> Importar extrato
            </Button>
          </CardContent>
        </Card>

        {/* Right - Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-blue-700">Importar extrato bancário OFX</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A conciliação bancária através dos arquivos OFX reduz o trabalho de digitação de suas movimentações financeiras. Entre no site do seu banco e salve seu extrato no formato OFX.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Depois, basta importar para o sistema e categorizar todas as suas movimentações.
          </p>
          <p className="text-sm text-muted-foreground">
            Caso tenha dúvidas, consulte a documentação sobre como realizar a conciliação bancária.
          </p>
        </div>
      </div>
    </div>
  );
}
