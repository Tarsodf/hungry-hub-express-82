

## Plano: Reorganizar Cardapio - Regras de Bebida/Sobremesa por Dia

### Problemas encontrados nos dados atuais

| Prato | Dia | Descrição diz "Inclui bebida..." | Correto? |
|---|---|---|---|
| Picanha | Domingo (0) | Nao | OK (fim de semana) |
| Executivo Classico | Segunda (1) | Sim | OK |
| Executivo Dom Bistro | Terca (2) | Sim | OK |
| Executivo Parmegiana | Quarta (3) | **Nao** | **Falta** |
| Executivo do Chefe | Quinta (4) | Sim | OK |
| Executivo Festa Brasileira | Sexta (5) | Sim | OK |
| Feijoada Completa | Sabado (6) | **Sim** | **Errado** (fim de semana) |
| Jantinha de Espetinhos | Sem dia | Nao | OK |

Duplicatas possiveis: "Bolo de Leite Ninho" (2.00) e "Bolo de Ninho" (4.00); "Suco Natural de Laranja" e "Sumo Natural Laranja"

### O que sera feito

**1. Atualizar dados na base de dados (UPDATE)**

- Padronizar todas as descricoes dos executivos de segunda a sexta para incluir "Inclui bebida, sobremesa e cafe."
- Remover "Inclui bebida, sobremesa e cafe." da Feijoada (sabado) e Picanha (domingo)
- Corrigir descricao da Parmegiana (quarta) para incluir a frase
- Padronizar nomes (ex: "Suco" vs "Sumo" - unificar)

**2. Alterar logica no MenuPage.tsx**

- Criar funcao `isWeekday(item)` que verifica se `day_of_week` esta entre 1-5
- Para executivos de **segunda a sexta**: mostrar na customizacao uma seccao "Escolha sua Bebida" e "Escolha sua Sobremesa" com as opcoes das categorias Bebidas e Bolos & Doces (preco incluido, sem custo extra)
- Para executivos de **sabado e domingo**: mostrar bebida e sobremesa como **extras pagos** (com preco normal)
- Manter a regra de que pratos de outros dias aparecem apenas como visualizacao (botao desativado) - ja funciona assim

**3. Estado adicional no dialogo de customizacao**

- Adicionar `selectedDrink` e `selectedDessert` ao estado do dialogo
- Na funcao `handleAddToCart`, incluir bebida e sobremesa como addons no carrinho (com preco 0 para dias de semana, preco normal para fim de semana)

### Ficheiros alterados

| Ficheiro | Acao |
|---|---|
| Base de dados | UPDATE descricoes via insert tool |
| `src/pages/MenuPage.tsx` | Adicionar logica de bebida/sobremesa por dia, seccoes no dialogo de customizacao |

### Detalhes tecnicos

- Buscar itens das categorias "Bebidas" e "Bolos & Doces" para popular os seletores
- Executivos de segunda a sexta: bebida e sobremesa com preco 0 nos addons do carrinho
- Executivos de sabado e domingo: bebida e sobremesa com preco normal nos addons
- A query de menu items ja carrega todos os itens ativos, so precisa filtrar por categoria

