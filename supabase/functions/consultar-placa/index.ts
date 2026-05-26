const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { placa } = await req.json();

    if (!placa) {
      return new Response(
        JSON.stringify({ success: false, error: 'Placa é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const placaLimpa = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    const regexPlaca = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    if (!regexPlaca.test(placaLimpa)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Formato de placa inválido. Use ABC1234 ou ABC1D23.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = Deno.env.get('PLACA_API_TOKEN');

    // 1) WDAPI2 com token (API principal)
    if (token) {
      console.log(`[1] Consultando wdapi2 com token: ${placaLimpa}`);
      try {
        const resp = await fetch(`https://wdapi2.com.br/consulta/${placaLimpa}/${token}`, {
          headers: { 'Accept': 'application/json' },
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.MARCA && data.MARCA !== 'NAO ENCONTRADO' && data.MARCA !== '' && !data.error) {
            console.log('[1] wdapi2: sucesso');
            const extra = data.extra || {};
            const fipeItem = data.fipe?.dados?.[0] || {};

            return jsonResponse({
              success: true,
              source: 'wdapi',
              veiculo: {
                placa: data.placa || placaLimpa,
                placa_alternativa: data.placa_alternativa || '',
                marca: data.MARCA || data.marca || '',
                modelo: data.MODELO || data.modelo || '',
                submodelo: data.SUBMODELO || '',
                versao: data.VERSAO || '',
                ano: data.ano || '',
                ano_modelo: data.anoModelo || '',
                cor: data.cor || '',
                chassi: data.chassi || '',
                municipio: data.municipio || extra.municipio || '',
                uf: data.uf || extra.uf || '',
                origem: data.origem || '',
                situacao: data.situacao || '',
                marca_modelo: data.marcaModelo || '',
                logo_url: data.logo || '',
                combustivel: extra.combustivel || '',
                cilindradas: extra.cilindradas || '',
                tipo_veiculo: extra.tipo_veiculo || '',
                especie: extra.especie || '',
                carroceria: extra.tipo_carroceria || '',
                quantidade_passageiros: extra.quantidade_passageiro || '',
                nacionalidade: extra.nacionalidade || '',
                segmento: extra.segmento || '',
                sub_segmento: extra.sub_segmento || '',
                peso_bruto_total: extra.peso_bruto_total || '',
                cap_maxima_tracao: extra.cap_maxima_tracao || '',
                eixos: extra.eixos || '',
                situacao_veiculo: extra.situacao_veiculo || '',
                situacao_chassi: extra.situacao_chassi || '',
                tipo_doc_proprietario: extra.tipo_doc_prop || '',
                uf_faturado: extra.uf_faturado || '',
                fipe_codigo: fipeItem.codigo_fipe || '',
                fipe_valor: fipeItem.texto_valor || '',
                fipe_modelo: fipeItem.texto_modelo || '',
                fipe_marca: fipeItem.texto_marca || '',
                fipe_referencia: fipeItem.mes_referencia || '',
              }
            });
          }
          console.log('[1] wdapi2 sem resultado:', JSON.stringify(data).substring(0, 300));
        } else {
          console.log('[1] wdapi2 HTTP:', resp.status);
        }
      } catch (e) {
        console.error('[1] Erro wdapi2:', e.message);
      }
    } else {
      console.log('[WARN] PLACA_API_TOKEN não configurado, pulando wdapi2');
    }

    // 2) PlacaFipe API (fallback)
    console.log(`[2] Tentando PlacaFipe: ${placaLimpa}`);
    if (token) {
      try {
        const resp = await fetch('https://api.placafipe.com.br/getplaca', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placa: placaLimpa, token }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && !data.error && !data.codigo && (data.marca || data.MARCA)) {
            console.log('[2] PlacaFipe: sucesso');
            return jsonResponse({
              success: true,
              source: 'placafipe',
              veiculo: {
                placa: placaLimpa,
                marca: data.marca || data.MARCA || '',
                modelo: data.modelo || data.MODELO || '',
                ano: data.ano || data.anoModelo || '',
                cor: data.cor || data.COR || '',
                chassi: data.chassi || '',
                combustivel: data.combustivel || '',
                municipio: data.municipio || '',
                uf: data.uf || '',
                tipo_veiculo: data.tipo || data.tipoVeiculo || '',
              }
            });
          }
          console.log('[2] PlacaFipe sem resultado');
        }
      } catch (e) {
        console.error('[2] Erro PlacaFipe:', e.message);
      }
    }

    // 3) WDAPI2 sem token (tentativa gratuita)
    if (!token) {
      console.log(`[3] Tentando wdapi2 SEM token: ${placaLimpa}`);
      try {
        const resp = await fetch(`https://wdapi2.com.br/consulta/${placaLimpa}/json`, {
          headers: { 'Accept': 'application/json' },
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.MARCA && data.MARCA !== 'NAO ENCONTRADO' && data.MARCA !== '') {
            console.log('[3] wdapi2 gratuito: sucesso');
            return jsonResponse({
              success: true,
              source: 'wdapi_free',
              veiculo: {
                placa: placaLimpa,
                marca: data.MARCA || '',
                modelo: data.MODELO || '',
                ano: data.ano || data.ANOFABRICACAO || '',
                cor: data.cor || data.COR || '',
                chassi: data.CHASSI || '',
                municipio: data.MUNICIPIO || data.municipio || '',
                uf: data.UF || data.uf || '',
                tipo_veiculo: data.TIPO || '',
              }
            });
          }
        }
      } catch (e) {
        console.error('[3] Erro wdapi2 free:', e.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Placa não encontrada. Verifique se a placa está correta e tente novamente.',
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro consultar-placa:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function jsonResponse(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
