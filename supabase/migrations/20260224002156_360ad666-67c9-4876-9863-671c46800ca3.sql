
-- Create empresa for orphaned user dkamotos@hotmail.com
INSERT INTO public.empresas (nome, cnpj, telefone, email, plano_ativo, status, trial_expira_em)
VALUES ('DKA MOTOS', '16754877000108', '79996277245', 'dkamotos@hotmail.com', 'trial', 'ativo', now() + interval '14 days');

-- Create usuario linked to empresa
INSERT INTO public.usuarios (auth_user_id, empresa_id, nome_completo, email)
SELECT '1c2375c9-1b3b-46a5-96f9-e1dfed49b947', e.id, 'DKA MOTOS', 'dkamotos@hotmail.com'
FROM public.empresas e WHERE e.email = 'dkamotos@hotmail.com';

-- Create admin role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'
FROM public.usuarios u WHERE u.auth_user_id = '1c2375c9-1b3b-46a5-96f9-e1dfed49b947';
