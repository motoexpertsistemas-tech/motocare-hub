import { useState } from "react";
import {
  Leaf,
  Recycle,
  TreePine,
  Scan,
  Smartphone,
  Camera,
  Globe,
  Languages,
  DollarSign,
  MapPin,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Zap,
  Package,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// --- Mock Data ---
const ecoProducts = [
  {
    sku: "FLT-YBR-001",
    nome: "Filtro de Óleo YBR 125",
    ecoScore: 82,
    co2Total: 3.3,
    co2Fab: 2.5,
    co2Trans: 0.8,
    reciclavel: 85,
    materiais: ["Alumínio: 60%", "Plástico: 25%", "Aço: 15%"],
    origem: "Honda Genuine Parts",
    lote: "2024-Q2-BR-001",
    selo: true,
  },
  {
    sku: "OLM-10W40-001",
    nome: "Óleo Motor 10W40 1L",
    ecoScore: 65,
    co2Total: 5.1,
    co2Fab: 3.8,
    co2Trans: 1.3,
    reciclavel: 40,
    materiais: ["Óleo mineral: 80%", "Aditivos: 15%", "Embalagem: 5%"],
    origem: "Motul Brasil",
    lote: "2025-Q1-BR-042",
    selo: false,
  },
  {
    sku: "PNE-9090-001",
    nome: "Pneu 90/90-18 Traseiro",
    ecoScore: 71,
    co2Total: 12.4,
    co2Fab: 9.6,
    co2Trans: 2.8,
    reciclavel: 92,
    materiais: ["Borracha: 70%", "Aço: 20%", "Nylon: 10%"],
    origem: "Pirelli BR",
    lote: "2024-Q4-BR-118",
    selo: true,
  },
];

const impactoMensal = [
  { mes: "Set", co2Evitado: 120, pecasRecicladas: 45 },
  { mes: "Out", co2Evitado: 145, pecasRecicladas: 58 },
  { mes: "Nov", co2Evitado: 180, pecasRecicladas: 72 },
  { mes: "Dez", co2Evitado: 210, pecasRecicladas: 89 },
  { mes: "Jan", co2Evitado: 195, pecasRecicladas: 76 },
  { mes: "Fev", co2Evitado: 230, pecasRecicladas: 94 },
];

const materiaisReciclados = [
  { name: "Alumínio", value: 35, color: "hsl(220, 15%, 70%)" },
  { name: "Aço", value: 28, color: "hsl(220, 10%, 55%)" },
  { name: "Borracha", value: 22, color: "hsl(3, 62%, 46%)" },
  { name: "Plástico", value: 15, color: "hsl(150, 60%, 45%)" },
];

const arPecasSimilares = [
  { sku: "PST-CG160-001", nome: "Pastilha Freio Diant. CG 160", marca: "Cobreq", similaridade: 97, preco: 42.90, estoque: 14 },
  { sku: "PST-CG160-002", nome: "Pastilha Freio Diant. CG 160", marca: "Fischer", similaridade: 93, preco: 38.50, estoque: 8 },
  { sku: "PST-TIT150-001", nome: "Pastilha Freio Diant. Titan 150", marca: "Cobreq", similaridade: 85, preco: 39.90, estoque: 0 },
];

const arCompativeis = [
  { sku: "DSC-CG160-001", nome: "Disco de Freio Dianteiro CG 160", marca: "Cobreq", tipo: "Complementar", preco: 89.90, estoque: 5 },
  { sku: "FLD-CG160-001", nome: "Fluido de Freio DOT4 200ml", marca: "Bosch", tipo: "Consumível", preco: 24.90, estoque: 22 },
  { sku: "MNG-CG160-001", nome: "Manete de Freio Dianteiro CG 160", marca: "Scud", tipo: "Complementar", preco: 32.50, estoque: 3 },
];

const idiomas = [
  { id: "pt-BR", label: "Português (Brasil)", bandeira: "🇧🇷", moeda: "BRL", formato: "1.234,56", ativo: true },
  { id: "en-US", label: "English (US)", bandeira: "🇺🇸", moeda: "USD", formato: "1,234.56", ativo: false },
  { id: "es-ES", label: "Español", bandeira: "🇪🇸", moeda: "EUR", formato: "1.234,56", ativo: false },
];

const tooltipStyle = {
  backgroundColor: "hsl(225, 22%, 11%)",
  border: "1px solid hsl(225, 18%, 18%)",
  borderRadius: "8px",
  color: "hsl(220, 15%, 92%)",
};

function EcoScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";
  return (
    <div className={`flex h-14 w-14 items-center justify-center rounded-full border-4 font-bold text-lg ${color}`}
      style={{ borderColor: score >= 80 ? "hsl(150, 60%, 45%)" : score >= 60 ? "hsl(45, 90%, 55%)" : "hsl(0, 72%, 51%)" }}>
      {score}
    </div>
  );
}

export default function Sustentabilidade() {
  const [tab, setTab] = useState("eco");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inovação & Sustentabilidade</h1>
        <p className="text-sm text-muted-foreground">Rastreabilidade ecológica, diagnóstico AR e internacionalização</p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { title: "CO₂ Evitado (mês)", value: "230 kg", icon: Leaf, color: "hsl(150, 60%, 45%)" },
          { title: "Peças Recicladas", value: "94", icon: Recycle, color: "hsl(3, 62%, 46%)" },
          { title: "Árvores Compensadas", value: "12", icon: TreePine, color: "hsl(150, 60%, 45%)" },
          { title: "Diagnósticos AR", value: "47", icon: Scan, color: "hsl(270, 60%, 65%)" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title} className="glass-panel">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{s.title}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${s.color}15` }}>
                    <Icon className="h-5 w-5" style={{ color: s.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="eco">Eco Score</TabsTrigger>
          <TabsTrigger value="impacto">Impacto Ambiental</TabsTrigger>
          <TabsTrigger value="ar">Identificar Peças</TabsTrigger>
          <TabsTrigger value="internacional">Internacional</TabsTrigger>
        </TabsList>

        {/* --- Eco Score --- */}
        <TabsContent value="eco" className="space-y-4">
          <div className="space-y-3">
            {ecoProducts.map((p) => (
              <Card key={p.sku} className="glass-panel">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <EcoScoreRing score={p.ecoScore} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{p.nome}</h3>
                        <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>
                        {p.selo && (
                          <Badge className="bg-success/15 text-success border-0 text-[10px]">
                            <Leaf className="h-3 w-3 mr-1" /> Eco
                          </Badge>
                        )}
                      </div>
                      <div className="grid gap-3 md:grid-cols-3 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Pegada de Carbono</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Fabricação</span>
                              <span className="font-mono">{p.co2Fab} kg CO₂</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span>Transporte</span>
                              <span className="font-mono">{p.co2Trans} kg CO₂</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold border-t border-border/50 pt-1">
                              <span>Total</span>
                              <span className="font-mono text-primary">{p.co2Total} kg CO₂</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Reciclabilidade: {p.reciclavel}%</p>
                          <Progress value={p.reciclavel} className="h-2 mb-2" />
                          <div className="space-y-0.5">
                            {p.materiais.map((m) => (
                              <p key={m} className="text-xs text-muted-foreground">{m}</p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Rastreabilidade</p>
                          <div className="space-y-1 text-xs">
                            <p><span className="text-muted-foreground">Fabricante:</span> {p.origem}</p>
                            <p><span className="text-muted-foreground">Lote:</span> {p.lote}</p>
                            <p className="flex items-center gap-1 text-primary">
                              <CheckCircle2 className="h-3 w-3" /> Autenticidade verificada
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="glass-panel border-success/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Recycle className="h-5 w-5 text-success" />
                <h3 className="font-semibold">Programa "Troque Sua Peça Velha"</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Traga sua peça usada e ganhe desconto na nova. Contribua para a reciclagem!</p>
              <div className="grid gap-2 md:grid-cols-3">
                {["Filtro usado → 10% off", "Pneu usado → 15% off", "Bateria usada → 20% off"].map((d) => (
                  <div key={d} className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
                    <Recycle className="h-4 w-4 text-success" /> {d}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Impacto --- */}
        <TabsContent value="impacto" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  CO₂ Evitado & Peças Recicladas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={impactoMensal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 18%)" />
                      <XAxis dataKey="mes" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                      <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="co2Evitado" fill="hsl(150, 60%, 45%)" radius={[4, 4, 0, 0]} barSize={20} name="CO₂ Evitado (kg)" />
                      <Bar dataKey="pecasRecicladas" fill="hsl(3, 62%, 46%)" radius={[4, 4, 0, 0]} barSize={20} name="Peças Recicladas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Materiais Reciclados por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={materiaisReciclados} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                        {materiaisReciclados.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {materiaisReciclados.map((m) => (
                    <div key={m.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                        <span className="text-muted-foreground">{m.name}</span>
                      </div>
                      <span className="font-medium">{m.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- AR Identificação de Peças --- */}
        <TabsContent value="ar" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                Identificação de Peças por Câmera
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Simulated AR view */}
              <div className="relative rounded-xl border border-border/50 bg-secondary/30 p-8 mb-4 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Smartphone className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Aponte a câmera para o produto</h3>
                  <p className="text-sm text-muted-foreground max-w-md">A IA identificará a peça e buscará produtos similares e compatíveis no seu catálogo automaticamente</p>
                  <Button className="mt-2"><Camera className="h-4 w-4 mr-1" /> Iniciar Escaneamento</Button>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge className="bg-primary/15 text-primary border-0"><Sparkles className="h-3 w-3 mr-1" /> IA Vision</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Último Escaneamento — Peça Identificada</h4>

                {/* Identified part */}
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                      <Scan className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Pastilha de Freio Dianteira</p>
                      <p className="text-xs text-muted-foreground">Confiança: 94% · Detectada via IA Vision</p>
                    </div>
                    <Badge className="ml-auto bg-success/15 text-success border-0 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Identificada
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Aplicação detectada: Honda CG 160 / Titan 160 / Fan 160</p>
                    <p>Categoria: Freios · Material: Semimetálica</p>
                  </div>
                </div>

                {/* Similar products found */}
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 pt-2">
                  <Package className="h-4 w-4" /> Peças Similares no Sistema ({arPecasSimilares.length})
                </h4>
                {arPecasSimilares.map((p) => (
                  <div key={p.sku} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${p.estoque > 0 ? "bg-success/15" : "bg-destructive/15"}`}>
                        <Package className={`h-4 w-4 ${p.estoque > 0 ? "text-success" : "text-destructive"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">{p.sku} · {p.marca} · Similaridade: {p.similaridade}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-semibold text-sm">R$ {p.preco.toFixed(2)}</p>
                        <p className={`text-[10px] ${p.estoque > 0 ? "text-success" : "text-destructive"}`}>
                          {p.estoque > 0 ? `${p.estoque} em estoque` : "Sem estoque"}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs">
                        {p.estoque > 0 ? "Adicionar" : "Encomendar"}
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Compatible parts */}
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 pt-2">
                  <Zap className="h-4 w-4" /> Componentes Compatíveis
                </h4>
                {arCompativeis.map((c) => (
                  <div key={c.sku} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Award className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{c.nome}</p>
                        <p className="text-xs text-muted-foreground">{c.sku} · {c.marca} · {c.tipo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-semibold text-sm">R$ {c.preco.toFixed(2)}</p>
                        <p className={`text-[10px] ${c.estoque > 0 ? "text-success" : "text-destructive"}`}>
                          {c.estoque > 0 ? `${c.estoque} em estoque` : "Sem estoque"}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs">Ver Detalhes</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Internacional --- */}
        <TabsContent value="internacional" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Languages className="h-4 w-4 text-primary" />
                  Multi-Idioma & Multi-Moeda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {idiomas.map((i) => (
                    <div key={i.id} className={`flex items-center justify-between rounded-lg border p-4 ${i.ativo ? "border-primary/30 bg-primary/5" : "border-border/50 bg-secondary/30"}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{i.bandeira}</span>
                        <div>
                          <p className="text-sm font-semibold">{i.label}</p>
                          <p className="text-xs text-muted-foreground">Moeda: {i.moeda} · Formato: {i.formato}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {i.ativo && <Badge className="bg-success/15 text-success border-0 text-xs">Ativo</Badge>}
                        <Button size="sm" variant={i.ativo ? "default" : "outline"}>{i.ativo ? "Padrão" : "Ativar"}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Marketplace Multi-País
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { pais: "🇧🇷 Brasil", produtos: 1247, pedidos: 342, status: "ativo", logistica: "Correios, Jadlog" },
                    { pais: "🇦🇷 Argentina", produtos: 680, pedidos: 0, status: "em_breve", logistica: "Correo Argentino" },
                    { pais: "🇺🇸 Estados Unidos", produtos: 0, pedidos: 0, status: "planejado", logistica: "FedEx, UPS" },
                  ].map((m) => (
                    <div key={m.pais} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-4">
                      <div>
                        <p className="font-semibold">{m.pais}</p>
                        <p className="text-xs text-muted-foreground">{m.produtos} produtos · {m.pedidos} pedidos · {m.logistica}</p>
                      </div>
                      <Badge variant="outline" className={m.status === "ativo" ? "border-success text-success" : m.status === "em_breve" ? "border-warning text-warning" : ""}>
                        {m.status === "ativo" ? "Ativo" : m.status === "em_breve" ? "Em Breve" : "Planejado"}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">Conversão Automática</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold">R$ 1,00</p>
                      <p className="text-xs text-muted-foreground">BRL</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">$ 0.18</p>
                      <p className="text-xs text-muted-foreground">USD</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">€ 0.17</p>
                      <p className="text-xs text-muted-foreground">EUR</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
