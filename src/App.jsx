import './App.css';
import MarketOverview from './components/MarketOverview.jsx';

export default function App() {
  return (
    <div className='app page-shell'>
      <header className='hero page-header'>
        <nav className='nav'>
          <div className='brand'>
            <span className='brand-dot' aria-hidden='true' />
            <div>
              <p className='brand-title'>Criptmoeda</p>
              <p className='brand-subtitle'>Painel informativo</p>
            </div>
          </div>

          <div className='nav-actions'>
            <a className='ghost-button nav-link active' href='/'>
              Início
            </a>
            <a className='ghost-button nav-link' href='/mercado.html'>
              Mercado
            </a>
            <a className='ghost-button nav-link' href='/transacoes.html'>
              Transações
            </a>
          </div>
        </nav>
      </header>

      <main className='page-main'>
        <section className='section'>
          <div className='section-header'>
            <div>
              <p className='section-tag'>Dados de mercado</p>
              <h2>Cotações, pares livos e ofertas</h2>
              <p className='market-meta'>
                Leitura com dados publicos de Binance e Bybit.
              </p>
            </div>
          </div>

          <MarketOverview />
        </section>
      </main>

      <footer className='footer'>
        <div>
          <p className='brand-title'>Criptmoeda</p>
          <p className='brand-subtitle'>Painel Informativo</p>
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
