## Objetivo

Mostrar um relógio decrescente (HH:MM:SS) de 24h após o cliente girar a roleta, em dois lugares:
1. Dentro do popup de resultado, logo abaixo do cupom ("SEU PRÊMIO EXPIRA EM").
2. Como uma barra/etiqueta fixa flutuante na vitrine da loja, visível enquanto o cupom estiver ativo.

## Mudanças

### 1. `src/components/SpinWheelPopup.tsx`
- Reaproveitar o estado `now` já existente para também recalcular o tempo restante quando há `result` (não só quando `isLocked`).
- Após o bloco do cupom, adicionar:
  - Texto: "SEU PRÊMIO EXPIRA EM:"
  - Três blocos pretos arredondados estilo flip-clock com `HH`, `MM`, `SS` separados por `:` (referência da imagem 2 do usuário, em escala menor para caber no popup).
- Quando `result` existir, calcular `prizeUntil = Date.now() + 24h` no momento em que o resultado é gerado (guardar em ref/state para não recriar a cada render).

### 2. `src/pages/Ecommerce.tsx`
- Quando `roletaLockedUntil` estiver no futuro, renderizar uma barra flutuante fixa (estilo da imagem 3): posição `fixed bottom-20 left-1/2 -translate-x-1/2`, fundo vermelho/amarelo gradiente, ícone de cupom, texto "SEU CUPOM EXPIRA EM HH:MM:SS" e botão "X" para dispensar (a barra reaparece ao recarregar).
- Clicar na barra reabre o `SpinWheelPopup` (que já mostra o cupom/contador).
- Hook próprio `useState` + `setInterval(1000)` para atualizar o contador da barra a cada segundo.
- A barra só aparece quando `roletaLockedUntil > now` e o popup está fechado.

### 3. Persistência do cupom
- Salvar no `localStorage` o último cupom sorteado (`roleta_cupom`) junto com o timestamp, para que ao recarregar a página a barra mostre o mesmo código e o popup (ao reabrir) exiba o resultado em vez de pedir novo giro.

## Detalhes técnicos

- Sem alterações no Supabase — tudo client-side em `localStorage`.
- Usar tokens semânticos do design system; cores quentes do gradiente (`from-red-600 to-orange-500`) consistentes com o popup.
- Garantir `z-index` da barra abaixo do popup mas acima do conteúdo da loja (`z-40`).
- Acessibilidade: `aria-live="polite"` no contador para leitores de tela; botão de fechar com `aria-label`.

## Fora de escopo

- Não enviar cupom para banco / servidor.
- Não validar o cupom no checkout (já existe lógica separada).
- Sem som ou animação adicional além da pulsação suave já existente.
