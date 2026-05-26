UPDATE plano_contas 
SET nome = UPPER(SUBSTRING(grupo_dre FROM POSITION(' - ' IN grupo_dre) + 3))
WHERE grupo_dre NOT IN ('------', 'Não mostrar no DRE') 
AND grupo_dre LIKE '% - %'
AND ativo = true;