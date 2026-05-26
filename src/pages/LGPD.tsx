import { useState } from "react";
import {
  Shield,
  Lock,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Key,
  Fingerprint,
  Server,
  Activity,
  Bell,
  UserX,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

// --- Mock Data ---
const consentimentos = [
  { id: "vendas", label: "Processamento de Vendas", desc: "Processar pedidos e emitir notas fiscais", obrigatorio: true, concedido: true, data: "15/01/2025" },
  { id: "marketing_email", label: "Marketing por E-mail", desc: "Envio de promoções e ofertas por e-mail", obrigatorio: false, concedido: true, data: "15/01/2025" },
  { id: "marketing_whatsapp", label: "Marketing por WhatsApp", desc: "Envio de ofertas e lembretes via WhatsApp", obrigatorio: false, concedido: true, data: "15/01/2025" },
  { id: "marketing_sms", label: "Marketing por SMS", desc: "Envio de mensagens de texto promocionais", obrigatorio: false, concedido: false, data: null },
  { id: "compartilhamento", label: "Compartilhamento com Parceiros", desc: "Compartilhar dados com Asaas e FocusNFe para processamento", obrigatorio: true, concedido: true, data: "15/01/2025" },
  { id: "analytics", label: "Análise de Comportamento", desc: "Usar dados de navegação para melhorar experiência", obrigatorio: false, concedido: false, data: null },
];

const requisicoes = [
  { tipo: "portabilidade", status: "concluido", data: "15/01/2025", desc: "Exportação completa em JSON" },
  { tipo: "acesso", status: "concluido", data: "02/02/2025", desc: "Relatório de dados pessoais enviado" },
  { tipo: "exclusao", status: "em_processamento", data: "10/02/2025", desc: "Período de carência de 30 dias" },
  { tipo: "retificacao", status: "concluido", data: "28/01/2025", desc: "E-mail corrigido com sucesso" },
];

const statusIcons: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  concluido: { icon: CheckCircle2, color: "text-success" },
  em_processamento: { icon: Clock, color: "text-warning" },
  negado: { icon: XCircle, color: "text-destructive" },
};

const tipoLabels: Record<string, string> = {
  portabilidade: "Portabilidade",
  acesso: "Acesso aos Dados",
  exclusao: "Exclusão de Conta",
  retificacao: "Retificação",
};

const camadasSeguranca = [
  {
    nivel: 1,
    titulo: "Infraestrutura",
    icon: Server,
    cor: "hsl(200, 70%, 50%)",
    score: 95,
    itens: [
      { nome: "WAF (Cloudflare)", status: "ativo", desc: "Firewall de aplicação web" },
      { nome: "DDoS Protection", status: "ativo", desc: "Proteção contra ataques distribuídos" },
      { nome: "Rate Limiting", status: "ativo", desc: "100 req/min por IP" },
      { nome: "SSL/TLS 1.3", status: "ativo", desc: "Certificado válido até 2026" },
    ],
  },
  {
    nivel: 2,
    titulo: "Aplicação",
    icon: Lock,
    cor: "hsl(3, 62%, 46%)",
    score: 88,
    itens: [
      { nome: "MFA (TOTP)", status: "ativo", desc: "Google Authenticator habilitado" },
      { nome: "Sessão Timeout", status: "ativo", desc: "30 minutos de inatividade" },
      { nome: "CSRF Tokens", status: "ativo", desc: "Em todos os formulários" },
      { nome: "Sanitização XSS", status: "ativo", desc: "Inputs sanitizados automaticamente" },
    ],
  },
  {
    nivel: 3,
    titulo: "Dados",
    icon: Key,
    cor: "hsl(150, 60%, 45%)",
    score: 92,
    itens: [
      { nome: "Criptografia AES-256", status: "ativo", desc: "Dados em repouso criptografados" },
      { nome: "Backup Automático", status: "ativo", desc: "A cada 6 horas" },
      { nome: "Retenção 30 dias", status: "ativo", desc: "Backups retidos por 30 dias" },
      { nome: "Teste de Recuperação", status: "pendente", desc: "Próximo teste: 01/03/2025" },
    ],
  },
  {
    nivel: 4,
    titulo: "Monitoramento",
    icon: Activity,
    cor: "hsl(270, 60%, 65%)",
    score: 85,
    itens: [
      { nome: "SIEM", status: "ativo", desc: "Monitoramento em tempo real" },
      { nome: "Alerta Login Falho", status: "ativo", desc: "3+ tentativas → bloqueio" },
      { nome: "IP Suspeito", status: "ativo", desc: "Geoblock + notificação" },
      { nome: "Dados Críticos", status: "ativo", desc: "Alteração de preços/impostos alertada" },
    ],
  },
];

const alertasSeguranca = [
  { tipo: "login_falho", severidade: "media", desc: "5 tentativas de login falhas para admin@ottotech.com", ip: "189.44.23.105", timestamp: "Há 15 min" },
  { tipo: "ip_suspeito", severidade: "alta", desc: "Acesso de IP não reconhecido (Rússia) bloqueado", ip: "91.234.56.78", timestamp: "Há 2 horas" },
  { tipo: "dados_criticos", severidade: "baixa", desc: "Alteração de alíquota ICMS por usuário admin", ip: "192.168.1.10", timestamp: "Há 1 dia" },
];

const sevStyles: Record<string, { bg: string; text: string; label: string }> = {
  alta: { bg: "bg-destructive/15", text: "text-destructive", label: "Alta" },
  media: { bg: "bg-warning/15", text: "text-warning", label: "Média" },
  baixa: { bg: "bg-info/15", text: "text-info", label: "Baixa" },
};

export default function LGPD() {
  const [tab, setTab] = useState("lgpd");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">LGPD & Segurança</h1>
        <p className="text-sm text-muted-foreground">Compliance de dados, consentimentos e proteção multi-camadas</p>
      </div>

      {/* Security Score */}
      <div className="grid gap-4 md:grid-cols-4">
        {camadasSeguranca.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.nivel} className="glass-panel">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${c.cor}15` }}>
                    <Icon className="h-5 w-5" style={{ color: c.cor }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nível {c.nivel}</p>
                    <p className="font-semibold text-sm">{c.titulo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={c.score} className="h-2 flex-1" />
                  <span className="text-sm font-bold" style={{ color: c.cor }}>{c.score}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="lgpd">LGPD Compliance</TabsTrigger>
          <TabsTrigger value="seguranca">Camadas de Segurança</TabsTrigger>
          <TabsTrigger value="alertas">Alertas em Tempo Real</TabsTrigger>
          <TabsTrigger value="direitos">Direitos do Titular</TabsTrigger>
        </TabsList>

        {/* --- LGPD --- */}
        <TabsContent value="lgpd" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Gestão de Consentimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {consentimentos.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.concedido ? "bg-success/15" : "bg-secondary"}`}>
                        {c.concedido ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{c.label}</p>
                          {c.obrigatorio && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Obrigatório</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{c.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {c.data && <span className="text-xs text-muted-foreground">{c.data}</span>}
                      <Switch checked={c.concedido} disabled={c.obrigatorio} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export & Deletion actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass-panel hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-5 text-center">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-primary/10 mb-3">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Exportar Meus Dados</h3>
                <p className="text-xs text-muted-foreground mb-3">Baixar todos os seus dados em JSON, CSV ou PDF</p>
                <Button size="sm" className="w-full"><Download className="h-4 w-4 mr-1" /> Exportar</Button>
              </CardContent>
            </Card>
            <Card className="glass-panel hover:border-warning/30 transition-colors cursor-pointer">
              <CardContent className="p-5 text-center">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-warning/10 mb-3">
                  <UserX className="h-6 w-6 text-warning" />
                </div>
                <h3 className="font-semibold mb-1">Anonimizar Dados</h3>
                <p className="text-xs text-muted-foreground mb-3">Anonimização automática após 5 anos de inatividade</p>
                <Button size="sm" variant="outline" className="w-full">Configurar</Button>
              </CardContent>
            </Card>
            <Card className="glass-panel hover:border-destructive/30 transition-colors cursor-pointer">
              <CardContent className="p-5 text-center">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-destructive/10 mb-3">
                  <Trash2 className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="font-semibold mb-1">Solicitar Exclusão</h3>
                <p className="text-xs text-muted-foreground mb-3">Período de carência de 30 dias antes da remoção</p>
                <Button size="sm" variant="destructive" className="w-full">Solicitar</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Segurança --- */}
        <TabsContent value="seguranca" className="space-y-4">
          {camadasSeguranca.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.nivel} className="glass-panel">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: c.cor }} />
                    Nível {c.nivel} — {c.titulo}
                    <span className="ml-auto text-sm font-bold" style={{ color: c.cor }}>{c.score}%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2">
                    {c.itens.map((item) => (
                      <div key={item.nome} className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/30 p-3">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${item.status === "ativo" ? "bg-success/15" : "bg-warning/15"}`}>
                          {item.status === "ativo" ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Clock className="h-3.5 w-3.5 text-warning" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.nome}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* --- Alertas --- */}
        <TabsContent value="alertas" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Alertas de Segurança em Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertasSeguranca.map((a, i) => {
                  const sev = sevStyles[a.severidade];
                  return (
                    <div key={i} className={`rounded-lg border p-4 ${a.severidade === "alta" ? "border-destructive/30" : "border-border/50"}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`h-4 w-4 ${sev.text}`} />
                          <span className="font-semibold text-sm">{a.desc}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sev.bg} ${sev.text}`}>{sev.label}</span>
                          <span className="text-xs text-muted-foreground">{a.timestamp}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> IP: {a.ip}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Direitos do Titular --- */}
        <TabsContent value="direitos" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Histórico de Requisições (Direitos do Titular)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requisicoes.map((r, i) => {
                  const s = statusIcons[r.status];
                  const Icon = s.icon;
                  return (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-4">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${s.color}`} />
                        <div>
                          <p className="text-sm font-semibold">{tipoLabels[r.tipo]}</p>
                          <p className="text-xs text-muted-foreground">{r.desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">{r.status === "concluido" ? "Concluído" : "Em processamento"}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{r.data}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
