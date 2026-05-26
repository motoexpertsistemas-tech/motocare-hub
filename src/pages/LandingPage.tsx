import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoOttoTech from "@/assets/otto-tech-logo.png";
import wesdraPhoto from "@/assets/wesdra-santos.png";
import whatsappLogo from "@/assets/wh.png";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check, X, ArrowRight, Zap, Users, TrendingUp, Shield, Bot,
  Smartphone, Wrench, BarChart3, Package, ShoppingCart, FileText,
  MessageSquare, Star, ChevronDown, Bike, Phone, Bell, Receipt,
  Cog, Key, Sprout, Heart, Target, Store, Calculator, Palette,
  Trophy, ClipboardList, Settings, Gift, CreditCard, Headphones,
  Cloud, HardDrive, BadgeDollarSign, Globe, Handshake
} from "lucide-react";

const planos = [
  {
    nome: "Platina",
    descricao: "Para redes e franquias",
    preco_mensal: 521.54,
    preco_semestral_mes: 443.31,
    preco_anual_mes: 339.00,
    cor: "#A0A0B0",
    recursos: [
      "Usuários ilimitados",
      "OSs ilimitadas",
      "Até 3 empresas/lojas",
      "Controle de estoque avançado",
      "PDV completo + Marketplace",
      "CRM Omnichannel",
      "🤖 Agente IA integrado",
      "WhatsApp Bot integrado (até 3)",
      "Modo quiosque para mecânicos",
      "Emissão de NF-e/NFC-e",
      "DRE automático",
      "Consulta de placas ilimitada",
      "Relatórios avançados",
      "API aberta para integrações",
      "Dashboard executivo",
      "Marketplace próprio",
      "📊 Calculadora de Lucro 2026",
      "🎨 Criativos IA - Estúdio de Escala",
      "Gestão Operacional",
      "E-commerce integrado",
      "Programa de Fidelidade",
      "Gerente de sucesso dedicado",
      "Customizações sob medida",
      "SLA de 2h para suporte",
    ],
    limitacoes: [],
    destaque: false,
  },
  {
    nome: "Ouro",
    descricao: "Para empresas em crescimento",
    preco_mensal: 398.46,
    preco_semestral_mes: 338.69,
    preco_anual_mes: 259.00,
    cor: "#C5A028",
    recursos: [
      "5 usuários simultâneos",
      "OSs ilimitadas",
      "Controle de estoque avançado",
      "PDV completo + Marketplace",
      "CRM Omnichannel",
      "🤖 Agente IA integrado",
      "WhatsApp Bot integrado",
      "Modo quiosque para mecânicos",
      "Emissão de NF-e/NFC-e",
      "DRE automático",
      "Consulta de placas ilimitada",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
    limitacoes: ["Máximo 5 usuários", "Sem multi-loja"],
    destaque: true,
  },
  {
    nome: "Prata",
    descricao: "Para empresas consolidadas",
    preco_mensal: 275.38,
    preco_semestral_mes: 234.07,
    preco_anual_mes: 179.00,
    cor: "#8A8A8A",
    recursos: [
      "3 usuários simultâneos",
      "OSs ilimitadas",
      "Controle de estoque completo",
      "PDV completo",
      "Emissão de NF-e/NFC-e",
      "Consulta de placas",
      "Relatórios avançados",
      "Suporte por chat",
    ],
    limitacoes: ["Sem CRM", "Sem Agente IA", "Sem modo quiosque"],
    destaque: false,
  },
  {
    nome: "Bronze",
    descricao: "Ideal para empresas iniciantes",
    preco_mensal: 167.69,
    preco_semestral_mes: 142.54,
    preco_anual_mes: 89.90,
    preco_promocional: 109.00,
    cor: "#CD7F32",
    recursos: [
      "1 usuário simultâneo",
      "50 OSs por mês",
      "Controle de estoque básico",
      "PDV simplificado",
      "Relatórios básicos",
      "Suporte por email",
    ],
    limitacoes: ["Sem CRM", "Sem NF-e automática", "Sem modo quiosque", "Sem API"],
    destaque: false,
  },
];

const recursos = [
  {
    id: "agente-ia",
    icon: Bot,
    titulo: "🤖 Agente IA Integrado",
    descricao: "Atende clientes automaticamente no WhatsApp, busca produtos no estoque, gera orçamentos e agenda serviços. Funciona 24/7!",
    badge: "NOVO",
    destaque: true,
    items: [
      "Atendimento automático WhatsApp",
      "Busca produtos no sistema em tempo real",
      "Gera orçamentos automaticamente",
      "Diagnóstico técnico inteligente",
    ],
  },
  {
    id: "consulta-placas",
    icon: Smartphone,
    titulo: "🔍 Consulta de Placas",
    descricao: "Digite a placa e o sistema preenche automaticamente marca, modelo, ano, cor e dados do veículo.",
    badge: "NOVO",
    destaque: false,
    items: ["Economia de 3 min por OS", "Redução de 95% de erros", "Consultas repetidas grátis por 90 dias"],
  },
  {
    id: "crm-omnichannel",
    icon: Users,
    titulo: "CRM Omnichannel",
    descricao: "Centralize atendimentos de WhatsApp, Instagram, Facebook e site em um único lugar.",
    badge: null,
    destaque: false,
    items: [
      "Histórico completo de conversas",
      "Funil de vendas integrado",
      "Tags e prioridades por cliente",
      "Transferência para atendente humano",
    ],
  },
  {
    id: "controle-financeiro",
    icon: TrendingUp,
    titulo: "DRE Automático",
    descricao: "Veja lucro real descontando impostos, comissões e custos automaticamente.",
    badge: null,
    destaque: false,
    items: [
      "Receitas x Despesas em tempo real",
      "Margem de contribuição por serviço",
      "Comparativo mensal automático",
      "Exportação para contabilidade",
    ],
  },
  {
    id: "ordens-servico",
    icon: Wrench,
    titulo: "Ordens de Serviço",
    descricao: "Crie, gerencie e acompanhe OSs com fotos, checklists e assinatura digital do cliente.",
    badge: null,
    destaque: false,
    items: [
      "Checklist digital de entrada",
      "Fotos antes e depois do serviço",
      "Acompanhamento por status",
      "Impressão e envio por WhatsApp",
    ],
  },
  {
    id: "controle-estoque",
    icon: Package,
    titulo: "Estoque Inteligente",
    descricao: "Controle de estoque com +28.000 produtos pré-cadastrados, importação de catálogos e alertas de reposição.",
    badge: null,
    destaque: false,
    items: [
      "Importação de catálogos automática",
      "Alerta de estoque mínimo",
      "Curva ABC de produtos",
      "Múltiplas tabelas de preço",
    ],
  },
  {
    id: "marketplaces",
    icon: Store,
    titulo: "🛒 Marketplaces Multi-canal",
    descricao: "Venda em Mercado Livre, Shopee, TikTok Shop e mais com sincronização automática de pedidos e estoque.",
    badge: "NOVO",
    destaque: true,
    items: [
      "Sincronização automática de pedidos",
      "Gestão de estoque unificada",
      "Dashboard de vendas por canal",
      "Integração com 6+ marketplaces",
    ],
  },
  {
    id: "calculadora-lucro",
    icon: Calculator,
    titulo: "📊 Calculadora de Lucro",
    descricao: "Simule preços e margens para seus produtos nos marketplaces com taxas atualizadas 2026.",
    badge: "2026",
    destaque: false,
    items: [
      "Taxas atualizadas por marketplace",
      "Cálculo automático de comissões",
      "Simulação Clássico vs Premium",
      "Perfis salvos por canal",
    ],
  },
  {
    id: "criativos-ia",
    icon: Palette,
    titulo: "🎨 Criativos IA - Estúdio de Escala",
    descricao: "Crie novas variações de imagens do zero usando IA para anúncios e marketplaces.",
    badge: "NOVO",
    destaque: false,
    items: [
      "Geração de imagens com IA",
      "Variações em lote automáticas",
      "Múltiplos formatos e resoluções",
      "Refinamento inteligente",
    ],
  },
  {
    id: "controle-vendas",
    icon: Trophy,
    titulo: "🏆 Ranking de Vendedores",
    descricao: "Acompanhe a performance dos vendedores e mecânicos em tempo real com rankings e medalhas.",
    badge: null,
    destaque: false,
    items: [
      "Rankings por faturamento mensal",
      "Filtro por canal de venda",
      "Medalhas de performance",
      "Comparativo entre períodos",
    ],
  },
  {
    id: "relatorios",
    icon: ClipboardList,
    titulo: "📋 Relatórios Avançados",
    descricao: "DRE Gerencial, Vendas, Estoque, Financeiro, Clientes, Serviços/OS, Comissões e Fidelidade.",
    badge: null,
    destaque: false,
    items: [
      "8 categorias de relatórios",
      "Exportação Excel e impressão",
      "Filtros avançados por período",
      "Comissões automáticas por vendedor",
    ],
  },
  {
    id: "gestao-operacional",
    icon: Settings,
    titulo: "⚙️ Gestão Operacional",
    descricao: "Checklists diários para 15 setores da empresa com monitoramento de performance em tempo real.",
    badge: null,
    destaque: false,
    items: [
      "Checklists por setor e funcionário",
      "Reset automático diário",
      "Relatório mensal de performance",
      "Badges de desempenho (Excelente, Bom, Regular)",
    ],
  },
];

const depoimentos = [
  { nome: "Carlos Silva", oficina: "Moto Mania SP", texto: "Reduzi 40% do tempo em orçamentos com o Agente IA. Meus clientes adoram o atendimento 24h!", estrelas: 5 },
  { nome: "Roberto Santos", oficina: "Speed Motos RJ", texto: "O sistema já veio com todos os produtos cadastrados. Economizei semanas de trabalho!", estrelas: 5 },
  { nome: "Ana Costa", oficina: "Oficina da Ana", texto: "A consulta de placas é sensacional. Preenche tudo automático, sem erros!", estrelas: 5 },
];

const faqs = [
  { q: "O Otto Tech Sistemas possui teste grátis?", a: "Sim, o Otto Tech Sistemas oferece um teste grátis completo. Esse teste permite que você experimente todas as funcionalidades do sistema ERP por <strong>10 dias consecutivos</strong>, sem a necessidade de cadastrar informações de pagamento, como cartão de crédito.\n\nO teste gratuito é uma excelente oportunidade para conhecer na prática como o Otto Tech Sistemas pode otimizar a gestão do seu negócio.\n\nVocê poderá testar a integração entre os módulos, a automação de processos e a facilidade de uso da plataforma, tudo sem compromisso financeiro.\n\nPara começar, é bem simples:\n\n– Comece o teste grátis do sistema;\n– Preencha o formulário com os dados da sua empresa e crie uma conta;\n– Após o cadastro, você terá acesso imediato ao sistema.\n\nO processo de cadastro é rápido: em <strong>menos de 1 minuto</strong>, você já pode começar a explorar as funcionalidades do ERP, como controle financeiro, estoque, vendas, emissão de notas fiscais, geração de boletos e relatórios estratégicos.\n\nDurante o período de teste, você também conta com <strong>suporte técnico gratuito</strong>, garantindo que qualquer dúvida seja esclarecida rapidamente, tornando a experiência ainda mais eficiente e produtiva.\n\nAproveite essa oportunidade para testar o <strong>Otto Tech Sistemas gratuitamente</strong> e descobrir como ele pode transformar a gestão da sua empresa." },
  { q: "Como funciona o teste grátis do Otto Tech Sistemas?", a: "O <strong>Otto Tech Sistemas oferece um teste grátis completo</strong>, no qual você pode experimentar todas as funcionalidades do sistema ERP por <strong>10 dias consecutivos</strong>, sem a necessidade de cadastrar informações de pagamento, como cartão de crédito.\n\n– <strong>Acesso total aos módulos:</strong> você poderá utilizar todas as ferramentas do sistema, como controle financeiro, emissão de notas fiscais, estoque, vendas, geração de boletos, relatórios e muito mais;\n\n– <strong>Interface 100% online:</strong> sem necessidade de instalação, você pode acessar o sistema de qualquer lugar, a qualquer hora, por meio de um navegador de internet;\n\n– <strong>Suporte técnico gratuito:</strong> durante o período de teste, você terá acesso ao suporte técnico da equipe do Otto Tech Sistemas para sanar dúvidas e auxiliar no melhor uso possível do sistema;\n\n– <strong>Sem cadastro de cartão, sem compromisso:</strong> caso decida não continuar após o período de teste, não há nenhum tipo de cobrança. Afinal, suas informações de pagamento não foram cadastradas.\n\nO teste gratuito é uma excelente oportunidade para entender, na prática, de que forma o Otto Tech Sistemas pode simplificar a gestão do seu negócio.\n\nDurante o período de teste, você poderá testar a integração entre os módulos, a automação de processos e a facilidade de uso da plataforma, tudo sem compromisso financeiro.\n\nExperimente o <strong>Otto Tech Sistemas gratuitamente por 10 dias</strong> e descubra como ele pode transformar a gestão da sua empresa." },
  { q: "Posso migrar meus dados de outro sistema?", a: "Sim! Nossa equipe auxilia na importação de dados de qualquer sistema anterior." },
  { q: "O sistema funciona offline?", a: "O Otto Tech Sistemas é 100% na nuvem, mas o PDV tem modo offline para vendas sem internet." },
  
  { q: "O Otto Tech Sistemas tem custo adicional por faturamento?", a: "Não. <strong>O Otto Tech Sistemas não cobra nenhum valor adicional</strong> conforme sua empresa fatura mais.\n\nOu seja, independentemente do volume de vendas, das notas emitidas ou do tamanho da sua operação, você paga sempre o mesmo valor mensal.\n\nOs planos são <strong>fixos</strong>, transparentes e pensados justamente para permitir que você <strong>cresça sem medo de custos extras</strong> ou cobranças extras proporcionais ao faturamento.\n\nEsse modelo foi criado para oferecer previsibilidade financeira e liberdade para empreendedores que querem <strong>aumentar vendas, emitir mais notas, organizar estoques, gerenciar ordens de serviço</strong> e expandir sem depender de taxas variáveis e cobranças escondidas.\n\nAssim, toda a sua operação pode escalar sem que você tenha surpresas na fatura ou limitações de uso.\n\nAlém disso, o Otto Tech Sistemas traz recursos completos, como <strong>PDV, controle de estoque, financeiro, emissão fiscal, boletos, ordem de serviço online</strong> e muito mais, tudo dentro do plano contratado.\n\nVocê fatura mais, vende mais e continua pagando o mesmo: <strong>ideal para empresas que querem crescer com previsibilidade e segurança.</strong>" },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, sem multa e sem burocracia. Seus dados ficam disponíveis por 30 dias após o cancelamento." },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [planoSelecionado, setPlanoSelecionado] = useState<"mensal" | "semestral" | "anual">("mensal");
  const [faqAberto, setFaqAberto] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      {/* DARK ZONE — Header + Hero + Stats */}
      <div className="dark landing-dark text-white">
      
      {/* HEADER */}
      <header className="border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src={logoOttoTech} alt="Otto Tech Sistemas" className="h-20 rounded-xl object-contain" />
          </div>

          <nav className="hidden md:flex items-center gap-12 text-xl font-bold">
            <a href="#recursos" className="text-gray-400 hover:text-white transition-colors">Recursos</a>
            <a href="#sobre" className="text-gray-400 hover:text-white transition-colors">Sobre</a>
            <a href="#planos" className="text-gray-400 hover:text-white transition-colors">Planos</a>
            <a href="#depoimentos" className="text-gray-400 hover:text-white transition-colors">Clientes</a>
            <a href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5 text-lg" onClick={() => navigate("/login")}>
              Entrar
            </Button>
            <Button className="bg-[hsl(3, 62%, 46%)] hover:bg-[hsl(3, 55%, 52%)] text-white shadow-lg shadow-[hsl(3, 62%, 46%)]/25" onClick={() => navigate("/cadastro")}>
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* MARQUEE BANNER */}
      <div className="bg-red-600 text-white py-3 overflow-hidden whitespace-nowrap">
        <div className="inline-block animate-marquee">
          <span className="text-sm md:text-lg font-extrabold mx-6">🔗 GARANTA SEU ACESSO</span>
          <span className="text-sm md:text-lg font-extrabold mx-6">⚡ DESCONTO ENCERRA EM BREVE</span>
          <span className="text-sm md:text-lg font-extrabold mx-6">🔥 PROMOÇÃO DE LANÇAMENTO</span>
          <span className="text-sm md:text-lg font-extrabold mx-6">🚀 TESTE GRÁTIS POR 10 DIAS</span>
          <span className="text-sm md:text-lg font-extrabold mx-6">🔗 GARANTA SEU ACESSO</span>
          <span className="text-sm md:text-lg font-extrabold mx-6">⚡ DESCONTO ENCERRA EM BREVE</span>
          <span className="text-sm md:text-lg font-extrabold mx-6">🔥 PROMOÇÃO DE LANÇAMENTO</span>
          <span className="text-sm md:text-lg font-extrabold mx-6">🚀 TESTE GRÁTIS POR 10 DIAS</span>
          <span className="text-sm md:text-lg font-extrabold mx-6">🔗 GARANTA SEU ACESSO</span>
          <span className="text-sm md:text-lg font-extrabold mx-6">⚡ DESCONTO ENCERRA EM BREVE</span>
          <span className="text-sm md:text-lg font-extrabold mx-6">🔥 PROMOÇÃO DE LANÇAMENTO</span>
          <span className="text-sm md:text-lg font-extrabold mx-6">🚀 TESTE GRÁTIS POR 10 DIAS</span>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(3, 62%, 46%)]/10 via-transparent to-purple-500/5" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-[hsl(3, 62%, 46%)]/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-5 bg-[hsl(3, 62%, 46%)]/15 text-[hsl(24,100%,60%)] border-[hsl(3, 62%, 46%)]/30 text-sm px-4 py-1.5">
                🤖 Agora com Inteligência Artificial
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
                O sistema ERP online feito para o{" "}
                <span className="bg-gradient-to-r from-[hsl(3, 62%, 46%)] to-[hsl(3, 55%, 52%)] bg-clip-text text-transparent">
                  seu negócio
                </span>
              </h1>

              <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-xl">
                Gerencie OSs, estoque, vendas e clientes com{" "}
                <span className="text-[hsl(24,100%,60%)] font-semibold">agente IA integrado</span>{" "}
                que atende automaticamente no WhatsApp. Enquanto o sistema cuida da operação, você foca no que realmente vale: fazer sua empresa crescer.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  className="bg-[hsl(3, 62%, 46%)] hover:bg-[hsl(3, 55%, 52%)] text-white text-lg px-8 h-14 shadow-xl shadow-[hsl(3, 62%, 46%)]/25"
                  onClick={() => navigate("/cadastro")}
                >
                  Testar 10 Dias Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg border-gray-700 text-gray-300 hover:bg-white/5 h-14"
                  onClick={() => navigate("/")}
                >
                  Ver Demonstração
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><Check className="text-green-500 h-4 w-4" /> Sem cartão de crédito</span>
                <span className="flex items-center gap-1.5"><Check className="text-green-500 h-4 w-4" /> Cancele quando quiser</span>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
                <div className="bg-[#1A1A1A] px-4 py-3 border-b border-white/10 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs text-gray-500">ottotech-sas.app</span>
                </div>
                <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] p-12 aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <Bot size={72} className="text-[hsl(3, 62%, 46%)] mx-auto mb-4 animate-pulse" />
                    <p className="text-white text-xl font-bold">Agente IA Atendendo</p>
                    <p className="text-gray-500 text-sm mt-2">WhatsApp • Site • Instagram</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-[hsl(3, 62%, 46%)] to-[hsl(24,80%,55%)] rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center">
                    <Zap size={22} className="text-white" />
                  </div>
                  <div className="text-white">
                    <p className="text-2xl font-extrabold">87%</p>
                    <p className="text-xs opacity-90">Atendimentos Automatizados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-white/5 bg-[#111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          {[
            { val: "28.000+", label: "Produtos pré-cadastrados" },
            { val: "6+", label: "Marketplaces integrados" },
            { val: "500+", label: "Empresas ativas" },
            { val: "87%", label: "Atendimentos via IA" },
            { val: "10 dias", label: "Teste grátis" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-[hsl(3, 62%, 46%)] to-[hsl(24,80%,65%)] bg-clip-text text-transparent">{s.val}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
      </div>{/* END DARK ZONE */}

      {/* LIGHT ZONE */}
      {/* RECURSOS */}
      {/* RECURSOS */}
      <section id="recursos" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1.5 text-sm md:text-base font-black uppercase bg-[hsl(3, 62%, 46%)]/15 text-black border-[hsl(3, 62%, 46%)]/30">RECURSOS EXCLUSIVOS</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">Tudo que você precisa em um só lugar</h2>
            <p className="text-lg text-gray-500">+ Agente de IA que trabalha 24/7 pela sua oficina</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recursos.map((r) => (
              <div
                key={r.titulo}
                id={r.id}
                className={`rounded-xl p-6 relative overflow-hidden border ${
                  r.destaque
                    ? "border-[hsl(3, 62%, 46%)]/30 bg-[hsl(3, 62%, 46%)]/5"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="relative">
                  {r.destaque && <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(3, 62%, 46%)]/10 rounded-full blur-3xl" />}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    r.destaque ? "bg-[hsl(3, 62%, 46%)]/20" : "bg-gray-200"
                  }`}>
                    <r.icon className={`h-6 w-6 ${r.destaque ? "text-[hsl(3, 62%, 46%)]" : "text-gray-600"}`} />
                  </div>
                  {r.badge && <Badge className="mb-3 bg-[hsl(3, 62%, 46%)] text-white border-0 text-[10px]">{r.badge}</Badge>}
                  <h3 className="text-lg font-bold mb-2 text-gray-900">{r.titulo}</h3>
                  <p className="text-sm mb-4 leading-relaxed text-gray-500">{r.descricao}</p>
                  {r.items.length > 0 && (
                    <ul className="space-y-2">
                      {r.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <Check className="text-green-600 h-4 w-4 mt-0.5 shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHATSAPP INTEGRATION */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-8 leading-tight text-gray-900">
                Agilize suas vendas com{" "}
                <span className="bg-gradient-to-r from-[hsl(3, 62%, 46%)] to-[hsl(3, 55%, 52%)] bg-clip-text text-transparent">
                  integração ao WhatsApp
                </span>
              </h2>
              <div className="space-y-5">
                {[
                  { icon: MessageSquare, text: "Com nossa integração, seus clientes voltam para oficina e seguem fidelizados" },
                  { icon: Bell, text: <>Faça pós-venda <strong className="text-gray-900">diretamente pelo sistema</strong></> },
                  { icon: Bell, text: <>Notifique cliente de <strong className="text-gray-900">serviço pronto</strong></> },
                  { icon: Receipt, text: <>Envie orçamento pelo <strong className="text-gray-900">WhatsApp direto do sistema</strong></> },
                  { icon: FileText, text: <>Nota fiscal e cupom fiscal não precisa mais imprimir, <strong className="text-gray-900">envie pelo WhatsApp para seu cliente</strong></> },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[hsl(3, 62%, 46%)]/15 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-[hsl(3, 62%, 46%)]" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed pt-2">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:flex items-center justify-center py-8 px-12">
              <div className="relative w-80 h-80 rounded-3xl border-2 border-[hsl(3, 62%, 46%)]/30 bg-gradient-to-br from-[hsl(3, 62%, 46%)]/10 to-transparent flex items-center justify-center">
                <img src={whatsappLogo} alt="" className="absolute inset-0 w-full h-full object-contain opacity-15 p-8 rounded-3xl" />
                <div className="text-center relative z-10">
                  <MessageSquare size={64} className="text-[hsl(3, 62%, 46%)] mx-auto mb-4" />
                  <p className="text-gray-900 text-lg font-bold">WhatsApp Integrado</p>
                  <p className="text-gray-500 text-sm mt-1">Envie tudo automaticamente</p>
                </div>
                <div className="absolute -top-4 -right-4 bg-[hsl(3, 62%, 46%)] rounded-full p-3 shadow-lg shadow-[hsl(3, 62%, 46%)]/30">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-3 -left-3 bg-white border border-[hsl(3, 62%, 46%)]/30 rounded-xl px-4 py-2 shadow-md">
                  <p className="text-xs text-[hsl(0,84%,45%)] font-semibold">QR Code Pix ✓</p>
                </div>
                <div className="absolute top-1/4 -left-8 bg-white border border-[hsl(3, 62%, 46%)]/30 rounded-xl px-4 py-2 shadow-md">
                  <p className="text-xs text-[hsl(0,84%,45%)] font-semibold">Pós-venda ✓</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE A OTTO TECH */}
      <section id="sobre" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Intro */}
          <div className="grid lg:grid-cols-2 gap-12 items-start mb-20">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-gray-900">
                Sobre a <span className="bg-gradient-to-r from-[hsl(3, 62%, 46%)] to-[hsl(3, 55%, 52%)] bg-clip-text text-transparent">Otto Tech Sistemas</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Tudo começa em uma cidade do interior do Brasil, onde um menino de 12 anos já conhecia o nome de cada produto melhor do que qualquer adulto ao redor. Não era talento — era paixão. Enquanto os outros garotos jogavam bola, <strong className="text-gray-900">Wesdra Santos</strong> organizava prateleiras, ajudava no atendimento do balcão e aprendia, na prática, como o mundo do comércio realmente funciona.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Com 19 anos, abriu seu primeiro ponto comercial. Sem sócio. Sem herança. Só com o conhecimento acumulado em 7 anos de chão de loja. Hoje, <strong className="text-gray-900">18 anos depois</strong>, com uma empresa sólida, Wesdra olha para frente e enxerga algo que ainda o tira do sono — não de preocupação, mas de empolgação.
              </p>
            </div>
            <div className="relative hidden lg:flex items-center justify-center">
              <img src={wesdraPhoto} alt="Wesdra Santos - Fundador da Otto Tech Sistemas" className="w-80 h-80 object-cover rounded-2xl shadow-xl border border-gray-200" />
            </div>
          </div>

          {/* Quote */}
          <div className="max-w-3xl mx-auto text-center mb-20">
            <blockquote className="text-xl md:text-2xl font-bold italic text-gray-700 mb-4 leading-relaxed">
              "Eu sempre soube vender produto. O que eu não sabia era como escalar isso sem perder o controle."
            </blockquote>
            <p className="text-[hsl(0,84%,45%)] font-semibold">— Wesdra Santos, fundador da Otto Tech Sistemas</p>
          </div>

          {/* História de sucesso */}
          <div className="max-w-4xl mx-auto mb-20">
            <h3 className="text-2xl md:text-3xl font-extrabold text-center mb-6 text-gray-900">
              Uma história de <span className="bg-gradient-to-r from-[hsl(3, 62%, 46%)] to-[hsl(3, 55%, 52%)] bg-clip-text text-transparent">sucesso e inovação</span>
            </h3>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Depois de anos gerenciando sua própria operação, Wesdra percebeu algo que todo empresário conhece, mas poucos admitem: <strong className="text-gray-900">o mercado no Brasil é gigante — e completamente desorganizado.</strong>
              </p>
              <p>
                Empresas perdendo ordem de serviço em papel. Lojas sem controle de estoque. Vendedores sem comissão calculada corretamente. Caixa no caderno. Checklist no WhatsApp. Nenhum histórico do cliente.
              </p>
              <p>
                Com a bagagem de quem viveu o problema na pele, Wesdra não construiu um software genérico. Ele construiu algo diferente: <strong className="text-gray-900">um sistema criado por quem empreende, para quem empreende.</strong>
              </p>
            </div>
          </div>

          {/* Dor x Solução */}
          <div className="max-w-4xl mx-auto mb-20">
            <h3 className="text-xl font-bold text-center mb-8 text-gray-900">Cada módulo nasceu de uma dor real</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { dor: "Perdi o checklist do cliente", solucao: "Checklist digital com histórico permanente" },
                { dor: "Não sei quanto tenho em estoque", solucao: "Gestão de produtos em tempo real" },
                { dor: "Meu caixa não bate no fim do mês", solucao: "DRE e fluxo de caixa automático" },
                { dor: "Não sei quanto meu vendedor vendeu", solucao: "Comissões calculadas automaticamente" },
                { dor: "Cliente sumiu, não tenho contato", solucao: "CRM com histórico completo do cliente" },
                { dor: "Minha OS fica perdida na oficina", solucao: "Ordem de serviço digital com status" },
              ].map((item) => (
                <div key={item.dor} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-red-500 mb-2 line-through">{item.dor}</p>
                  <div className="flex items-start gap-2">
                    <Check className="text-green-600 h-4 w-4 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-900 font-medium">{item.solucao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefícios em todos os planos */}
          <div className="max-w-5xl mx-auto mb-10">
            <h3 className="text-2xl md:text-3xl font-extrabold text-center mb-2 text-gray-900">
              Otto Tech Sistemas: gestão completa, em todos os planos
            </h3>
            <p className="text-center text-gray-500 mb-8">
              <strong className="text-gray-900">Planos diferentes, o mesmo padrão.</strong> Em todos, gestão inteligente com:
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Gift, titulo: "10 dias de teste grátis", bg: "bg-red-100", color: "text-red-600" },
                { icon: CreditCard, titulo: "Avaliação sem cadastro de cartão", bg: "bg-gray-900", color: "text-white" },
                { icon: Headphones, titulo: "Suporte técnico gratuito", bg: "bg-purple-100", color: "text-purple-600" },
                { icon: Cloud, titulo: "Dados seguros em nuvem", bg: "bg-sky-100", color: "text-sky-600" },
                { icon: HardDrive, titulo: "Armazenamento ilimitado grátis", bg: "bg-amber-100", color: "text-amber-600" },
                { icon: BadgeDollarSign, titulo: "Valor fixo, independente do faturamento", bg: "bg-emerald-100", color: "text-emerald-600" },
                { icon: Users, titulo: "Acesso simultâneo sem restrições", bg: "bg-indigo-100", color: "text-indigo-600" },
                { icon: Globe, titulo: "100% online de qualquer dispositivo", bg: "bg-teal-100", color: "text-teal-600" },
              ].map((b) => (
                <div key={b.titulo} className="bg-gray-50 rounded-xl p-5 flex items-center gap-3 border border-gray-200">
                  <div className={`p-2.5 rounded-full ${b.bg}`}>
                    <b.icon className={`w-5 h-5 ${b.color}`} />
                  </div>
                  <p className="text-gray-900 font-semibold text-sm">{b.titulo}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Segmentos */}
          <div className="max-w-4xl mx-auto mb-10">
            <h3 className="text-xl font-bold text-center mb-8 text-gray-900">Mais que um Sistema — Uma Rede</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Store, titulo: "Lojas", desc: "Controle de vendas, estoque e financeiro", bg: "bg-emerald-100", color: "text-emerald-600" },
                { icon: Wrench, titulo: "Empresas de serviços", desc: "OS, checklist, diagnóstico e histórico", bg: "bg-gray-900", color: "text-white" },
                { icon: Handshake, titulo: "Revendas multimarcas", desc: "Consignação e consórcio", bg: "bg-amber-100", color: "text-amber-600" },
                { icon: Package, titulo: "Distribuidores", desc: "Atacado, marketplace e logística", bg: "bg-orange-100", color: "text-orange-600" },
              ].map((s) => (
                <div key={s.titulo} className="bg-gray-50 rounded-xl p-5 text-center border border-gray-200 flex flex-col items-center">
                  <div className={`p-3 rounded-full ${s.bg} mb-3`}>
                    <s.icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                  <p className="text-gray-900 font-bold text-sm mb-1">{s.titulo}</p>
                  <p className="text-gray-500 text-xs">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visão */}
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              A Otto Tech Sistemas não quer ser "mais um sistema de gestão." A visão é clara:
            </p>
            <p className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-[hsl(3, 62%, 46%)] to-[hsl(3, 55%, 52%)] bg-clip-text text-transparent">
              "Ser o sistema operacional das empresas do Brasil."
            </p>
            <p className="text-sm text-gray-500 mt-4">
              🚀 Gestão que acelera. Controle que não trava.
            </p>
          </div>
        </div>
      </section>

      {/* PILARES */}
      <section className="py-20 md:py-28 bg-[#111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-white">
              Esses são os <span className="bg-gradient-to-r from-[hsl(3, 62%, 46%)] to-[hsl(3, 55%, 52%)] bg-clip-text text-transparent">pilares que acreditamos</span>
            </h2>
            <p className="text-gray-400">Valores fundamentais que guiam nossa missão</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: Cog, titulo: "Automação de Processos", desc: "Eliminar tarefas repetitivas, aumentando a produtividade." },
              { icon: BarChart3, titulo: "Clareza na Gestão", desc: "Organizar dados para decisões estratégicas seguras." },
              { icon: Key, titulo: "Empreender com liberdade", desc: "Reduzir a operação para focar no crescimento do negócio." },
              { icon: Shield, titulo: "Suporte e Confiabilidade", desc: "Oferecer atendimento próximo e suporte rápido." },
              { icon: Sprout, titulo: "Crescimento Sustentável", desc: "Tecnologia para impulsionar resultados." },
            ].map((p) => (
              <div key={p.titulo} className="bg-[#1a1a1a] rounded-xl p-6 text-center border border-white/10 hover:border-[hsl(3, 62%, 46%)]/40 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-[hsl(3, 62%, 46%)]/15 flex items-center justify-center mx-auto mb-4">
                  <p.icon className="h-7 w-7 text-[hsl(3, 62%, 46%)]" />
                </div>
                <h4 className="text-white font-bold text-sm mb-2">{p.titulo}</h4>
                <p className="text-gray-300 text-xs leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">Planos que Crescem com Você</h2>
            <p className="text-lg text-gray-500 mb-6">Escolha o plano ideal para sua oficina</p>

            <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-8">
              <MessageSquare className="h-4 w-4 text-[hsl(3, 62%, 46%)]" />
              <span className="text-sm text-gray-600">Dúvidas?</span>
              <Button
                size="sm"
                className="bg-[hsl(3, 62%, 46%)] hover:bg-[hsl(3, 55%, 52%)] text-white text-xs h-8 px-4"
                onClick={() => {
                  const widget = document.querySelector('[data-chat-widget]') as HTMLButtonElement;
                  if (widget) widget.click();
                  else window.open("https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre os planos do Otto Tech Sistemas.", "_blank");
                }}
              >
                Falar com Consultor
              </Button>
            </div>

            <div className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-full p-1">
              <button
                onClick={() => setPlanoSelecionado("mensal")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  planoSelecionado === "mensal" ? "bg-[hsl(3, 62%, 46%)] text-white shadow-lg" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setPlanoSelecionado("semestral")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  planoSelecionado === "semestral" ? "bg-[hsl(3, 62%, 46%)] text-white shadow-lg" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Semestral
                <Badge className="bg-green-500 text-white border-0 text-[10px]">-15%</Badge>
              </button>
              <button
                onClick={() => setPlanoSelecionado("anual")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  planoSelecionado === "anual" ? "bg-[hsl(3, 62%, 46%)] text-white shadow-lg" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Anual
                <Badge className="bg-green-500 text-white border-0 text-[10px]">-35%</Badge>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {planos.map((plano) => (
              <div
                key={plano.nome}
                className={`relative overflow-hidden rounded-xl border ${
                  plano.destaque
                    ? "ring-2 ring-[hsl(3, 62%, 46%)] shadow-2xl shadow-[hsl(3, 62%, 46%)]/10 scale-[1.02] border-[hsl(3, 62%, 46%)]/30"
                    : "border-gray-200"
                }`}
                style={{ background: plano.destaque ? "hsl(24,100%,50%,0.03)" : "#fff" }}
              >
                {plano.destaque && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(3, 62%, 46%)] to-[hsl(3, 55%, 52%)]" />
                )}
                <div className="p-6">
                  {plano.destaque && (
                    <Badge className="mb-3 bg-[hsl(3, 62%, 46%)] text-white border-0 text-[10px]">MAIS POPULAR</Badge>
                  )}
                  <h3 className="text-2xl font-bold mb-1 text-gray-900">{plano.nome}</h3>
                  <p className="text-sm mb-6 text-gray-500">{plano.descricao}</p>

                  <div className="mb-6">
                    {(planoSelecionado !== "mensal" || plano.preco_promocional) && (
                      <p className="text-xs line-through text-gray-400">
                        R$ {plano.preco_mensal.toFixed(2).replace(".", ",")}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-gray-900">
                        R$ {plano.preco_promocional && planoSelecionado === "mensal"
                          ? plano.preco_promocional.toFixed(2).replace(".", ",")
                          : planoSelecionado === "mensal"
                          ? plano.preco_mensal.toFixed(2).replace(".", ",")
                          : planoSelecionado === "semestral"
                          ? plano.preco_semestral_mes.toFixed(2).replace(".", ",")
                          : plano.preco_anual_mes.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-sm text-gray-500">/mês</span>
                    </div>
                    {plano.preco_promocional && planoSelecionado === "mensal" && (
                      <p className="text-xs text-orange-600 mt-1 font-bold">
                        🔥 Promoção de lançamento!
                      </p>
                    )}
                    {planoSelecionado === "semestral" && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        15.00% de desconto no contrato semestral
                      </p>
                    )}
                    {planoSelecionado === "anual" && (
                      <>
                        <p className="text-xs text-green-600 mt-1 font-medium">
                          35.00% de desconto no contrato anual
                        </p>
                        <p className="text-xs text-orange-600 mt-1 font-bold">
                          🔥 Promoção de lançamento!
                        </p>
                      </>
                    )}
                  </div>

                  <Button
                    className={`w-full mb-6 h-11 ${
                      plano.destaque
                        ? "bg-[hsl(3, 62%, 46%)] hover:bg-[hsl(3, 55%, 52%)] text-white shadow-lg"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                    onClick={() => navigate("/cadastro")}
                  >
                    Começar Agora
                  </Button>

                  <div className="space-y-2.5 mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Incluído:</p>
                    {plano.recursos.map((r) => (
                      <div key={r} className="flex items-start gap-2">
                        <Check className="text-green-600 h-4 w-4 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-700">{r}</span>
                      </div>
                    ))}
                  </div>

                  {plano.limitacoes.length > 0 && (
                    <div className="space-y-2.5 pt-5 border-t border-gray-200">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Não incluído:</p>
                      {plano.limitacoes.map((l) => (
                        <div key={l} className="flex items-start gap-2">
                          <X className="text-red-400 h-4 w-4 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-400">{l}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">O que nossos clientes dizem</h2>
            <p className="text-lg text-gray-500">Empresas reais usando o Otto Tech Sistemas</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {depoimentos.map((d) => (
              <div key={d.nome} className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm">
                <div>
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: d.estrelas }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-sm mb-4 leading-relaxed italic text-gray-700">"{d.texto}"</p>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{d.nome}</p>
                    <p className="text-xs text-gray-500">{d.oficina}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-gray-900">
              Tire suas dúvidas sobre o <span className="bg-gradient-to-r from-[hsl(3, 62%, 46%)] to-[hsl(3, 55%, 52%)] bg-clip-text text-transparent">Otto Tech Sistemas</span>
            </h2>
            <p className="text-gray-500">Tudo o que você precisa saber sobre o sistema ERP Otto Tech Sistemas antes de começar.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div
                key={i}
                className={`rounded-xl border overflow-hidden transition-all duration-300 ${faqAberto === i ? "bg-white border-[hsl(3, 62%, 46%)]/30 shadow-lg shadow-[hsl(3, 62%, 46%)]/5" : "bg-white border-gray-200 hover:border-gray-300"}`}
              >
                <button
                  onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className={`font-bold text-base ${faqAberto === i ? "text-[hsl(3, 62%, 46%)]" : "text-gray-900"}`}>{f.q}</span>
                  <ChevronDown className={`h-5 w-5 flex-shrink-0 ml-4 transition-transform duration-300 ${faqAberto === i ? "rotate-180 text-[hsl(3, 62%, 46%)]" : "text-gray-400"}`} />
                </button>
                {faqAberto === i && (
                  <div className="px-5 pb-6 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4 space-y-3">
                    {f.a.split("\n\n").map((paragraph, pi) => (
                      <p key={pi} dangerouslySetInnerHTML={{ __html: paragraph }} />
                    ))}
                    <div className="pt-2">
                      <Button
                        size="sm"
                        className="bg-[hsl(3, 62%, 46%)] hover:bg-[hsl(0,75%,45%)] text-white font-bold text-xs uppercase tracking-wide"
                        onClick={() => navigate("/cadastro")}
                      >
                        Teste Grátis Agora
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(0,84%,45%)] to-[hsl(30,100%,55%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">
            Pronto para revolucionar sua oficina?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já transformaram seus negócios com a Otto Tech Sistemas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-[hsl(0,84%,45%)] hover:bg-white/90 text-lg px-10 h-14 shadow-xl font-bold rounded-full"
              onClick={() => navigate("/cadastro")}
            >
              🚀 Começar agora
            </Button>
            <Button
              size="lg"
              className="bg-white text-[hsl(0,84%,45%)] hover:bg-gray-100 text-lg px-10 h-14 rounded-full font-bold shadow-xl border-0"
              onClick={() => {
                window.open("https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre o Otto Tech Sistemas.", "_blank");
              }}
            >
              📞 Falar com consultor
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Coluna 1 - Otto Tech */}
            <div>
              <h4 className="text-lg font-bold mb-6">Otto Tech</h4>
              <ul className="space-y-3">
                <li><a href="/login" className="text-gray-400 hover:text-white transition-colors">Acessar Sistema</a></li>
                <li><a href="/landing#sobre" className="text-gray-400 hover:text-white transition-colors">Quem somos</a></li>
                <li><a href="/landing#planos" className="text-gray-400 hover:text-white transition-colors">Planos e Preços</a></li>
                <li><a href="/cadastro" className="text-gray-400 hover:text-white transition-colors">Teste Grátis</a></li>
                <li><a href="/landing#faq" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="/landing#funcionalidades" className="text-gray-400 hover:text-white transition-colors">Segmentos</a></li>
              </ul>
            </div>

            {/* Coluna 2 - Funcionalidades */}
            <div>
              <h4 className="text-lg font-bold mb-6">Funcionalidades</h4>
              <ul className="space-y-3">
                <li><a href="#controle-financeiro" className="text-gray-400 hover:text-white transition-colors">Controle Financeiro</a></li>
                <li><a href="#controle-estoque" className="text-gray-400 hover:text-white transition-colors">Controle de Estoque</a></li>
                <li><a href="#controle-vendas" className="text-gray-400 hover:text-white transition-colors">Controle de Vendas</a></li>
                <li><a href="#ordens-servico" className="text-gray-400 hover:text-white transition-colors">Ordens de Serviço</a></li>
                <li><a href="#marketplaces" className="text-gray-400 hover:text-white transition-colors">Marketplaces</a></li>
                <li><a href="#relatorios" className="text-gray-400 hover:text-white transition-colors">Relatórios</a></li>
                <li><a href="#gestao-operacional" className="text-gray-400 hover:text-white transition-colors">Gestão Operacional</a></li>
              </ul>
            </div>

            {/* Coluna 3 - Suporte + Redes Sociais */}
            <div>
              <h4 className="text-lg font-bold mb-6">Precisando de suporte?</h4>
              <ul className="space-y-3 mb-8">
                <li>
                  <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href="/central-ajuda" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                    Central de Ajuda
                  </a>
                </li>
              </ul>

              <h4 className="text-lg font-bold mb-4">Siga-nos</h4>
              <div className="flex items-center gap-4">
                <a href="https://www.instagram.com/ottotechsistemas/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="YouTube">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="WhatsApp">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Barra inferior */}
          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">© 2026 Otto Tech Sistemas. Todos os direitos reservados.</p>
            <a href="https://www.instagram.com/ottotechsistemas/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              <span className="text-sm font-medium">@ottotechsistemas</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
