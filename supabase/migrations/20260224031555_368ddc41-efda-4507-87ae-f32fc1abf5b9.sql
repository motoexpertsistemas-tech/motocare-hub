-- Permitir leitura pública da tabela empresas (para página pública /app/:slug)
CREATE POLICY "Empresas visíveis publicamente"
ON public.empresas
FOR SELECT
USING (true);