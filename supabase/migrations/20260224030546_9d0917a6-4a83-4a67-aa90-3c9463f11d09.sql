
-- Add DELETE policy for empresas
CREATE POLICY "Empresas podem ser deletadas"
ON public.empresas
FOR DELETE
USING (true);

-- Fix eventos_sistema FK to cascade
ALTER TABLE public.eventos_sistema
  DROP CONSTRAINT eventos_sistema_empresa_id_fkey;

ALTER TABLE public.eventos_sistema
  ADD CONSTRAINT eventos_sistema_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
