import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SPEDY_URLS: Record<string, string> = {
  sandbox: "https://sandbox-api.spedy.com.br/v1",
  production: "https://api.spedy.com.br/v1",
};

const TIPO_ENDPOINT: Record<string, string> = {
  nfe: "product-invoices",
  nfce: "product-invoices",
  nfse: "service-invoices",
};

/* ── helpers ── */

function buildNfePayload(dados: any): any {
  const items = (dados.itens || []).map((item: any) => {
    const totalAmount = (item.quantidade || 1) * (item.valorUnitario || 0);
    const taxes: any = {};

    // ICMS
    if (dados.regimeTributario === "simplesNacional" || dados.regimeTributario === "simplesNacionalMEI") {
      taxes.icms = { origin: Number(item.origem || 0), csosn: Number(item.csosn || 400) };
    } else {
      taxes.icms = {
        origin: Number(item.origem || 0),
        cst: Number(item.cstIcms || 0),
        baseTaxModality: 3,
        baseTax: totalAmount,
        baseTaxReduction: 0,
        rate: Number(item.aliquotaIcms || 0) / 100,
        amount: totalAmount * (Number(item.aliquotaIcms || 0) / 100),
      };
    }

    // PIS
    taxes.pis = { cst: Number(item.cstPis || 7) };
    if (Number(item.cstPis) === 1 || Number(item.cstPis) === 2) {
      taxes.pis.baseTax = totalAmount;
      taxes.pis.rate = Number(item.aliquotaPis || 0.0065);
      taxes.pis.amount = totalAmount * taxes.pis.rate;
    }

    // COFINS
    taxes.cofins = { cst: Number(item.cstCofins || 7) };
    if (Number(item.cstCofins) === 1 || Number(item.cstCofins) === 2) {
      taxes.cofins.baseTax = totalAmount;
      taxes.cofins.rate = Number(item.aliquotaCofins || 0.03);
      taxes.cofins.amount = totalAmount * taxes.cofins.rate;
    }

    return {
      code: item.codigo || `ITEM${item.numeroItem || 1}`,
      description: item.descricao,
      ncm: item.ncm || "00000000",
      cfop: Number(item.cfop || 5102),
      unit: item.unidade || "UN",
      quantity: item.quantidade || 1,
      unitAmount: item.valorUnitario || 0,
      totalAmount,
      unitTax: item.unidade || "UN",
      quantityTax: item.quantidade || 1,
      unitTaxAmount: item.valorUnitario || 0,
      makeupTotal: true,
      taxes,
    };
  });

  const productAmount = items.reduce((s: number, i: any) => s + i.totalAmount, 0);
  const dest = dados.destinatario || {};
  const endereco = dest.endereco || {};

  const receiver: any = {
    name: dest.nome,
    federalTaxNumber: (dest.cpfCnpj || "").replace(/\D/g, ""),
  };
  if (dest.email) receiver.email = dest.email;
  if (dest.ie) receiver.stateTaxNumber = dest.ie;

  if (endereco.logradouro) {
    receiver.address = {
      street: endereco.logradouro,
      number: endereco.numero || "S/N",
      district: endereco.bairro || "",
      postalCode: (endereco.cep || "").replace(/\D/g, ""),
      city: {
        name: endereco.cidade || "",
        state: endereco.uf || "",
      },
    };
  }

  const isFinalCustomer = dados.tipo === "nfce" || dest.tipo === "fisica";
  const destination = dados.destination || "internal";
  const presenceType = dados.presenceType || "internet";

  const payload: any = {
    isFinalCustomer,
    effectiveDate: new Date().toISOString(),
    status: "enqueued",
    operationType: "outgoing",
    destination,
    presenceType,
    operationNature: dados.naturezaOperacao || "Venda de Mercadoria",
    sendEmailToCustomer: !!dest.email,
    receiver,
    items,
    payments: [
      {
        method: dados.formaPagamento || "01",
        amount: productAmount,
      },
    ],
    total: {
      invoiceAmount: productAmount,
      productAmount,
    },
  };

  if (dados.integrationId) payload.integrationId = dados.integrationId;
  if (dados.observacoes) payload.additionalInformation = dados.observacoes;

  return payload;
}

function buildNfsePayload(dados: any): any {
  const dest = dados.destinatario || {};
  const endereco = dest.endereco || {};

  const receiver: any = {
    name: dest.nome,
    federalTaxNumber: (dest.cpfCnpj || "").replace(/\D/g, ""),
  };
  if (dest.email) receiver.email = dest.email;

  if (endereco.logradouro) {
    receiver.address = {
      street: endereco.logradouro,
      number: endereco.numero || "S/N",
      district: endereco.bairro || "",
      postalCode: (endereco.cep || "").replace(/\D/g, ""),
      city: { name: endereco.cidade || "", state: endereco.uf || "" },
    };
  }

  const totalAmount = Number(dados.valorTotal || dados.valorServicos || 0);
  const issRate = Number(dados.issRate || 0.05);

  // Build description from items
  let description = dados.descricaoServico || "";
  if (!description && dados.itens?.length) {
    description = dados.itens
      .map((i: any) => `- ${i.descricao} (Qtd: ${i.quantidade}, R$ ${(i.quantidade * i.valorUnitario).toFixed(2)})`)
      .join("\n");
  }

  const payload: any = {
    effectiveDate: new Date().toISOString(),
    status: "enqueued",
    sendEmailToCustomer: !!dest.email,
    description: description || "Prestação de serviços",
    federalServiceCode: dados.federalServiceCode || "1.07",
    cityServiceCode: dados.cityServiceCode || "",
    taxationType: dados.taxationType || "taxationInMunicipality",
    receiver,
    total: {
      invoiceAmount: totalAmount,
      issRate,
      issAmount: totalAmount * issRate,
      issWithheld: dados.issWithheld === true,
    },
  };

  if (dados.integrationId) payload.integrationId = dados.integrationId;

  return payload;
}

function buildOrderPayload(dados: any): any {
  const dest = dados.destinatario || {};
  const customer: any = {
    name: dest.nome,
    federalTaxNumber: (dest.cpfCnpj || "").replace(/\D/g, ""),
  };
  if (dest.email) customer.email = dest.email;

  const items = (dados.itens || []).map((item: any) => {
    const amount = (item.quantidade || 1) * (item.valorUnitario || 0);
    return {
      quantity: item.quantidade || 1,
      price: item.valorUnitario || 0,
      amount,
      discountAmount: 0,
      product: {
        name: item.descricao,
        code: item.codigo || undefined,
        price: item.valorUnitario || 0,
      },
    };
  });

  const totalAmount = items.reduce((s: number, i: any) => s + i.amount, 0);

  const payload: any = {
    transactionId: dados.integrationId || `TXN-${Date.now()}`,
    date: new Date().toISOString(),
    amount: totalAmount,
    autoIssueMode: "immediately",
    status: "approved",
    paymentMethod: dados.paymentMethod || "pix",
    sendEmailToCustomer: !!dest.email,
    customer,
    items,
  };

  return payload;
}

/* ── main handler ── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: usuario } = await userClient
      .from("usuarios")
      .select("empresa_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!usuario?.empresa_id) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const empresaId = usuario.empresa_id;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: config } = await adminClient
      .from("spedy_config")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .single();

    if (!config) {
      return new Response(
        JSON.stringify({ error: "Spedy não configurado. Acesse Configuração Fiscal > Spedy." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { operacao, tipo, dados, notaId } = body;

    const baseUrl = SPEDY_URLS[config.ambiente] || SPEDY_URLS.sandbox;
    const apiKey = config.api_key;

    let spedyEndpoint = "";
    let spedyMethod = "GET";
    let spedyBody: string | undefined;

    const endpointPath = TIPO_ENDPOINT[tipo] || "product-invoices";

    switch (operacao) {
      case "emitir": {
        spedyEndpoint = `${baseUrl}/${endpointPath}`;
        spedyMethod = "POST";

        // Transform internal payload to Spedy format
        if (tipo === "nfse") {
          spedyBody = JSON.stringify(buildNfsePayload(dados));
        } else {
          spedyBody = JSON.stringify(buildNfePayload({ ...dados, tipo }));
        }
        break;
      }
      case "emitir-order": {
        spedyEndpoint = `${baseUrl}/orders`;
        spedyMethod = "POST";
        spedyBody = JSON.stringify(buildOrderPayload(dados));
        break;
      }
      case "consultar": {
        spedyEndpoint = `${baseUrl}/${endpointPath}/${notaId}`;
        spedyMethod = "GET";
        break;
      }
      case "consultar-status": {
        spedyEndpoint = `${baseUrl}/${endpointPath}/${notaId}`;
        spedyMethod = "GET";
        break;
      }
      case "cancelar": {
        spedyEndpoint = `${baseUrl}/${endpointPath}/${notaId}`;
        spedyMethod = "DELETE";
        if (dados?.justificativa) {
          spedyBody = JSON.stringify({ justification: dados.justificativa });
        }
        break;
      }
      case "download-xml": {
        spedyEndpoint = `${baseUrl}/${endpointPath}/${notaId}/xml`;
        spedyMethod = "GET";
        break;
      }
      case "download-pdf": {
        spedyEndpoint = `${baseUrl}/${endpointPath}/${notaId}/pdf`;
        spedyMethod = "GET";
        break;
      }
      case "reenviar-email": {
        spedyEndpoint = `${baseUrl}/${endpointPath}/${notaId}/resend-email`;
        spedyMethod = "POST";
        spedyBody = JSON.stringify(dados);
        break;
      }
      case "testar-conexao": {
        spedyEndpoint = `${baseUrl}/${endpointPath}?page=1&pageSize=1`;
        spedyMethod = "GET";
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: `Operação '${operacao}' não suportada` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }

    // Call Spedy API
    const spedyResponse = await fetch(spedyEndpoint, {
      method: spedyMethod,
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      ...(spedyBody ? { body: spedyBody } : {}),
    });

    const responseData = await spedyResponse.json().catch(() => ({}));

    // Log the request
    await adminClient.from("spedy_logs").insert({
      empresa_id: empresaId,
      operacao,
      endpoint: spedyEndpoint,
      metodo: spedyMethod,
      request_body: spedyBody ? JSON.parse(spedyBody) : null,
      status_code: spedyResponse.status,
      response_body: responseData,
      sucesso: spedyResponse.ok,
      erro_mensagem: spedyResponse.ok ? null : responseData?.message || responseData?.errors?.[0]?.message || JSON.stringify(responseData),
    });

    // For emitir-order: save as nota fiscal too
    if (operacao === "emitir-order" && spedyResponse.ok && responseData?.id) {
      const invoices = responseData.invoices || [];
      const firstInvoice = invoices[0] || {};

      await adminClient.from("notas_fiscais").insert({
        empresa_id: empresaId,
        tipo_nota: firstInvoice.model === "serviceInvoice" ? "nfse" : "nfe",
        numero_nota: 0,
        serie: "1",
        spedy_nota_id: firstInvoice.id || responseData.id,
        spedy_status: firstInvoice.status || "enqueued",
        destinatario_nome: dados?.destinatario?.nome || null,
        destinatario_cpf_cnpj: (dados?.destinatario?.cpfCnpj || "").replace(/\D/g, ""),
        destinatario_email: dados?.destinatario?.email || null,
        valor_produtos: dados?.valorTotal || 0,
        valor_total: dados?.valorTotal || 0,
        status: "processando",
        integration_id: dados?.integrationId || responseData.transactionId || null,
      });
    }

    // For emitir (complete mode): save nota fiscal record
    if (operacao === "emitir" && spedyResponse.ok && responseData?.id) {
      const nextNum = tipo === "nfse"
        ? (config.proximo_numero_nfse || 1)
        : tipo === "nfce"
        ? (config.proximo_numero_nfce || 1)
        : (config.proximo_numero_nfe || 1);

      const serie = tipo === "nfse"
        ? (config.serie_nfse || "1")
        : tipo === "nfce"
        ? (config.serie_nfce || "1")
        : (config.serie_nfe || "1");

      await adminClient.from("notas_fiscais").insert({
        empresa_id: empresaId,
        tipo_nota: tipo,
        numero_nota: nextNum,
        serie,
        spedy_nota_id: responseData.id,
        spedy_status: responseData.status || "enqueued",
        destinatario_tipo: dados?.destinatario?.tipo || null,
        destinatario_cpf_cnpj: (dados?.destinatario?.cpfCnpj || "").replace(/\D/g, ""),
        destinatario_nome: dados?.destinatario?.nome || null,
        destinatario_email: dados?.destinatario?.email || null,
        valor_produtos: dados?.valorProdutos || dados?.valorTotal || 0,
        valor_servicos: dados?.valorServicos || 0,
        valor_total: dados?.valorTotal || 0,
        status: "processando",
        observacoes: dados?.observacoes || null,
        informacoes_adicionais: dados?.informacoesAdicionais || null,
        venda_id: dados?.vendaId || null,
        ordem_servico_id: dados?.ordemServicoId || null,
        integration_id: dados?.integrationId || null,
      });
    }

    // For consultar-status: update local nota with latest status
    if (operacao === "consultar-status" && spedyResponse.ok && responseData?.status) {
      const statusMap: Record<string, string> = {
        authorized: "autorizada",
        canceled: "cancelada",
        denied: "denegada",
        rejected: "rejeitada",
        enqueued: "processando",
        created: "processando",
        received: "processando",
      };
      const mappedStatus = statusMap[responseData.status] || "processando";
      const updateData: Record<string, any> = {
        status: mappedStatus,
        spedy_status: responseData.status,
        processing_detail: responseData.processingDetail || null,
      };

      if (responseData.number) updateData.numero_nota = responseData.number;
      if (responseData.accessKey) updateData.chave_acesso = responseData.accessKey;
      if (responseData.authorization?.protocol) updateData.protocolo_autorizacao = responseData.authorization.protocol;
      if (responseData.authorization?.date) updateData.data_autorizacao = responseData.authorization.date;

      await adminClient
        .from("notas_fiscais")
        .update(updateData)
        .eq("spedy_nota_id", notaId)
        .eq("empresa_id", empresaId);
    }

    return new Response(JSON.stringify(responseData), {
      status: spedyResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
