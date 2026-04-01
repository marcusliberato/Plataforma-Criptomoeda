import './MarketPage.css';
import AuthGate from '../auth/AuthGate.jsx';
import MarketOverview from './MarketOverview.jsx';
import NavigationMenu from '../navigation/NavigationMenu.jsx';
import useSwipeNavigation from '../../hooks/useSwipeNavigation.jsx';

export default function MarketPage() {
  useSwipeNavigation();

  return (
    <AuthGate unauthenticatedMode='redirect'>
      {({ username, logout }) => (
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

              <p className='header-project'>Projeto de Bloco 5</p>

              <div className='nav-actions'>
                <a className='ghost-button nav-link' href='/'>
                  Início
                </a>
                <a className='ghost-button nav-link active' href='/mercado.html'>
                  Mercado
                </a>
                <a className='ghost-button nav-link' href='/imagens.html'>
                  Imagens
                </a>
                <button className='ghost-button nav-link' type='button' onClick={logout}>
                  Sair
                </button>
              </div>

              <div className='page-header-user'>
                <span className='user-badge' aria-label={`Usuário autenticado: ${username}`}>
                  Usuário: {username}
                </span>
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
              <a href='/imagens.html'>Imagens</a>
            </div>
          </footer>
        </div>
      )}
    </AuthGate>
  );
}
