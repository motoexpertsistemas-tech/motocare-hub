-- Atualizar fornecedor para produtos OSI
UPDATE produtos_catalogo SET fornecedor = 'OSI' WHERE (fornecedor IS NULL OR fornecedor = '') AND UPPER(nome) LIKE '%OSI %';

-- Atualizar fornecedor para produtos MAGNETRON (padrão MAGN seguido de número)
UPDATE produtos_catalogo SET fornecedor = 'MAGNETRON' WHERE (fornecedor IS NULL OR fornecedor = '') AND UPPER(nome) ~ 'MAGN [0-9]';

-- Atualizar fornecedor para produtos MELC
UPDATE produtos_catalogo SET fornecedor = 'MELC' WHERE (fornecedor IS NULL OR fornecedor = '') AND UPPER(nome) LIKE '%MELC%';

-- Atualizar fornecedor para produtos SPORT (cuidado para não pegar SPORTIVE que já tem fornecedor)
UPDATE produtos_catalogo SET fornecedor = 'SPORT' WHERE (fornecedor IS NULL OR fornecedor = '') AND UPPER(nome) LIKE '% SPORT %';

-- Atualizar fornecedor para produtos TRILHA
UPDATE produtos_catalogo SET fornecedor = 'TRILHA' WHERE (fornecedor IS NULL OR fornecedor = '') AND UPPER(nome) LIKE '%TRILHA%';