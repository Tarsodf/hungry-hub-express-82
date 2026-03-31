

## Plano: Corrigir ficheiros trocados

As alterações manuais trocaram o conteúdo dos ficheiros. Aqui está o que aconteceu:

| Ficheiro | Conteúdo atual (ERRADO) | Conteúdo correto |
|---|---|---|
| `src/pages/Index.tsx` | Código da edge function create-checkout (Deno/Stripe) | Página inicial do site (homepage) |
| `supabase/functions/create-checkout/index.ts` | Código do CartPage (React) | Edge function de checkout (Deno/Stripe) |
| `src/pages/CartPage.tsx` | Apenas um snippet de `handleSubmitOrder` (81 linhas) | Componente completo do carrinho |

### O que será feito

**1. Restaurar `src/pages/Index.tsx`** como homepage
- Recriar a página inicial com hero section, botões para cardápio, secção de reviews (GoogleReviews) e informações do restaurante

**2. Restaurar `supabase/functions/create-checkout/index.ts`** com o código correto da edge function
- O código que está atualmente em `Index.tsx` (linhas 1-351) é o código correto da edge function — será movido de volta para `create-checkout/index.ts`

**3. Restaurar `src/pages/CartPage.tsx`** como componente completo
- Usar o código que está em `create-checkout/index.ts` (que é o CartPage React completo com lógica de pagamento, MB WAY, formulário, etc.) como base
- Garantir que o JSX completo do carrinho está incluído (a versão atual em `create-checkout` tem `{/* ... restante do layout ... */}` no JSX — será necessário reconstruir o layout completo)

**4. Deploy da edge function** `create-checkout` após restaurar o código correto

### Detalhes técnicos

- O conteúdo da edge function `create-checkout` (com validação, cálculo server-side, Stripe session, rate limiting) será restaurado a partir do que está em `Index.tsx`
- A homepage será recriada com a estrutura típica: hero, CTA para cardápio, GoogleReviews
- O CartPage será reconstruído com o layout completo do carrinho incluindo: lista de itens, formulário de dados, seleção de entrega/retirada, calculadora de taxa, seleção de pagamento, e botões de submissão

