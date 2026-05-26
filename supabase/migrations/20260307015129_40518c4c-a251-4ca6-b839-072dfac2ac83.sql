ALTER TABLE produtos_catalogo 
  ADD COLUMN IF NOT EXISTS habilitar_nf boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS possui_composicao boolean DEFAULT false;