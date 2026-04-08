const TermsPage = () => {
  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Termos & Condições</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Identificação do Responsável</h2>
          <p><strong>Nome:</strong> Tarso Souza Madeira</p>
          <p><strong>NIF:</strong> 307229661</p>
          <p><strong>Endereço:</strong> Rua da Marcha Gualteriana 606, 3º, Oliveira do Castelo, 4810-264 Guimarães, Portugal</p>
          <p><strong>Email:</strong> bistrogrillr@gmail.com</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Objeto</h2>
          <p>Os presentes Termos e Condições regulam o acesso e utilização do website Dom Bistro Grill, bem como a realização de encomendas e reservas através do mesmo.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Encomendas e Pagamentos</h2>
          <p>Ao realizar uma encomenda através do nosso website, o cliente compromete-se a fornecer informações verdadeiras e atualizadas. Os pagamentos são processados de forma segura através do Stripe. Os preços indicados incluem IVA à taxa legal em vigor.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Entregas</h2>
          <p>As entregas são realizadas na área de Guimarães e vizinhanças. O tempo estimado de entrega será comunicado no momento da confirmação da encomenda. A taxa de entrega varia conforme a distância.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Cancelamentos e Devoluções</h2>
          <p>O cancelamento de encomendas só é possível antes do início da preparação. Dada a natureza perecível dos produtos alimentares, não são aceites devoluções após a entrega, salvo em caso de produto defeituoso ou incorreto.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Reservas</h2>
          <p>As reservas estão sujeitas à disponibilidade e confirmação por parte do restaurante. O não comparecimento sem aviso prévio pode resultar em restrições futuras.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Propriedade Intelectual</h2>
          <p>Todos os conteúdos do website, incluindo textos, imagens e logótipos, são propriedade de Tarso Souza Madeira e estão protegidos pela legislação aplicável.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Lei Aplicável</h2>
          <p>Os presentes termos são regidos pela legislação portuguesa. Para qualquer litígio será competente o foro da comarca de Guimarães.</p>
        </section>
      </div>
    </main>
  );
};

export default TermsPage;
