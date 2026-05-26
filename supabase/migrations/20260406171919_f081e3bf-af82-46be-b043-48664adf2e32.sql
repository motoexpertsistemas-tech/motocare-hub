
-- Add branch_id to main tables
ALTER TABLE public.produtos_catalogo ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.caixas ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.caixa_movimentacoes ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.ordem_servico ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.movimentacoes_financeiras ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_produtos_catalogo_branch ON public.produtos_catalogo(branch_id);
CREATE INDEX IF NOT EXISTS idx_clientes_branch ON public.clientes(branch_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_branch ON public.fornecedores(branch_id);
CREATE INDEX IF NOT EXISTS idx_servicos_branch ON public.servicos(branch_id);
CREATE INDEX IF NOT EXISTS idx_caixas_branch ON public.caixas(branch_id);
CREATE INDEX IF NOT EXISTS idx_caixa_movimentacoes_branch ON public.caixa_movimentacoes(branch_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_branch ON public.orcamentos(branch_id);
CREATE INDEX IF NOT EXISTS idx_ordem_servico_branch ON public.ordem_servico(branch_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_financeiras_branch ON public.movimentacoes_financeiras(branch_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_branch ON public.funcionarios(branch_id);

-- Associate existing data with the matriz branch of each empresa
UPDATE public.produtos_catalogo p SET branch_id = b.id
FROM public.branches b WHERE b.empresa_id = p.empresa_id AND b.tipo = 'matriz' AND p.branch_id IS NULL;

UPDATE public.clientes c SET branch_id = b.id
FROM public.branches b WHERE b.empresa_id = c.empresa_id AND b.tipo = 'matriz' AND c.branch_id IS NULL;

UPDATE public.fornecedores f SET branch_id = b.id
FROM public.branches b WHERE b.empresa_id = f.empresa_id AND b.tipo = 'matriz' AND f.branch_id IS NULL;

UPDATE public.servicos s SET branch_id = b.id
FROM public.branches b WHERE b.empresa_id = s.empresa_id AND b.tipo = 'matriz' AND s.branch_id IS NULL;

UPDATE public.caixas c SET branch_id = b.id
FROM public.branches b WHERE b.empresa_id = c.empresa_id AND b.tipo = 'matriz' AND c.branch_id IS NULL;

UPDATE public.orcamentos o SET branch_id = b.id
FROM public.branches b WHERE b.empresa_id = o.empresa_id AND b.tipo = 'matriz' AND o.branch_id IS NULL;

UPDATE public.ordem_servico os SET branch_id = b.id
FROM public.branches b WHERE b.empresa_id = os.empresa_id AND b.tipo = 'matriz' AND os.branch_id IS NULL;

UPDATE public.movimentacoes_financeiras mf SET branch_id = b.id
FROM public.branches b WHERE b.empresa_id = mf.empresa_id AND b.tipo = 'matriz' AND mf.branch_id IS NULL;

UPDATE public.funcionarios f SET branch_id = b.id
FROM public.branches b WHERE b.empresa_id = f.empresa_id AND b.tipo = 'matriz' AND f.branch_id IS NULL;
