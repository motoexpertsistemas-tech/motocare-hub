import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, Check, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function RelServicosContratados() {
  const navigate = useNavigate();
  const [loja, setLoja] = useState("todas");
  const [dataInicio, setDataInicio] = useState("2026-02-01");
  const [dataFim, setDataFim] = useState("2026-02-28");
  const [fornecedor, setFornecedor] = useState("");
  const [servico, setServico] = useState("");
  const [situacao, setSituacao] = useState("todos");
  const [centroCusto, setCentroCusto] = useState("todos");

  const limpar = () => {
    setLoja("todas"); setDataInicio("2026-02-01"); setDataFim("2026-02-28");
    setFornecedor(""); setServico(""); setSituacao("todos"); setCentroCusto("todos");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios/estoque")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Wrench className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Relatório de serviços contratados</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Relatórios de estoque &gt; Serviços contratados</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Loja</Label>
              <Select value={loja} onValueChange={setLoja}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todas">DKA GERENCIAL</SelectItem><SelectItem value="matriz">Matriz</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data da compra</Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                <span className="text-xs text-muted-foreground">a</span>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Fornecedor</Label>
              <Input placeholder="Digite para buscar" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Serviço</Label>
              <Input placeholder="Digite para buscar" value={servico} onChange={(e) => setServico(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select value={situacao} onValueChange={setSituacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos</SelectItem></SelectContent>
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

          <div className="flex gap-2 pt-2">
            <Button className="bg-green-600 hover:bg-green-700"><Check className="h-4 w-4 mr-1" />Gerar</Button>
            <Button variant="destructive" onClick={limpar}><X className="h-4 w-4 mr-1" />Limpar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
