import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Plus, Trash2, RefreshCw, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";

interface ProdutoAjuste {
  id: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export default function NFeAjuste() {
  const [tipo, setTipo] = useState("Saída");
  const [finalidade, setFinalidade] = useState("Ajuste");
  const [naturezaOperacao, setNaturezaOperacao] = useState("AJUSTE DE ICMS");
  const [chaveAcesso, setChaveAcesso] = useState("");

  const [fornecedor, setFornecedor] = useState({
    nome: "", cnpj: "", inscricaoEstadual: "", email: "", whatsapp: "",
    endereco: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "", cep: "",
  });

  const [transportadora, setTransportadora] = useState({
    nome: "", cnpj: "", inscricaoEstadual: "", endereco: "", cidade: "", uf: "",
  });

  const [produtos, setProdutos] = useState<ProdutoAjuste[]>([]);

  const addProduto = () => {
    setProdutos([...produtos, {
      id: crypto.randomUUID(), descricao: "", ncm: "", cfop: "", unidade: "UN",
      quantidade: 1, valorUnitario: 0, valorTotal: 0,
    }]);
  };

  const removeProduto = (id: string) => setProdutos(produtos.filter(p => p.id !== id));

  const updateProduto = (id: string, field: keyof ProdutoAjuste, value: any) => {
    setProdutos(produtos.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      if (field === "quantidade" || field === "valorUnitario") {
        updated.valorTotal = updated.quantidade * updated.valorUnitario;
      }
      return updated;
    }));
  };

  const limparFormulario = () => {
    setFornecedor({ nome: "", cnpj: "", inscricaoEstadual: "", email: "", whatsapp: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "", cep: "" });
    setTransportadora({ nome: "", cnpj: "", inscricaoEstadual: "", endereco: "", cidade: "", uf: "" });
    setProdutos([]);
    setChaveAcesso("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">NFe Ajuste</h1>
      </div>

      {/* Informações fornecedor */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-primary">Informações fornecedor</CardTitle>
          <CardDescription>Adicione abaixo as informações do fornecedor para a nota fiscal de ajuste.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Saída">Saída</SelectItem>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Finalidade *</Label>
              <Select value={finalidade} onValueChange={setFinalidade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ajuste">Ajuste</SelectItem>
                  <SelectItem value="Complementar">Complementar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Natureza da Operação *</Label>
              <Select value={naturezaOperacao} onValueChange={setNaturezaOperacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AJUSTE DE ICMS">AJUSTE DE ICMS</SelectItem>
                  <SelectItem value="AJUSTE DE IPI">AJUSTE DE IPI</SelectItem>
                  <SelectItem value="AJUSTE DE PIS/COFINS">AJUSTE DE PIS/COFINS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>Chave de Acesso da NFe</Label>
                <Input placeholder="Digite a chave de 44 dígitos ou selecione uma nota" value={chaveAcesso} onChange={e => setChaveAcesso(e.target.value)} />
              </div>
              <Button variant="outline" size="default">
                <Search className="h-4 w-4 mr-1" /> Selecionar Nota
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Nome do Fornecedor *</Label><Input placeholder="Nome completo do fornecedor" value={fornecedor.nome} onChange={e => setFornecedor({ ...fornecedor, nome: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>CNPJ/CPF *</Label><Input placeholder="Número" value={fornecedor.cnpj} onChange={e => setFornecedor({ ...fornecedor, cnpj: e.target.value })} /></div>
            <div><Label>Inscrição Estadual *</Label><Input placeholder="Inscrição Estadual" value={fornecedor.inscricaoEstadual} onChange={e => setFornecedor({ ...fornecedor, inscricaoEstadual: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>E-mail</Label><Input placeholder="fornecedor@email.com" value={fornecedor.email} onChange={e => setFornecedor({ ...fornecedor, email: e.target.value })} /></div>
            <div><Label>Whatsapp</Label><Input placeholder="(00) 000.000.0000" value={fornecedor.whatsapp} onChange={e => setFornecedor({ ...fornecedor, whatsapp: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Endereço *</Label><Input placeholder="Rua, Avenida, etc" value={fornecedor.endereco} onChange={e => setFornecedor({ ...fornecedor, endereco: e.target.value })} /></div>
            <div><Label>Número *</Label><Input placeholder="Número" value={fornecedor.numero} onChange={e => setFornecedor({ ...fornecedor, numero: e.target.value })} /></div>
            <div><Label>Complemento</Label><Input placeholder="Apto, Casa, etc" value={fornecedor.complemento} onChange={e => setFornecedor({ ...fornecedor, complemento: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div><Label>Bairro *</Label><Input placeholder="Bairro" value={fornecedor.bairro} onChange={e => setFornecedor({ ...fornecedor, bairro: e.target.value })} /></div>
            <div><Label>Cidade *</Label><Input placeholder="Cidade" value={fornecedor.cidade} onChange={e => setFornecedor({ ...fornecedor, cidade: e.target.value })} /></div>
            <div><Label>UF *</Label><Input placeholder="Ex: SP" value={fornecedor.uf} onChange={e => setFornecedor({ ...fornecedor, uf: e.target.value })} /></div>
            <div><Label>CEP *</Label><Input placeholder="00000-000" value={fornecedor.cep} onChange={e => setFornecedor({ ...fornecedor, cep: e.target.value })} /></div>
          </div>

          <Separator className="my-4" />

          {/* Transportadora */}
          <div>
            <p className="text-sm font-semibold text-foreground">Informações Transportadora <span className="text-muted-foreground font-normal">(Opcional)</span></p>
            <p className="text-xs text-muted-foreground mb-3">Adicione abaixo as informações da transportadora, se necessário.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Nome da Transportadora</Label><Input placeholder="Nome da transportadora" value={transportadora.nome} onChange={e => setTransportadora({ ...transportadora, nome: e.target.value })} /></div>
            <div><Label>CNPJ</Label><Input placeholder="00.000.000/0000-00" value={transportadora.cnpj} onChange={e => setTransportadora({ ...transportadora, cnpj: e.target.value })} /></div>
            <div><Label>Inscrição Estadual</Label><Input placeholder="IE" value={transportadora.inscricaoEstadual} onChange={e => setTransportadora({ ...transportadora, inscricaoEstadual: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Endereço</Label><Input placeholder="Endereço da transportadora" value={transportadora.endereco} onChange={e => setTransportadora({ ...transportadora, endereco: e.target.value })} /></div>
            <div><Label>Cidade</Label><Input placeholder="Cidade" value={transportadora.cidade} onChange={e => setTransportadora({ ...transportadora, cidade: e.target.value })} /></div>
            <div><Label>UF</Label><Input placeholder="UF" value={transportadora.uf} onChange={e => setTransportadora({ ...transportadora, uf: e.target.value })} /></div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button variant="outline" size="sm" onClick={limparFormulario}>
              <Trash2 className="h-4 w-4 mr-1" /> Limpar Formulário
            </Button>
            <Button>Avançar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Adicionar produtos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-primary">Adicionar produtos</CardTitle>
              <CardDescription>Adicione abaixo os produtos que serão incluídos na nota fiscal de ajuste.</CardDescription>
            </div>
            <Button size="sm" onClick={addProduto}><Plus className="h-4 w-4 mr-1" /> Adicionar produto</Button>
          </div>
        </CardHeader>
        <CardContent>
          {produtos.length === 0 ? (
            <div className="bg-primary/10 text-primary rounded-lg p-3 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Nenhum produto adicionado. Clique em "Adicionar produtos" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>NCM</TableHead>
                  <TableHead>CFOP</TableHead>
                  <TableHead>Un.</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Valor Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map(p => (
                  <TableRow key={p.id}>
                    <TableCell><Input value={p.descricao} onChange={e => updateProduto(p.id, "descricao", e.target.value)} /></TableCell>
                    <TableCell><Input value={p.ncm} onChange={e => updateProduto(p.id, "ncm", e.target.value)} className="w-28" /></TableCell>
                    <TableCell><Input value={p.cfop} onChange={e => updateProduto(p.id, "cfop", e.target.value)} className="w-20" /></TableCell>
                    <TableCell><Input value={p.unidade} onChange={e => updateProduto(p.id, "unidade", e.target.value)} className="w-16" /></TableCell>
                    <TableCell><Input type="number" value={p.quantidade} onChange={e => updateProduto(p.id, "quantidade", Number(e.target.value))} className="w-16" /></TableCell>
                    <TableCell><Input type="number" step="0.01" value={p.valorUnitario} onChange={e => updateProduto(p.id, "valorUnitario", Number(e.target.value))} className="w-24" /></TableCell>
                    <TableCell className="font-medium">R$ {p.valorTotal.toFixed(2)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeProduto(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notas Emitidas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Notas Emitidas</CardTitle>
              <CardDescription>Últimos 7 dias</CardDescription>
            </div>
            <Button variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Atualizar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Autorizadas", value: 0, total: "R$ 0,00", color: "text-green-600", icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
              { label: "Erro", value: 0, total: "R$ 0,00", color: "text-red-600", icon: <XCircle className="h-5 w-5 text-red-500" /> },
              { label: "Canceladas", value: 0, total: "R$ 0,00", color: "text-yellow-600", icon: <AlertCircle className="h-5 w-5 text-yellow-500" /> },
              { label: "Total", value: 0, total: "R$ 0,00", color: "text-blue-600", icon: <FileText className="h-5 w-5 text-blue-500" /> },
            ].map(s => (
              <div key={s.label} className="rounded-lg border bg-card p-4 flex items-start justify-between">
                <div>
                  <p className={`text-xs font-semibold ${s.color}`}>{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.total}</p>
                </div>
                {s.icon}
              </div>
            ))}
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm">Nenhuma nota emitida nos últimos 7 dias.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
