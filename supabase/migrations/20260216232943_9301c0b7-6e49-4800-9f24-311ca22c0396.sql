
-- Fix product SPT-6090001: custo_final=80, margins 80%/40%/20%
-- Correct: 80*(1+0.8)=144, 80*(1+0.4)=112, 80*(1+0.2)=96
UPDATE produtos_catalogo
SET precos_venda = '[
  {"tipo":"Varejo","lucro_sugerido":80,"lucro_utilizado":80,"valor_venda_sugerido":144,"valor_venda_utilizado":144},
  {"tipo":"Atacado","lucro_sugerido":40,"lucro_utilizado":40,"valor_venda_sugerido":112,"valor_venda_utilizado":112},
  {"tipo":"Shoppe","lucro_sugerido":20,"lucro_utilizado":20,"valor_venda_sugerido":96,"valor_venda_utilizado":96}
]'::jsonb
WHERE id = '8b156957-1b07-445d-ac70-08a19d0d1102';

-- Fix product SPT-6060003: custo_final=50, margins 80%/40%/20%
-- Correct: 50*(1+0.8)=90, 50*(1+0.4)=70, 50*(1+0.2)=60
UPDATE produtos_catalogo
SET precos_venda = '[
  {"tipo":"Varejo","lucro_sugerido":80,"lucro_utilizado":80,"valor_venda_sugerido":90,"valor_venda_utilizado":90},
  {"tipo":"Atacado","lucro_sugerido":40,"lucro_utilizado":40,"valor_venda_sugerido":70,"valor_venda_utilizado":70},
  {"tipo":"Shoppe","lucro_sugerido":20,"lucro_utilizado":20,"valor_venda_sugerido":60,"valor_venda_utilizado":60}
]'::jsonb
WHERE id = 'dee0f36e-2c61-442d-8111-e70c71d86fa5';
