export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      afiliados: {
        Row: {
          afiliado_pai_id: string | null
          agencia: string | null
          aprovado_em: string | null
          atualizado_em: string | null
          banco: string | null
          codigo_afiliado: string
          comissao_percentual: number | null
          comissao_recorrente_meses: number | null
          comissao_tipo: string | null
          comissoes_pagas: number | null
          comissoes_pendentes: number | null
          conta: string | null
          cpf_cnpj: string
          criado_em: string | null
          email: string
          id: string
          link_afiliado: string
          nivel: number | null
          nome_completo: string
          pix_chave: string | null
          pix_tipo: string | null
          status: string | null
          telefone: string | null
          tipo_conta: string | null
          total_comissoes: number | null
          total_vendas: number | null
        }
        Insert: {
          afiliado_pai_id?: string | null
          agencia?: string | null
          aprovado_em?: string | null
          atualizado_em?: string | null
          banco?: string | null
          codigo_afiliado: string
          comissao_percentual?: number | null
          comissao_recorrente_meses?: number | null
          comissao_tipo?: string | null
          comissoes_pagas?: number | null
          comissoes_pendentes?: number | null
          conta?: string | null
          cpf_cnpj: string
          criado_em?: string | null
          email: string
          id?: string
          link_afiliado: string
          nivel?: number | null
          nome_completo: string
          pix_chave?: string | null
          pix_tipo?: string | null
          status?: string | null
          telefone?: string | null
          tipo_conta?: string | null
          total_comissoes?: number | null
          total_vendas?: number | null
        }
        Update: {
          afiliado_pai_id?: string | null
          agencia?: string | null
          aprovado_em?: string | null
          atualizado_em?: string | null
          banco?: string | null
          codigo_afiliado?: string
          comissao_percentual?: number | null
          comissao_recorrente_meses?: number | null
          comissao_tipo?: string | null
          comissoes_pagas?: number | null
          comissoes_pendentes?: number | null
          conta?: string | null
          cpf_cnpj?: string
          criado_em?: string | null
          email?: string
          id?: string
          link_afiliado?: string
          nivel?: number | null
          nome_completo?: string
          pix_chave?: string | null
          pix_tipo?: string | null
          status?: string | null
          telefone?: string | null
          tipo_conta?: string | null
          total_comissoes?: number | null
          total_vendas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "afiliados_afiliado_pai_id_fkey"
            columns: ["afiliado_pai_id"]
            isOneToOne: false
            referencedRelation: "afiliados"
            referencedColumns: ["id"]
          },
        ]
      }
      afiliados_analytics: {
        Row: {
          afiliado_id: string
          cidade: string | null
          created_at: string | null
          estado: string | null
          evento: string
          id: string
          ip_address: string | null
          pais: string | null
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          afiliado_id: string
          cidade?: string | null
          created_at?: string | null
          estado?: string | null
          evento: string
          id?: string
          ip_address?: string | null
          pais?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          afiliado_id?: string
          cidade?: string | null
          created_at?: string | null
          estado?: string | null
          evento?: string
          id?: string
          ip_address?: string | null
          pais?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "afiliados_analytics_afiliado_id_fkey"
            columns: ["afiliado_id"]
            isOneToOne: false
            referencedRelation: "afiliados"
            referencedColumns: ["id"]
          },
        ]
      }
      afiliados_comissoes_recorrentes: {
        Row: {
          afiliado_id: string
          ano_referencia: number
          comissao_percentual: number
          comissao_valor: number
          created_at: string | null
          data_pagamento: string | null
          fatura_id: string
          id: string
          mes_referencia: number
          status: string | null
          valor_fatura: number
          venda_original_id: string
        }
        Insert: {
          afiliado_id: string
          ano_referencia: number
          comissao_percentual: number
          comissao_valor: number
          created_at?: string | null
          data_pagamento?: string | null
          fatura_id: string
          id?: string
          mes_referencia: number
          status?: string | null
          valor_fatura: number
          venda_original_id: string
        }
        Update: {
          afiliado_id?: string
          ano_referencia?: number
          comissao_percentual?: number
          comissao_valor?: number
          created_at?: string | null
          data_pagamento?: string | null
          fatura_id?: string
          id?: string
          mes_referencia?: number
          status?: string | null
          valor_fatura?: number
          venda_original_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "afiliados_comissoes_recorrentes_afiliado_id_fkey"
            columns: ["afiliado_id"]
            isOneToOne: false
            referencedRelation: "afiliados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afiliados_comissoes_recorrentes_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afiliados_comissoes_recorrentes_venda_original_id_fkey"
            columns: ["venda_original_id"]
            isOneToOne: false
            referencedRelation: "afiliados_vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      afiliados_pagamentos: {
        Row: {
          afiliado_id: string
          ano_referencia: number
          comprovante_url: string | null
          created_at: string | null
          dados_bancarios: Json | null
          id: string
          mes_referencia: number
          metodo_pagamento: string
          processado_em: string | null
          status: string | null
          valor_bruto: number
          valor_impostos: number | null
          valor_liquido: number
        }
        Insert: {
          afiliado_id: string
          ano_referencia: number
          comprovante_url?: string | null
          created_at?: string | null
          dados_bancarios?: Json | null
          id?: string
          mes_referencia: number
          metodo_pagamento: string
          processado_em?: string | null
          status?: string | null
          valor_bruto: number
          valor_impostos?: number | null
          valor_liquido: number
        }
        Update: {
          afiliado_id?: string
          ano_referencia?: number
          comprovante_url?: string | null
          created_at?: string | null
          dados_bancarios?: Json | null
          id?: string
          mes_referencia?: number
          metodo_pagamento?: string
          processado_em?: string | null
          status?: string | null
          valor_bruto?: number
          valor_impostos?: number | null
          valor_liquido?: number
        }
        Relationships: [
          {
            foreignKeyName: "afiliados_pagamentos_afiliado_id_fkey"
            columns: ["afiliado_id"]
            isOneToOne: false
            referencedRelation: "afiliados"
            referencedColumns: ["id"]
          },
        ]
      }
      afiliados_vendas: {
        Row: {
          afiliado_id: string
          assinatura_id: string
          comissao_percentual: number
          comissao_status: string | null
          comissao_valor: number
          data_aprovacao: string | null
          data_pagamento: string | null
          data_venda: string | null
          empresa_id: string
          id: string
          ip_address: string | null
          periodicidade: string
          plano: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          valor_plano: number
        }
        Insert: {
          afiliado_id: string
          assinatura_id: string
          comissao_percentual: number
          comissao_status?: string | null
          comissao_valor: number
          data_aprovacao?: string | null
          data_pagamento?: string | null
          data_venda?: string | null
          empresa_id: string
          id?: string
          ip_address?: string | null
          periodicidade: string
          plano: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_plano: number
        }
        Update: {
          afiliado_id?: string
          assinatura_id?: string
          comissao_percentual?: number
          comissao_status?: string | null
          comissao_valor?: number
          data_aprovacao?: string | null
          data_pagamento?: string | null
          data_venda?: string | null
          empresa_id?: string
          id?: string
          ip_address?: string | null
          periodicidade?: string
          plano?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_plano?: number
        }
        Relationships: [
          {
            foreignKeyName: "afiliados_vendas_afiliado_id_fkey"
            columns: ["afiliado_id"]
            isOneToOne: false
            referencedRelation: "afiliados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afiliados_vendas_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afiliados_vendas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afiliados_vendas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_treinamento: {
        Row: {
          categoria: string
          created_at: string
          empresa_id: string | null
          id: string
          pergunta: string
          resposta: string
          updated_at: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          empresa_id?: string | null
          id?: string
          pergunta: string
          resposta: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          empresa_id?: string | null
          id?: string
          pergunta?: string
          resposta?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agente_treinamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agente_treinamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      ajustes_estoque: {
        Row: {
          criado_em: string
          empresa_id: string | null
          id: string
          motivo: string | null
          observacoes: string | null
          tipo: string
          valor_frete: number | null
          valor_total: number | null
        }
        Insert: {
          criado_em?: string
          empresa_id?: string | null
          id?: string
          motivo?: string | null
          observacoes?: string | null
          tipo: string
          valor_frete?: number | null
          valor_total?: number | null
        }
        Update: {
          criado_em?: string
          empresa_id?: string | null
          id?: string
          motivo?: string | null
          observacoes?: string | null
          tipo?: string
          valor_frete?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ajustes_estoque_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustes_estoque_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      ajustes_estoque_itens: {
        Row: {
          ajuste_id: string
          empresa_id: string | null
          id: string
          produto_id: string
          quantidade: number
          unidade: string | null
          valor_custo: number | null
          valor_total: number | null
        }
        Insert: {
          ajuste_id: string
          empresa_id?: string | null
          id?: string
          produto_id: string
          quantidade?: number
          unidade?: string | null
          valor_custo?: number | null
          valor_total?: number | null
        }
        Update: {
          ajuste_id?: string
          empresa_id?: string | null
          id?: string
          produto_id?: string
          quantidade?: number
          unidade?: string | null
          valor_custo?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ajustes_estoque_itens_ajuste_id_fkey"
            columns: ["ajuste_id"]
            isOneToOne: false
            referencedRelation: "ajustes_estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustes_estoque_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustes_estoque_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustes_estoque_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustes_estoque_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo_vitrine"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_conversas: {
        Row: {
          canal: string
          empresa_id: string | null
          id: string
          mensagem_usuario: string
          numero: string | null
          resolvido: boolean | null
          resposta_bot: string
          satisfacao: number | null
          tempo_resposta_ms: number | null
          timestamp: string | null
        }
        Insert: {
          canal: string
          empresa_id?: string | null
          id?: string
          mensagem_usuario: string
          numero?: string | null
          resolvido?: boolean | null
          resposta_bot: string
          satisfacao?: number | null
          tempo_resposta_ms?: number | null
          timestamp?: string | null
        }
        Update: {
          canal?: string
          empresa_id?: string | null
          id?: string
          mensagem_usuario?: string
          numero?: string | null
          resolvido?: boolean | null
          resposta_bot?: string
          satisfacao?: number | null
          tempo_resposta_ms?: number | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          atualizado_em: string | null
          criado_em: string | null
          cupom_codigo: string | null
          cupom_desconto: number | null
          data_cancelamento: string | null
          data_inicio: string
          empresa_id: string
          id: string
          periodicidade: string
          plano: string
          proxima_cobranca: string | null
          status: string
          trial_fim: string | null
          trial_inicio: string | null
          valor: number
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          atualizado_em?: string | null
          criado_em?: string | null
          cupom_codigo?: string | null
          cupom_desconto?: number | null
          data_cancelamento?: string | null
          data_inicio?: string
          empresa_id: string
          id?: string
          periodicidade?: string
          plano?: string
          proxima_cobranca?: string | null
          status?: string
          trial_fim?: string | null
          trial_inicio?: string | null
          valor?: number
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          atualizado_em?: string | null
          criado_em?: string | null
          cupom_codigo?: string | null
          cupom_desconto?: number | null
          data_cancelamento?: string | null
          data_inicio?: string
          empresa_id?: string
          id?: string
          periodicidade?: string
          plano?: string
          proxima_cobranca?: string | null
          status?: string
          trial_fim?: string | null
          trial_inicio?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      automacoes: {
        Row: {
          acoes: Json
          ativo: boolean | null
          condicoes: Json | null
          created_at: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          nome: string
          prioridade: number | null
          total_execucoes: number | null
          trigger_config: Json | null
          trigger_evento: string
          ultima_execucao: string | null
        }
        Insert: {
          acoes?: Json
          ativo?: boolean | null
          condicoes?: Json | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          prioridade?: number | null
          total_execucoes?: number | null
          trigger_config?: Json | null
          trigger_evento: string
          ultima_execucao?: string | null
        }
        Update: {
          acoes?: Json
          ativo?: boolean | null
          condicoes?: Json | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          prioridade?: number | null
          total_execucoes?: number | null
          trigger_config?: Json | null
          trigger_evento?: string
          ultima_execucao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_fornecedores: {
        Row: {
          atendimento: number | null
          comentario: string | null
          cumprimento_prazo: number | null
          data_avaliacao: string | null
          empresa_id: string | null
          fornecedor_id: string
          id: string
          pedido_compra_id: string | null
          preco_competitivo: number | null
          qualidade_produtos: number | null
        }
        Insert: {
          atendimento?: number | null
          comentario?: string | null
          cumprimento_prazo?: number | null
          data_avaliacao?: string | null
          empresa_id?: string | null
          fornecedor_id: string
          id?: string
          pedido_compra_id?: string | null
          preco_competitivo?: number | null
          qualidade_produtos?: number | null
        }
        Update: {
          atendimento?: number | null
          comentario?: string | null
          cumprimento_prazo?: number | null
          data_avaliacao?: string | null
          empresa_id?: string | null
          fornecedor_id?: string
          id?: string
          pedido_compra_id?: string | null
          preco_competitivo?: number | null
          qualidade_produtos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_fornecedores_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_fornecedores_pedido_compra_id_fkey"
            columns: ["pedido_compra_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_inventory: {
        Row: {
          branch_id: string
          empresa_id: string
          estoque_minimo: number
          id: string
          product_id: string
          quantidade: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          empresa_id: string
          estoque_minimo?: number
          id?: string
          product_id: string
          quantidade?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          empresa_id?: string
          estoque_minimo?: number
          id?: string
          product_id?: string
          quantidade?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_inventory_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_inventory_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo_vitrine"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_users: {
        Row: {
          branch_id: string
          created_at: string
          empresa_id: string
          id: string
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          empresa_id: string
          id?: string
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          empresa_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_users_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_users_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          ativo: boolean
          bairro: string | null
          celular: string | null
          cep: string | null
          cidade: string | null
          cnae_principal: string | null
          cnpj: string | null
          complemento: string | null
          created_at: string
          email: string | null
          empresa_id: string
          endereco: string | null
          estado: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          isenta_ie: boolean | null
          logradouro: string | null
          nome: string
          nome_fantasia: string | null
          numero: string | null
          razao_social: string | null
          regime_especial_tributacao: string | null
          regime_tributario: string | null
          site: string | null
          telefone: string | null
          tipo: string
          tipo_pessoa: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnae_principal?: string | null
          cnpj?: string | null
          complemento?: string | null
          created_at?: string
          email?: string | null
          empresa_id: string
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          isenta_ie?: boolean | null
          logradouro?: string | null
          nome: string
          nome_fantasia?: string | null
          numero?: string | null
          razao_social?: string | null
          regime_especial_tributacao?: string | null
          regime_tributario?: string | null
          site?: string | null
          telefone?: string | null
          tipo?: string
          tipo_pessoa?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnae_principal?: string | null
          cnpj?: string | null
          complemento?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          isenta_ie?: boolean | null
          logradouro?: string | null
          nome?: string
          nome_fantasia?: string | null
          numero?: string | null
          razao_social?: string | null
          regime_especial_tributacao?: string | null
          regime_tributario?: string | null
          site?: string | null
          telefone?: string | null
          tipo?: string
          tipo_pessoa?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      caixa_movimentacoes: {
        Row: {
          branch_id: string | null
          caixa_id: string
          criado_em: string
          empresa_id: string | null
          id: string
          observacoes: string | null
          tipo: string
          valor: number
        }
        Insert: {
          branch_id?: string | null
          caixa_id: string
          criado_em?: string
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          tipo: string
          valor?: number
        }
        Update: {
          branch_id?: string | null
          caixa_id?: string
          criado_em?: string
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "caixa_movimentacoes_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_movimentacoes_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      caixas: {
        Row: {
          aberto_em: string
          atualizado_em: string
          branch_id: string | null
          criado_em: string
          empresa_id: string | null
          fechado_em: string | null
          funcionario: string
          id: string
          loja: string
          observacoes: string | null
          saldo: number
          saldo_abertura: number
          saldo_fechamento: number | null
          status: string
        }
        Insert: {
          aberto_em?: string
          atualizado_em?: string
          branch_id?: string | null
          criado_em?: string
          empresa_id?: string | null
          fechado_em?: string | null
          funcionario?: string
          id?: string
          loja?: string
          observacoes?: string | null
          saldo?: number
          saldo_abertura?: number
          saldo_fechamento?: number | null
          status?: string
        }
        Update: {
          aberto_em?: string
          atualizado_em?: string
          branch_id?: string | null
          criado_em?: string
          empresa_id?: string | null
          fechado_em?: string | null
          funcionario?: string
          id?: string
          loja?: string
          observacoes?: string | null
          saldo?: number
          saldo_abertura?: number
          saldo_fechamento?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "caixas_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      canais_comunicacao: {
        Row: {
          ativo: boolean | null
          auto_resposta_ativa: boolean | null
          conectado: boolean | null
          configuracao: Json
          created_at: string | null
          dias_funcionamento: string[] | null
          empresa_id: string | null
          erro_conexao: string | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          mensagem_boas_vindas: string | null
          mensagem_fora_horario: string | null
          mensagem_horario_comercial: string | null
          nome_exibicao: string
          tipo: string
          ultimo_heartbeat: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          auto_resposta_ativa?: boolean | null
          conectado?: boolean | null
          configuracao?: Json
          created_at?: string | null
          dias_funcionamento?: string[] | null
          empresa_id?: string | null
          erro_conexao?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          mensagem_boas_vindas?: string | null
          mensagem_fora_horario?: string | null
          mensagem_horario_comercial?: string | null
          nome_exibicao: string
          tipo: string
          ultimo_heartbeat?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          auto_resposta_ativa?: boolean | null
          conectado?: boolean | null
          configuracao?: Json
          created_at?: string | null
          dias_funcionamento?: string[] | null
          empresa_id?: string | null
          erro_conexao?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          mensagem_boas_vindas?: string | null
          mensagem_fora_horario?: string | null
          mensagem_horario_comercial?: string | null
          nome_exibicao?: string
          tipo?: string
          ultimo_heartbeat?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canais_comunicacao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canais_comunicacao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogo_master: {
        Row: {
          aplicacoes: string[] | null
          categoria: string | null
          codigo: string | null
          codigo_barras: string | null
          created_at: string
          descricao: string | null
          fornecedor: string | null
          id: string
          imagem_url: string | null
          marca: string | null
          nome: string
          preco_custo: number | null
          unidade: string | null
        }
        Insert: {
          aplicacoes?: string[] | null
          categoria?: string | null
          codigo?: string | null
          codigo_barras?: string | null
          created_at?: string
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          imagem_url?: string | null
          marca?: string | null
          nome: string
          preco_custo?: number | null
          unidade?: string | null
        }
        Update: {
          aplicacoes?: string[] | null
          categoria?: string | null
          codigo?: string | null
          codigo_barras?: string | null
          created_at?: string
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          imagem_url?: string | null
          marca?: string | null
          nome?: string
          preco_custo?: number | null
          unidade?: string | null
        }
        Relationships: []
      }
      chatbot_fluxos: {
        Row: {
          ativo: boolean | null
          canais_ativos: string[] | null
          created_at: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          nome: string
          passos: Json
          prioridade: number | null
          taxa_conclusao: number | null
          total_execucoes: number | null
          trigger_config: Json | null
          trigger_tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          canais_ativos?: string[] | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          passos?: Json
          prioridade?: number | null
          taxa_conclusao?: number | null
          total_execucoes?: number | null
          trigger_config?: Json | null
          trigger_tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          canais_ativos?: string[] | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          passos?: Json
          prioridade?: number | null
          taxa_conclusao?: number | null
          total_execucoes?: number | null
          trigger_config?: Json | null
          trigger_tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_fluxos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_fluxos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          anexos: Json | null
          ativo: boolean | null
          bairro: string | null
          bloqueado: boolean | null
          branch_id: string | null
          cadastrado_em: string | null
          cadastrado_por: string | null
          categoria_cliente: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          codigo: number
          complemento: string | null
          consentimento_email: boolean | null
          consentimento_sms: boolean | null
          consentimento_whatsapp: boolean | null
          cpf: string | null
          created_at: string | null
          data_consentimento: string | null
          data_nascimento: string | null
          desconto_padrao: number | null
          dia_vencimento_preferido: number | null
          dias_medio_atraso: number | null
          email: string | null
          empresa_id: string | null
          estado: string | null
          facebook: string | null
          forma_pagamento_preferida: string | null
          foto_url: string | null
          genero: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          instagram: string | null
          limite_credito: number | null
          logradouro: string | null
          motivo_bloqueio: string | null
          nivel_fidelidade: string | null
          nome_completo: string | null
          nome_fantasia: string | null
          numero: string | null
          observacoes: string | null
          origem_cadastro: string | null
          pais: string | null
          placas: string[] | null
          pontos_acumulados: number | null
          primeira_compra: string | null
          razao_social: string | null
          rg: string | null
          score_pagamento: number | null
          tags: string[] | null
          telefone: string
          telefone_secundario: string | null
          ticket_medio: number | null
          tipo_pessoa: string
          total_compras: number | null
          total_gasto: number | null
          total_os: number | null
          ultima_compra: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          anexos?: Json | null
          ativo?: boolean | null
          bairro?: string | null
          bloqueado?: boolean | null
          branch_id?: string | null
          cadastrado_em?: string | null
          cadastrado_por?: string | null
          categoria_cliente?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          codigo?: number
          complemento?: string | null
          consentimento_email?: boolean | null
          consentimento_sms?: boolean | null
          consentimento_whatsapp?: boolean | null
          cpf?: string | null
          created_at?: string | null
          data_consentimento?: string | null
          data_nascimento?: string | null
          desconto_padrao?: number | null
          dia_vencimento_preferido?: number | null
          dias_medio_atraso?: number | null
          email?: string | null
          empresa_id?: string | null
          estado?: string | null
          facebook?: string | null
          forma_pagamento_preferida?: string | null
          foto_url?: string | null
          genero?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          instagram?: string | null
          limite_credito?: number | null
          logradouro?: string | null
          motivo_bloqueio?: string | null
          nivel_fidelidade?: string | null
          nome_completo?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          origem_cadastro?: string | null
          pais?: string | null
          placas?: string[] | null
          pontos_acumulados?: number | null
          primeira_compra?: string | null
          razao_social?: string | null
          rg?: string | null
          score_pagamento?: number | null
          tags?: string[] | null
          telefone: string
          telefone_secundario?: string | null
          ticket_medio?: number | null
          tipo_pessoa?: string
          total_compras?: number | null
          total_gasto?: number | null
          total_os?: number | null
          ultima_compra?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          anexos?: Json | null
          ativo?: boolean | null
          bairro?: string | null
          bloqueado?: boolean | null
          branch_id?: string | null
          cadastrado_em?: string | null
          cadastrado_por?: string | null
          categoria_cliente?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          codigo?: number
          complemento?: string | null
          consentimento_email?: boolean | null
          consentimento_sms?: boolean | null
          consentimento_whatsapp?: boolean | null
          cpf?: string | null
          created_at?: string | null
          data_consentimento?: string | null
          data_nascimento?: string | null
          desconto_padrao?: number | null
          dia_vencimento_preferido?: number | null
          dias_medio_atraso?: number | null
          email?: string | null
          empresa_id?: string | null
          estado?: string | null
          facebook?: string | null
          forma_pagamento_preferida?: string | null
          foto_url?: string | null
          genero?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          instagram?: string | null
          limite_credito?: number | null
          logradouro?: string | null
          motivo_bloqueio?: string | null
          nivel_fidelidade?: string | null
          nome_completo?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          origem_cadastro?: string | null
          pais?: string | null
          placas?: string[] | null
          pontos_acumulados?: number | null
          primeira_compra?: string | null
          razao_social?: string | null
          rg?: string | null
          score_pagamento?: number | null
          tags?: string[] | null
          telefone?: string
          telefone_secundario?: string | null
          ticket_medio?: number | null
          tipo_pessoa?: string
          total_compras?: number | null
          total_gasto?: number | null
          total_os?: number | null
          ultima_compra?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_fiscal: {
        Row: {
          atualizado_em: string
          bairro: string | null
          cep: string | null
          certificado_nome: string | null
          certificado_url: string | null
          certificado_validade: string | null
          cnpj: string | null
          complemento: string | null
          cpf_responsavel: string | null
          criado_em: string
          discrimina_impostos: boolean | null
          email: string | null
          empresa_id: string | null
          enviar_email_destinatario: boolean | null
          focusnfe_ambiente: string | null
          focusnfe_token: string | null
          id: string
          logradouro: string | null
          municipio: string | null
          nfe_habilitada: boolean | null
          nfe_inscricao_estadual: string | null
          nfe_proximo_numero: number | null
          nfe_serie: string | null
          nfse_habilitada: boolean | null
          nfse_inscricao_municipal: string | null
          nfse_login: string | null
          nfse_nacional_habilitada: boolean | null
          nfse_proximo_numero: number | null
          nfse_senha: string | null
          nfse_serie: string | null
          nome: string | null
          nome_fantasia: string | null
          numero: string | null
          regime_tributario: string | null
          telefone: string | null
          uf: string | null
        }
        Insert: {
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          certificado_nome?: string | null
          certificado_url?: string | null
          certificado_validade?: string | null
          cnpj?: string | null
          complemento?: string | null
          cpf_responsavel?: string | null
          criado_em?: string
          discrimina_impostos?: boolean | null
          email?: string | null
          empresa_id?: string | null
          enviar_email_destinatario?: boolean | null
          focusnfe_ambiente?: string | null
          focusnfe_token?: string | null
          id?: string
          logradouro?: string | null
          municipio?: string | null
          nfe_habilitada?: boolean | null
          nfe_inscricao_estadual?: string | null
          nfe_proximo_numero?: number | null
          nfe_serie?: string | null
          nfse_habilitada?: boolean | null
          nfse_inscricao_municipal?: string | null
          nfse_login?: string | null
          nfse_nacional_habilitada?: boolean | null
          nfse_proximo_numero?: number | null
          nfse_senha?: string | null
          nfse_serie?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          regime_tributario?: string | null
          telefone?: string | null
          uf?: string | null
        }
        Update: {
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          certificado_nome?: string | null
          certificado_url?: string | null
          certificado_validade?: string | null
          cnpj?: string | null
          complemento?: string | null
          cpf_responsavel?: string | null
          criado_em?: string
          discrimina_impostos?: boolean | null
          email?: string | null
          empresa_id?: string | null
          enviar_email_destinatario?: boolean | null
          focusnfe_ambiente?: string | null
          focusnfe_token?: string | null
          id?: string
          logradouro?: string | null
          municipio?: string | null
          nfe_habilitada?: boolean | null
          nfe_inscricao_estadual?: string | null
          nfe_proximo_numero?: number | null
          nfe_serie?: string | null
          nfse_habilitada?: boolean | null
          nfse_inscricao_municipal?: string | null
          nfse_login?: string | null
          nfse_nacional_habilitada?: boolean | null
          nfse_proximo_numero?: number | null
          nfse_senha?: string | null
          nfse_serie?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          regime_tributario?: string | null
          telefone?: string | null
          uf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracao_fiscal_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuracao_fiscal_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_loja: {
        Row: {
          atualizado_em: string
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string
          complemento: string | null
          criado_em: string
          email: string | null
          empresa_id: string | null
          estado: string | null
          id: string
          inscricao_estadual: string | null
          logradouro: string | null
          mensagem_cupom: string | null
          nome_fantasia: string
          numero: string | null
          operador_padrao: string | null
          prazo_troca_dias: number | null
          razao_social: string
          telefone: string
          telefone2: string | null
          website: string | null
        }
        Insert: {
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          complemento?: string | null
          criado_em?: string
          email?: string | null
          empresa_id?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          logradouro?: string | null
          mensagem_cupom?: string | null
          nome_fantasia?: string
          numero?: string | null
          operador_padrao?: string | null
          prazo_troca_dias?: number | null
          razao_social?: string
          telefone?: string
          telefone2?: string | null
          website?: string | null
        }
        Update: {
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          complemento?: string | null
          criado_em?: string
          email?: string | null
          empresa_id?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          logradouro?: string | null
          mensagem_cupom?: string | null
          nome_fantasia?: string
          numero?: string | null
          operador_padrao?: string | null
          prazo_troca_dias?: number | null
          razao_social?: string
          telefone?: string
          telefone2?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_loja_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuracoes_loja_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_bancarias: {
        Row: {
          agencia: string | null
          ativo: boolean | null
          atualizado_em: string
          banco: string | null
          conta: string | null
          criado_em: string
          empresa_id: string | null
          id: string
          nome: string
          saldo_inicial: number | null
          tipo: string | null
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean | null
          atualizado_em?: string
          banco?: string | null
          conta?: string | null
          criado_em?: string
          empresa_id?: string | null
          id?: string
          nome: string
          saldo_inicial?: number | null
          tipo?: string | null
        }
        Update: {
          agencia?: string | null
          ativo?: boolean | null
          atualizado_em?: string
          banco?: string | null
          conta?: string | null
          criado_em?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          saldo_inicial?: number | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_bancarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_bancarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas: {
        Row: {
          arquivada: boolean | null
          atendente_nome: string | null
          avaliacao_cliente: number | null
          canal_id: string
          canal_tipo: string
          cliente_id: string | null
          contato_avatar_url: string | null
          contato_externo_id: string
          contato_nome: string | null
          created_at: string | null
          empresa_id: string | null
          etapa_funil: string | null
          feedback_cliente: string | null
          id: string
          primeira_resposta_em: string | null
          prioridade: string | null
          probabilidade_venda: number | null
          resolvido_em: string | null
          status: string
          tags: string[] | null
          tempo_primeira_resposta_segundos: number | null
          tempo_total_atendimento_segundos: number | null
          tipo_solicitacao: string | null
          total_mensagens: number | null
          ultima_mensagem_de: string | null
          ultima_mensagem_em: string | null
          updated_at: string | null
          valor_estimado: number | null
        }
        Insert: {
          arquivada?: boolean | null
          atendente_nome?: string | null
          avaliacao_cliente?: number | null
          canal_id: string
          canal_tipo: string
          cliente_id?: string | null
          contato_avatar_url?: string | null
          contato_externo_id: string
          contato_nome?: string | null
          created_at?: string | null
          empresa_id?: string | null
          etapa_funil?: string | null
          feedback_cliente?: string | null
          id?: string
          primeira_resposta_em?: string | null
          prioridade?: string | null
          probabilidade_venda?: number | null
          resolvido_em?: string | null
          status?: string
          tags?: string[] | null
          tempo_primeira_resposta_segundos?: number | null
          tempo_total_atendimento_segundos?: number | null
          tipo_solicitacao?: string | null
          total_mensagens?: number | null
          ultima_mensagem_de?: string | null
          ultima_mensagem_em?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Update: {
          arquivada?: boolean | null
          atendente_nome?: string | null
          avaliacao_cliente?: number | null
          canal_id?: string
          canal_tipo?: string
          cliente_id?: string | null
          contato_avatar_url?: string | null
          contato_externo_id?: string
          contato_nome?: string | null
          created_at?: string | null
          empresa_id?: string | null
          etapa_funil?: string | null
          feedback_cliente?: string | null
          id?: string
          primeira_resposta_em?: string | null
          prioridade?: string | null
          probabilidade_venda?: number | null
          resolvido_em?: string | null
          status?: string
          tags?: string[] | null
          tempo_primeira_resposta_segundos?: number | null
          tempo_total_atendimento_segundos?: number | null
          tipo_solicitacao?: string | null
          total_mensagens?: number | null
          ultima_mensagem_de?: string | null
          ultima_mensagem_em?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversas_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canais_comunicacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas_whatsapp: {
        Row: {
          created_at: string | null
          empresa_id: string | null
          historico: Json | null
          id: string
          nome: string | null
          numero: string
          ultima_mensagem: string | null
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          historico?: Json | null
          id?: string
          nome?: string | null
          numero: string
          ultima_mensagem?: string | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
          historico?: Json | null
          id?: string
          nome?: string | null
          numero?: string
          ultima_mensagem?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversas_whatsapp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_whatsapp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacoes: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_envio: string | null
          data_resposta: string | null
          empresa_id: string | null
          fornecedor: string | null
          id: string
          observacoes: string | null
          status: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_envio?: string | null
          data_resposta?: string | null
          empresa_id?: string | null
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_envio?: string | null
          data_resposta?: string | null
          empresa_id?: string | null
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacoes_itens: {
        Row: {
          cotacao_id: string
          criado_em: string
          empresa_id: string | null
          id: string
          preco_unitario: number | null
          produto_id: string | null
          produto_nome: string
          quantidade: number
          unidade: string | null
        }
        Insert: {
          cotacao_id: string
          criado_em?: string
          empresa_id?: string | null
          id?: string
          preco_unitario?: number | null
          produto_id?: string | null
          produto_nome: string
          quantidade?: number
          unidade?: string | null
        }
        Update: {
          cotacao_id?: string
          criado_em?: string
          empresa_id?: string | null
          id?: string
          preco_unitario?: number | null
          produto_id?: string | null
          produto_nome?: string
          quantidade?: number
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_itens_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo_vitrine"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacoes_respostas: {
        Row: {
          aceita: boolean | null
          cotacao_id: string
          data_resposta: string | null
          empresa_id: string | null
          forma_pagamento: string | null
          fornecedor_id: string
          id: string
          observacoes: string | null
          prazo_entrega_dias: number
          validade_proposta_dias: number | null
          valor_total: number
        }
        Insert: {
          aceita?: boolean | null
          cotacao_id: string
          data_resposta?: string | null
          empresa_id?: string | null
          forma_pagamento?: string | null
          fornecedor_id: string
          id?: string
          observacoes?: string | null
          prazo_entrega_dias?: number
          validade_proposta_dias?: number | null
          valor_total?: number
        }
        Update: {
          aceita?: boolean | null
          cotacao_id?: string
          data_resposta?: string | null
          empresa_id?: string | null
          forma_pagamento?: string | null
          fornecedor_id?: string
          id?: string
          observacoes?: string | null
          prazo_entrega_dias?: number
          validade_proposta_dias?: number | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_respostas_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_respostas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_respostas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_respostas_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      cupons: {
        Row: {
          aplica_em: string[] | null
          ativo: boolean | null
          codigo: string
          created_at: string | null
          data_expiracao: string | null
          data_inicio: string
          descricao: string | null
          id: string
          max_usos: number | null
          primeiro_mes_apenas: boolean | null
          tipo_desconto: string
          usos_realizados: number | null
          valor_desconto: number
        }
        Insert: {
          aplica_em?: string[] | null
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          data_expiracao?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          max_usos?: number | null
          primeiro_mes_apenas?: boolean | null
          tipo_desconto?: string
          usos_realizados?: number | null
          valor_desconto?: number
        }
        Update: {
          aplica_em?: string[] | null
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          data_expiracao?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          max_usos?: number | null
          primeiro_mes_apenas?: boolean | null
          tipo_desconto?: string
          usos_realizados?: number | null
          valor_desconto?: number
        }
        Relationships: []
      }
      custo_homem_hora: {
        Row: {
          created_at: string
          descricao: string | null
          empresa_id: string | null
          id: string
          nome: string
          valor_hora: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          valor_hora?: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          valor_hora?: number
        }
        Relationships: [
          {
            foreignKeyName: "custo_homem_hora_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custo_homem_hora_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_clientes: {
        Row: {
          ativo: boolean
          atualizado_em: string
          cliente_id: string | null
          cpf: string | null
          criado_em: string
          email: string
          empresa_id: string | null
          id: string
          loja_id: string
          nome: string
          senha_hash: string
          telefone: string | null
          ultimo_login: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          cliente_id?: string | null
          cpf?: string | null
          criado_em?: string
          email: string
          empresa_id?: string | null
          id?: string
          loja_id: string
          nome: string
          senha_hash: string
          telefone?: string | null
          ultimo_login?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          cliente_id?: string | null
          cpf?: string | null
          criado_em?: string
          email?: string
          empresa_id?: string | null
          id?: string
          loja_id?: string
          nome?: string
          senha_hash?: string
          telefone?: string | null
          ultimo_login?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_clientes_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_config: {
        Row: {
          about_text: string | null
          branch_id: string | null
          business_hours: string | null
          config: Json
          empresa_id: string
          id: string
          maps_link: string | null
          primary_color: string | null
          roleta_ativa: boolean | null
          secondary_color: string | null
          updated_at: string | null
          use_matriz_institutional: boolean | null
          whatsapp: string | null
        }
        Insert: {
          about_text?: string | null
          branch_id?: string | null
          business_hours?: string | null
          config?: Json
          empresa_id: string
          id?: string
          maps_link?: string | null
          primary_color?: string | null
          roleta_ativa?: boolean | null
          secondary_color?: string | null
          updated_at?: string | null
          use_matriz_institutional?: boolean | null
          whatsapp?: string | null
        }
        Update: {
          about_text?: string | null
          branch_id?: string | null
          business_hours?: string | null
          config?: Json
          empresa_id?: string
          id?: string
          maps_link?: string | null
          primary_color?: string | null
          roleta_ativa?: boolean | null
          secondary_color?: string | null
          updated_at?: string | null
          use_matriz_institutional?: boolean | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_config_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_enderecos: {
        Row: {
          apelido: string | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          cliente_id: string
          complemento: string | null
          criado_em: string
          empresa_id: string | null
          estado: string | null
          id: string
          logradouro: string | null
          numero: string | null
          principal: boolean
        }
        Insert: {
          apelido?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cliente_id: string
          complemento?: string | null
          criado_em?: string
          empresa_id?: string | null
          estado?: string | null
          id?: string
          logradouro?: string | null
          numero?: string | null
          principal?: boolean
        }
        Update: {
          apelido?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cliente_id?: string
          complemento?: string | null
          criado_em?: string
          empresa_id?: string | null
          estado?: string | null
          id?: string
          logradouro?: string | null
          numero?: string | null
          principal?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_enderecos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_enderecos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_enderecos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_lojas: {
        Row: {
          ativa: boolean
          atualizado_em: string
          cor_primaria: string | null
          cor_secundaria: string | null
          criado_em: string
          desconto_pix: number
          empresa_id: string
          exibir_precos_sem_login: boolean
          exigir_login_compra: boolean
          facebook: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          max_parcelas: number
          nome_loja: string
          slug: string | null
          whatsapp: string | null
        }
        Insert: {
          ativa?: boolean
          atualizado_em?: string
          cor_primaria?: string | null
          cor_secundaria?: string | null
          criado_em?: string
          desconto_pix?: number
          empresa_id: string
          exibir_precos_sem_login?: boolean
          exigir_login_compra?: boolean
          facebook?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          max_parcelas?: number
          nome_loja?: string
          slug?: string | null
          whatsapp?: string | null
        }
        Update: {
          ativa?: boolean
          atualizado_em?: string
          cor_primaria?: string | null
          cor_secundaria?: string | null
          criado_em?: string
          desconto_pix?: number
          empresa_id?: string
          exibir_precos_sem_login?: boolean
          exigir_login_compra?: boolean
          facebook?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          max_parcelas?: number
          nome_loja?: string
          slug?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_lojas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_lojas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_pedidos: {
        Row: {
          atualizado_em: string
          cliente_id: string
          criado_em: string
          desconto: number
          empresa_id: string | null
          endereco_entrega: Json | null
          forma_pagamento: string | null
          frete: number
          id: string
          loja_id: string
          numero_pedido: number
          observacoes: string | null
          parcelas: number | null
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          atualizado_em?: string
          cliente_id: string
          criado_em?: string
          desconto?: number
          empresa_id?: string | null
          endereco_entrega?: Json | null
          forma_pagamento?: string | null
          frete?: number
          id?: string
          loja_id: string
          numero_pedido?: number
          observacoes?: string | null
          parcelas?: number | null
          status?: string
          subtotal?: number
          total?: number
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string
          criado_em?: string
          desconto?: number
          empresa_id?: string | null
          endereco_entrega?: Json | null
          forma_pagamento?: string | null
          frete?: number
          id?: string
          loja_id?: string
          numero_pedido?: number
          observacoes?: string | null
          parcelas?: number | null
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_pedidos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_pedidos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_pedidos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_pedidos_itens: {
        Row: {
          empresa_id: string | null
          id: string
          imagem_url: string | null
          nome_produto: string
          pedido_id: string
          preco_total: number
          preco_unitario: number
          produto_id: string | null
          quantidade: number
        }
        Insert: {
          empresa_id?: string | null
          id?: string
          imagem_url?: string | null
          nome_produto: string
          pedido_id: string
          preco_total?: number
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
        }
        Update: {
          empresa_id?: string | null
          id?: string
          imagem_url?: string | null
          nome_produto?: string
          pedido_id?: string
          preco_total?: number
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_pedidos_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_pedidos_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_pedidos_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_pedidos_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_pedidos_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo_vitrine"
            referencedColumns: ["id"]
          },
        ]
      }
      emissoes_fiscais: {
        Row: {
          atualizado_em: string
          chave_acesso: string | null
          criado_em: string
          dados_nfe: Json | null
          data_emissao: string
          destinatario: string | null
          destinatario_cnpj: string | null
          empresa_id: string | null
          erro_mensagem: string | null
          focusnfe_ref: string | null
          id: string
          motivo_cancelamento: string | null
          numero: string
          observacoes: string | null
          pdf_url: string | null
          qrcode_url: string | null
          status: string
          tipo: string
          url_danfe: string | null
          valor: number | null
          xml_url: string | null
        }
        Insert: {
          atualizado_em?: string
          chave_acesso?: string | null
          criado_em?: string
          dados_nfe?: Json | null
          data_emissao?: string
          destinatario?: string | null
          destinatario_cnpj?: string | null
          empresa_id?: string | null
          erro_mensagem?: string | null
          focusnfe_ref?: string | null
          id?: string
          motivo_cancelamento?: string | null
          numero: string
          observacoes?: string | null
          pdf_url?: string | null
          qrcode_url?: string | null
          status?: string
          tipo: string
          url_danfe?: string | null
          valor?: number | null
          xml_url?: string | null
        }
        Update: {
          atualizado_em?: string
          chave_acesso?: string | null
          criado_em?: string
          dados_nfe?: Json | null
          data_emissao?: string
          destinatario?: string | null
          destinatario_cnpj?: string | null
          empresa_id?: string | null
          erro_mensagem?: string | null
          focusnfe_ref?: string | null
          id?: string
          motivo_cancelamento?: string | null
          numero?: string
          observacoes?: string | null
          pdf_url?: string | null
          qrcode_url?: string | null
          status?: string
          tipo?: string
          url_danfe?: string | null
          valor?: number | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emissoes_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emissoes_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_produtos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          empresa_id: string
          estoque_minimo: number | null
          estoque_quantidade: number
          id: string
          localizacao: string | null
          preco_custo_custom: number | null
          precos_venda_custom: Json | null
          produto_catalogo_id: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          empresa_id: string
          estoque_minimo?: number | null
          estoque_quantidade?: number
          id?: string
          localizacao?: string | null
          preco_custo_custom?: number | null
          precos_venda_custom?: Json | null
          produto_catalogo_id: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          empresa_id?: string
          estoque_minimo?: number | null
          estoque_quantidade?: number
          id?: string
          localizacao?: string | null
          preco_custo_custom?: number | null
          precos_venda_custom?: Json | null
          produto_catalogo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_produtos_produto_catalogo_id_fkey"
            columns: ["produto_catalogo_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_produtos_produto_catalogo_id_fkey"
            columns: ["produto_catalogo_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo_vitrine"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          assinatura_id: string | null
          atualizado_em: string
          cnpj: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          criado_em: string
          email: string | null
          id: string
          logo_url: string | null
          max_usuarios: number
          nome: string
          nome_fantasia: string | null
          plano_ativo: string
          slug: string | null
          status: string
          telefone: string | null
          trial_expira_em: string | null
        }
        Insert: {
          assinatura_id?: string | null
          atualizado_em?: string
          cnpj?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          max_usuarios?: number
          nome: string
          nome_fantasia?: string | null
          plano_ativo?: string
          slug?: string | null
          status?: string
          telefone?: string | null
          trial_expira_em?: string | null
        }
        Update: {
          assinatura_id?: string | null
          atualizado_em?: string
          cnpj?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          max_usuarios?: number
          nome?: string
          nome_fantasia?: string | null
          plano_ativo?: string
          slug?: string | null
          status?: string
          telefone?: string | null
          trial_expira_em?: string | null
        }
        Relationships: []
      }
      empresas_brindes: {
        Row: {
          aplicado_em: string
          brinde_id: string
          empresa_id: string
          id: string
          nome_brinde: string
          quantidade_concedida: number
          status: string
          tipo_brinde: string
        }
        Insert: {
          aplicado_em?: string
          brinde_id: string
          empresa_id: string
          id?: string
          nome_brinde: string
          quantidade_concedida?: number
          status?: string
          tipo_brinde?: string
        }
        Update: {
          aplicado_em?: string
          brinde_id?: string
          empresa_id?: string
          id?: string
          nome_brinde?: string
          quantidade_concedida?: number
          status?: string
          tipo_brinde?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresas_brindes_brinde_id_fkey"
            columns: ["brinde_id"]
            isOneToOne: false
            referencedRelation: "produtos_brindes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_brindes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_brindes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      etiquetas_modelos: {
        Row: {
          altura_etiqueta_cm: number | null
          altura_mm: number | null
          atualizado_em: string
          colunas: number | null
          criado_em: string
          densidade_horizontal_cm: number | null
          densidade_vertical_cm: number | null
          descricao_topo: string | null
          empresa_id: string | null
          espaco_horizontal_mm: number | null
          espaco_vertical_mm: number | null
          exibir_codigo_barras: string | null
          exibir_codigo_interno: string | null
          exibir_numero_codigo_barras: string | null
          exibir_valor_produto: string | null
          fonte_etiqueta: string | null
          id: string
          largura_etiqueta_cm: number | null
          largura_mm: number | null
          limite_caracteres: number | null
          linhas: number | null
          margem_esquerda_mm: number | null
          margem_lateral_cm: number | null
          margem_superior_cm: number | null
          margem_superior_mm: number | null
          nome: string
          padrao_etiqueta: string | null
          posicao_codigo_barras: string | null
          tamanho_fonte: string | null
          tamanho_fonte_valor: string | null
          tamanho_pagina: string
        }
        Insert: {
          altura_etiqueta_cm?: number | null
          altura_mm?: number | null
          atualizado_em?: string
          colunas?: number | null
          criado_em?: string
          densidade_horizontal_cm?: number | null
          densidade_vertical_cm?: number | null
          descricao_topo?: string | null
          empresa_id?: string | null
          espaco_horizontal_mm?: number | null
          espaco_vertical_mm?: number | null
          exibir_codigo_barras?: string | null
          exibir_codigo_interno?: string | null
          exibir_numero_codigo_barras?: string | null
          exibir_valor_produto?: string | null
          fonte_etiqueta?: string | null
          id?: string
          largura_etiqueta_cm?: number | null
          largura_mm?: number | null
          limite_caracteres?: number | null
          linhas?: number | null
          margem_esquerda_mm?: number | null
          margem_lateral_cm?: number | null
          margem_superior_cm?: number | null
          margem_superior_mm?: number | null
          nome: string
          padrao_etiqueta?: string | null
          posicao_codigo_barras?: string | null
          tamanho_fonte?: string | null
          tamanho_fonte_valor?: string | null
          tamanho_pagina?: string
        }
        Update: {
          altura_etiqueta_cm?: number | null
          altura_mm?: number | null
          atualizado_em?: string
          colunas?: number | null
          criado_em?: string
          densidade_horizontal_cm?: number | null
          densidade_vertical_cm?: number | null
          descricao_topo?: string | null
          empresa_id?: string | null
          espaco_horizontal_mm?: number | null
          espaco_vertical_mm?: number | null
          exibir_codigo_barras?: string | null
          exibir_codigo_interno?: string | null
          exibir_numero_codigo_barras?: string | null
          exibir_valor_produto?: string | null
          fonte_etiqueta?: string | null
          id?: string
          largura_etiqueta_cm?: number | null
          largura_mm?: number | null
          limite_caracteres?: number | null
          linhas?: number | null
          margem_esquerda_mm?: number | null
          margem_lateral_cm?: number | null
          margem_superior_cm?: number | null
          margem_superior_mm?: number | null
          nome?: string
          padrao_etiqueta?: string | null
          posicao_codigo_barras?: string | null
          tamanho_fonte?: string | null
          tamanho_fonte_valor?: string | null
          tamanho_pagina?: string
        }
        Relationships: [
          {
            foreignKeyName: "etiquetas_modelos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etiquetas_modelos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_sistema: {
        Row: {
          categoria: string
          created_at: string | null
          dados: Json | null
          empresa_id: string | null
          evento: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          categoria?: string
          created_at?: string | null
          dados?: Json | null
          empresa_id?: string | null
          evento: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          dados?: Json | null
          empresa_id?: string | null
          evento?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_sistema_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_sistema_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      faturas: {
        Row: {
          asaas_boleto_url: string | null
          asaas_invoice_url: string | null
          asaas_payment_id: string | null
          asaas_pix_qrcode: string | null
          assinatura_id: string
          created_at: string | null
          data_emissao: string
          data_pagamento: string | null
          data_vencimento: string
          desconto: number | null
          empresa_id: string
          forma_pagamento: string | null
          id: string
          numero_fatura: string
          referencia_ano: number
          referencia_mes: number
          status: string
          valor: number
          valor_final: number
        }
        Insert: {
          asaas_boleto_url?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_pix_qrcode?: string | null
          assinatura_id: string
          created_at?: string | null
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento?: string
          desconto?: number | null
          empresa_id: string
          forma_pagamento?: string | null
          id?: string
          numero_fatura: string
          referencia_ano: number
          referencia_mes: number
          status?: string
          valor?: number
          valor_final?: number
        }
        Update: {
          asaas_boleto_url?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_pix_qrcode?: string | null
          assinatura_id?: string
          created_at?: string | null
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento?: string
          desconto?: number | null
          empresa_id?: string
          forma_pagamento?: string | null
          id?: string
          numero_fatura?: string
          referencia_ano?: number
          referencia_mes?: number
          status?: string
          valor?: number
          valor_final?: number
        }
        Relationships: [
          {
            foreignKeyName: "faturas_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faturas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faturas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      formas_pagamento: {
        Row: {
          ativo: boolean
          atualizado_em: string
          confirmacao_automatica: string | null
          conta_bancaria: string | null
          criado_em: string
          disponivel_pagamentos: boolean
          disponivel_pdv: boolean | null
          disponivel_recebimentos: boolean
          empresa_id: string | null
          gerar_boleto: boolean | null
          id: string
          intervalo_parcelas_dias: number | null
          juros_mora: number | null
          juros_multa: number | null
          max_parcelas: number | null
          modalidade: string | null
          nome: string
          primeira_parcela_dias: number | null
          taxa_banco: number | null
          taxa_operadora: number | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          confirmacao_automatica?: string | null
          conta_bancaria?: string | null
          criado_em?: string
          disponivel_pagamentos?: boolean
          disponivel_pdv?: boolean | null
          disponivel_recebimentos?: boolean
          empresa_id?: string | null
          gerar_boleto?: boolean | null
          id?: string
          intervalo_parcelas_dias?: number | null
          juros_mora?: number | null
          juros_multa?: number | null
          max_parcelas?: number | null
          modalidade?: string | null
          nome: string
          primeira_parcela_dias?: number | null
          taxa_banco?: number | null
          taxa_operadora?: number | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          confirmacao_automatica?: string | null
          conta_bancaria?: string | null
          criado_em?: string
          disponivel_pagamentos?: boolean
          disponivel_pdv?: boolean | null
          disponivel_recebimentos?: boolean
          empresa_id?: string | null
          gerar_boleto?: boolean | null
          id?: string
          intervalo_parcelas_dias?: number | null
          juros_mora?: number | null
          juros_multa?: number | null
          max_parcelas?: number | null
          modalidade?: string | null
          nome?: string
          primeira_parcela_dias?: number | null
          taxa_banco?: number | null
          taxa_operadora?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "formas_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formas_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          agencia: string | null
          ativo: boolean | null
          bairro: string | null
          banco: string | null
          branch_id: string | null
          catalogo_url: string | null
          categoria: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          condicao_pagamento: string | null
          conta: string | null
          contato_nome: string | null
          cpf: string | null
          created_at: string | null
          desconto_padrao: number | null
          email: string | null
          empresa_id: string | null
          estado: string | null
          forma_pagamento: string | null
          frete_tipo: string | null
          id: string
          inscricao_estadual: string | null
          logradouro: string | null
          nome_completo: string | null
          nome_fantasia: string | null
          nota_avaliacao: number | null
          numero: string | null
          observacoes: string | null
          pais: string | null
          pedido_minimo: number | null
          pix: string | null
          prazo_entrega_dias: number | null
          razao_social: string | null
          tags: string[] | null
          telefone: string
          telefone_secundario: string | null
          tipo_pessoa: string
          total_compras: number | null
          total_cotacoes: number | null
          total_gasto: number | null
          ultima_compra: string | null
          updated_at: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean | null
          bairro?: string | null
          banco?: string | null
          branch_id?: string | null
          catalogo_url?: string | null
          categoria?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          condicao_pagamento?: string | null
          conta?: string | null
          contato_nome?: string | null
          cpf?: string | null
          created_at?: string | null
          desconto_padrao?: number | null
          email?: string | null
          empresa_id?: string | null
          estado?: string | null
          forma_pagamento?: string | null
          frete_tipo?: string | null
          id?: string
          inscricao_estadual?: string | null
          logradouro?: string | null
          nome_completo?: string | null
          nome_fantasia?: string | null
          nota_avaliacao?: number | null
          numero?: string | null
          observacoes?: string | null
          pais?: string | null
          pedido_minimo?: number | null
          pix?: string | null
          prazo_entrega_dias?: number | null
          razao_social?: string | null
          tags?: string[] | null
          telefone: string
          telefone_secundario?: string | null
          tipo_pessoa?: string
          total_compras?: number | null
          total_cotacoes?: number | null
          total_gasto?: number | null
          ultima_compra?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          agencia?: string | null
          ativo?: boolean | null
          bairro?: string | null
          banco?: string | null
          branch_id?: string | null
          catalogo_url?: string | null
          categoria?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          condicao_pagamento?: string | null
          conta?: string | null
          contato_nome?: string | null
          cpf?: string | null
          created_at?: string | null
          desconto_padrao?: number | null
          email?: string | null
          empresa_id?: string | null
          estado?: string | null
          forma_pagamento?: string | null
          frete_tipo?: string | null
          id?: string
          inscricao_estadual?: string | null
          logradouro?: string | null
          nome_completo?: string | null
          nome_fantasia?: string | null
          nota_avaliacao?: number | null
          numero?: string | null
          observacoes?: string | null
          pais?: string | null
          pedido_minimo?: number | null
          pix?: string | null
          prazo_entrega_dias?: number | null
          razao_social?: string | null
          tags?: string[] | null
          telefone?: string
          telefone_secundario?: string | null
          tipo_pessoa?: string
          total_compras?: number | null
          total_cotacoes?: number | null
          total_gasto?: number | null
          ultima_compra?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          bairro: string | null
          branch_id: string | null
          cargo: string | null
          celular1: string | null
          celular2: string | null
          cep: string | null
          cidade_uf: string | null
          codigo_gerente: string | null
          comissao: number | null
          complemento: string | null
          cpf: string | null
          criado_em: string | null
          data_nascimento: string | null
          desconto_maximo: number | null
          dias_permitidos: string[] | null
          email: string | null
          empresa_id: string | null
          fim_almoco: string | null
          grupo_acesso: string | null
          habilitar_codigo_gerente: boolean | null
          hora_entrada: string | null
          hora_saida: string | null
          id: string
          inicio_almoco: string | null
          logradouro: string | null
          lojas: string[] | null
          nome: string
          numero: string | null
          observacoes: string | null
          permitir_acesso: boolean | null
          rg: string | null
          sexo: string | null
          situacao: string | null
          telefone: string | null
          telefone_fixo: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          bairro?: string | null
          branch_id?: string | null
          cargo?: string | null
          celular1?: string | null
          celular2?: string | null
          cep?: string | null
          cidade_uf?: string | null
          codigo_gerente?: string | null
          comissao?: number | null
          complemento?: string | null
          cpf?: string | null
          criado_em?: string | null
          data_nascimento?: string | null
          desconto_maximo?: number | null
          dias_permitidos?: string[] | null
          email?: string | null
          empresa_id?: string | null
          fim_almoco?: string | null
          grupo_acesso?: string | null
          habilitar_codigo_gerente?: boolean | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          inicio_almoco?: string | null
          logradouro?: string | null
          lojas?: string[] | null
          nome: string
          numero?: string | null
          observacoes?: string | null
          permitir_acesso?: boolean | null
          rg?: string | null
          sexo?: string | null
          situacao?: string | null
          telefone?: string | null
          telefone_fixo?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          bairro?: string | null
          branch_id?: string | null
          cargo?: string | null
          celular1?: string | null
          celular2?: string | null
          cep?: string | null
          cidade_uf?: string | null
          codigo_gerente?: string | null
          comissao?: number | null
          complemento?: string | null
          cpf?: string | null
          criado_em?: string | null
          data_nascimento?: string | null
          desconto_maximo?: number | null
          dias_permitidos?: string[] | null
          email?: string | null
          empresa_id?: string | null
          fim_almoco?: string | null
          grupo_acesso?: string | null
          habilitar_codigo_gerente?: boolean | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          inicio_almoco?: string | null
          logradouro?: string | null
          lojas?: string[] | null
          nome?: string
          numero?: string | null
          observacoes?: string | null
          permitir_acesso?: boolean | null
          rg?: string | null
          sexo?: string | null
          situacao?: string | null
          telefone?: string | null
          telefone_fixo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      import_queue: {
        Row: {
          criado_em: string
          empresa_id: string | null
          erro: string | null
          finalizado_em: string | null
          fornecedor: string
          id: string
          produtos_duplicados: number
          produtos_inseridos: number
          status: string
          total_produtos: number
        }
        Insert: {
          criado_em?: string
          empresa_id?: string | null
          erro?: string | null
          finalizado_em?: string | null
          fornecedor: string
          id?: string
          produtos_duplicados?: number
          produtos_inseridos?: number
          status?: string
          total_produtos?: number
        }
        Update: {
          criado_em?: string
          empresa_id?: string | null
          erro?: string | null
          finalizado_em?: string | null
          fornecedor?: string
          id?: string
          produtos_duplicados?: number
          produtos_inseridos?: number
          status?: string
          total_produtos?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_queue_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_queue_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cargo: string | null
          created_at: string | null
          email: string | null
          empresa: string | null
          empresa_id: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          responsavel: string | null
          score: number | null
          status: string | null
          tags: string[] | null
          telefone: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          responsavel?: string | null
          score?: number | null
          status?: string | null
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          responsavel?: string | null
          score?: number | null
          status?: string | null
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      log_auditoria: {
        Row: {
          acao: string
          criado_em: string
          detalhes: Json | null
          empresa_id: string | null
          entidade: string
          entidade_id: string | null
          id: string
        }
        Insert: {
          acao: string
          criado_em?: string
          detalhes?: Json | null
          empresa_id?: string | null
          entidade: string
          entidade_id?: string | null
          id?: string
        }
        Update: {
          acao?: string
          criado_em?: string
          detalhes?: Json | null
          empresa_id?: string | null
          entidade?: string
          entidade_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_devolucoes: {
        Row: {
          codigo_rastreio_retorno: string | null
          created_at: string | null
          data_coleta: string | null
          data_recebimento: string | null
          data_reembolso: string | null
          data_solicitacao: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          itens: Json | null
          marketplace: string
          motivo: string
          numero_pedido: string | null
          observacoes: string | null
          pedido_id: string | null
          status: string
          tipo: string
          transportadora_retorno: string | null
          updated_at: string | null
          valor_reembolso: number | null
        }
        Insert: {
          codigo_rastreio_retorno?: string | null
          created_at?: string | null
          data_coleta?: string | null
          data_recebimento?: string | null
          data_reembolso?: string | null
          data_solicitacao?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          itens?: Json | null
          marketplace: string
          motivo: string
          numero_pedido?: string | null
          observacoes?: string | null
          pedido_id?: string | null
          status?: string
          tipo?: string
          transportadora_retorno?: string | null
          updated_at?: string | null
          valor_reembolso?: number | null
        }
        Update: {
          codigo_rastreio_retorno?: string | null
          created_at?: string | null
          data_coleta?: string | null
          data_recebimento?: string | null
          data_reembolso?: string | null
          data_solicitacao?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          itens?: Json | null
          marketplace?: string
          motivo?: string
          numero_pedido?: string | null
          observacoes?: string | null
          pedido_id?: string | null
          status?: string
          tipo?: string
          transportadora_retorno?: string | null
          updated_at?: string | null
          valor_reembolso?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_devolucoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_devolucoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_devolucoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "marketplace_pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_integracoes: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          credenciais: Json
          empresa_id: string | null
          erro_sincronizacao: string | null
          id: string
          marketplace: string
          markup_marketplace: number | null
          sincronizar_estoque: boolean | null
          sincronizar_pedidos: boolean | null
          sincronizar_precos: boolean | null
          ultima_sincronizacao: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          credenciais?: Json
          empresa_id?: string | null
          erro_sincronizacao?: string | null
          id?: string
          marketplace: string
          markup_marketplace?: number | null
          sincronizar_estoque?: boolean | null
          sincronizar_pedidos?: boolean | null
          sincronizar_precos?: boolean | null
          ultima_sincronizacao?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          credenciais?: Json
          empresa_id?: string | null
          erro_sincronizacao?: string | null
          id?: string
          marketplace?: string
          markup_marketplace?: number | null
          sincronizar_estoque?: boolean | null
          sincronizar_pedidos?: boolean | null
          sincronizar_precos?: boolean | null
          ultima_sincronizacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_integracoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_integracoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_pedidos: {
        Row: {
          bairro: string
          cep: string
          cidade: string
          cliente_cpf_cnpj: string | null
          cliente_email: string | null
          cliente_nome: string
          cliente_telefone: string | null
          codigo_rastreio: string | null
          complemento: string | null
          created_at: string | null
          data_entrega: string | null
          data_envio: string | null
          data_pedido: string
          empresa_id: string | null
          erro_detalhe: string | null
          estado: string
          id: string
          integracao_id: string
          itens: Json
          logradouro: string
          marketplace: string
          nfe_chave: string | null
          nfe_url: string | null
          numero: string
          numero_pedido: string
          pedido_externo_id: string
          percentual_comissao: number | null
          sincronizado_estoque: boolean | null
          sincronizado_financeiro: boolean | null
          status: string
          sub_status: string | null
          taxa_marketplace: number | null
          transportadora: string | null
          updated_at: string | null
          valor_frete: number | null
          valor_produtos: number
          valor_total: number
        }
        Insert: {
          bairro: string
          cep: string
          cidade: string
          cliente_cpf_cnpj?: string | null
          cliente_email?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          codigo_rastreio?: string | null
          complemento?: string | null
          created_at?: string | null
          data_entrega?: string | null
          data_envio?: string | null
          data_pedido: string
          empresa_id?: string | null
          erro_detalhe?: string | null
          estado: string
          id?: string
          integracao_id: string
          itens?: Json
          logradouro: string
          marketplace: string
          nfe_chave?: string | null
          nfe_url?: string | null
          numero: string
          numero_pedido: string
          pedido_externo_id: string
          percentual_comissao?: number | null
          sincronizado_estoque?: boolean | null
          sincronizado_financeiro?: boolean | null
          status: string
          sub_status?: string | null
          taxa_marketplace?: number | null
          transportadora?: string | null
          updated_at?: string | null
          valor_frete?: number | null
          valor_produtos: number
          valor_total: number
        }
        Update: {
          bairro?: string
          cep?: string
          cidade?: string
          cliente_cpf_cnpj?: string | null
          cliente_email?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          codigo_rastreio?: string | null
          complemento?: string | null
          created_at?: string | null
          data_entrega?: string | null
          data_envio?: string | null
          data_pedido?: string
          empresa_id?: string | null
          erro_detalhe?: string | null
          estado?: string
          id?: string
          integracao_id?: string
          itens?: Json
          logradouro?: string
          marketplace?: string
          nfe_chave?: string | null
          nfe_url?: string | null
          numero?: string
          numero_pedido?: string
          pedido_externo_id?: string
          percentual_comissao?: number | null
          sincronizado_estoque?: boolean | null
          sincronizado_financeiro?: boolean | null
          status?: string
          sub_status?: string | null
          taxa_marketplace?: number | null
          transportadora?: string | null
          updated_at?: string | null
          valor_frete?: number | null
          valor_produtos?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_pedidos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_pedidos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_pedidos_integracao_id_fkey"
            columns: ["integracao_id"]
            isOneToOne: false
            referencedRelation: "marketplace_integracoes"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_produtos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          canal: string
          criado_em: string
          empresa_id: string | null
          id: string
          margem: number
          preco: number
          produto_id: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          canal: string
          criado_em?: string
          empresa_id?: string | null
          id?: string
          margem?: number
          preco?: number
          produto_id: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          canal?: string
          criado_em?: string
          empresa_id?: string | null
          id?: string
          margem?: number
          preco?: number
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo_vitrine"
            referencedColumns: ["id"]
          },
        ]
      }
      membros_equipe: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          cargo: string | null
          created_at: string | null
          email: string | null
          empresa_id: string | null
          id: string
          nome: string
          permissoes: string[] | null
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          permissoes?: string[] | null
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          permissoes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "membros_equipe_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membros_equipe_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          confianca_ia: number | null
          conteudo: string | null
          conversa_id: string
          created_at: string | null
          empresa_id: string | null
          erro_envio: string | null
          id: string
          id_externo: string | null
          intencao_detectada: string | null
          mensagem_resposta_id: string | null
          metadata: Json | null
          midia_tamanho_bytes: number | null
          midia_tipo: string | null
          midia_url: string | null
          sentimento: string | null
          status_envio: string | null
          tipo_mensagem: string
          tipo_remetente: string
          usuario_nome: string | null
        }
        Insert: {
          confianca_ia?: number | null
          conteudo?: string | null
          conversa_id: string
          created_at?: string | null
          empresa_id?: string | null
          erro_envio?: string | null
          id?: string
          id_externo?: string | null
          intencao_detectada?: string | null
          mensagem_resposta_id?: string | null
          metadata?: Json | null
          midia_tamanho_bytes?: number | null
          midia_tipo?: string | null
          midia_url?: string | null
          sentimento?: string | null
          status_envio?: string | null
          tipo_mensagem: string
          tipo_remetente: string
          usuario_nome?: string | null
        }
        Update: {
          confianca_ia?: number | null
          conteudo?: string | null
          conversa_id?: string
          created_at?: string | null
          empresa_id?: string | null
          erro_envio?: string | null
          id?: string
          id_externo?: string | null
          intencao_detectada?: string | null
          mensagem_resposta_id?: string | null
          metadata?: Json | null
          midia_tamanho_bytes?: number | null
          midia_tipo?: string | null
          midia_url?: string | null
          sentimento?: string | null
          status_envio?: string | null
          tipo_mensagem?: string
          tipo_remetente?: string
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_mensagem_resposta_id_fkey"
            columns: ["mensagem_resposta_id"]
            isOneToOne: false
            referencedRelation: "mensagens"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_mensais: {
        Row: {
          ano: number
          arpu: number
          arr: number
          churn_rate: number
          clientes_cancelados: number
          created_at: string | null
          id: string
          ltv: number
          mes: number
          mrr: number
          novos_clientes: number
          total_clientes: number
        }
        Insert: {
          ano: number
          arpu?: number
          arr?: number
          churn_rate?: number
          clientes_cancelados?: number
          created_at?: string | null
          id?: string
          ltv?: number
          mes: number
          mrr?: number
          novos_clientes?: number
          total_clientes?: number
        }
        Update: {
          ano?: number
          arpu?: number
          arr?: number
          churn_rate?: number
          clientes_cancelados?: number
          created_at?: string | null
          id?: string
          ltv?: number
          mes?: number
          mrr?: number
          novos_clientes?: number
          total_clientes?: number
        }
        Relationships: []
      }
      movimentacoes_financeiras: {
        Row: {
          atualizado_em: string
          branch_id: string | null
          centro_custo: string | null
          criado_em: string
          data_competencia: string | null
          data_movimentacao: string
          data_vencimento: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          observacoes: string | null
          plano_conta_id: string
          tipo: string
          valor: number
        }
        Insert: {
          atualizado_em?: string
          branch_id?: string | null
          centro_custo?: string | null
          criado_em?: string
          data_competencia?: string | null
          data_movimentacao?: string
          data_vencimento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          plano_conta_id: string
          tipo?: string
          valor?: number
        }
        Update: {
          atualizado_em?: string
          branch_id?: string | null
          centro_custo?: string | null
          criado_em?: string
          data_competencia?: string | null
          data_movimentacao?: string
          data_vencimento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          plano_conta_id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_financeiras_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_financeiras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_financeiras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_financeiras_plano_conta_id_fkey"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      negocios: {
        Row: {
          created_at: string | null
          data_previsao_fechamento: string | null
          empresa_id: string | null
          etapa_id: string
          id: string
          lead_id: string | null
          motivo_perda: string | null
          notas: string | null
          pipeline_id: string
          probabilidade: number | null
          responsavel: string | null
          status: string | null
          tags: string[] | null
          titulo: string
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data_previsao_fechamento?: string | null
          empresa_id?: string | null
          etapa_id: string
          id?: string
          lead_id?: string | null
          motivo_perda?: string | null
          notas?: string | null
          pipeline_id: string
          probabilidade?: number | null
          responsavel?: string | null
          status?: string | null
          tags?: string[] | null
          titulo: string
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data_previsao_fechamento?: string | null
          empresa_id?: string | null
          etapa_id?: string
          id?: string
          lead_id?: string | null
          motivo_perda?: string | null
          notas?: string | null
          pipeline_id?: string
          probabilidade?: number | null
          responsavel?: string | null
          status?: string | null
          tags?: string[] | null
          titulo?: string
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "negocios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "pipeline_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          atualizado_em: string | null
          base_calculo_icms: number | null
          cancelada: boolean | null
          cancelada_em: string | null
          chave_acesso: string | null
          criado_em: string | null
          danfe_url: string | null
          data_autorizacao: string | null
          destinatario_cpf_cnpj: string | null
          destinatario_email: string | null
          destinatario_nome: string | null
          destinatario_tipo: string | null
          empresa_id: string
          id: string
          informacoes_adicionais: string | null
          integration_id: string | null
          motivo_cancelamento: string | null
          numero_nota: number
          observacoes: string | null
          ordem_servico_id: string | null
          pdf_url: string | null
          processing_detail: Json | null
          protocolo_autorizacao: string | null
          protocolo_cancelamento: string | null
          serie: string
          spedy_nota_id: string | null
          spedy_status: string | null
          status: string
          tipo_nota: string
          valor_cofins: number | null
          valor_desconto: number | null
          valor_frete: number | null
          valor_icms: number | null
          valor_iss: number | null
          valor_pis: number | null
          valor_produtos: number
          valor_servicos: number | null
          valor_total: number
          venda_id: string | null
          xml_url: string | null
        }
        Insert: {
          atualizado_em?: string | null
          base_calculo_icms?: number | null
          cancelada?: boolean | null
          cancelada_em?: string | null
          chave_acesso?: string | null
          criado_em?: string | null
          danfe_url?: string | null
          data_autorizacao?: string | null
          destinatario_cpf_cnpj?: string | null
          destinatario_email?: string | null
          destinatario_nome?: string | null
          destinatario_tipo?: string | null
          empresa_id: string
          id?: string
          informacoes_adicionais?: string | null
          integration_id?: string | null
          motivo_cancelamento?: string | null
          numero_nota: number
          observacoes?: string | null
          ordem_servico_id?: string | null
          pdf_url?: string | null
          processing_detail?: Json | null
          protocolo_autorizacao?: string | null
          protocolo_cancelamento?: string | null
          serie: string
          spedy_nota_id?: string | null
          spedy_status?: string | null
          status?: string
          tipo_nota: string
          valor_cofins?: number | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_icms?: number | null
          valor_iss?: number | null
          valor_pis?: number | null
          valor_produtos?: number
          valor_servicos?: number | null
          valor_total?: number
          venda_id?: string | null
          xml_url?: string | null
        }
        Update: {
          atualizado_em?: string | null
          base_calculo_icms?: number | null
          cancelada?: boolean | null
          cancelada_em?: string | null
          chave_acesso?: string | null
          criado_em?: string | null
          danfe_url?: string | null
          data_autorizacao?: string | null
          destinatario_cpf_cnpj?: string | null
          destinatario_email?: string | null
          destinatario_nome?: string | null
          destinatario_tipo?: string | null
          empresa_id?: string
          id?: string
          informacoes_adicionais?: string | null
          integration_id?: string | null
          motivo_cancelamento?: string | null
          numero_nota?: number
          observacoes?: string | null
          ordem_servico_id?: string | null
          pdf_url?: string | null
          processing_detail?: Json | null
          protocolo_autorizacao?: string | null
          protocolo_cancelamento?: string | null
          serie?: string
          spedy_nota_id?: string | null
          spedy_status?: string | null
          status?: string
          tipo_nota?: string
          valor_cofins?: number | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_icms?: number | null
          valor_iss?: number | null
          valor_pis?: number | null
          valor_produtos?: number
          valor_servicos?: number | null
          valor_total?: number
          venda_id?: string | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais_itens: {
        Row: {
          aliquota_cofins: number | null
          aliquota_icms: number | null
          aliquota_iss: number | null
          aliquota_pis: number | null
          cfop: string
          codigo: string | null
          codigo_servico: string | null
          criado_em: string | null
          cst_cofins: string | null
          cst_icms: string | null
          cst_pis: string | null
          descricao: string
          id: string
          ncm: string | null
          nota_fiscal_id: string
          numero_item: number
          origem_mercadoria: string | null
          produto_id: string | null
          quantidade: number
          servico_id: string | null
          tipo: string
          unidade: string | null
          valor_cofins: number | null
          valor_desconto: number | null
          valor_icms: number | null
          valor_iss: number | null
          valor_pis: number | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          aliquota_cofins?: number | null
          aliquota_icms?: number | null
          aliquota_iss?: number | null
          aliquota_pis?: number | null
          cfop: string
          codigo?: string | null
          codigo_servico?: string | null
          criado_em?: string | null
          cst_cofins?: string | null
          cst_icms?: string | null
          cst_pis?: string | null
          descricao: string
          id?: string
          ncm?: string | null
          nota_fiscal_id: string
          numero_item: number
          origem_mercadoria?: string | null
          produto_id?: string | null
          quantidade: number
          servico_id?: string | null
          tipo: string
          unidade?: string | null
          valor_cofins?: number | null
          valor_desconto?: number | null
          valor_icms?: number | null
          valor_iss?: number | null
          valor_pis?: number | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          aliquota_cofins?: number | null
          aliquota_icms?: number | null
          aliquota_iss?: number | null
          aliquota_pis?: number | null
          cfop?: string
          codigo?: string | null
          codigo_servico?: string | null
          criado_em?: string | null
          cst_cofins?: string | null
          cst_icms?: string | null
          cst_pis?: string | null
          descricao?: string
          id?: string
          ncm?: string | null
          nota_fiscal_id?: string
          numero_item?: number
          origem_mercadoria?: string | null
          produto_id?: string | null
          quantidade?: number
          servico_id?: string | null
          tipo?: string
          unidade?: string | null
          valor_cofins?: number | null
          valor_desconto?: number | null
          valor_icms?: number | null
          valor_iss?: number | null
          valor_pis?: number | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_itens_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          atualizado_em: string
          branch_id: string | null
          canal_venda: string | null
          cliente_id: string | null
          cliente_nome: string | null
          comissao: number | null
          comissao_parceiro: number | null
          criado_em: string
          data_orcamento: string
          desconto: number | null
          desconto_percentual: number | null
          desconto_valor: number | null
          empresa_id: string | null
          endereco_entrega: string | null
          forma_pagamento: string | null
          id: string
          introducao: string | null
          nro_pedido_cli: string | null
          numero: number
          observacoes: string | null
          observacoes_internas: string | null
          observacoes_padrao: string | null
          parceiro: string | null
          parcelas: number | null
          prazo_entrega: string | null
          situacao: string
          transportadora: string | null
          usar_endereco_entrega: boolean | null
          validade: string | null
          valor_frete: number | null
          valor_produtos: number | null
          valor_servicos: number | null
          valor_total: number
          vendedor_id: string | null
          vendedor_nome: string | null
        }
        Insert: {
          atualizado_em?: string
          branch_id?: string | null
          canal_venda?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          comissao?: number | null
          comissao_parceiro?: number | null
          criado_em?: string
          data_orcamento?: string
          desconto?: number | null
          desconto_percentual?: number | null
          desconto_valor?: number | null
          empresa_id?: string | null
          endereco_entrega?: string | null
          forma_pagamento?: string | null
          id?: string
          introducao?: string | null
          nro_pedido_cli?: string | null
          numero?: number
          observacoes?: string | null
          observacoes_internas?: string | null
          observacoes_padrao?: string | null
          parceiro?: string | null
          parcelas?: number | null
          prazo_entrega?: string | null
          situacao?: string
          transportadora?: string | null
          usar_endereco_entrega?: boolean | null
          validade?: string | null
          valor_frete?: number | null
          valor_produtos?: number | null
          valor_servicos?: number | null
          valor_total?: number
          vendedor_id?: string | null
          vendedor_nome?: string | null
        }
        Update: {
          atualizado_em?: string
          branch_id?: string | null
          canal_venda?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          comissao?: number | null
          comissao_parceiro?: number | null
          criado_em?: string
          data_orcamento?: string
          desconto?: number | null
          desconto_percentual?: number | null
          desconto_valor?: number | null
          empresa_id?: string | null
          endereco_entrega?: string | null
          forma_pagamento?: string | null
          id?: string
          introducao?: string | null
          nro_pedido_cli?: string | null
          numero?: number
          observacoes?: string | null
          observacoes_internas?: string | null
          observacoes_padrao?: string | null
          parceiro?: string | null
          parcelas?: number | null
          prazo_entrega?: string | null
          situacao?: string
          transportadora?: string | null
          usar_endereco_entrega?: boolean | null
          validade?: string | null
          valor_frete?: number | null
          valor_produtos?: number | null
          valor_servicos?: number | null
          valor_total?: number
          vendedor_id?: string | null
          vendedor_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos_itens: {
        Row: {
          desconto: number | null
          empresa_id: string | null
          id: string
          observacoes: string | null
          orcamento_id: string
          produto_id: string | null
          produto_nome: string
          quantidade: number
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          desconto?: number | null
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          orcamento_id: string
          produto_id?: string | null
          produto_nome: string
          quantidade?: number
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          desconto?: number | null
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          orcamento_id?: string
          produto_id?: string | null
          produto_nome?: string
          quantidade?: number
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo_vitrine"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos_servicos: {
        Row: {
          desconto: number | null
          detalhes: string | null
          empresa_id: string | null
          id: string
          orcamento_id: string
          quantidade: number
          servico_nome: string
          subtotal: number
          valor: number
        }
        Insert: {
          desconto?: number | null
          detalhes?: string | null
          empresa_id?: string | null
          id?: string
          orcamento_id: string
          quantidade?: number
          servico_nome: string
          subtotal?: number
          valor?: number
        }
        Update: {
          desconto?: number | null
          detalhes?: string | null
          empresa_id?: string | null
          id?: string
          orcamento_id?: string
          quantidade?: number
          servico_nome?: string
          subtotal?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_servicos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_servicos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_servicos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordem_servico: {
        Row: {
          acessorios: string | null
          branch_id: string | null
          canal_venda: string | null
          centro_custo: string | null
          checklist_revisao: Json | null
          cliente_nome: string | null
          cliente_telefone: string | null
          condicoes: string | null
          created_at: string
          criado_por: string | null
          data_conclusao: string | null
          data_entrada: string
          data_prevista_conclusao: string | null
          defeito_relatado: string | null
          empresa_id: string | null
          id: string
          km_entrada: number | null
          km_ultima_revisao: number | null
          nivel_combustivel: string | null
          numero_os: string
          observacoes: string | null
          observacoes_checkin: string | null
          observacoes_internas: string | null
          oleo_recomendado: string | null
          placa: string | null
          prioridade: string
          solucao: string | null
          status: string
          tecnico_responsavel: string | null
          ultima_troca_oleo: string | null
          updated_at: string
          valor_desconto: number | null
          valor_frete: number | null
          valor_outros: number | null
          valor_total: number | null
          valor_total_pecas: number | null
          valor_total_servicos: number | null
          veiculo_ano: string | null
          veiculo_chassi: string | null
          veiculo_cor: string | null
          veiculo_marca: string | null
          veiculo_modelo: string | null
          vendedor: string | null
        }
        Insert: {
          acessorios?: string | null
          branch_id?: string | null
          canal_venda?: string | null
          centro_custo?: string | null
          checklist_revisao?: Json | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          condicoes?: string | null
          created_at?: string
          criado_por?: string | null
          data_conclusao?: string | null
          data_entrada?: string
          data_prevista_conclusao?: string | null
          defeito_relatado?: string | null
          empresa_id?: string | null
          id?: string
          km_entrada?: number | null
          km_ultima_revisao?: number | null
          nivel_combustivel?: string | null
          numero_os: string
          observacoes?: string | null
          observacoes_checkin?: string | null
          observacoes_internas?: string | null
          oleo_recomendado?: string | null
          placa?: string | null
          prioridade?: string
          solucao?: string | null
          status?: string
          tecnico_responsavel?: string | null
          ultima_troca_oleo?: string | null
          updated_at?: string
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_outros?: number | null
          valor_total?: number | null
          valor_total_pecas?: number | null
          valor_total_servicos?: number | null
          veiculo_ano?: string | null
          veiculo_chassi?: string | null
          veiculo_cor?: string | null
          veiculo_marca?: string | null
          veiculo_modelo?: string | null
          vendedor?: string | null
        }
        Update: {
          acessorios?: string | null
          branch_id?: string | null
          canal_venda?: string | null
          centro_custo?: string | null
          checklist_revisao?: Json | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          condicoes?: string | null
          created_at?: string
          criado_por?: string | null
          data_conclusao?: string | null
          data_entrada?: string
          data_prevista_conclusao?: string | null
          defeito_relatado?: string | null
          empresa_id?: string | null
          id?: string
          km_entrada?: number | null
          km_ultima_revisao?: number | null
          nivel_combustivel?: string | null
          numero_os?: string
          observacoes?: string | null
          observacoes_checkin?: string | null
          observacoes_internas?: string | null
          oleo_recomendado?: string | null
          placa?: string | null
          prioridade?: string
          solucao?: string | null
          status?: string
          tecnico_responsavel?: string | null
          ultima_troca_oleo?: string | null
          updated_at?: string
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_outros?: number | null
          valor_total?: number | null
          valor_total_pecas?: number | null
          valor_total_servicos?: number | null
          veiculo_ano?: string | null
          veiculo_chassi?: string | null
          veiculo_cor?: string | null
          veiculo_marca?: string | null
          veiculo_modelo?: string | null
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordem_servico_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordem_servico_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordem_servico_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      os_itens: {
        Row: {
          codigo: string | null
          created_at: string
          desconto: number | null
          descricao: string
          detalhes: string | null
          empresa_id: string | null
          id: string
          os_id: string
          quantidade: number
          status: string
          subtotal: number
          tecnico: string | null
          tipo: string
          valor_unitario: number
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          desconto?: number | null
          descricao: string
          detalhes?: string | null
          empresa_id?: string | null
          id?: string
          os_id: string
          quantidade?: number
          status?: string
          subtotal?: number
          tecnico?: string | null
          tipo?: string
          valor_unitario?: number
        }
        Update: {
          codigo?: string | null
          created_at?: string
          desconto?: number | null
          descricao?: string
          detalhes?: string | null
          empresa_id?: string | null
          id?: string
          os_id?: string
          quantidade?: number
          status?: string
          subtotal?: number
          tecnico?: string | null
          tipo?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "os_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_itens_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordem_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_compra: {
        Row: {
          codigo_rastreio: string | null
          condicao_pagamento: string | null
          created_at: string | null
          data_entrega_real: string | null
          data_pedido: string | null
          data_prevista_entrega: string | null
          data_recebimento: string | null
          empresa_id: string | null
          forma_pagamento: string
          fornecedor_id: string
          id: string
          nfe_fornecedor_chave: string | null
          nfe_fornecedor_numero: string | null
          nfe_fornecedor_url: string | null
          numero_pedido: string
          observacoes: string | null
          observacoes_recebimento: string | null
          status: string
          subtotal: number
          transportadora: string | null
          updated_at: string | null
          valor_desconto: number | null
          valor_frete: number | null
          valor_total: number
        }
        Insert: {
          codigo_rastreio?: string | null
          condicao_pagamento?: string | null
          created_at?: string | null
          data_entrega_real?: string | null
          data_pedido?: string | null
          data_prevista_entrega?: string | null
          data_recebimento?: string | null
          empresa_id?: string | null
          forma_pagamento?: string
          fornecedor_id: string
          id?: string
          nfe_fornecedor_chave?: string | null
          nfe_fornecedor_numero?: string | null
          nfe_fornecedor_url?: string | null
          numero_pedido: string
          observacoes?: string | null
          observacoes_recebimento?: string | null
          status?: string
          subtotal?: number
          transportadora?: string | null
          updated_at?: string | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_total?: number
        }
        Update: {
          codigo_rastreio?: string | null
          condicao_pagamento?: string | null
          created_at?: string | null
          data_entrega_real?: string | null
          data_pedido?: string | null
          data_prevista_entrega?: string | null
          data_recebimento?: string | null
          empresa_id?: string | null
          forma_pagamento?: string
          fornecedor_id?: string
          id?: string
          nfe_fornecedor_chave?: string | null
          nfe_fornecedor_numero?: string | null
          nfe_fornecedor_url?: string | null
          numero_pedido?: string
          observacoes?: string | null
          observacoes_recebimento?: string | null
          status?: string
          subtotal?: number
          transportadora?: string | null
          updated_at?: string | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_compra_itens: {
        Row: {
          codigo_fornecedor: string | null
          created_at: string | null
          empresa_id: string | null
          id: string
          observacoes: string | null
          pedido_compra_id: string
          produto_id: string
          quantidade_pedida: number
          quantidade_recebida: number | null
          status: string | null
          valor_total: number | null
          valor_unitario: number
        }
        Insert: {
          codigo_fornecedor?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          pedido_compra_id: string
          produto_id: string
          quantidade_pedida?: number
          quantidade_recebida?: number | null
          status?: string | null
          valor_total?: number | null
          valor_unitario?: number
        }
        Update: {
          codigo_fornecedor?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          pedido_compra_id?: string
          produto_id?: string
          quantidade_pedida?: number
          quantidade_recebida?: number | null
          status?: string | null
          valor_total?: number | null
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_itens_pedido_compra_id_fkey"
            columns: ["pedido_compra_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo_vitrine"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_etapas: {
        Row: {
          cor: string | null
          created_at: string | null
          empresa_id: string | null
          id: string
          nome: string
          ordem: number
          pipeline_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          ordem?: number
          pipeline_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          ordem?: number
          pipeline_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_etapas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_etapas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_etapas_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          ativa: boolean | null
          created_at: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipelines_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_contas: {
        Row: {
          ativo: boolean
          atualizado_em: string
          classificacao: string
          criado_em: string
          empresa_id: string | null
          grupo_dre: string | null
          id: string
          nivel: number
          nome: string
          tipo_movimentacao: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          classificacao: string
          criado_em?: string
          empresa_id?: string | null
          grupo_dre?: string | null
          id?: string
          nivel?: number
          nome: string
          tipo_movimentacao?: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          classificacao?: string
          criado_em?: string
          empresa_id?: string | null
          grupo_dre?: string | null
          id?: string
          nivel?: number
          nome?: string
          tipo_movimentacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_contas_template: {
        Row: {
          classificacao: string
          criado_em: string
          grupo_dre: string | null
          id: string
          nivel: number
          nome: string
          tipo_movimentacao: string
        }
        Insert: {
          classificacao: string
          criado_em?: string
          grupo_dre?: string | null
          id?: string
          nivel?: number
          nome: string
          tipo_movimentacao?: string
        }
        Update: {
          classificacao?: string
          criado_em?: string
          grupo_dre?: string | null
          id?: string
          nivel?: number
          nome?: string
          tipo_movimentacao?: string
        }
        Relationships: []
      }
      produto_composicao: {
        Row: {
          criado_em: string
          custo: number | null
          empresa_id: string | null
          id: string
          produto_item_id: string
          produto_pai_id: string
          quantidade: number
          unidade: string | null
        }
        Insert: {
          criado_em?: string
          custo?: number | null
          empresa_id?: string | null
          id?: string
          produto_item_id: string
          produto_pai_id: string
          quantidade?: number
          unidade?: string | null
        }
        Update: {
          criado_em?: string
          custo?: number | null
          empresa_id?: string | null
          id?: string
          produto_item_id?: string
          produto_pai_id?: string
          quantidade?: number
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produto_composicao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_composicao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_composicao_produto_item_id_fkey"
            columns: ["produto_item_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_composicao_produto_item_id_fkey"
            columns: ["produto_item_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo_vitrine"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_composicao_produto_pai_id_fkey"
            columns: ["produto_pai_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_composicao_produto_pai_id_fkey"
            columns: ["produto_pai_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo_vitrine"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_brindes: {
        Row: {
          ativo: boolean
          criado_em: string
          descricao: string | null
          id: string
          nome: string
          planos_aplicaveis: string[] | null
          quantidade: number
          tipo_brinde: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          id?: string
          nome: string
          planos_aplicaveis?: string[] | null
          quantidade?: number
          tipo_brinde?: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          id?: string
          nome?: string
          planos_aplicaveis?: string[] | null
          quantidade?: number
          tipo_brinde?: string
        }
        Relationships: []
      }
      produtos_catalogo: {
        Row: {
          aplicacoes: string[] | null
          ativo_vitrine: boolean
          atualizado_em: string
          branch_id: string | null
          categoria: string | null
          cest: string | null
          codigo_cpl: string
          codigo_fornecedor: string | null
          cor: string | null
          custo_final: number | null
          descricao: string | null
          despesas_acessorias: number | null
          destaques: string[] | null
          ean: string | null
          empresa_id: string | null
          estoque_minimo: number | null
          estoque_quantidade: number | null
          fornecedor: string | null
          habilitar_nf: boolean | null
          id: string
          imagem_url: string | null
          imagens_adicionais: string[] | null
          importado_em: string
          localizacao: string | null
          marca: string | null
          ncm: string | null
          nome: string
          observacoes: string | null
          outras_despesas: number | null
          peso: number | null
          possui_composicao: boolean | null
          preco_custo: number | null
          precos_venda: Json | null
          unidade: string | null
        }
        Insert: {
          aplicacoes?: string[] | null
          ativo_vitrine?: boolean
          atualizado_em?: string
          branch_id?: string | null
          categoria?: string | null
          cest?: string | null
          codigo_cpl: string
          codigo_fornecedor?: string | null
          cor?: string | null
          custo_final?: number | null
          descricao?: string | null
          despesas_acessorias?: number | null
          destaques?: string[] | null
          ean?: string | null
          empresa_id?: string | null
          estoque_minimo?: number | null
          estoque_quantidade?: number | null
          fornecedor?: string | null
          habilitar_nf?: boolean | null
          id?: string
          imagem_url?: string | null
          imagens_adicionais?: string[] | null
          importado_em?: string
          localizacao?: string | null
          marca?: string | null
          ncm?: string | null
          nome: string
          observacoes?: string | null
          outras_despesas?: number | null
          peso?: number | null
          possui_composicao?: boolean | null
          preco_custo?: number | null
          precos_venda?: Json | null
          unidade?: string | null
        }
        Update: {
          aplicacoes?: string[] | null
          ativo_vitrine?: boolean
          atualizado_em?: string
          branch_id?: string | null
          categoria?: string | null
          cest?: string | null
          codigo_cpl?: string
          codigo_fornecedor?: string | null
          cor?: string | null
          custo_final?: number | null
          descricao?: string | null
          despesas_acessorias?: number | null
          destaques?: string[] | null
          ean?: string | null
          empresa_id?: string | null
          estoque_minimo?: number | null
          estoque_quantidade?: number | null
          fornecedor?: string | null
          habilitar_nf?: boolean | null
          id?: string
          imagem_url?: string | null
          imagens_adicionais?: string[] | null
          importado_em?: string
          localizacao?: string | null
          marca?: string | null
          ncm?: string | null
          nome?: string
          observacoes?: string | null
          outras_despesas?: number | null
          peso?: number | null
          possui_composicao?: boolean | null
          preco_custo?: number | null
          precos_venda?: Json | null
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_catalogo_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_catalogo_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_catalogo_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      respostas_rapidas: {
        Row: {
          atalho: string
          ativo: boolean | null
          canais_permitidos: string[] | null
          categoria: string | null
          created_at: string | null
          empresa_id: string | null
          id: string
          mensagem: string
          midia_url: string | null
          titulo: string
          total_usos: number | null
          usa_variaveis: boolean | null
        }
        Insert: {
          atalho: string
          ativo?: boolean | null
          canais_permitidos?: string[] | null
          categoria?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          mensagem: string
          midia_url?: string | null
          titulo: string
          total_usos?: number | null
          usa_variaveis?: boolean | null
        }
        Update: {
          atalho?: string
          ativo?: boolean | null
          canais_permitidos?: string[] | null
          categoria?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          mensagem?: string
          midia_url?: string | null
          titulo?: string
          total_usos?: number | null
          usa_variaveis?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "respostas_rapidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_rapidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean
          branch_id: string | null
          codigo_interno: string
          comissao: number
          created_at: string
          custo_homem_hora_id: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          nome: string
          tempo_estimado_min: number | null
          updated_at: string
          valor_custo: number
          valor_venda: number
        }
        Insert: {
          ativo?: boolean
          branch_id?: string | null
          codigo_interno?: string
          comissao?: number
          created_at?: string
          custo_homem_hora_id?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          tempo_estimado_min?: number | null
          updated_at?: string
          valor_custo?: number
          valor_venda?: number
        }
        Update: {
          ativo?: boolean
          branch_id?: string | null
          codigo_interno?: string
          comissao?: number
          created_at?: string
          custo_homem_hora_id?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          tempo_estimado_min?: number | null
          updated_at?: string
          valor_custo?: number
          valor_venda?: number
        }
        Relationships: [
          {
            foreignKeyName: "servicos_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_custo_homem_hora_id_fkey"
            columns: ["custo_homem_hora_id"]
            isOneToOne: false
            referencedRelation: "custo_homem_hora"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      situacoes_financeiro: {
        Row: {
          ativo: boolean
          atualizado_em: string
          confirmar_lancamento: boolean
          cor: string
          cor_atrasado: string | null
          criado_em: string
          empresa_id: string | null
          exibir_listagem: boolean
          id: string
          nome: string
          nome_atrasado: string | null
          padrao: boolean
          permite_edicao: boolean
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          confirmar_lancamento?: boolean
          cor?: string
          cor_atrasado?: string | null
          criado_em?: string
          empresa_id?: string | null
          exibir_listagem?: boolean
          id?: string
          nome: string
          nome_atrasado?: string | null
          padrao?: boolean
          permite_edicao?: boolean
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          confirmar_lancamento?: boolean
          cor?: string
          cor_atrasado?: string | null
          criado_em?: string
          empresa_id?: string | null
          exibir_listagem?: boolean
          id?: string
          nome?: string
          nome_atrasado?: string | null
          padrao?: boolean
          permite_edicao?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "situacoes_financeiro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situacoes_financeiro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      situacoes_os: {
        Row: {
          cor: string
          created_at: string
          empresa_id: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          cor?: string
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          cor?: string
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "situacoes_os_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situacoes_os_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      spedy_config: {
        Row: {
          ambiente: string
          api_key: string
          ativo: boolean | null
          atualizado_em: string | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string
          codigo_municipio: string | null
          complemento: string | null
          criado_em: string | null
          emissor_id: string | null
          empresa_id: string
          homologado: boolean | null
          homologado_em: string | null
          id: string
          logradouro: string | null
          nome_fantasia: string | null
          numero: string | null
          razao_social: string
          regime_tributario: string | null
          serie_nfce: string | null
          serie_nfe: string | null
          serie_nfse: string | null
          uf: string | null
        }
        Insert: {
          ambiente?: string
          api_key: string
          ativo?: boolean | null
          atualizado_em?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj: string
          codigo_municipio?: string | null
          complemento?: string | null
          criado_em?: string | null
          emissor_id?: string | null
          empresa_id: string
          homologado?: boolean | null
          homologado_em?: string | null
          id?: string
          logradouro?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          razao_social: string
          regime_tributario?: string | null
          serie_nfce?: string | null
          serie_nfe?: string | null
          serie_nfse?: string | null
          uf?: string | null
        }
        Update: {
          ambiente?: string
          api_key?: string
          ativo?: boolean | null
          atualizado_em?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          codigo_municipio?: string | null
          complemento?: string | null
          criado_em?: string | null
          emissor_id?: string | null
          empresa_id?: string
          homologado?: boolean | null
          homologado_em?: string | null
          id?: string
          logradouro?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          razao_social?: string
          regime_tributario?: string | null
          serie_nfce?: string | null
          serie_nfe?: string | null
          serie_nfse?: string | null
          uf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spedy_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spedy_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      spedy_logs: {
        Row: {
          criado_em: string | null
          empresa_id: string
          endpoint: string
          erro_mensagem: string | null
          id: string
          metodo: string
          nota_fiscal_id: string | null
          operacao: string
          request_body: Json | null
          response_body: Json | null
          status_code: number | null
          sucesso: boolean | null
        }
        Insert: {
          criado_em?: string | null
          empresa_id: string
          endpoint: string
          erro_mensagem?: string | null
          id?: string
          metodo: string
          nota_fiscal_id?: string | null
          operacao: string
          request_body?: Json | null
          response_body?: Json | null
          status_code?: number | null
          sucesso?: boolean | null
        }
        Update: {
          criado_em?: string | null
          empresa_id?: string
          endpoint?: string
          erro_mensagem?: string | null
          id?: string
          metodo?: string
          nota_fiscal_id?: string | null
          operacao?: string
          request_body?: Json | null
          response_body?: Json | null
          status_code?: number | null
          sucesso?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "spedy_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spedy_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spedy_logs_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          branch_id: string
          created_at: string
          empresa_id: string
          id: string
          motivo: string | null
          product_id: string
          quantidade: number
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string
          empresa_id: string
          id?: string
          motivo?: string | null
          product_id: string
          quantidade: number
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string
          empresa_id?: string
          id?: string
          motivo?: string | null
          product_id?: string
          quantidade?: number
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produtos_catalogo_vitrine"
            referencedColumns: ["id"]
          },
        ]
      }
      tabela_precos_servicos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          empresa_id: string | null
          id: string
          nome: string
          percentual_acrescimo: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          percentual_acrescimo?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          percentual_acrescimo?: number
        }
        Relationships: [
          {
            foreignKeyName: "tabela_precos_servicos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabela_precos_servicos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      transportadoras: {
        Row: {
          ativo: boolean | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          contato_nome: string | null
          created_at: string | null
          email: string | null
          empresa_id: string | null
          estado: string | null
          id: string
          inscricao_estadual: string | null
          logradouro: string | null
          nome: string
          numero: string | null
          observacoes: string | null
          prazo_entrega_dias: number | null
          telefone: string | null
          tipo: string | null
          tipo_frete: string | null
          updated_at: string | null
          valor_frete_padrao: number | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          contato_nome?: string | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          logradouro?: string | null
          nome: string
          numero?: string | null
          observacoes?: string | null
          prazo_entrega_dias?: number | null
          telefone?: string | null
          tipo?: string | null
          tipo_frete?: string | null
          updated_at?: string | null
          valor_frete_padrao?: number | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          contato_nome?: string | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          logradouro?: string | null
          nome?: string
          numero?: string | null
          observacoes?: string | null
          prazo_entrega_dias?: number | null
          telefone?: string | null
          tipo?: string | null
          tipo_frete?: string | null
          updated_at?: string | null
          valor_frete_padrao?: number | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportadoras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportadoras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          atualizado_em: string
          auth_user_id: string | null
          avatar_url: string | null
          criado_em: string
          email: string | null
          empresa_id: string
          id: string
          nome_completo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          auth_user_id?: string | null
          avatar_url?: string | null
          criado_em?: string
          email?: string | null
          empresa_id: string
          id?: string
          nome_completo: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          auth_user_id?: string | null
          avatar_url?: string | null
          criado_em?: string
          email?: string | null
          empresa_id?: string
          id?: string
          nome_completo?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      valores_venda: {
        Row: {
          atualizado_em: string
          criado_em: string
          empresa_id: string | null
          id: string
          media_lucro: number
          nome: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          empresa_id?: string | null
          id?: string
          media_lucro?: number
          nome: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          empresa_id?: string | null
          id?: string
          media_lucro?: number
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "valores_venda_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valores_venda_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos_cache: {
        Row: {
          ano: string | null
          chassi: string | null
          combustivel: string | null
          cor: string | null
          created_at: string
          dados_completos: Json | null
          empresa_id: string | null
          fonte: string | null
          id: string
          marca: string | null
          modelo: string | null
          municipio: string | null
          placa: string
          tipo_veiculo: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          ano?: string | null
          chassi?: string | null
          combustivel?: string | null
          cor?: string | null
          created_at?: string
          dados_completos?: Json | null
          empresa_id?: string | null
          fonte?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          municipio?: string | null
          placa: string
          tipo_veiculo?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ano?: string | null
          chassi?: string | null
          combustivel?: string | null
          cor?: string | null
          created_at?: string
          dados_completos?: Json | null
          empresa_id?: string | null
          fonte?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          municipio?: string | null
          placa?: string
          tipo_veiculo?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_cache_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veiculos_cache_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks_config: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          empresa_id: string | null
          eventos: string[] | null
          headers: Json | null
          id: string
          nome: string
          secret: string | null
          total_disparos: number | null
          ultimo_disparo: string | null
          ultimo_status: number | null
          url: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          empresa_id?: string | null
          eventos?: string[] | null
          headers?: Json | null
          id?: string
          nome: string
          secret?: string | null
          total_disparos?: number | null
          ultimo_disparo?: string | null
          ultimo_status?: number | null
          url: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          empresa_id?: string | null
          eventos?: string[] | null
          headers?: Json | null
          id?: string
          nome?: string
          secret?: string | null
          total_disparos?: number | null
          ultimo_disparo?: string | null
          ultimo_status?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      empresas_publicas: {
        Row: {
          cor_primaria: string | null
          cor_secundaria: string | null
          id: string | null
          logo_url: string | null
          nome: string | null
          nome_fantasia: string | null
          slug: string | null
          status: string | null
        }
        Insert: {
          cor_primaria?: string | null
          cor_secundaria?: string | null
          id?: string | null
          logo_url?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          slug?: string | null
          status?: string | null
        }
        Update: {
          cor_primaria?: string | null
          cor_secundaria?: string | null
          id?: string | null
          logo_url?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          slug?: string | null
          status?: string | null
        }
        Relationships: []
      }
      produtos_catalogo_vitrine: {
        Row: {
          aplicacoes: string[] | null
          atualizado_em: string | null
          categoria: string | null
          cest: string | null
          codigo_cpl: string | null
          codigo_fornecedor: string | null
          cor: string | null
          custo_final: number | null
          descricao: string | null
          despesas_acessorias: number | null
          ean: string | null
          estoque_minimo: number | null
          estoque_quantidade: number | null
          fornecedor: string | null
          id: string | null
          imagem_url: string | null
          importado_em: string | null
          localizacao: string | null
          marca: string | null
          ncm: string | null
          nome: string | null
          observacoes: string | null
          outras_despesas: number | null
          peso: number | null
          preco_custo: number | null
          precos_venda: Json | null
          unidade: string | null
          vitrine_prioridade: number | null
        }
        Insert: {
          aplicacoes?: string[] | null
          atualizado_em?: string | null
          categoria?: string | null
          cest?: string | null
          codigo_cpl?: string | null
          codigo_fornecedor?: string | null
          cor?: string | null
          custo_final?: number | null
          descricao?: string | null
          despesas_acessorias?: number | null
          ean?: string | null
          estoque_minimo?: number | null
          estoque_quantidade?: number | null
          fornecedor?: string | null
          id?: string | null
          imagem_url?: string | null
          importado_em?: string | null
          localizacao?: string | null
          marca?: string | null
          ncm?: string | null
          nome?: string | null
          observacoes?: string | null
          outras_despesas?: number | null
          peso?: number | null
          preco_custo?: number | null
          precos_venda?: Json | null
          unidade?: string | null
          vitrine_prioridade?: never
        }
        Update: {
          aplicacoes?: string[] | null
          atualizado_em?: string | null
          categoria?: string | null
          cest?: string | null
          codigo_cpl?: string | null
          codigo_fornecedor?: string | null
          cor?: string | null
          custo_final?: number | null
          descricao?: string | null
          despesas_acessorias?: number | null
          ean?: string | null
          estoque_minimo?: number | null
          estoque_quantidade?: number | null
          fornecedor?: string | null
          id?: string | null
          imagem_url?: string | null
          importado_em?: string | null
          localizacao?: string | null
          marca?: string | null
          ncm?: string | null
          nome?: string | null
          observacoes?: string | null
          outras_despesas?: number | null
          peso?: number | null
          preco_custo?: number | null
          precos_venda?: Json | null
          unidade?: string | null
          vitrine_prioridade?: never
        }
        Relationships: []
      }
    }
    Functions: {
      atualizar_comissoes_afiliado: {
        Args: { p_afiliado_id: string; p_valor: number }
        Returns: undefined
      }
      buscar_produtos_catalogo:
        | {
            Args: { termos: string[] }
            Returns: {
              aplicacoes: string[] | null
              ativo_vitrine: boolean
              atualizado_em: string
              branch_id: string | null
              categoria: string | null
              cest: string | null
              codigo_cpl: string
              codigo_fornecedor: string | null
              cor: string | null
              custo_final: number | null
              descricao: string | null
              despesas_acessorias: number | null
              destaques: string[] | null
              ean: string | null
              empresa_id: string | null
              estoque_minimo: number | null
              estoque_quantidade: number | null
              fornecedor: string | null
              habilitar_nf: boolean | null
              id: string
              imagem_url: string | null
              imagens_adicionais: string[] | null
              importado_em: string
              localizacao: string | null
              marca: string | null
              ncm: string | null
              nome: string
              observacoes: string | null
              outras_despesas: number | null
              peso: number | null
              possui_composicao: boolean | null
              preco_custo: number | null
              precos_venda: Json | null
              unidade: string | null
            }[]
            SetofOptions: {
              from: "*"
              to: "produtos_catalogo"
              isOneToOne: false
              isSetofReturn: true
            }
          }
        | {
            Args: { p_empresa_id?: string; termos: string[] }
            Returns: {
              aplicacoes: string[] | null
              ativo_vitrine: boolean
              atualizado_em: string
              branch_id: string | null
              categoria: string | null
              cest: string | null
              codigo_cpl: string
              codigo_fornecedor: string | null
              cor: string | null
              custo_final: number | null
              descricao: string | null
              despesas_acessorias: number | null
              destaques: string[] | null
              ean: string | null
              empresa_id: string | null
              estoque_minimo: number | null
              estoque_quantidade: number | null
              fornecedor: string | null
              habilitar_nf: boolean | null
              id: string
              imagem_url: string | null
              imagens_adicionais: string[] | null
              importado_em: string
              localizacao: string | null
              marca: string | null
              ncm: string | null
              nome: string
              observacoes: string | null
              outras_despesas: number | null
              peso: number | null
              possui_composicao: boolean | null
              preco_custo: number | null
              precos_venda: Json | null
              unidade: string | null
            }[]
            SetofOptions: {
              from: "*"
              to: "produtos_catalogo"
              isOneToOne: false
              isSetofReturn: true
            }
          }
      calcular_churn_rate: {
        Args: { ano_ref: number; mes_ref: number }
        Returns: number
      }
      calcular_mrr: { Args: never; Returns: number }
      criar_cliente_ecommerce: {
        Args: {
          p_cpf?: string
          p_email: string
          p_loja_id: string
          p_nome: string
          p_senha?: string
          p_telefone?: string
        }
        Returns: string
      }
      criar_empresa_cadastro: {
        Args: {
          p_auth_user_id?: string
          p_documento?: string
          p_email?: string
          p_nome: string
          p_plano?: string
          p_slug: string
          p_telefone?: string
        }
        Returns: string
      }
      ecommerce_categorias:
        | {
            Args: never
            Returns: {
              categoria: string
            }[]
          }
        | {
            Args: { p_empresa_id?: string }
            Returns: {
              categoria: string
            }[]
          }
      ecommerce_fornecedores:
        | {
            Args: never
            Returns: {
              fornecedor: string
            }[]
          }
        | {
            Args: { p_empresa_id?: string }
            Returns: {
              fornecedor: string
            }[]
          }
      ecommerce_produtos_paginados: {
        Args: {
          p_busca?: string
          p_categoria?: string
          p_com_estoque?: boolean
          p_empresa_id?: string
          p_fornecedor?: string
          p_ordenacao?: string
          p_pagina?: number
          p_por_pagina?: number
        }
        Returns: {
          aplicacoes: string
          categoria: string
          codigo_fornecedor: string
          estoque_quantidade: number
          fornecedor: string
          id: string
          imagem_url: string
          nome: string
          precos_venda: Json
          total_count: number
        }[]
      }
      gerar_subdominio_unico: { Args: { nome_base: string }; Returns: string }
      get_ecommerce_config: { Args: { p_empresa_id: string }; Returns: Json }
      get_empresa_by_slug: { Args: { p_slug: string }; Returns: string }
      get_user_branches: { Args: { p_user_id: string }; Returns: string[] }
      get_user_empresa_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      importar_catalogo_master: {
        Args: {
          p_branch_id?: string
          p_categoria?: string
          p_empresa_id: string
          p_marca?: string
        }
        Returns: Json
      }
      login_ecommerce: {
        Args: { p_email: string; p_senha: string }
        Returns: Json
      }
      verificar_senha_ecommerce: {
        Args: { p_email: string; p_senha: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gerente" | "vendedor" | "mecanico" | "cliente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gerente", "vendedor", "mecanico", "cliente"],
    },
  },
} as const
