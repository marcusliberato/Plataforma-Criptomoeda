import { useRef, useState } from 'react';
import {
  CameraView,
  useCameraPermissions,
} from './cameraCompat.web.jsx';
import './MediaPanel.css';

export default function Camera({ onCapture }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const cameraRef = useRef(null);

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

      <p className='mobile-device-status'>{statusMessage}</p>
    </section>
  );
}
