import { useEffect, useRef, useState } from 'react';
import '../../App.css';
import AuthGate from '../auth/AuthGate.jsx';
import NavigationMenu from '../navigation/NavigationMenu.jsx';
import useSwipeNavigation from '../../hooks/useSwipeNavigation.jsx';
import Camera from './Camera.jsx';
import GaleriaCamera from './GaleriaCamera.jsx';
import './ImagesPage.css';

export default function ImagesPage() {
  useSwipeNavigation();
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryStatusMessage, setGalleryStatusMessage] = useState('');
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const galleryImagesRef = useRef([]);

  useEffect(() => {
    galleryImagesRef.current = galleryImages;
  }, [galleryImages]);

  useEffect(
    () => () => {
      galleryImagesRef.current.forEach((imageItem) => {
        if (imageItem.uri.startsWith('blob:')) {
          URL.revokeObjectURL(imageItem.uri);
        }
      });
    },
    [],
  );

  function handleGalleryImageAdd(nextImage, nextStatus) {
    if (nextImage) {
      setGalleryImages((currentImages) => [...currentImages, nextImage]);
    }

    if (nextStatus) {
      setGalleryStatusMessage(nextStatus);
    }
  }

  function handleCameraCapture(photoUri) {
    handleGalleryImageAdd(
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        uri: photoUri,
        source: 'camera',
      },
      '',
    );
  }

  function handleImageSelectionToggle(imageId) {
    setSelectedImageIds((currentIds) =>
      currentIds.includes(imageId)
        ? currentIds.filter((currentId) => currentId !== imageId)
        : [...currentIds, imageId],
    );
  }

  function handleDeleteSelectedImages() {
    if (!selectedImageIds.length) {
      return;
    }

    setGalleryImages((currentImages) => {
      currentImages.forEach((imageItem) => {
        if (selectedImageIds.includes(imageItem.id) && imageItem.uri.startsWith('blob:')) {
          URL.revokeObjectURL(imageItem.uri);
        }
      });

      return currentImages.filter((imageItem) => !selectedImageIds.includes(imageItem.id));
    });

    setSelectedImageIds([]);
    setGalleryStatusMessage('');
    window.alert('Imagens selecionadas removidas da galeria.');
  }

  function handleLogout(logout) {
    logout();
    window.location.replace('/');
  }

  return (
    <AuthGate
      title='Acessar imagens'
      description='Entre com usuário e senha para usar a câmera e gerenciar a galeria do projeto.'
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
                <button
                  className='ghost-button nav-link'
                  type='button'
                  onClick={() => handleLogout(logout)}
                >
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
                <GaleriaCamera
                  imageItems={galleryImages}
                  selectedImageIds={selectedImageIds}
                  statusMessage={galleryStatusMessage}
                  onImageAdd={handleGalleryImageAdd}
                  onImageSelectionToggle={handleImageSelectionToggle}
                  onDeleteSelectedImages={handleDeleteSelectedImages}
                />
                <Camera onCapture={handleCameraCapture} />
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
