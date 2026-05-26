import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Plus, Trash2, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

interface ProdutoDevolucao {
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export default function NFeDevolucao() {
  const [tipo, setTipo] = useState("Saída");
  const [chaveAcesso, setChaveAcesso] = useState("");

  const [fornecedor, setFornecedor] = useState({
    nome: "", cnpj: "", inscricao_estadual: "", email: "", whatsapp: "",
    endereco: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "", cep: "",
  });

  const [transportadora, setTransportadora] = useState({
    nome: "", cnpj: "", inscricao_estadual: "", endereco: "", municipio: "", uf: "",
    modalidade_frete: "1 - Destinatário", placa: "", uf_veiculo: "",
    valor_frete: "0,00", peso: "0,000",
  });

  const [produtos, setProdutos] = useState<ProdutoDevolucao[]>([]);

  const updateFornecedor = (field: string, value: string) =>
    setFornecedor((prev) => ({ ...prev, [field]: value }));

  const updateTransportadora = (field: string, value: string) =>
    setTransportadora((prev) => ({ ...prev, [field]: value }));

  const addProduto = () => {
    setProdutos([...produtos, { descricao: "", ncm: "", cfop: "5202", unidade: "UN", quantidade: 1, valor_unitario: 0, valor_total: 0 }]);
  };

  const removeProduto = (idx: number) => {
    setProdutos(produtos.filter((_, i) => i !== idx));
  };

  const updateProduto = (idx: number, field: string, value: any) => {
    const updated = [...produtos];
    (updated[idx] as any)[field] = value;
    if (field === "quantidade" || field === "valor_unitario") {
      updated[idx].valor_total = updated[idx].quantidade * updated[idx].valor_unitario;
    }
    setProdutos(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">NF-e de Devolução</h1>
        <p className="text-sm text-muted-foreground">Emita notas fiscais de devolução ao fornecedor</p>
      </div>

      {/* Importar nota de origem */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Importar nota de origem</CardTitle>
          <CardDescription>Preencha o formulário manualmente ou importe os dados enviando o XML ou o PDF da nota.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button variant="default" size="sm"><Upload className="h-4 w-4 mr-2" /> Ler XML</Button>
            <Button variant="secondary" size="sm"><Upload className="h-4 w-4 mr-2" /> Ler PDF (IA)</Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            XML: precisão automática nos detalhes da nota; PDF: entra IA para extrair valores, fornecedor e itens.
          </div>
        </CardContent>
      </Card>

      {/* Informações do Fornecedor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informações Fornecedor</CardTitle>
          <CardDescription>Adicione abaixo as informações do fornecedor que irá receber a nota fiscal de retorno.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Saída">Saída</SelectItem>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-destructive">Chave de Acesso da NFe *</Label>
              <Input placeholder="Digite a chave de 44 dígitos" value={chaveAcesso} onChange={(e) => setChaveAcesso(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-destructive">Nome do Fornecedor *</Label>
            <Input placeholder="Nome completo do fornecedor" value={fornecedor.nome} onChange={(e) => updateFornecedor("nome", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-destructive">CNPJ/CPF *</Label><Input placeholder="Número" value={fornecedor.cnpj} onChange={(e) => updateFornecedor("cnpj", e.target.value)} /></div>
            <div><Label className="text-destructive">Inscrição Estadual *</Label><Input placeholder="Inscrição Estadual" value={fornecedor.inscricao_estadual} onChange={(e) => updateFornecedor("inscricao_estadual", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>E-mail</Label><Input placeholder="fornecedor@email.com" value={fornecedor.email} onChange={(e) => updateFornecedor("email", e.target.value)} /></div>
            <div><Label>Whatsapp</Label><Input placeholder="(00) 00000-0000" value={fornecedor.whatsapp} onChange={(e) => updateFornecedor("whatsapp", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label className="text-destructive">Endereço *</Label><Input placeholder="Rua, Avenida, etc." value={fornecedor.endereco} onChange={(e) => updateFornecedor("endereco", e.target.value)} /></div>
            <div><Label className="text-destructive">Número *</Label><Input placeholder="Número" value={fornecedor.numero} onChange={(e) => updateFornecedor("numero", e.target.value)} /></div>
            <div><Label>Complemento</Label><Input placeholder="Apto, Casa, etc." value={fornecedor.complemento} onChange={(e) => updateFornecedor("complemento", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div><Label className="text-destructive">Bairro *</Label><Input value={fornecedor.bairro} onChange={(e) => updateFornecedor("bairro", e.target.value)} /></div>
            <div><Label className="text-destructive">Cidade *</Label><Input value={fornecedor.cidade} onChange={(e) => updateFornecedor("cidade", e.target.value)} /></div>
            <div>
              <Label className="text-destructive">UF *</Label>
              <Select value={fornecedor.uf} onValueChange={(v) => updateFornecedor("uf", v)}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>{UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label className="text-destructive">CEP *</Label><Input placeholder="00000-000" value={fornecedor.cep} onChange={(e) => updateFornecedor("cep", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Transportadora */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informações Transportadora <span className="text-muted-foreground font-normal text-sm">(Opcional)</span></CardTitle>
          <CardDescription>Adicione abaixo as informações da transportadora, se necessário.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1"><Label>Nome da Transportadora</Label><Input value={transportadora.nome} onChange={(e) => updateTransportadora("nome", e.target.value)} /></div>
            <div><Label>CNPJ</Label><Input placeholder="00.000.000/0000-00" value={transportadora.cnpj} onChange={(e) => updateTransportadora("cnpj", e.target.value)} /></div>
            <div><Label>Inscrição Estadual</Label><Input value={transportadora.inscricao_estadual} onChange={(e) => updateTransportadora("inscricao_estadual", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Endereço</Label><Input placeholder="Endereço da transportadora" value={transportadora.endereco} onChange={(e) => updateTransportadora("endereco", e.target.value)} /></div>
            <div><Label>Município</Label><Input value={transportadora.municipio} onChange={(e) => updateTransportadora("municipio", e.target.value)} /></div>
            <div><Label>UF</Label>
              <Select value={transportadora.uf} onValueChange={(v) => updateTransportadora("uf", v)}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>{UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Modalidade do Frete</Label>
              <Select value={transportadora.modalidade_frete} onValueChange={(v) => updateTransportadora("modalidade_frete", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0 - Remetente">0 - Remetente</SelectItem>
                  <SelectItem value="1 - Destinatário">1 - Destinatário</SelectItem>
                  <SelectItem value="2 - Terceiros">2 - Terceiros</SelectItem>
                  <SelectItem value="9 - Sem frete">9 - Sem frete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Placa do veículo</Label><Input placeholder="Ex: ABC1J24" value={transportadora.placa} onChange={(e) => updateTransportadora("placa", e.target.value)} /></div>
            <div><Label>UF do veículo</Label>
              <Select value={transportadora.uf_veiculo} onValueChange={(v) => updateTransportadora("uf_veiculo", v)}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>{UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Valor do frete (R$) ⓘ</Label><Input placeholder="Ex: 0,00" value={transportadora.valor_frete} onChange={(e) => updateTransportadora("valor_frete", e.target.value)} /></div>
            <div><Label>Peso (kg) ⓘ</Label><Input placeholder="Ex: 0,000" value={transportadora.peso} onChange={(e) => updateTransportadora("peso", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Produtos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Produtos</CardTitle>
              <CardDescription>Adicione os produtos que serão incluídos na nota fiscal de devolução.</CardDescription>
            </div>
            <Button size="sm" onClick={addProduto}><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
          </div>
        </CardHeader>
        <CardContent>
          {produtos.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">Nenhum produto adicionado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-24">NCM</TableHead>
                  <TableHead className="w-20">CFOP</TableHead>
                  <TableHead className="w-16">UN</TableHead>
                  <TableHead className="w-16">Qtd</TableHead>
                  <TableHead className="w-24">Vl. Unit.</TableHead>
                  <TableHead className="w-24">Total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Input value={p.descricao} onChange={(e) => updateProduto(idx, "descricao", e.target.value)} className="h-8" /></TableCell>
                    <TableCell><Input value={p.ncm} onChange={(e) => updateProduto(idx, "ncm", e.target.value)} className="h-8" /></TableCell>
                    <TableCell><Input value={p.cfop} onChange={(e) => updateProduto(idx, "cfop", e.target.value)} className="h-8" /></TableCell>
                    <TableCell><Input value={p.unidade} onChange={(e) => updateProduto(idx, "unidade", e.target.value)} className="h-8" /></TableCell>
                    <TableCell><Input type="number" value={p.quantidade} onChange={(e) => updateProduto(idx, "quantidade", Number(e.target.value))} className="h-8" /></TableCell>
                    <TableCell><Input type="number" value={p.valor_unitario} onChange={(e) => updateProduto(idx, "valor_unitario", Number(e.target.value))} className="h-8" /></TableCell>
                    <TableCell className="font-medium">R$ {p.valor_total.toFixed(2)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeProduto(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Notas de Devolução Emitidas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Notas de Devolução Emitidas</CardTitle>
              <CardDescription>Últimos 7 dias</CardDescription>
            </div>
            <Button variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" /> Atualizar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Autorizadas</p>
                <p className="text-lg font-bold">0</p>
                <p className="text-xs text-muted-foreground">R$ 0,00</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Erro</p>
                <p className="text-lg font-bold">0</p>
                <p className="text-xs text-muted-foreground">R$ 0,00</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Canceladas</p>
                <p className="text-lg font-bold">0</p>
                <p className="text-xs text-muted-foreground">R$ 0,00</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">0</p>
                <p className="text-xs text-muted-foreground">R$ 0,00</p>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground py-4">Nenhuma nota de devolução emitida nos últimos 7 dias.</p>
        </CardContent>
      </Card>
    </div>
  );
}
