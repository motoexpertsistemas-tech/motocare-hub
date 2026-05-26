import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Check, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { usePlanoContasOptions, useContasBancariasOptions, useFormasPagamentoOptions, SITUACOES_FINANCEIRO } from "@/hooks/useRelatorioFilters";

export default function RelExtrato() {
  const navigate = useNavigate();
  const [loja, setLoja] = useState("todas");
  const [entidade, setEntidade] = useState("cliente");
  const [cliente, setCliente] = useState("");
  const [planoContas, setPlanoContas] = useState("todos");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("2026-02-01");
  const [dataFim, setDataFim] = useState("2026-02-28");
  const [competenciaInicio, setCompetenciaInicio] = useState("");
  const [competenciaFim, setCompetenciaFim] = useState("");
  const [valorInicio, setValorInicio] = useState("");
  const [valorFim, setValorFim] = useState("");
  const [movimentacao, setMovimentacao] = useState("todas");
  const [situacao, setSituacao] = useState("todas");
  const [contaBancaria, setContaBancaria] = useState("todos");
  const [formaPagamento, setFormaPagamento] = useState("todos");
  const [centroCusto, setCentroCusto] = useState("todos");
  const [detalhado, setDetalhado] = useState(false);
  const [transferencias, setTransferencias] = useState(false);
  const [saldoAnterior, setSaldoAnterior] = useState(false);

  const { data: planoContasOpts = [] } = usePlanoContasOptions();
  const { data: contasBancarias = [] } = useContasBancariasOptions();
  const { data: formasPagamento = [] } = useFormasPagamentoOptions();

  const limpar = () => {
    setLoja("todas"); setEntidade("cliente"); setCliente(""); setPlanoContas("todos");
    setDescricao(""); setDataInicio("2026-02-01"); setDataFim("2026-02-28");
    setCompetenciaInicio(""); setCompetenciaFim(""); setValorInicio(""); setValorFim("");
    setMovimentacao("todas"); setSituacao("todas"); setContaBancaria("todos");
    setFormaPagamento("todos"); setCentroCusto("todos");
    setDetalhado(false); setTransferencias(false); setSaldoAnterior(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios/financeiro")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Relatório de extrato</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Relatórios financeiros &gt; Extrato</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Loja</Label>
              <Select value={loja} onValueChange={setLoja}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todas">DKA GERENCIAL</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Entidade</Label>
              <Select value={entidade} onValueChange={setEntidade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="fornecedor">Fornecedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Input placeholder="Digite para buscar" value={cliente} onChange={(e) => setCliente(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Plano de contas</Label>
              <Select value={planoContas} onValueChange={setPlanoContas}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {planoContasOpts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.classificacao} - {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Período</Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                <span className="text-xs text-muted-foreground">a</span>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Data de competência</Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={competenciaInicio} onChange={(e) => setCompetenciaInicio(e.target.value)} />
                <span className="text-xs text-muted-foreground">a</span>
                <Input type="date" value={competenciaFim} onChange={(e) => setCompetenciaFim(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Valor</Label>
              <div className="flex items-center gap-2">
                <Input placeholder="" value={valorInicio} onChange={(e) => setValorInicio(e.target.value)} />
                <span className="text-xs text-muted-foreground">a</span>
                <Input placeholder="" value={valorFim} onChange={(e) => setValorFim(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label>Movimentação</Label>
              <Select value={movimentacao} onValueChange={setMovimentacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select value={situacao} onValueChange={setSituacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SITUACOES_FINANCEIRO.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conta bancária</Label>
              <Select value={contaBancaria} onValueChange={setContaBancaria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {contasBancarias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}{c.banco ? ` - ${c.banco}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Forma de pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {formasPagamento.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Centro de custo</Label>
              <Select value={centroCusto} onValueChange={setCentroCusto}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={detalhado} onCheckedChange={(v) => setDetalhado(!!v)} />
              Exibir relatório detalhado
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={transferencias} onCheckedChange={(v) => setTransferencias(!!v)} />
              Exibir transferências
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={saldoAnterior} onCheckedChange={(v) => setSaldoAnterior(!!v)} />
              Mostrar saldo anterior
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="bg-green-600 hover:bg-green-700"><Check className="h-4 w-4 mr-1" />Gerar</Button>
            <Button variant="destructive" onClick={limpar}><X className="h-4 w-4 mr-1" />Limpar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
