
ALTER TABLE public.etiquetas_modelos
  ADD COLUMN padrao_etiqueta TEXT DEFAULT 'Indefinido',
  ADD COLUMN margem_lateral_cm NUMERIC DEFAULT 0,
  ADD COLUMN densidade_vertical_cm NUMERIC DEFAULT 0,
  ADD COLUMN densidade_horizontal_cm NUMERIC DEFAULT 0,
  ADD COLUMN altura_etiqueta_cm NUMERIC DEFAULT 0,
  ADD COLUMN largura_etiqueta_cm NUMERIC DEFAULT 0,
  ADD COLUMN fonte_etiqueta TEXT DEFAULT 'Times New Roman',
  ADD COLUMN tamanho_fonte TEXT DEFAULT '10pt',
  ADD COLUMN limite_caracteres INTEGER DEFAULT 0,
  ADD COLUMN descricao_topo TEXT DEFAULT '',
  ADD COLUMN exibir_codigo_interno TEXT DEFAULT 'Sim',
  ADD COLUMN exibir_codigo_barras TEXT DEFAULT 'Sim',
  ADD COLUMN exibir_numero_codigo_barras TEXT DEFAULT 'Não',
  ADD COLUMN exibir_valor_produto TEXT DEFAULT 'Sim',
  ADD COLUMN tamanho_fonte_valor TEXT DEFAULT 'Padrão',
  ADD COLUMN posicao_codigo_barras TEXT DEFAULT 'Superior',
  ADD COLUMN margem_superior_cm NUMERIC DEFAULT 0;

-- Rename existing columns to match (keep old ones for backward compat but we'll use new ones)
