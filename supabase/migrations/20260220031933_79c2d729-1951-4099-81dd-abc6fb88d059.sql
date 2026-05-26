
-- Tabela de configurações da loja (dados para impressão e cabeçalhos)
CREATE TABLE public.configuracoes_loja (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social text NOT NULL DEFAULT '',
  nome_fantasia text NOT NULL DEFAULT '',
  cnpj text NOT NULL DEFAULT '',
  inscricao_estadual text,
  telefone text NOT NULL DEFAULT '',
  telefone2 text,
  email text,
  website text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  operador_padrao text DEFAULT 'GERENCIAL',
  mensagem_cupom text DEFAULT 'OBRIGADO E VOLTE SEMPRE!',
  prazo_troca_dias integer DEFAULT 7,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes_loja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on configuracoes_loja"
ON public.configuracoes_loja FOR ALL
USING (true) WITH CHECK (true);

-- Inserir registro padrão com dados da DKA Motos
INSERT INTO public.configuracoes_loja (
  razao_social, nome_fantasia, cnpj, telefone, telefone2, email, website,
  logradouro, numero, bairro, cidade, estado, cep, operador_padrao
) VALUES (
  'DKA MOTOS LTDA', 'DKA MOTOS', '16.754.877/0001-08',
  '(79)99858-0924', '(79)988581970', 'dkamotos@hotmail.com', 'dkamotos.com.br',
  'AV JOSE CANDIDO DOS SANTOS', '8', 'POV. LAGOA REDONDA II PROXIMO A DIVISA',
  'Itapicuru', 'BA', '48475-000', 'GERENCIAL'
);
