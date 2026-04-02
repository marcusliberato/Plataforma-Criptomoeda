import './App.css';
import MarketHighlights from './features/market/MarketHighlights.jsx';
import NavigationMenu from './features/navigation/NavigationMenu.jsx';
import useAuthSession from './features/auth/useAuthSession.js';
import useSwipeNavigation from './hooks/useSwipeNavigation.jsx';

export default function App() {
  useSwipeNavigation();
  const { isAuthenticated, username, logout } = useAuthSession();

  function handleLogout() {
    logout();
    window.location.replace('/');
  }

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

          <p className='header-project'>Projeto de Bloco 5</p>

          <div className='nav-actions'>
            <a className='ghost-button nav-link active' href='/'>
              Início
            </a>
            <a className='ghost-button nav-link' href='/mercado.html'>
              Mercado
            </a>
            <a className='ghost-button nav-link' href='/imagens.html'>
              Imagens
            </a>
            {isAuthenticated ? (
              <button className='ghost-button nav-link' type='button' onClick={handleLogout}>
                Sair
              </button>
            ) : null}
          </div>

          {isAuthenticated ? (
            <div className='page-header-user'>
              <span className='user-badge' aria-label={`Usuário autenticado: ${username}`}>
                Usuário: {username}
              </span>
            </div>
          ) : null}
        </nav>
      </header>

      <main className='page-main'>
        <section className='section'>
          <div className='section-header'>
            <div>
              <p className='section-tag'>Mercado cripto</p>
              <h2>Resumo das principais criptomoedas</h2>
              <p className='market-meta'>
                BTC, ETH, XRP, SOL e USDC com atualização pública nas últimas 24 horas.
              </p>
            </div>
          </div>

          <MarketHighlights />
          <NavigationMenu />
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
          <a href='/imagens.html'>Imagens</a>
        </div>
      </footer>
    </div>
  );
}
