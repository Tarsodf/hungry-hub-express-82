

# Dom Bistro Grill - Site de Pedidos Online 🍽️

## Visão Geral
Site completo para o restaurante **Dom Bistro Grill** com cardápio digital, carrinho de compras, pagamento online via Stripe e painel administrativo para gestão total do cardápio.

## Design & Identidade Visual
- Estilo **quente e acolhedor**: tons de marrom, dourado, bege e bordô
- Tipografia elegante e convidativa
- Imagens de destaque para cada prato
- Layout responsivo (mobile e desktop)

---

## Páginas Principais

### 1. Página Inicial
- Banner hero com imagem do restaurante e slogan
- Categorias do cardápio em destaque (Pratos Executivos, Hambúrgueres, Espetinhos, Sobremesas, Bebidas, Pastéis)
- Botão de chamada para ver o cardápio completo
- Informações de contacto e horário de funcionamento

### 2. Cardápio Digital
- Navegação por categorias com abas/filtros
- Cada item com: **foto, nome, descrição, preço**
- Botão para adicionar ao carrinho com seleção de quantidade
- Opção de **personalizar/remover ingredientes** de cada prato (ex: sem cebola, sem queijo)

### 3. Carrinho de Compras
- Lista dos itens selecionados com quantidades editáveis
- Possibilidade de remover itens
- Resumo do pedido com subtotal e total
- Escolha do **modo de recebimento**: Entrega ao domicílio ou Retirada no local
- Campo para endereço de entrega (quando aplicável)
- Campo para observações do pedido

### 4. Checkout & Pagamento
- Integração real com **Stripe** para pagamentos seguros
- Métodos aceites: **Cartão de Débito, Cartão de Crédito e MB WAY**
- Confirmação do pedido após pagamento

### 5. Confirmação do Pedido
- Página com resumo do pedido realizado
- Número do pedido para acompanhamento

---

## Painel Administrativo

### 6. Login do Administrador
- Acesso protegido por autenticação (email/password)

### 7. Gestão do Cardápio
- **Adicionar** novos pratos com foto, nome, descrição, preço e categoria
- **Editar** qualquer item existente
- **Remover** itens do cardápio
- **Ativar/desativar** itens sem apagar
- Organizar por categorias

### 8. Gestão de Pedidos
- Visualizar pedidos recebidos
- Status do pedido (recebido, em preparação, pronto, entregue)

---

## Backend (Lovable Cloud / Supabase)
- Base de dados para armazenar o cardápio, pedidos e utilizadores
- Autenticação para o painel administrativo
- Storage para upload de imagens dos pratos
- Edge functions para integração com Stripe

---

## Categorias do Cardápio
1. 🍽️ Pratos Executivos
2. 🍔 Hambúrgueres
3. 🍢 Espetinhos
4. 🍰 Sobremesas
5. 🥤 Bebidas
6. 🥟 Pastéis

