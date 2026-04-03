import { useEffect, useRef, useState } from 'react';
import {
  CameraView,
  useCameraPermissions,
} from './cameraCompat.web.jsx';
import './MediaPanel.css';

export default function Camera({ onCapture }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(
    () => () => {
      if (photoUri?.startsWith('blob:')) {
        URL.revokeObjectURL(photoUri);
      }
    },
    [photoUri],
  );

  async function tirarFoto() {
    if (!cameraRef.current) {
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
      setStatusMessage('Foto capturada. Escolha salvar na galeria ou descartar.');
    } catch {
      window.alert('Erro: Não foi possível tirar a foto.');
    }
  }

  function abrirCapturaFallback() {
    fileInputRef.current?.click();
  }

  function selecionarArquivoFallback(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const uri = URL.createObjectURL(file);
    setPhotoUri((currentPhotoUri) => {
      if (currentPhotoUri?.startsWith('blob:')) {
        URL.revokeObjectURL(currentPhotoUri);
      }
      return uri;
    });
    setStatusMessage('Foto selecionada pelo navegador. Escolha salvar na galeria ou descartar.');
    // Permite selecionar o mesmo arquivo novamente em tentativas futuras.
    event.target.value = '';
  }

  function salvarNaGaleria() {
    if (!photoUri) {
      return;
    }

    onCapture?.(photoUri);
    window.alert('Foto salva na galeria com sucesso.');
    setPhotoUri(null);
    setStatusMessage('');
  }

  function descartarFoto() {
    if (photoUri?.startsWith('blob:')) {
      URL.revokeObjectURL(photoUri);
    }
    setPhotoUri(null);
    setStatusMessage('Foto descartada. Você pode capturar uma nova imagem.');
  }

  return (
    <section className='mobile-device-section camera-shell'>
      <div className='mobile-device-header mobile-device-header-centered'>
        <div>
          <h2>Câmera do dispositivo</h2>
          <p>Use a webcam para capturar novas imagens.</p>
        </div>
      </div>

      {!permission.granted ? (
        <div className='mobile-device-actions'>
          <button
            className='ghost-button camera-button'
            type='button'
            onClick={requestPermission}
          >
            Permitir câmera
          </button>
          <button
            className='ghost-button camera-button'
            type='button'
            onClick={abrirCapturaFallback}
          >
            Usar câmera do navegador
          </button>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            capture='user'
            onChange={selecionarArquivoFallback}
            style={{ display: 'none' }}
          />
        </div>
      ) : !photoUri ? (
        <>
          <div className='mobile-device-actions'>
            <button
              className='ghost-button camera-button'
              type='button'
              onClick={tirarFoto}
            >
              Tirar foto
            </button>
          </div>
          <div className='mobile-device-preview camera-preview'>
            <CameraView ref={cameraRef} facing='front' className='camera-frame'>
              <div className='camera-overlay'>Preview da câmera</div>
            </CameraView>
          </div>
        </>
      ) : (
        <>
          <div className='mobile-device-actions'>
            <button
              className='ghost-button camera-button'
              type='button'
              onClick={descartarFoto}
            >
              Tirar outra foto
            </button>
          </div>
          <div className='mobile-device-preview camera-preview'>
            <img className='camera-image' src={photoUri} alt='Foto capturada' />
          </div>
          <div className='mobile-device-actions camera-decision-actions'>
            <button
              className='ghost-button camera-button camera-save-button'
              type='button'
              onClick={salvarNaGaleria}
            >
              Salvar na galeria
            </button>
            <button
              className='ghost-button camera-button camera-discard-button'
              type='button'
              onClick={descartarFoto}
            >
              Descartar
            </button>
          </div>
        </>
      )}

      <p className='mobile-device-status'>
        {statusMessage || (!permission.granted ? permission.reason : '')}
      </p>
    </section>
  );
}
