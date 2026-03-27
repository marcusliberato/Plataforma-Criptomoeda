import './MercadoPage.css';
import MarketOverview from './MarketOverview.jsx';
import NavigationMenu from './NavigationMenu.jsx';
import useSwipeNavigation from '../hooks/useSwipeNavigation.jsx';

export default function MercadoPage() {
  useSwipeNavigation();

  return (
    <div className='app page-shell'>
      <header className='hero page-header'>
        <nav className='nav'>
          <div className='brand'>
            <span className='brand-dot' aria-hidden='true' />
            <div>
              <p className='brand-title'>Criptmoeda</p>
              <p className='brand-subtitle'>Mercado em tempo real</p>
            </div>
          </div>

          <div className='nav-actions'>
            <a className='ghost-button nav-link' href='/'>
              Início
            </a>
            <a className='ghost-button nav-link active' href='/mercado.html'>
              Mercado
            </a>
          </div>
        </nav>
      </header>

      <main className='page-main'>
        <section className='section'>
          <div className='section-header'>
            <div>
              <p className='section-tag'>Mercado dedicado</p>
              <h2>Pares, ultimo preco e livro de ofertas</h2>
              <p className='market-meta'>
                Selecione exchange e par para acompanhar os dados ao vivo.
              </p>
            </div>
            <a className='ghost-button link-button' href='/'>
              Voltar para home
            </a>
          </div>

          <MarketOverview />
          <NavigationMenu />
        </section>
      </main>

      <footer className='footer'>
        <div>
          <p className='brand-title'>Criptmoeda</p>
          <p>Painel dedicado de monitoramento de mercado.</p>
        </div>

        <div className='footer-links'>
          <a href='/'>Início</a>
          <a href='/mercado.html'>Mercado</a>
        </div>
      </footer>
    </div>
  );
}
