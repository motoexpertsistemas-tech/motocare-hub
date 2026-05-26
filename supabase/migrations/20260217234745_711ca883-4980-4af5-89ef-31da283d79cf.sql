
DELETE FROM produtos_catalogo b
WHERE b.codigo_cpl NOT LIKE 'OSI %'
AND EXISTS (
  SELECT 1 FROM produtos_catalogo a 
  WHERE a.codigo_cpl = 'OSI ' || b.codigo_cpl
);
