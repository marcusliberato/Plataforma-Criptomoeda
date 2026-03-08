import './TransactionsPage.css';

const notes = [
  'Este sistema nao executa compra e venda de criptomoedas.',
  'As telas exibem apenas dados publicos retornados pelas APIs das exchanges.',
  'Use a pagina Mercado para acompanhar pares, ultimo preco e livro de ofertas.',
];

export default function TransactionsPage() {
  return (
    <div className='app page-shell'>
      <header className='hero page-header'>
        <nav className='nav'>
          <div className='brand'>
            <span className='brand-dot' aria-hidden='true' />
            <div>
              <p className='brand-title'>Criptmoeda</p>
              <p className='brand-subtitle'>Informacoes do sistema</p>
            </div>
          </div>

          <div className='nav-actions'>
            <a className='ghost-button nav-link' href='/'>
              Início
            </a>
            <a className='ghost-button nav-link' href='/mercado.html'>
              Mercado
            </a>
            <a className='ghost-button nav-link active' href='/transacoes.html'>
              Transações
            </a>
          </div>
        </nav>
      </header>

      <main className='page-main'>
        <section className='section'>
          <div className='section-header'>
            <div>
              <p className='section-tag'>Escopo da aplicacao</p>
              <h2>Sem negociacao de ativos</h2>
              <p className='market-meta'>
                Esta pagina substitui o historico de transações para evitar
                dados simulados.
              </p>
            </div>
            <a className='ghost-button link-button' href='/mercado.html'>
              Ir para mercado
            </a>
          </div>

          <div className='transaction-list transaction-page-list'>
            {notes.map((note) => (
              <article key={note} className='transaction-item'>
                <div>
                  <p className='transaction-type'>Informacao</p>
                  <p className='transaction-asset'>{note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className='footer'>
        <div>
          <p className='brand-title'>Criptmoeda</p>
          <p>Painel somente leitura com dados de APIs.</p>
        </div>

        <div className='footer-links'>
          <a href='/'>Início</a>
          <a href='/mercado.html'>Mercado</a>
          <a href='/transacoes.html'>Transações</a>
        </div>
      </footer>
    </div>
  );
}
