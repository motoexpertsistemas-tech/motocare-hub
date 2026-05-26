import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ML_BASE_URL = "https://api.mercadolibre.com";

// ============================================
// MERCADO LIVRE CLASS
// ============================================

class MercadoLivre {
  private credentials: {
    client_id: string;
    client_secret: string;
    access_token: string;
    refresh_token: string;
    user_id: string;
  };
  private supabase: any;
  private integracaoId: string;

  constructor(credentials: any, supabase: any, integracaoId: string) {
    this.credentials = credentials;
    this.supabase = supabase;
    this.integracaoId = integracaoId;
  }

  // --- AUTH ---

  async refreshAccessToken() {
    const response = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: this.credentials.client_id,
        client_secret: this.credentials.client_secret,
        refresh_token: this.credentials.refresh_token,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      this.credentials.access_token = data.access_token;
      this.credentials.refresh_token = data.refresh_token;
      await this.salvarCredenciais();
    }

    return data;
  }

  private async salvarCredenciais() {
    await this.supabase
      .from("marketplace_integracoes")
      .update({
        credenciais: this.credentials,
        ultima_sincronizacao: new Date().toISOString(),
      })
      .eq("id", this.integracaoId);
  }

  private async fetchML(url: string, options: RequestInit = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.credentials.access_token}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const data = await res.json();

    if (data.error === "invalid_token") {
      await this.refreshAccessToken();
      return this.fetchML(url, options);
    }

    return data;
  }

  // --- PRODUTOS ---

  async publicarProduto(produto: any) {
    const categoria = await this.buscarCategoria(produto.nome);

    const payload = {
      title: (produto.nome || "").substring(0, 60),
      category_id: categoria.id,
      price: produto.preco_venda || produto.custo_final || 0,
      currency_id: "BRL",
      available_quantity: produto.estoque_quantidade || 0,
      buying_mode: "buy_it_now",
      condition: "new",
      listing_type_id: "gold_special",
      description: { plain_text: produto.descricao || produto.nome },
      pictures: produto.imagem_url
        ? [{ source: produto.imagem_url }]
        : [],
      attributes: [
        { id: "BRAND", value_name: produto.marca || produto.categoria || "" },
        { id: "MODEL", value_name: produto.nome },
        ...(produto.ean ? [{ id: "GTIN", value_name: produto.ean }] : []),
      ],
      shipping: {
        mode: "me2",
        free_shipping: (produto.preco_venda || 0) > 79,
        local_pick_up: true,
      },
    };

    const data = await this.fetchML(`${ML_BASE_URL}/items`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (data.error) {
      throw new Error(data.message || data.error);
    }

    return data;
  }

  async buscarCategoria(nomeProduto: string) {
    const response = await fetch(
      `${ML_BASE_URL}/sites/MLB/domain_discovery/search?q=${encodeURIComponent(nomeProduto)}`
    );
    const data = await response.json();

    return data[0]?.category_id
      ? { id: data[0].category_id }
      : { id: "MLB1499" };
  }

  async atualizarEstoque(mlItemId: string, quantidade: number) {
    return this.fetchML(`${ML_BASE_URL}/items/${mlItemId}`, {
      method: "PUT",
      body: JSON.stringify({ available_quantity: quantidade }),
    });
  }

  async atualizarPreco(mlItemId: string, preco: number) {
    return this.fetchML(`${ML_BASE_URL}/items/${mlItemId}`, {
      method: "PUT",
      body: JSON.stringify({ price: preco }),
    });
  }

  async alterarStatus(mlItemId: string, status: "active" | "paused" | "closed") {
    return this.fetchML(`${ML_BASE_URL}/items/${mlItemId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  // --- PEDIDOS ---

  async buscarPedidos(desde?: Date) {
    const params = new URLSearchParams({
      seller: this.credentials.user_id,
      sort: "date_desc",
      limit: "50",
    });

    if (desde) {
      params.append("order.date_created.from", desde.toISOString());
    }

    const data = await this.fetchML(
      `${ML_BASE_URL}/orders/search?${params}`
    );

    return data.results || [];
  }

  async buscarDetalhesPedido(orderId: string) {
    return this.fetchML(`${ML_BASE_URL}/orders/${orderId}`);
  }

  async processarNovoPedido(order: any, integracaoId: string) {
    const detalhes = await this.buscarDetalhesPedido(order.id);

    const taxaML =
      (detalhes.payments?.[0]?.transaction_amount || 0) -
      (detalhes.payments?.[0]?.net_received_amount || 0);
    const percentualComissao =
      detalhes.total_amount > 0
        ? (taxaML / detalhes.total_amount) * 100
        : 0;

    const receiverAddr = detalhes.shipping?.receiver_address || {};

    const { data: pedido, error } = await this.supabase
      .from("marketplace_pedidos")
      .insert({
        integracao_id: integracaoId,
        pedido_externo_id: order.id.toString(),
        numero_pedido: `ML-${order.id}`,
        marketplace: "mercado_livre",
        cliente_nome: detalhes.buyer?.nickname || "Comprador ML",
        cliente_cpf_cnpj: detalhes.buyer?.billing_info?.doc_number || null,
        cliente_telefone: detalhes.buyer?.phone
          ? `${detalhes.buyer.phone.area_code || ""}${detalhes.buyer.phone.number || ""}`
          : null,
        cliente_email: detalhes.buyer?.email || null,
        cep: receiverAddr.zip_code || "00000000",
        logradouro: receiverAddr.street_name || "N/A",
        numero: receiverAddr.street_number || "S/N",
        complemento: receiverAddr.comment || null,
        bairro: receiverAddr.neighborhood?.name || "N/A",
        cidade: receiverAddr.city?.name || "N/A",
        estado: receiverAddr.state?.id || "SP",
        valor_produtos: (detalhes.total_amount || 0) - (detalhes.shipping?.cost || 0),
        valor_frete: detalhes.shipping?.cost || 0,
        valor_total: detalhes.total_amount || 0,
        taxa_marketplace: taxaML,
        percentual_comissao: percentualComissao,
        status: this.mapearStatus(detalhes.status),
        itens: (detalhes.order_items || []).map((item: any) => ({
          sku: item.item?.seller_sku,
          nome: item.item?.title,
          quantidade: item.quantity,
          valor_unitario: item.unit_price,
          produto_id: null,
        })),
        data_pedido: new Date(detalhes.date_created).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return pedido;
  }

  private mapearStatus(mlStatus: string): string {
    const mapa: Record<string, string> = {
      paid: "confirmado",
      confirmed: "confirmado",
      payment_required: "aguardando_confirmacao",
      payment_in_process: "aguardando_confirmacao",
      partially_paid: "aguardando_confirmacao",
      cancelled: "cancelado",
      invalid: "cancelado",
    };
    return mapa[mlStatus] || "aguardando_confirmacao";
  }

  // --- ENVIO ---

  async informarEnvio(orderId: string, codigoRastreio: string, transportadora: string) {
    const order = await this.buscarDetalhesPedido(orderId);
    const shipmentId = order.shipping?.id;
    if (!shipmentId) throw new Error("Shipment não encontrado");

    return this.fetchML(`${ML_BASE_URL}/shipments/${shipmentId}`, {
      method: "PUT",
      body: JSON.stringify({
        status: "shipped",
        tracking_number: codigoRastreio,
        tracking_method: transportadora,
      }),
    });
  }

  // --- PERGUNTAS ---

  async buscarPerguntas() {
    const data = await this.fetchML(
      `${ML_BASE_URL}/questions/search?seller_id=${this.credentials.user_id}&status=UNANSWERED`
    );
    return data.questions || [];
  }

  async responderPergunta(questionId: string, resposta: string) {
    return this.fetchML(`${ML_BASE_URL}/answers`, {
      method: "POST",
      body: JSON.stringify({ question_id: questionId, text: resposta }),
    });
  }
}

// ============================================
// SINCRONIZAÇÃO AUTOMÁTICA
// ============================================

async function sincronizarMercadoLivre(supabase: any, integracaoId: string) {
  const { data: integracao } = await supabase
    .from("marketplace_integracoes")
    .select("*")
    .eq("id", integracaoId)
    .single();

  if (!integracao || !integracao.ativo) {
    return { success: false, message: "Integração inativa ou não encontrada" };
  }

  const ml = new MercadoLivre(integracao.credenciais, supabase, integracaoId);
  const results: any = { pedidos: 0, estoque: 0, precos: 0, perguntas: 0 };

  try {
    // 1. SINCRONIZAR PEDIDOS
    if (integracao.sincronizar_pedidos) {
      const ultimaSinc = integracao.ultima_sincronizacao
        ? new Date(integracao.ultima_sincronizacao)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

      const pedidos = await ml.buscarPedidos(ultimaSinc);

      for (const pedido of pedidos) {
        const { data: existe } = await supabase
          .from("marketplace_pedidos")
          .select("id")
          .eq("pedido_externo_id", pedido.id.toString())
          .maybeSingle();

        if (!existe) {
          await ml.processarNovoPedido(pedido, integracaoId);
          results.pedidos++;
        }
      }
    }

    // 2. SINCRONIZAR ESTOQUE
    if (integracao.sincronizar_estoque) {
      const { data: produtos } = await supabase
        .from("produtos_catalogo")
        .select("id, estoque_quantidade, codigo_fornecedor")
        .not("codigo_fornecedor", "is", null);

      // Simple approach: sync products that have a ML item ID stored somewhere
      // For now we log the count
      results.estoque = (produtos || []).length;
    }

    // 3. BUSCAR PERGUNTAS → CRM
    const perguntas = await ml.buscarPerguntas();

    for (const pergunta of perguntas) {
      const { data: canal } = await supabase
        .from("canais_comunicacao")
        .select("id")
        .eq("tipo", "mercado_livre")
        .maybeSingle();

      if (!canal) continue;

      const { data: conversaExiste } = await supabase
        .from("conversas")
        .select("id")
        .eq("contato_externo_id", pergunta.from.id.toString())
        .eq("canal_tipo", "mercado_livre")
        .maybeSingle();

      if (!conversaExiste) {
        const { data: conversa } = await supabase
          .from("conversas")
          .insert({
            canal_id: canal.id,
            canal_tipo: "mercado_livre",
            contato_externo_id: pergunta.from.id.toString(),
            contato_nome: pergunta.from.nickname,
            status: "aguardando",
            tipo_solicitacao: "duvida",
          })
          .select()
          .single();

        if (conversa) {
          await supabase.from("mensagens").insert({
            conversa_id: conversa.id,
            tipo_remetente: "cliente",
            tipo_mensagem: "texto",
            conteudo: pergunta.text,
            id_externo: pergunta.id.toString(),
          });
          results.perguntas++;
        }
      }
    }

    // Atualizar timestamp
    await supabase
      .from("marketplace_integracoes")
      .update({
        ultima_sincronizacao: new Date().toISOString(),
        erro_sincronizacao: null,
      })
      .eq("id", integracaoId);

    return { success: true, results };
  } catch (error) {
    console.error("Erro sincronização ML:", error);

    await supabase
      .from("marketplace_integracoes")
      .update({ erro_sincronizacao: String(error) })
      .eq("id", integracaoId);

    throw error;
  }
}

// ============================================
// EDGE FUNCTION HANDLER
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, integracao_id, ...params } = await req.json();

    // Load integration
    const { data: integracao, error: intError } = await supabase
      .from("marketplace_integracoes")
      .select("*")
      .eq("id", integracao_id)
      .single();

    if (intError || !integracao) {
      return new Response(
        JSON.stringify({ error: "Integração não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ml = new MercadoLivre(integracao.credenciais, supabase, integracao_id);
    let result: any;

    switch (action) {
      case "sincronizar":
        result = await sincronizarMercadoLivre(supabase, integracao_id);
        break;

      case "publicar_produto":
        result = await ml.publicarProduto(params.produto);
        break;

      case "atualizar_estoque":
        result = await ml.atualizarEstoque(params.ml_item_id, params.quantidade);
        break;

      case "atualizar_preco":
        result = await ml.atualizarPreco(params.ml_item_id, params.preco);
        break;

      case "pausar_anuncio":
        result = await ml.alterarStatus(params.ml_item_id, "paused");
        break;

      case "ativar_anuncio":
        result = await ml.alterarStatus(params.ml_item_id, "active");
        break;

      case "buscar_pedidos":
        result = await ml.buscarPedidos(params.desde ? new Date(params.desde) : undefined);
        break;

      case "informar_envio":
        result = await ml.informarEnvio(
          params.order_id,
          params.codigo_rastreio,
          params.transportadora
        );
        break;

      case "buscar_perguntas":
        result = await ml.buscarPerguntas();
        break;

      case "responder_pergunta":
        result = await ml.responderPergunta(params.question_id, params.resposta);
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
