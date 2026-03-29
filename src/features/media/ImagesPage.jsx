import '../../App.css';
import AuthGate from '../auth/AuthGate.jsx';
import NavigationMenu from '../navigation/NavigationMenu.jsx';
import useSwipeNavigation from '../../hooks/useSwipeNavigation.jsx';
import Camera from './Camera.jsx';
import GaleriaCamera from './GaleriaCamera.jsx';
import './ImagesPage.css';

export default function ImagesPage() {
  useSwipeNavigation();

  return (
    <AuthGate
      title='Entrar na área de imagens'
      description='Autentique-se para acessar os recursos de câmera e galeria.'
    >
      {({ username, logout }) => (
        <div className='app page-shell'>
          <header className='hero page-header'>
            <nav className='nav'>
              <div className='brand'>
                <span className='brand-dot' aria-hidden='true' />
                <div>
                  <p className='brand-title'>Criptmoeda</p>
                  <p className='brand-subtitle'>Recursos de imagem</p>
                </div>
              </div>

              <p className='header-project'>Projeto de Bloco 5</p>

              <div className='nav-actions'>
                <a className='ghost-button nav-link' href='/'>
                  Início
                </a>
                <a className='ghost-button nav-link' href='/mercado.html'>
                  Mercado
                </a>
                <a className='ghost-button nav-link active' href='/imagens.html'>
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
                <a className='ghost-button link-button' href='/mercado.html'>
                  Voltar para mercado
                </a>
              </div>

              <div className='images-page-grid'>
                <GaleriaCamera />
                <Camera />
              </div>

              <NavigationMenu />
            </section>
          </main>

          <footer className='footer'>
            <div>
              <p className='brand-title'>Criptmoeda</p>
              <p>Painel dedicado a captura e seleção de imagens.</p>
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
