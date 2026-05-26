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
    let { conversa_id, mensagem_cliente } = await req.json();
    if (!conversa_id || !mensagem_cliente) {
      return new Response(JSON.stringify({ error: "conversa_id and mensagem_cliente are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map numeric shortcuts to actual intents
    const atalhos: Record<string, { texto: string; intencaoForce: string }> = {
      "1": { texto: "Quero buscar peças e preços", intencaoForce: "consulta_produto" },
      "2": { texto: "Quero fazer um orçamento", intencaoForce: "orcamento" },
      "3": { texto: "Quero agendar um serviço", intencaoForce: "agendar" },
      "4": { texto: "Tenho uma dúvida técnica", intencaoForce: "duvida_tecnica" },
    };

    const msgTrimmed = mensagem_cliente.trim();
    const atalho = atalhos[msgTrimmed];
    let intencaoForce: string | null = null;
    if (atalho) {
      mensagem_cliente = atalho.texto;
      intencaoForce = atalho.intencaoForce;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch conversation + client data
    const { data: conversa } = await supabase
      .from("conversas")
      .select("*, clientes(*)")
      .eq("id", conversa_id)
      .single();

    const empresaIdConv = conversa?.empresa_id || null;

    // Fetch store name (personalization)
    let nomeLoja = "nossa loja";
    if (empresaIdConv) {
      const { data: emp } = await supabase
        .from("empresas")
        .select("nome_fantasia, nome")
        .eq("id", empresaIdConv)
        .maybeSingle();
      const n = ((emp as any)?.nome_fantasia || (emp as any)?.nome || "").toString().trim();
      if (n) nomeLoja = n;
    }

    // Fetch store settings for business hours (scoped to empresa)
    const { data: lojaConfig } = await supabase
      .from("canais_comunicacao")
      .select("horario_inicio, horario_fim, dias_funcionamento")
      .eq("empresa_id", empresaIdConv)
      .limit(1)
      .maybeSingle();

    const horarioInicio = lojaConfig?.horario_inicio || "08:00";
    const horarioFim = lojaConfig?.horario_fim || "17:30";
    const diasFuncionamento = lojaConfig?.dias_funcionamento || ["seg", "ter", "qua", "qui", "sex"];

    // Fetch last 10 messages for context
    const { data: mensagensAnteriores } = await supabase
      .from("mensagens")
      .select("tipo_remetente, conteudo")
      .eq("conversa_id", conversa_id)
      .order("created_at", { ascending: true })
      .limit(10);

    const cliente = conversa?.clientes;
    const clienteCtx = cliente
      ? `- Nome: ${cliente.nome_completo || "N/A"}
- Total gasto: R$ ${cliente.total_gasto ?? 0}
- Nível fidelidade: ${cliente.nivel_fidelidade || "bronze"}
- Última compra: ${cliente.ultima_compra || "N/A"}`
      : "Cliente novo sem histórico";

    const historico = (mensagensAnteriores || [])
      .map((m: any) => `${m.tipo_remetente}: ${m.conteudo}`)
      .join("\n");

    let intencao = intencaoForce || "outro";

    if (!intencaoForce) {
      // Step 1: Detect intent via AI
      const intencaoRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "user",
              content: `Classifique a intenção desta mensagem em uma das categorias:
- orcamento (pedir preço/orçamento)
- consulta_produto (buscar peça, perguntar se tem, preço de peça)
- duvida_tecnica (perguntas técnicas sobre motos)
- agendar (marcar horário/serviço)
- reclamacao (problema/insatisfação)
- elogio (feedback positivo)
- outro

Mensagem: "${mensagem_cliente}"

Responda APENAS com a categoria, sem explicações.`,
            },
          ],
        }),
      });

      if (!intencaoRes.ok) {
        const status = intencaoRes.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Payment required." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`Intent detection failed: ${status}`);
      }

      const intencaoData = await intencaoRes.json();
      intencao = (intencaoData.choices?.[0]?.message?.content || "outro").trim().toLowerCase();
    }

    // Save detected intent on the client's message
    await supabase
      .from("mensagens")
      .update({ intencao_detectada: intencao, confianca_ia: 0.85 })
      .eq("conversa_id", conversa_id)
      .eq("conteudo", mensagem_cliente);

    // Step 2: Search products if intent is product-related
    let produtosEncontrados: any[] = [];

    if (["consulta_produto", "orcamento"].includes(intencao)) {
      const keywords = mensagem_cliente
        .toUpperCase()
        .replace(/[^\w\sÀ-ÿ]/g, "")
        .split(/\s+/)
        .filter((w: string) => w.length > 2)
        .slice(0, 6);

      if (keywords.length > 0) {
        const { data: produtos } = await supabase
          .rpc("buscar_produtos_catalogo", { termos: keywords, p_empresa_id: conversa?.empresa_id || null });

        if (produtos && produtos.length > 0) {
          produtosEncontrados = produtos.slice(0, 8).map((p: any) => {
            const preco = p.precos_venda?.varejo ?? p.precos_venda?.preco1 ?? p.precos_venda?.preco_1 ?? null;
            let precoFinal = preco ? Number(preco) : null;
            // Fallback: custo * 1.8
            if (!precoFinal && p.preco_custo && p.preco_custo > 0) {
              precoFinal = Math.round(p.preco_custo * 1.8 * 100) / 100;
            }
            // Try array format
            if (!precoFinal && Array.isArray(p.precos_venda)) {
              const varejo = p.precos_venda.find((pv: any) =>
                pv.nome === "Varejo" || pv.tipo === "Varejo" || pv.tipo === "VAREJO"
              );
              if (varejo) {
                precoFinal = Number(varejo.valor || varejo.valor_venda_utilizado || 0);
              }
              if (!precoFinal) {
                const first = p.precos_venda.find((pv: any) =>
                  (Number(pv.valor) > 0) || (Number(pv.valor_venda_utilizado) > 0)
                );
                if (first) precoFinal = Number(first.valor || first.valor_venda_utilizado);
              }
            }

            return {
              id: p.id,
              nome: p.nome,
              codigo_cpl: p.codigo_cpl || null,
              imagem_url: p.imagem_url || null,
              preco: precoFinal || 0,
              estoque: p.estoque_quantidade ?? 0,
              categoria: p.categoria || null,
              fornecedor: p.fornecedor || null,
            };
          });
        }
      }
    }

    // Step 2b: Search services / labor (mão de obra) — sempre que cliente fala em preço, revisão, troca, agendamento ou dúvida técnica
    let servicosEncontrados: any[] = [];
    if (["consulta_produto", "orcamento", "agendar", "duvida_tecnica"].includes(intencao)) {
      const termosServ = mensagem_cliente
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w: string) => w.length > 2);

      let queryServ = supabase
        .from("servicos")
        .select("id, nome, descricao, valor_venda, tempo_estimado_min")
        .eq("ativo", true)
        .eq("empresa_id", empresaIdConv)
        .limit(8);

      if (termosServ.length > 0) {
        // ILIKE OR para nome OU descricao em qualquer um dos termos
        const orFilter = termosServ
          .flatMap((t: string) => [`nome.ilike.%${t}%`, `descricao.ilike.%${t}%`])
          .join(",");
        queryServ = queryServ.or(orFilter);
      }

      const { data: servs } = await queryServ;
      servicosEncontrados = servs || [];

      // Fallback: se nada bateu, traz top 8 ativos para o modelo ter referência
      if (servicosEncontrados.length === 0) {
        const { data: fallback } = await supabase
          .from("servicos")
          .select("id, nome, descricao, valor_venda, tempo_estimado_min")
          .eq("ativo", true)
          .eq("empresa_id", empresaIdConv)
          .order("nome")
          .limit(8);
        servicosEncontrados = fallback || [];
      }
    }

    // Build product context for AI
    let produtosContexto = "";
    if (["consulta_produto", "orcamento"].includes(intencao)) {
      if (produtosEncontrados.length > 0) {
        produtosContexto = `\n\nPRODUTOS ENCONTRADOS NO ESTOQUE DA LOJA:\n${produtosEncontrados
          .map((p) => `- ${p.nome} | Código: ${p.codigo_cpl || "N/A"} | Preço: R$ ${p.preco.toFixed(2)} | Estoque: ${p.estoque}`)
          .join("\n")}`;
      } else {
        produtosContexto = `\n\nPRODUTOS ENCONTRADOS NO ESTOQUE DA LOJA:\n(NENHUM — não invente produtos, marcas, modelos, códigos, kits nem preços. Apenas informe ao cliente que vai verificar com o estoquista e retornar.)`;
      }
    }

    // Build services context for AI
    let servicosContexto = "";
    if (["consulta_produto", "orcamento", "agendar", "duvida_tecnica"].includes(intencao)) {
      if (servicosEncontrados.length > 0) {
        servicosContexto = `\n\nSERVIÇOS / MÃO DE OBRA CADASTRADOS NA LOJA:\n${servicosEncontrados
          .map((s: any) => {
            const valor = Number(s.valor_venda || 0);
            const tempo = s.tempo_estimado_min ? ` | Tempo: ${s.tempo_estimado_min} min` : "";
            const desc = s.descricao ? ` — ${s.descricao}` : "";
            return `- ${s.nome}${desc} | Valor: R$ ${valor.toFixed(2)}${tempo}`;
          })
          .join("\n")}`;
      } else {
        servicosContexto = `\n\nSERVIÇOS / MÃO DE OBRA CADASTRADOS NA LOJA:\n(NENHUM serviço cadastrado para esta busca — não invente valor de mão de obra. Diga que vai verificar com o mecânico e retornar.)`;
      }
    }


    // Step 3: Generate bot response
    const systemPrompt = `Você é o assistente virtual da ${nomeLoja}. Sempre se refira à loja como "${nomeLoja}" — NUNCA mencione "Otto Tech Sistemas" ou outros nomes.

CONTEXTO DO CLIENTE:
${clienteCtx}

REGRA CRÍTICA — NUNCA INVENTE PRODUTOS OU PREÇOS:
- Você só pode citar produtos, marcas, modelos, códigos e preços que estejam EXPLICITAMENTE listados em "PRODUTOS ENCONTRADOS NO ESTOQUE DA LOJA" abaixo.
- Se a lista estiver marcada como (NENHUM) ou vazia, é PROIBIDO mencionar qualquer preço, marca (ex.: Axios, Pro-X, Magneti, etc.), kit, código ou disponibilidade. Apenas diga algo como: "No momento não temos essa peça cadastrada no nosso estoque. Vou verificar com o estoquista e retorno em instantes. 🔧"
- É terminantemente proibido estimar, supor, inferir ou inventar valores em R$ por conta própria.

REGRA CRÍTICA — SERVIÇOS / MÃO DE OBRA:
- Sempre que o cliente perguntar preço/valor de revisão, troca, manutenção, conserto ou qualquer serviço, CONSULTE PRIMEIRO a lista "SERVIÇOS / MÃO DE OBRA CADASTRADOS NA LOJA" abaixo.
- Se houver serviço compatível na lista, INFORME O VALOR EXATO em R$ (não diga "vou verificar com o mecânico" se o serviço estiver cadastrado).
- Se NÃO houver serviço compatível na lista, aí sim diga que vai confirmar com o mecânico e retornar.
- Para revisões/orçamentos, combine peças (da lista de produtos) + serviços (da lista de mão de obra) com o total em R$.

INSTRUÇÕES:
1. Seja cordial, prestativo e use tom amigável
2. Use emojis de forma moderada (1-2 por mensagem)
3. Respostas curtas e diretas (máximo 4 linhas)
4. Se encontrou produtos, apresente-os de forma resumida e diga que o cliente pode adicionar ao carrinho
5. Se não encontrou, diga que vai verificar com o estoquista
6. Para orçamentos, liste os itens com preços e ofereça enviar o orçamento completo
7. Se não souber responder, diga que vai transferir para um atendente humano

REGRA OBRIGATÓRIA PARA AGENDAMENTO:
- Para agendar qualquer serviço, você DEVE pedir a PLACA da moto do cliente antes de confirmar.
- Formato válido: ABC1234 ou ABC1D23 (Mercosul)
- Só confirme o agendamento APÓS o cliente informar a placa, a data/hora desejada e o serviço.
- Se o cliente pedir para agendar sem informar a placa, peça educadamente: "Para agendar, preciso do número da placa da sua moto. Pode me informar? 🏍️"
- HORÁRIO DE FUNCIONAMENTO: ${horarioInicio} às ${horarioFim} (${diasFuncionamento.join(", ")})
- Só agende dentro do horário de funcionamento. Se o cliente pedir horário fora, informe os horários disponíveis.
- Horários disponíveis: a cada 30 minutos, de ${horarioInicio} até ${horarioFim}.
${produtosContexto}${servicosContexto}

HISTÓRICO DA CONVERSA:
${historico}`;

    const respostaRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: mensagem_cliente },
        ],
      }),
    });

    if (!respostaRes.ok) {
      const status = respostaRes.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Response generation failed: ${status}`);
    }

    const respostaData = await respostaRes.json();
    let respostaBot = respostaData.choices?.[0]?.message?.content
      || "Desculpe, não consegui processar sua mensagem.";

    // ─── Scheduling: actually create an OS when intent is "agendar" ───
    let agendamentoCriado = false;
    if (intencao === "agendar") {
      try {
        // Use AI to extract structured scheduling data from the full conversation
        const fullHistory = historico + `\nusuario: ${mensagem_cliente}\nbot: ${respostaBot}`;
        const extractRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{
              role: "user",
              content: `Extraia dados de agendamento desta conversa. Responda APENAS com JSON válido (sem markdown).
Se NÃO houver data/hora E placa confirmados, responda: {"agendado":false}

Campos esperados quando houver agendamento confirmado:
{
  "agendado": true,
  "placa": "ABC1234 ou ABC1D23",
  "cliente_nome": "nome ou null",
  "cliente_telefone": "telefone ou null",
  "veiculo_modelo": "modelo da moto ou null",
  "defeito_relatado": "serviço solicitado ou null",
  "data_entrada": "YYYY-MM-DD",
  "hora": "HH:MM",
  "observacoes": "resumo do pedido"
}

IMPORTANTE: A placa é OBRIGATÓRIA. Se não houver placa na conversa, retorne {"agendado":false}.
Normalize a placa para maiúsculas sem espaços/traços.

Data de hoje: ${new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} (formato DD/MM/AAAA)
Ano atual: ${new Date().getFullYear()}
REGRA CRÍTICA: data_entrada DEVE ser >= hoje. Nunca retorne data no passado.
Quando o cliente disser "10/05" interprete como dia 10 do mês 05 do ano atual; se essa data já passou, use o próximo ano.
Se disser "amanhã", calcule a data correta.
Se disser "segunda", calcule a próxima segunda-feira.

CONVERSA:
${fullHistory}`,
            }],
          }),
        });

        if (extractRes.ok) {
          const extractData = await extractRes.json();
          let rawJson = extractData.choices?.[0]?.message?.content || "";
          rawJson = rawJson.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
          const parsed = JSON.parse(rawJson);

          if (parsed.agendado && parsed.data_entrada && parsed.placa) {
            // ─── Validate date is not in the past (Brazil timezone) ───
            const hojeBR = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
            hojeBR.setHours(0, 0, 0, 0);
            const [yy, mm, dd] = String(parsed.data_entrada).split("-").map(Number);
            const dataAg = new Date(yy, (mm || 1) - 1, dd || 1);
            if (isNaN(dataAg.getTime()) || dataAg < hojeBR) {
              console.warn("Data de agendamento no passado, ignorando:", parsed.data_entrada);
              respostaBot = `Notei que a data **${String(dd).padStart(2,"0")}/${String(mm).padStart(2,"0")}/${yy}** já passou. 📅\n\nPode me confirmar uma nova data (a partir de hoje) para eu agendar sua revisão? 🏍️`;
              return new Response(
                JSON.stringify({ resposta: respostaBot, intencao, agendamento_criado: false }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            const placaNorm = parsed.placa.toUpperCase().replace(/[^A-Z0-9]/g, "");

            // ─── DB Lookup: search customer by plate ───
            let clienteNome: string | null = null;
            let clienteId: string | null = null;
            let clienteTelefone = parsed.cliente_telefone || null;
            let veiculoModelo = parsed.veiculo_modelo || null;
            let veiculoMarca: string | null = null;
            let veiculoAno: string | null = null;
            let veiculoCor: string | null = null;

            // 1) Check clientes table (placas array)
            const { data: clienteDB } = await supabase
              .from("clientes")
              .select("*")
              .contains("placas", [placaNorm])
              .limit(1)
              .maybeSingle();

            if (clienteDB) {
              clienteNome = clienteDB.nome_completo || clienteDB.nome_fantasia || null;
              clienteId = clienteDB.id;
              clienteTelefone = clienteDB.telefone || clienteTelefone;
              console.log("Cliente encontrado pelo banco:", clienteNome);
            }

            // 2) Check previous OS with same plate for vehicle data
            const { data: osAnterior } = await supabase
              .from("ordem_servico")
              .select("cliente_nome, cliente_telefone, veiculo_modelo, veiculo_marca, veiculo_ano, veiculo_cor")
              .eq("placa", placaNorm)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (osAnterior) {
              if (!clienteDB && !clienteNome) {
                clienteNome = osAnterior.cliente_nome || null;
                clienteTelefone = osAnterior.cliente_telefone || clienteTelefone;
              }
              veiculoModelo = osAnterior.veiculo_modelo || veiculoModelo;
              veiculoMarca = osAnterior.veiculo_marca || null;
              veiculoAno = osAnterior.veiculo_ano || null;
              veiculoCor = osAnterior.veiculo_cor || null;
              console.log("OS anterior encontrada para placa:", placaNorm);
            }

            // 3) Check vehicle cache
            if (!veiculoModelo) {
              const { data: cache } = await supabase
                .from("veiculos_cache")
                .select("marca, modelo, ano, cor")
                .eq("placa", placaNorm)
                .maybeSingle();

              if (cache) {
                veiculoModelo = cache.modelo || veiculoModelo;
                veiculoMarca = cache.marca || veiculoMarca;
                veiculoAno = cache.ano || veiculoAno;
                veiculoCor = cache.cor || veiculoCor;
                console.log("Cache de veículo encontrado:", placaNorm);
              }
            }

            // Generate OS number
            const now = new Date();
            const numOS = `OS${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

            // Brasil timezone (-03:00) — sem o offset, o Postgres interpreta como UTC e desloca 3h
            const dataEntrada = parsed.hora
              ? `${parsed.data_entrada}T${parsed.hora}:00-03:00`
              : `${parsed.data_entrada}T09:00:00-03:00`;

            const cadastroPendente = !clienteId;
            const { error: osError } = await supabase.from("ordem_servico").insert({
              numero_os: numOS,
              status: "agendada",
              prioridade: "normal",
              placa: placaNorm,
              
              cliente_nome: clienteNome,
              cliente_telefone: clienteTelefone,
              veiculo_modelo: veiculoModelo,
              veiculo_marca: veiculoMarca,
              veiculo_ano: veiculoAno,
              veiculo_cor: veiculoCor,
              defeito_relatado: `[${nomeLoja}] ${parsed.defeito_relatado || parsed.observacoes || "Agendamento via assistente virtual"}`,
              data_entrada: dataEntrada,
              data_prevista_conclusao: dataEntrada,
              observacoes: `📋 Agendamento ${nomeLoja}\n──────────────────────\nCriado automaticamente pelo assistente virtual da ${nomeLoja}.\nPlaca: ${placaNorm}\nCliente: ${clienteNome || "⚠️ A CADASTRAR (completar no atendimento)"}${clienteTelefone ? `\nTelefone: ${clienteTelefone}` : ""}\nData/Hora: ${dataEntrada.replace("T", " ")}${cadastroPendente ? `\n\n⚠️ CADASTRO DE CLIENTE PENDENTE — completar no atendimento.` : ""}\n${parsed.observacoes ? `\nDetalhes: ${parsed.observacoes}` : ""}`.trim(),
              empresa_id: empresaIdConv,
            });

            if (!osError) {
              agendamentoCriado = true;
              console.log("OS criada com sucesso:", numOS, "Placa:", placaNorm);
            } else {
              console.error("Erro ao criar OS:", osError);
            }
          }
        }
      } catch (parseErr) {
        console.error("Erro ao extrair dados de agendamento:", parseErr);
      }
    }

    // ─── Ticket interno para o estoquista quando o assistente NÃO acha a peça ───
    let ticketEstoquistaCriado = false;
    let ticketEstoquistaId: string | null = null;
    if (
      ["consulta_produto", "orcamento"].includes(intencao) &&
      produtosEncontrados.length === 0 &&
      empresaIdConv
    ) {
      try {
        // Extrai placa + item solicitado da conversa
        const fullHist = historico + `\nusuario: ${mensagem_cliente}\nbot: ${respostaBot}`;
        const extrairRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{
              role: "user",
              content: `Extraia da conversa abaixo a peça/produto que o cliente está pedindo, a placa da moto (se mencionada) e o modelo do veículo. Responda APENAS com JSON puro (sem markdown).
{
  "item_solicitado": "descrição curta da peça pedida (ex.: BIELA YBR 125 2008)",
  "placa": "ABC1234 ou null",
  "veiculo_modelo": "ex.: YBR 125 2008 ou null"
}
Normalize a placa para maiúsculas sem espaços/traços. Se não houver pedido claro de peça, retorne {"item_solicitado": null}.

CONVERSA:
${fullHist}`,
            }],
          }),
        });

        let item = mensagem_cliente.slice(0, 200);
        let placa: string | null = null;
        let veiculoModelo: string | null = null;

        if (extrairRes.ok) {
          const d = await extrairRes.json();
          let raw = d.choices?.[0]?.message?.content || "";
          raw = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
          try {
            const parsed = JSON.parse(raw);
            if (parsed.item_solicitado) item = String(parsed.item_solicitado).slice(0, 250);
            if (parsed.placa) placa = String(parsed.placa).toUpperCase().replace(/[^A-Z0-9]/g, "");
            if (parsed.veiculo_modelo) veiculoModelo = String(parsed.veiculo_modelo).slice(0, 120);
          } catch {/* keep defaults */}
        }

        const cli: any = conversa?.clientes || {};
        const clienteNome = cli.nome_completo || conversa?.contato_nome || "Cliente via Chat";
        const clienteTel = cli.telefone || conversa?.contato_externo_id || null;

        const mensagemEstoquista =
          `🔧 Cliente está pedindo: ${item}\n` +
          (placa ? `Placa: ${placa}\n` : "") +
          (veiculoModelo ? `Veículo: ${veiculoModelo}\n` : "") +
          `Cliente: ${clienteNome}${clienteTel ? ` (${clienteTel})` : ""}\n` +
          `Origem: assistente virtual ${nomeLoja}\n` +
          `Verifique se conseguimos atender e responda na conversa.`;

        const { data: ticketIns, error: ticketErr } = await supabase
          .from("tickets_estoquista")
          .insert({
            empresa_id: empresaIdConv,
            conversa_id,
            cliente_nome: clienteNome,
            cliente_telefone: clienteTel,
            placa,
            veiculo_modelo: veiculoModelo,
            item_solicitado: item,
            mensagem_estoquista: mensagemEstoquista,
            origem: "chat_assistente",
            status: "pendente",
          })
          .select("id")
          .single();

        if (ticketErr) {
          console.error("Erro ao criar ticket estoquista:", ticketErr);
        } else {
          ticketEstoquistaCriado = true;
          ticketEstoquistaId = ticketIns?.id || null;
          console.log("Ticket estoquista criado:", ticketEstoquistaId);
        }
      } catch (err) {
        console.error("Falha extração/criação ticket estoquista:", err);
      }
    }

    // Check if needs human handoff
    const precisaAtendente =
      intencao === "reclamacao" ||
      respostaBot.toLowerCase().includes("transferir") ||
      respostaBot.toLowerCase().includes("atendente");

    if (precisaAtendente) {
      respostaBot += "\n\n_Aguarde, vou transferir você para um atendente._";
      await supabase
        .from("conversas")
        .update({
          status: "aguardando",
          prioridade: intencao === "reclamacao" ? "alta" : "media",
        })
        .eq("id", conversa_id);
    }

    // Save bot response as message
    await supabase.from("mensagens").insert({
      conversa_id,
      tipo_remetente: "bot",
      tipo_mensagem: "texto",
      conteudo: respostaBot,
      status_envio: "enviado",
      intencao_detectada: intencao,
      sentimento: intencao === "elogio" ? "positivo" : intencao === "reclamacao" ? "negativo" : "neutro",
      confianca_ia: 0.85,
      empresa_id: empresaIdConv,
    });

    return new Response(
      JSON.stringify({
        resposta: respostaBot,
        intencao,
        transferir: precisaAtendente,
        produtos: produtosEncontrados,
        agendamento_criado: agendamentoCriado,
        ticket_estoquista: ticketEstoquistaCriado,
        ticket_estoquista_id: ticketEstoquistaId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("processar-mensagem error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
