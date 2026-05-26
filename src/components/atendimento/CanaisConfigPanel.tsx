import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  MessageCircle,
  Settings,
  Wifi,
  WifiOff,
  Clock,
  QrCode,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface CanalConfig {
  id: string;
  tipo: string;
  nome_exibicao: string;
  ativo: boolean;
  conectado: boolean;
  configuracao: Record<string, unknown>;
  mensagem_boas_vindas: string | null;
  mensagem_fora_horario: string | null;
  horario_inicio: string | null;
  horario_fim: string | null;
  auto_resposta_ativa: boolean;
  erro_conexao: string | null;
}

const CANAIS_DISPONIVEIS = [
  {
    tipo: "whatsapp",
    label: "WhatsApp",
    icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
    cor: "bg-white border-green-500/30",
    descricao: "Conecte via Evolution API ou Z-API",
    campos: [
      { key: "api_url", label: "URL da API", placeholder: "https://api.seudominio.com" },
      { key: "api_key", label: "API Key / Token", placeholder: "Sua chave de API", tipo: "password" },
      { key: "instance_name", label: "Nome da Instância", placeholder: "minha-instancia" },
    ],
  },
  {
    tipo: "instagram",
    label: "Instagram",
    icon: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
    cor: "bg-white border-pink-500/30",
    descricao: "Instagram Messaging via Meta Graph API",
    campos: [
      { key: "page_id", label: "Page ID (Facebook)", placeholder: "ID da página vinculada" },
      { key: "access_token", label: "Access Token", placeholder: "Token de acesso permanente", tipo: "password" },
      { key: "ig_account_id", label: "Instagram Account ID", placeholder: "ID da conta Instagram" },
    ],
  },
  {
    tipo: "facebook",
    label: "Facebook Messenger",
    icon: "https://upload.wikimedia.org/wikipedia/commons/b/be/Facebook_Messenger_logo_2020.svg",
    cor: "bg-white border-blue-500/30",
    descricao: "Facebook Messenger Platform",
    campos: [
      { key: "page_id", label: "Page ID", placeholder: "ID da página" },
      { key: "access_token", label: "Page Access Token", placeholder: "Token de acesso da página", tipo: "password" },
      { key: "verify_token", label: "Verify Token (Webhook)", placeholder: "Token de verificação" },
    ],
  },
];

export default function CanaisConfigPanel() {
  const [canais, setCanais] = useState<CanalConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);

  useEffect(() => {
    carregarCanais();
  }, []);

  const carregarCanais = async () => {
    const { data } = await supabase.from("canais_comunicacao").select("*").order("created_at");
    setCanais((data as CanalConfig[]) || []);
    setLoading(false);
  };

  const criarCanal = async (tipo: string) => {
    const info = CANAIS_DISPONIVEIS.find((c) => c.tipo === tipo);
    if (!info) return;

    const { error } = await supabase.from("canais_comunicacao").insert({
      tipo,
      nome_exibicao: info.label,
      configuracao: {},
      ativo: false,
      conectado: false,
    });

    if (!error) {
      toast.success(`Canal ${info.label} criado!`);
      carregarCanais();
    }
  };

  const salvarCanal = async (canal: CanalConfig) => {
    setSalvando(canal.id);
    const { error } = await supabase
      .from("canais_comunicacao")
      .update({
        nome_exibicao: canal.nome_exibicao,
        ativo: canal.ativo,
        configuracao: canal.configuracao as unknown as import("@/integrations/supabase/types").Json,
        mensagem_boas_vindas: canal.mensagem_boas_vindas,
        mensagem_fora_horario: canal.mensagem_fora_horario,
        horario_inicio: canal.horario_inicio,
        horario_fim: canal.horario_fim,
        auto_resposta_ativa: canal.auto_resposta_ativa,
      })
      .eq("id", canal.id);

    setSalvando(null);
    if (!error) toast.success("Canal salvo com sucesso!");
    else toast.error("Erro ao salvar canal");
  };

  const testarConexao = async (canal: CanalConfig) => {
    toast.info(`Testando conexão ${canal.nome_exibicao}...`);
    // Simulação — depois conectará à edge function real
    setTimeout(() => {
      toast.success(`Conexão com ${canal.nome_exibicao} testada (simulado)`);
    }, 1500);
  };

  const updateCanalField = (id: string, field: string, value: unknown) => {
    setCanais((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const updateCanalConfig = (id: string, key: string, value: string) => {
    setCanais((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, configuracao: { ...c.configuracao, [key]: value } }
          : c
      )
    );
  };

  const canaisConfigurados = canais.map((c) => c.tipo);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Configuração de Canais</h2>
        <p className="text-sm text-muted-foreground">
          Configure suas integrações com WhatsApp, Instagram e Facebook
        </p>
      </div>

      {/* Canais disponíveis para adicionar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CANAIS_DISPONIVEIS.map((info) => {
          const jaConfigurado = canaisConfigurados.includes(info.tipo);
          return (
            <Card
              key={info.tipo}
              className={`border ${jaConfigurado ? "border-primary/30 bg-primary/5" : "border-dashed border-border"}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border overflow-hidden ${info.cor}`}>
                    <img src={info.icon} alt={info.label} className="w-7 h-7 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{info.label}</h3>
                    <p className="text-[11px] text-muted-foreground">{info.descricao}</p>
                  </div>
                </div>

                {jaConfigurado ? (
                  <Badge variant="secondary" className="text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Configurado
                  </Badge>
                ) : (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => criarCanal(info.tipo)}>
                    + Adicionar Canal
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuração detalhada de cada canal */}
      {canais.length > 0 && (
        <Tabs defaultValue={canais[0]?.id}>
          <TabsList className="bg-secondary/50">
            {canais.map((canal) => {
              const info = CANAIS_DISPONIVEIS.find((c) => c.tipo === canal.tipo);
              return (
                <TabsTrigger key={canal.id} value={canal.id} className="gap-1.5">
                  {info?.icon && <img src={info.icon} alt="" className="w-4 h-4 object-contain" />}
                  {canal.nome_exibicao}
                  {canal.conectado ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-muted-foreground" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {canais.map((canal) => {
            const info = CANAIS_DISPONIVEIS.find((c) => c.tipo === canal.tipo);
            return (
              <TabsContent key={canal.id} value={canal.id} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Credenciais */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Credenciais da API
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {info?.campos.map((campo) => (
                        <div key={campo.key}>
                          <label className="text-xs font-medium text-muted-foreground">{campo.label}</label>
                          <Input
                            type={campo.tipo || "text"}
                            placeholder={campo.placeholder}
                            value={(canal.configuracao[campo.key] as string) || ""}
                            onChange={(e) => updateCanalConfig(canal.id, campo.key, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      ))}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testarConexao(canal)}
                          className="flex-1"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Testar Conexão
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => salvarCanal(canal)}
                          disabled={salvando === canal.id}
                          className="flex-1"
                        >
                          {salvando === canal.id ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>

                      {canal.erro_conexao && (
                        <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <p className="text-xs text-destructive">{canal.erro_conexao}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Automação */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Automação & Horário
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Canal Ativo</p>
                          <p className="text-[11px] text-muted-foreground">Receber e enviar mensagens</p>
                        </div>
                        <Switch
                          checked={canal.ativo ?? false}
                          onCheckedChange={(v) => updateCanalField(canal.id, "ativo", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Auto-resposta</p>
                          <p className="text-[11px] text-muted-foreground">Responder automaticamente</p>
                        </div>
                        <Switch
                          checked={canal.auto_resposta_ativa ?? false}
                          onCheckedChange={(v) => updateCanalField(canal.id, "auto_resposta_ativa", v)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Início
                          </label>
                          <Input
                            type="time"
                            value={canal.horario_inicio || "08:00"}
                            onChange={(e) => updateCanalField(canal.id, "horario_inicio", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Fim</label>
                          <Input
                            type="time"
                            value={canal.horario_fim || "18:00"}
                            onChange={(e) => updateCanalField(canal.id, "horario_fim", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Mensagem de Boas-vindas</label>
                        <Input
                          placeholder="Olá! Como posso ajudar?"
                          value={canal.mensagem_boas_vindas || ""}
                          onChange={(e) => updateCanalField(canal.id, "mensagem_boas_vindas", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Mensagem Fora do Horário</label>
                        <Input
                          placeholder="Estamos fora do horário de atendimento..."
                          value={canal.mensagem_fora_horario || ""}
                          onChange={(e) => updateCanalField(canal.id, "mensagem_fora_horario", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Webhook Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Webhook (para receber mensagens)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-secondary/50 rounded-lg p-3 font-mono text-xs break-all text-muted-foreground">
                      {`https://qrwminvkdcjaqpiptxlr.supabase.co/functions/v1/webhook-${canal.tipo}`}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Configure esta URL como webhook no painel do seu provedor ({canal.tipo === "whatsapp" ? "Evolution API / Z-API" : "Meta Developers"}).
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {loading && (
        <div className="text-center py-8 text-muted-foreground text-sm">Carregando canais...</div>
      )}
    </div>
  );
}
