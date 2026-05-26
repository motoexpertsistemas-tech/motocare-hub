DELETE FROM produtos_catalogo
WHERE codigo_cpl ~ '^[0-9]+$'
AND EXISTS (
  SELECT 1 FROM produtos_catalogo AS p2
  WHERE p2.nome = produtos_catalogo.nome
  AND p2.codigo_cpl <> produtos_catalogo.codigo_cpl
  AND p2.codigo_cpl !~ '^[0-9]+$'
);