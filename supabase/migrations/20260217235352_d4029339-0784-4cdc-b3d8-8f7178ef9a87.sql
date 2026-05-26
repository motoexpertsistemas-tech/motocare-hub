
DELETE FROM produtos_catalogo b
WHERE b.codigo_cpl NOT LIKE '% %'
AND EXISTS (
  SELECT 1 FROM produtos_catalogo a 
  WHERE a.codigo_cpl ~ '^[A-Z]+ [0-9]'
  AND SUBSTRING(a.codigo_cpl FROM POSITION(' ' IN a.codigo_cpl) + 1) = b.codigo_cpl
);
