import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import './MobileCameraSection.css';

const platformLabels = {
  ios: 'iOS',
  android: 'Android',
  web: 'Web',
};

export default function MobileCameraSection() {
  const [platform, setPlatform] = useState('web');
  const [imageUri, setImageUri] = useState('');
  const [statusMessage, setStatusMessage] = useState(
    'Use os botões abaixo para capturar uma foto ou selecionar uma imagem da galeria.',
  );

  useEffect(() => {
    const currentPlatform = Capacitor.getPlatform();
    setPlatform(currentPlatform);
    const body = document.body;
    body.classList.remove('platform-ios', 'platform-android', 'platform-web');
    body.classList.add(`platform-${currentPlatform}`);

    return () => {
      body.classList.remove(`platform-${currentPlatform}`);
    };
  }, []);

  async function takePhoto(source, successText) {
    try {
      setStatusMessage('Solicitando permissão...');
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source,
      });

      const uri =
        photo.webPath ||
        photo.path ||
        (photo.base64String
          ? `data:image/jpeg;base64,${photo.base64String}`
          : '');
      if (!uri) {
        setStatusMessage('Nenhuma imagem foi selecionada ou capturada.');
        return;
      }

      setImageUri(uri);
      setStatusMessage(successText);
    } catch (error) {
      console.error(error);
      setStatusMessage(
        'Não foi possível acessar o recurso nativo do dispositivo.',
      );
    }
  }

  return (
    <section className='mobile-device-section'>
      <div className='mobile-device-header'>
        <div>
          <p className='section-tag'>Recursos nativos</p>
          <h2>Câmera e galeria do dispositivo</h2>
          <p className='market-meta'>
            Acesse a câmera ou selecione imagens direto do dispositivo no app
            mobile.
          </p>
        </div>

        <div className='platform-badge'>
          Plataforma: {platformLabels[platform] ?? platform}
        </div>
      </div>

      <div className='mobile-device-actions'>
        <button
          className='ghost-button'
          type='button'
          onClick={() => takePhoto(CameraSource.Photos, 'Imagem selecionada.')}
        >
          Selecionar da galeria
        </button>
        <button
          className='ghost-button'
          type='button'
          onClick={() => takePhoto(CameraSource.Camera, 'Foto capturada.')}
        >
          Tirar foto
        </button>
      </div>

      <div className='mobile-device-preview'>
        {imageUri ? (
          <img src={imageUri} alt='Imagem do dispositivo' />
        ) : (
          <div className='mobile-device-empty'>
            Nenhuma imagem selecionada ainda.
          </div>
        )}
      </div>

      <p className='mobile-device-status'>{statusMessage}</p>
    </section>
  );
}
