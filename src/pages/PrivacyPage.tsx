const PrivacyPage = () => {
  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Política de Privacidade</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Responsável pelo Tratamento</h2>
          <p><strong>Nome:</strong> Tarso Souza Madeira</p>
          <p><strong>NIF:</strong> 307229661</p>
          <p><strong>Endereço:</strong> Rua da Marcha Gualteriana 606, 3º, Oliveira do Castelo, 4810-264 Guimarães, Portugal</p>
          <p><strong>Email:</strong> bistrogrillr@gmail.com</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Dados Recolhidos</h2>
          <p>Recolhemos os seguintes dados pessoais quando utiliza o nosso website:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nome completo</li>
            <li>Endereço de email</li>
            <li>Número de telefone</li>
            <li>Morada de entrega (quando aplicável)</li>
            <li>Dados de navegação (cookies)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Finalidade do Tratamento</h2>
          <p>Os dados pessoais são tratados para as seguintes finalidades:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Processamento e entrega de encomendas</li>
            <li>Gestão de reservas</li>
            <li>Comunicação com o cliente sobre o estado do pedido</li>
            <li>Cumprimento de obrigações legais e fiscais</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Base Legal</h2>
          <p>O tratamento dos dados baseia-se na execução de contrato (encomendas e reservas), no consentimento do titular e no cumprimento de obrigações legais, em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Partilha de Dados</h2>
          <p>Os dados podem ser partilhados com:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Stripe (processamento de pagamentos)</li>
            <li>Serviços de entrega (quando aplicável)</li>
          </ul>
          <p>Não vendemos nem cedemos dados pessoais a terceiros para fins de marketing.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Conservação dos Dados</h2>
          <p>Os dados são conservados pelo período necessário ao cumprimento das finalidades para as quais foram recolhidos, e em conformidade com as obrigações legais aplicáveis.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Direitos do Titular</h2>
          <p>Nos termos do RGPD, tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Aceder aos seus dados pessoais</li>
            <li>Retificar dados incorretos</li>
            <li>Solicitar a eliminação dos dados</li>
            <li>Opor-se ao tratamento</li>
            <li>Portabilidade dos dados</li>
          </ul>
          <p>Para exercer os seus direitos, contacte-nos através do email <a href="mailto:bistrogrillr@gmail.com" className="text-primary hover:underline">bistrogrillr@gmail.com</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Cookies</h2>
          <p>O nosso website utiliza cookies essenciais para o funcionamento do serviço. Ao continuar a navegar, consente a utilização destes cookies.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Alterações</h2>
          <p>Reservamo-nos o direito de atualizar esta política a qualquer momento. A data da última atualização será indicada no topo desta página.</p>
          <p className="text-xs mt-4">Última atualização: Abril 2026</p>
        </section>
      </div>
    </main>
  );
};

export default PrivacyPage;
