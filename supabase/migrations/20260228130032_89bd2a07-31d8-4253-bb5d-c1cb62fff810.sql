INSERT INTO public.assinaturas (empresa_id, plano, periodicidade, valor, status, data_inicio, trial_inicio, trial_fim, proxima_cobranca)
VALUES (
  '8ca5c3c9-bdff-497a-9e7d-fec3d025905b',
  'professional',
  'mensal',
  0,
  'trial',
  NOW(),
  NOW(),
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days'
)