import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BarChart3, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export default function RelCurvaABC() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get("tipo") || "produtos";
  const isProdutos = tipo === "produtos";

  const [mes, setMes] = useState("2026-02");
  const [tab, setTab] = useState("relatorio");

  const subtotais = isProdutos
    ? { quantidade: "2.281,000", unitario: "48.591,44", total: "82.638,25" }
    : { quantidade: "1.963,000", unitario: "15.052,21", total: "73.337,22" };

  const curvas = isProdutos
    ? {
        a: { valor: "R$ 66.074,59", pct: "79,96%", qtd: "1.099,000" },
        b: { valor: "R$ 12.422,84", pct: "15,03%", qtd: "586,000" },
        c: { valor: "R$ 4.140,82", pct: "5,01%", qtd: "596,000" },
        total: { valor: "R$ 82.638,25", pct: "100,00%", qtd: "2.281,000" },
      }
    : {
        a: { valor: "R$ 58.588,29", pct: "79,88%", qtd: "0,00" },
        b: { valor: "R$ 11.026,38", pct: "15,04%", qtd: "0,00" },
        c: { valor: "R$ 3.722,55", pct: "5,08%", qtd: "0,00" },
        total: { valor: "R$ 73.337,22", pct: "100,00%", qtd: "0,00" },
      };

  const demoRows = isProdutos
    ? [
        { nome: "OLEO SHELL ADVANCE 4T AX6 10W-30", qtd: "84,000", unit: "33,39", total: "2.805,02", acum: "2.805,02", pct: "3,39", pctAcum: "3,39", classe: "A" },
        { nome: "BATERIA BROS150/125 TIT150 04/13 ERX 6BS ERBS", qtd: "11,000", unit: "167,97", total: "1.847,64", acum: "4.652,66", pct: "2,24", pctAcum: "5,63", classe: "A" },
        { nome: "OLEO MOBIL 4T 20W50 PRETO 1L MOBIL", qtd: "55,000", unit: "31,98", total: "1.759,00", acum: "6.411,66", pct: "2,13", pctAcum: "7,76", classe: "A" },
        { nome: "PNEU TRAS 14 80/100-14 VIPAL ST 200 VIPAL", qtd: "7,000", unit: "241,94", total: "1.693,60", acum: "8.105,26", pct: "2,05", pctAcum: "9,81", classe: "A" },
        { nome: "OLEO DULUB 4T 20W50 EXTREME SAE SL 1L", qtd: "66,000", unit: "20,21", total: "1.334,00", acum: "9.439,26", pct: "1,61", pctAcum: "11,42", classe: "A" },
        { nome: "ALCA POP 100 SPORT CROM MOTO SHOW", qtd: "3,000", unit: "23,41", total: "70,24", acum: "9.509,50", pct: "0,09", pctAcum: "80,04", classe: "B" },
        { nome: "CAPA BANCO TIT 150 I4 CC FAN START 160 RACING", qtd: "5,000", unit: "14,00", total: "70,00", acum: "9.579,50", pct: "0,08", pctAcum: "80,13", classe: "B" },
        { nome: "POSICIONADOR LENT AZUL ROSCA YAMAHA COD:18084 SOLIDEZ", qtd: "2,000", unit: "35,00", total: "70,00", acum: "9.649,50", pct: "0,08", pctAcum: "80,21", classe: "B" },
        { nome: "RETROVISOR BMW GS800 ROSCA COMETA", qtd: "4,000", unit: "17,50", total: "70,00", acum: "9.719,50", pct: "0,08", pctAcum: "80,30", classe: "B" },
        { nome: "PEDALEIRA T TIT 160 C8 TWISTER 18 TRILHA", qtd: "2,000", unit: "35,00", total: "70,00", acum: "9.789,50", pct: "0,08", pctAcum: "80,38", classe: "B" },
        { nome: "MANIC EMB POP 09 TRILHA", qtd: "1,000", unit: "22,00", total: "22,00", acum: "9.811,50", pct: "0,03", pctAcum: "95,02", classe: "C" },
        { nome: "CABO ACEL BIZ 110 125 I6 19 A SOLIDEZ", qtd: "1,000", unit: "22,00", total: "22,00", acum: "9.833,50", pct: "0,03", pctAcum: "95,04", classe: "C" },
        { nome: "CABO ACEL BIZ 110 125 I6 19 B SOLIDEZ", qtd: "1,000", unit: "22,00", total: "22,00", acum: "9.855,50", pct: "0,03", pctAcum: "95,07", classe: "C" },
        { nome: "RET CAMBIO TIT 150 FAN 150 160 BROS 150 160 R1 91236", qtd: "1,000", unit: "22,00", total: "22,00", acum: "9.877,50", pct: "0,03", pctAcum: "95,10", classe: "C" },
        { nome: "CABO ACEL POP 110 16 17 (B) MAGNTRON", qtd: "1,000", unit: "22,00", total: "22,00", acum: "9.899,50", pct: "0,03", pctAcum: "95,12", classe: "C" },
      ]
    : [
        { nome: "CLIENTE NAO INDENTIFICADO", qtd: "160,000", unit: "28,95", total: "4.631,45", acum: "4.631,45", pct: "6,32", pctAcum: "6,32", classe: "A" },
        { nome: "FAZENDA PARANÁ", qtd: "43,000", unit: "57,88", total: "2.488,64", acum: "7.120,09", pct: "3,39", pctAcum: "9,71", classe: "A" },
        { nome: "ADRIANO DA ANUNCIACAO MELO", qtd: "64,000", unit: "35,70", total: "2.284,58", acum: "9.404,67", pct: "3,12", pctAcum: "12,82", classe: "A" },
        { nome: "ERMISOM BATISTA DO SANTOS (MECANICO)", qtd: "53,000", unit: "38,90", total: "2.061,92", acum: "11.466,59", pct: "2,81", pctAcum: "15,64", classe: "A" },
        { nome: "JOAO ANTAO DA SILVA NETO", qtd: "26,000", unit: "73,05", total: "1.899,31", acum: "13.365,90", pct: "2,59", pctAcum: "18,23", classe: "A" },
        { nome: "MARCOS ALVES DE SOUZA", qtd: "12,000", unit: "14,78", total: "177,40", acum: "13.543,30", pct: "0,24", pctAcum: "80,13", classe: "B" },
        { nome: "RITA LEE MACEDO DOS SANTOS", qtd: "8,000", unit: "22,00", total: "176,00", acum: "13.719,30", pct: "0,24", pctAcum: "80,37", classe: "B" },
        { nome: "JARIEL CARREGOSA FONTES", qtd: "5,000", unit: "35,00", total: "175,00", acum: "13.894,30", pct: "0,24", pctAcum: "80,61", classe: "B" },
        { nome: "EDIVALDO MACIEL DA SILVA", qtd: "10,000", unit: "17,40", total: "174,00", acum: "14.068,30", pct: "0,24", pctAcum: "80,85", classe: "B" },
        { nome: "RAFAELA LEAL", qtd: "9,000", unit: "18,88", total: "169,89", acum: "14.238,19", pct: "0,23", pctAcum: "81,08", classe: "B" },
        { nome: "ROBSON ALVES SANTOS MECANICO", qtd: "3,000", unit: "20,53", total: "61,59", acum: "14.299,78", pct: "0,08", pctAcum: "95,01", classe: "C" },
        { nome: "DOMINGOS DE JESUS SANTOS (MECANICO)", qtd: "4,000", unit: "15,38", total: "61,53", acum: "14.361,31", pct: "0,08", pctAcum: "95,09", classe: "C" },
        { nome: "GRAZIELE MENESES DOS SANTOS", qtd: "2,000", unit: "30,25", total: "60,50", acum: "14.421,81", pct: "0,08", pctAcum: "95,17", classe: "C" },
        { nome: "LEANDRO RODRIGUES LISBOA", qtd: "3,000", unit: "20,17", total: "60,50", acum: "14.482,31", pct: "0,08", pctAcum: "95,26", classe: "C" },
        { nome: "RENILZA SANTOS SOUZA", qtd: "2,000", unit: "30,25", total: "60,50", acum: "14.542,81", pct: "0,08", pctAcum: "95,34", classe: "C" },
      ];

  const chartData = demoRows.map((r) => ({
    nome: r.nome.length > 15 ? r.nome.substring(0, 15) + "..." : r.nome,
    valorTotal: parseFloat(r.total.replace(".", "").replace(",", ".")),
    pctAcumulado: parseFloat(r.pctAcum.replace(",", ".")),
  }));

  const meses = [
    { value: "2026-01", label: "Janeiro de 2026" },
    { value: "2026-02", label: "Fevereiro de 2026" },
    { value: "2026-03", label: "Março de 2026" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios/vendas")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Relatório de curva ABC de {isProdutos ? "produtos" : "clientes"}</h1>
            <p className="text-xs text-muted-foreground">Início &gt; Relatórios de vendas &gt; Curva ABC {isProdutos ? "Produtos" : "Clientes"}</p>
          </div>
        </div>
        <Button variant="outline"><Search className="h-4 w-4 mr-1" />Busca avançada</Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {meses.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
          <TabsTrigger value="grafico">Gráfico</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "grafico" ? (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-center text-lg font-semibold mb-4">Curva ABC de {isProdutos ? "produtos" : "clientes"}</h2>
            <ResponsiveContainer width="100%" height={420}>
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 10 }} height={80} />
                <YAxis yAxisId="left" label={{ value: "Valor", angle: -90, position: "insideLeft" }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: "Percentual", angle: 90, position: "insideRight" }} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "pctAcumulado"
                      ? [`${value.toFixed(2)}%`, "Percentual acumulado"]
                      : [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Valor total"]
                  }
                />
                <Legend />
                <Bar yAxisId="left" dataKey="valorTotal" name="Valor total" fill="#22c55e" barSize={30} />
                <Line yAxisId="right" type="monotone" dataKey="pctAcumulado" name="Percentual acumulado" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="text-right text-sm font-semibold">SUBTOTAIS:</div>
            <div className="border rounded text-sm">
              <div className="flex justify-between px-4 py-1 border-b bg-muted/30"><span>Quantidade:</span><span>{subtotais.quantidade}</span></div>
              <div className="flex justify-between px-4 py-1 border-b bg-muted/30"><span>Valor unitário:</span><span>{subtotais.unitario}</span></div>
              <div className="flex justify-between px-4 py-1 bg-muted/30"><span>Valor total:</span><span>{subtotais.total}</span></div>
            </div>

            <div className="text-center text-sm font-semibold pt-2">TOTAIS:</div>
            <div className="grid grid-cols-4 text-sm text-center border rounded overflow-hidden">
              <div className="bg-cyan-100 p-2 border-r">
                <div className="font-bold">Curva A</div>
                <div>{curvas.a.valor} ({curvas.a.pct})</div>
                <div>{curvas.a.qtd}</div>
              </div>
              <div className="bg-yellow-100 p-2 border-r">
                <div className="font-bold">Curva B</div>
                <div>{curvas.b.valor} ({curvas.b.pct})</div>
                <div>{curvas.b.qtd}</div>
              </div>
              <div className="bg-red-100 p-2 border-r">
                <div className="font-bold">Curva C</div>
                <div>{curvas.c.valor} ({curvas.c.pct})</div>
                <div>{curvas.c.qtd}</div>
              </div>
              <div className="bg-green-100 p-2">
                <div className="font-bold">Total</div>
                <div>{curvas.total.valor} ({curvas.total.pct})</div>
                <div>{curvas.total.qtd}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">{isProdutos ? "Produto" : "Cliente"}</th>
                    <th className="text-right p-2">Quantidade</th>
                    <th className="text-right p-2">Valor unitário</th>
                    <th className="text-right p-2">Valor total</th>
                    <th className="text-right p-2">Valor acumulado</th>
                    <th className="text-right p-2">(%) Porcentagem</th>
                    <th className="text-right p-2">(%) Porcentagem acumulada</th>
                    <th className="text-center p-2">Classe</th>
                  </tr>
                </thead>
                <tbody>
                  {demoRows.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="p-2">{row.nome}</td>
                      <td className="text-right p-2">{row.qtd}</td>
                      <td className="text-right p-2">{row.unit}</td>
                      <td className="text-right p-2">{row.total}</td>
                      <td className="text-right p-2">{row.acum}</td>
                      <td className="text-right p-2">{row.pct}</td>
                      <td className="text-right p-2">{row.pctAcum}</td>
                      <td className="text-center p-2">{row.classe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
