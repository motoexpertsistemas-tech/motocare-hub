
-- Remove duplicates first (keep the first one)
DELETE FROM public.funcionarios a
USING public.funcionarios b
WHERE a.id > b.id
  AND a.cpf = b.cpf
  AND a.cpf IS NOT NULL
  AND a.cpf != '';

-- Add unique index on non-empty CPF
CREATE UNIQUE INDEX idx_funcionarios_cpf_unique 
ON public.funcionarios (cpf) 
WHERE cpf IS NOT NULL AND cpf != '';
