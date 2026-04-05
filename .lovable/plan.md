

## Plano: Sistema de Reservas com Gestão no Painel Admin

### Visão Geral
Criar um sistema completo de reservas onde clientes podem agendar mesas pelo site, o pedido é enviado por email ao restaurante, e o administrador pode aceitar ou recusar reservas no painel.

---

### 1. Base de Dados — Tabela `reservations`

Criar tabela com os campos:
- `id`, `customer_name`, `customer_email`, `customer_phone`
- `date` (data da reserva), `time` (horário)
- `party_size` (número de pessoas)
- `notes` (observações)
- `status` (enum: `pending`, `confirmed`, `rejected`, `cancelled`)
- `created_at`, `updated_at`

Políticas RLS:
- Qualquer pessoa pode inserir (público — formulário sem login)
- Apenas admins podem ver, atualizar e apagar reservas

---

### 2. Página de Reservas (`/reserva`)

Nova página com formulário:
- Nome, email, telefone
- Data (calendário), horário (select com faixas horárias)
- Número de pessoas (select 1-20)
- Observações (textarea opcional)
- Validação com feedback visual
- Mensagem de confirmação após envio

---

### 3. Link na Página Principal

Adicionar um botão/secção na página inicial (Index.tsx) com link para `/reserva`, posicionado após a secção "Sobre Nós" ou no hero.

---

### 4. Notificação por Email

Usar o email do restaurante (`bistrogrillr@gmail.com`) — ao submeter a reserva, invocar uma Edge Function que notifica o admin por email com os detalhes da reserva.

---

### 5. Painel Admin — Aba "Reservas"

Nova aba no AdminDashboard com:
- Lista de reservas pendentes, confirmadas e rejeitadas
- Filtros por data e status
- Botões para **Aceitar** ou **Recusar** cada reserva
- Badge com contagem de pendentes
- Detalhes do cliente (nome, telefone, email, nº pessoas, data/hora, notas)

---

### 6. Rota no App.tsx

Adicionar rota `/reserva` apontando para a nova página.

---

### Detalhes Técnicos

- **Tabela**: `reservations` com RLS (INSERT público, SELECT/UPDATE/DELETE apenas admin)
- **Edge Function**: `notify-reservation` para envio de email ao admin
- **AdminDashboard.tsx**: Nova aba `reservations` no array de tabs, novo componente `ReservationManagement`
- **Nova página**: `src/pages/ReservationPage.tsx`
- **Index.tsx**: Secção CTA com link para `/reserva`
- **App.tsx**: Rota lazy-loaded `/reserva`

