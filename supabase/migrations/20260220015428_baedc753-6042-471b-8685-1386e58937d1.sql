
CREATE TABLE public.formas_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  conta_bancaria TEXT,
  disponivel_pagamentos BOOLEAN NOT NULL DEFAULT true,
  disponivel_recebimentos BOOLEAN NOT NULL DEFAULT true,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to formas_pagamento" ON public.formas_pagamento FOR ALL USING (true) WITH CHECK (true);

-- Seed with common payment methods
INSERT INTO public.formas_pagamento (nome, conta_bancaria, disponivel_pagamentos, disponivel_recebimentos) VALUES
  ('BOLETO BANCARIO INTER', 'BANCO INTER', true, true),
  ('PIX', 'BANCO INTER', true, true),
  ('A COMBINAR', 'CAIXA', true, true),
  ('A DINHEIRO', 'CAIXA', true, true),
  ('A PIX - Infinity Pay', 'Infinity Pay', true, true),
  ('A PIX - INTER', 'BANCO INTER', true, true),
  ('BONIFICACAO', 'CAIXA', true, false),
  ('CARTÃO BANESE', 'BANCO BRASIL', true, true),
  ('CARTÃO CREDITO - PAG BANK', 'PAG BANK', true, true),
  ('CARTÃO DEBITO - PAG BANK', 'PAG BANK', true, true);
