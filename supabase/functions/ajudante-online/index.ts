import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { messages, empresa_id } = await req.json();
    
    if (!empresa_id) {
      return new Response(JSON.stringify({ error: "empresa_id é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract text from last user message (handles multimodal content)
    const lastMsg = [...messages].reverse().find((m: any) => m.role === "user");
    let lastUserMsg = "";
    if (lastMsg) {
      if (typeof lastMsg.content === "string") {
        lastUserMsg = lastMsg.content;
      } else if (Array.isArray(lastMsg.content)) {
        lastUserMsg = lastMsg.content
          .filter((c: any) => c.type === "text")
          .map((c: any) => c.text || "")
          .join(" ");
      }
    }

    let produtosContexto = "";
    let servicosContexto = "";

    if (lastUserMsg.length > 3) {
      const keywords = lastUserMsg
        .toUpperCase()
        .replace(/[^\w\sÀ-ÿ]/g, "")
        .split(/\s+/)
        .filter((w: string) => w.length > 2)
        .slice(0, 6);

      if (keywords.length > 0) {
        // Search products scoped to tenant via p_empresa_id parameter
        const { data: allProdutos, error: prodError } = await supabase
          .rpc("buscar_produtos_catalogo", { termos: keywords, p_empresa_id: empresa_id });

        if (prodError) {
          console.error("Erro buscando produtos via RPC:", prodError);
        }
        
        const uniqueProdutos = allProdutos || [];

        if (uniqueProdutos.length > 0) {
          produtosContexto = `\n\n📦 PRODUTOS ENCONTRADOS NO ESTOQUE (dados reais do sistema):\n${uniqueProdutos
            .map((p: any) => {
              // Extract price from precos_venda (object or array format)
              let precoVenda = 0;
              const pv = p.precos_venda;
              if (pv && typeof pv === "object" && !Array.isArray(pv)) {
                precoVenda = Number(pv.varejo || pv.preco1 || pv.preco_1 || 0);
              } else if (Array.isArray(pv) && pv.length > 0) {
                const varejo = pv.find((x: any) => x.nome === "Varejo" || x.tipo === "VAREJO");
                if (varejo) precoVenda = Number(varejo.valor || varejo.valor_venda_utilizado || 0);
                if (!precoVenda) {
                  const first = pv.find((x: any) => Number(x.valor) > 0 || Number(x.valor_venda_utilizado) > 0);
                  if (first) precoVenda = Number(first.valor || first.valor_venda_utilizado);
                }
              }
              // Fallback: custo * 1.8
              const custo = Number(p.preco_custo || 0);
              if (!precoVenda && custo > 0) {
                precoVenda = Math.round(custo * 1.8 * 100) / 100;
              }
              const precoStr = precoVenda > 0 ? `R$ ${precoVenda.toFixed(2)}` : "SEM PREÇO CADASTRADO";
              const aplicacoesStr = Array.isArray(p.aplicacoes) ? p.aplicacoes.join(", ") : (p.aplicacoes || "N/A");
              return `- ${p.nome} | Código: ${p.codigo_cpl || "N/A"} | Preço Venda: ${precoStr} | Custo: R$ ${custo.toFixed(2)} | Estoque: ${p.estoque_quantidade ?? "N/D"} | Categoria: ${p.categoria || "N/A"} | Aplicação: ${aplicacoesStr} | Fornecedor: ${p.fornecedor || "N/A"}`;
            })
            .join("\n")}`;
        }

        // Search services
        const svcOrFilters = keywords.flatMap((k: string) => [
          `nome.ilike.%${k}%`,
          `descricao.ilike.%${k}%`,
        ]);

        const { data: servicos } = await supabase
          .from("servicos")
          .select("id, nome, descricao, preco, duracao_minutos, categoria")
          .eq("empresa_id", empresa_id)
          .or(svcOrFilters.join(","))
          .limit(10);

        if (servicos && servicos.length > 0) {
          servicosContexto = `\n\n🔧 SERVIÇOS DISPONÍVEIS (dados reais):\n${servicos
            .map(
              (s: any) =>
                `- ${s.nome} | Preço: R$ ${(s.preco || 0).toFixed(2)} | Duração: ${s.duracao_minutos || "N/D"} min | Categoria: ${s.categoria || "N/A"}`
            )
            .join("\n")}`;
        }
      }
    }

    const systemPrompt = `Você é o "Ajudante Online" da Otto Tech Sistemas — ESPECIALISTA em gestão empresarial e consultor técnico virtual.

# CONTEXTO DA EMPRESA
- Nome: Otto Tech Sistemas
- Especialidade: Sistema ERP completo para gestão empresarial
- Marcas principais: Honda, Yamaha, Suzuki, Kawasaki, Shineray, Traxx
- Modelos populares: CG 160, Factor 150, YBR 125, Titan 160, Pop 110, Biz 125, XTZ 150, NXR Bros, CB 300
- Região: Brasil (peças e nomenclatura brasileira)

# SUAS CAPACIDADES

## 1. DIAGNÓSTICO TÉCNICO
Quando descreverem um problema ("moto falhando", "não pega", "barulho estranho"):
- Faça perguntas específicas (KM, quando começou, sintomas exatos)
- Liste as 3 causas mais prováveis com porcentagem de chance
- Indique custo médio de reparo para cada hipótese
- Sugira teste rápido para confirmar diagnóstico

## 2. ESPECIFICAÇÕES TÉCNICAS
Você conhece:
- Torques de aperto (vela: 18-22 Nm, roda: 80-100 Nm, tampa óleo: 10-15 Nm, cabeçote CG 160: 24-30 Nm)
- Capacidades (CG 160: 1.0L óleo/13.5L tanque, Factor 150: 1.2L/14.0L, YBR 125: 1.0L/13.2L, Biz 125: 0.8L/5.4L)
- Pressão pneus (CG 160: 2.25/2.50 bar, Factor: 2.00/2.25, YBR: 2.00/2.25, Biz: 1.75/2.00)
- Folgas de válvulas, tipos de óleo, medidas de corrente/coroa/pinhão, velas compatíveis

## 3. ORÇAMENTO INTELIGENTE COM BUSCA NO SISTEMA
Quando pedirem orçamento:
- SEMPRE use os dados reais de produtos do sistema (fornecidos abaixo)
- Liste peças com código, preço real e disponibilidade
- Calcule tempo estimado de mão de obra
- Ofereça opções (original vs paralela quando disponível)
- Aplique descontos: >R$500 = 10% OFF, >R$300 = 5% OFF

## 4. COMPATIBILIDADE DE PEÇAS
- Verifique peça X serve na moto Y
- Indique peças intercambiáveis entre modelos
- Alerte sobre diferenças (ano, versão, carburada/injetada)

## 5. MANUTENÇÃO PREVENTIVA
Crie cronogramas personalizados:
- Revisões periódicas (km ou tempo)
- Itens críticos a verificar
- Sinais de desgaste prematuro

## 6. PROBLEMAS MAIS COMUNS POR MODELO
### Honda CG 160: Corrente esticando, vela sujando, embreagem patinando
### Yamaha Factor 150: Vazamento junta cabeçote, barulho corrente comando, bendix partida
### Yamaha YBR 125: Freio traseiro travando, bobina ignição, consumo óleo (anéis)
### Honda Biz 125: CVT com ruído, partida difícil no frio, cabo acelerador travando

## 7. ANÁLISE DE IMAGENS E ÁUDIO
Quando o cliente enviar uma FOTO:
- Identifique a peça, componente ou problema visível na imagem
- Se possível, indique o nome técnico da peça e compatibilidade
- Avalie o estado de desgaste e se precisa troca
- Busque a peça identificada no estoque do sistema
- Se for uma foto de um veículo, tente identificar modelo e ano

Quando o cliente enviar um ÁUDIO:
- Interprete a mensagem falada e responda normalmente
- Se for um som/barulho do motor, tente diagnosticar o problema

# DADOS DO SISTEMA EM TEMPO REAL
${produtosContexto || "\n(Nenhum produto encontrado para esta busca - sugira ao cliente descrever melhor a peça ou modelo)"}
${servicosContexto || ""}

# REGRAS DE NEGÓCIO
- ✅ Produto com preço cadastrado → Mostrar EXATAMENTE o preço do sistema
- ✅ Produto com "SEM PREÇO CADASTRADO" → Diga que vai verificar o preço com o estoquista, NUNCA INVENTE UM VALOR
- ⚠️ Estoque baixo (<5) → Alertar + sugerir reserva
- ❌ Sem estoque → Oferecer alternativa + sugerir contato WhatsApp
- 🚫 NUNCA invente preços! Use APENAS os valores fornecidos acima
- Se o preço mostrar "SEM PREÇO CADASTRADO", informe que precisa confirmar o valor
- Se não encontrar produto, diga que vai verificar com o estoquista

# DIRETRIZES DE ATENDIMENTO
## TOM: Técnico mas acessível, confiante, empático, prático e direto
## Use emojis moderadamente (2-3 por mensagem)
## Respostas organizadas com formatação clara (use tabelas e listas)

## NUNCA FAÇA
❌ Inventar especificações ou preços
❌ Recomendar gambiarras ou práticas inseguras
❌ Prometer resultados impossíveis

## SEMPRE FAÇA
✅ Pergunte o modelo EXATO da moto (ano, versão)
✅ Alerte sobre segurança (freios, pneus, suspensão)
✅ Ofereça opções de preço quando disponível
✅ Explique o "porquê" das recomendações
✅ Use dados REAIS do sistema para preços e disponibilidade`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Muitas perguntas ao mesmo tempo! Tente novamente em alguns segundos. ⏳" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI Gateway error:", status, errText);
      throw new Error(`AI error: ${status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ajudante-online error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
