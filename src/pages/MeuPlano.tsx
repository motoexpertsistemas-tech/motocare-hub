import { useState } from "react";
import { Crown, Check, X, CreditCard, FileText, Printer, RefreshCw, ArrowUpRight, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlano } from "@/contexts/PlanoContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const planosData = [
  {
    id: "starter",
    nome: "Bronze",
    preco_mensal: 167.69,
    preco_anual_mes: 89.90,
    recursos: {
      usuarios: 1,
      lojas: 1,
      emissao_nf: false,
      emissao_boletos: false,
      layout_personalizado: false,
      conta_integrada: false,
      recursos_humanos: false,
      assinatura_digital: false,
      agenda_pro: false,
      mdfe: false,
      tray: false,
      mercado_pago: false,
      mercado_livre: false,
    },
  },
  {
    id: "professional",
    nome: "Prata",
    preco_mensal: 275.38,
    preco_anual_mes: 179.00,
    recursos: {
      usuarios: 3,
      lojas: 1,
      emissao_nf: true,
      emissao_boletos: true,
      layout_personalizado: false,
      conta_integrada: false,
      recursos_humanos: false,
      assinatura_digital: false,
      agenda_pro: false,
      mdfe: false,
      tray: false,
      mercado_pago: false,
      mercado_livre: false,
    },
  },
  {
    id: "enterprise",
    nome: "Ouro",
    preco_mensal: 398.46,
    preco_anual_mes: 259.00,
    recursos: {
      usuarios: 5,
      lojas: 1,
      emissao_nf: true,
      emissao_boletos: true,
      layout_personalizado: true,
      conta_integrada: true,
      recursos_humanos: false,
      assinatura_digital: false,
      agenda_pro: true,
      mdfe: false,
      tray: false,
      mercado_pago: true,
      mercado_livre: false,
    },
  },
  {
    id: "platina",
    nome: "Platina",
    preco_mensal: 521.54,
    preco_anual_mes: 339.00,
    recursos: {
      usuarios: "Ilimitados",
      lojas: 3,
      emissao_nf: true,
      emissao_boletos: true,
      layout_personalizado: true,
      conta_integrada: true,
      recursos_humanos: true,
      assinatura_digital: true,
      agenda_pro: true,
      mdfe: true,
      tray: true,
      mercado_pago: true,
      mercado_livre: true,
    },
  },
];

const recursosLabels: Record<string, string> = {
  usuarios: "Usuários",
  lojas: "Lojas",
  emissao_nf: "Emissão de notas fiscais",
  emissao_boletos: "Emissão de boletos",
  layout_personalizado: "Layout e domínio personalizado",
  conta_integrada: "Conta Integrada",
  recursos_humanos: "Recursos Humanos",
  assinatura_digital: "Assinatura Digital",
  agenda_pro: "Agenda Pro",
  mdfe: "MDF-e",
  tray: "Tray",
  mercado_pago: "Mercado Pago",
  mercado_livre: "Mercado Livre",
};

const notasFiscaisMock: { numero: string; data_emissao: string; destinatario: string; valor: number }[] = [];

export default function MeuPlano() {
  const planoAtual = usePlano();
  const planoInfo = planosData.find((p) => p.id === planoAtual) || planosData[3];
  const [showAlterarPlano, setShowAlterarPlano] = useState(false);

  const periodicidade = "Anual";
  const valor = planoInfo.preco_anual_mes * 12;
  const vencimento = "02/07/2026";
  const situacao = "Ativo";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Meu plano</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          🏠 Início › Meu plano
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Plano contratado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Plano contratado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{planoInfo.nome}</TableCell>
                  <TableCell>{vencimento}</TableCell>
                  <TableCell>{periodicidade}</TableCell>
                  <TableCell>R$ {valor.toFixed(2).replace(".", ",")}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-500 text-white border-0">{situacao}</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="flex items-center gap-2 mt-4 justify-center">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                Renovar assinatura
              </Button>
              <Dialog open={showAlterarPlano} onOpenChange={setShowAlterarPlano}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Alterar plano
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Alterar plano</DialogTitle>
                  </DialogHeader>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    {planosData.map((p) => {
                      const isAtual = p.id === planoAtual;
                      return (
                        <div
                          key={p.id}
                          className={`rounded-xl border p-5 transition-all ${
                            isAtual
                              ? "ring-2 ring-primary border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <h3 className="text-lg font-bold">{p.nome}</h3>
                          <div className="flex items-baseline gap-1 mt-2 mb-4">
                            <span className="text-2xl font-extrabold">
                              R$ {p.preco_anual_mes.toFixed(2).replace(".", ",")}
                            </span>
                            <span className="text-xs text-muted-foreground">/mês</span>
                          </div>
                          {isAtual ? (
                            <Badge className="bg-primary text-primary-foreground border-0">Plano atual</Badge>
                          ) : (
                            <Button size="sm" className="w-full">Selecionar</Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline" className="gap-1">
                + Recursos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recursos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Recursos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(planoInfo.recursos).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-sm">{recursosLabels[key] || key}</span>
                <span className="text-sm font-medium">
                  {typeof value === "number" ? (
                    <span className="text-primary font-bold">{value}</span>
                  ) : value ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Forma de pagamento */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Forma de pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Titular do cartão</p>
              <p className="text-sm font-medium">NARA SOUZA SILVA</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Número</p>
              <div className="flex items-center gap-2">
                <img src="/images/mastercard.png" alt="Mastercard" className="h-5" />
                <span className="text-sm">•••• •••• •••• 8706</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vencimento</p>
              <p className="text-sm font-medium">04/24</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            Renovação automática: <span className="text-green-600 font-semibold">Habilitada</span>
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Sua assinatura será renovada automaticamente em: 25/06/2026
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1">
              <CreditCard className="h-3.5 w-3.5" />
              Editar forma de pagamento
            </Button>
            <Button size="sm" variant="outline" className="gap-1">
              <FileText className="h-3.5 w-3.5" />
              Histórico de pagamentos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notas fiscais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notas fiscais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Data de emissão</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Valor total</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notasFiscaisMock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    Nenhuma nota fiscal encontrada
                  </TableCell>
                </TableRow>
              ) : (
                notasFiscaisMock.map((nf) => (
                  <TableRow key={nf.numero}>
                    <TableCell className="font-medium">{nf.numero}</TableCell>
                    <TableCell>{nf.data_emissao}</TableCell>
                    <TableCell>{nf.destinatario}</TableCell>
                    <TableCell>{nf.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        <Printer className="h-3.5 w-3.5" />
                        Imprimir NFS-e
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
