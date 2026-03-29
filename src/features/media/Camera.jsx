import { useRef, useState } from 'react';
import {
  CameraView,
  useCameraPermissions,
} from './cameraCompat.web.jsx';
import './MediaPanel.css';

export default function Camera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const cameraRef = useRef(null);

  async function tirarFoto() {
    if (!cameraRef.current) {
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
    } catch {
      window.alert('Erro: Não foi possível tirar a foto.');
    }
  }

  return (
    <section className='camera-shell'>
      <div className='camera-heading'>
        <p className='section-tag'>Expo Camera</p>
        <h2>Câmera do dispositivo</h2>
        <p className='market-meta'>
          Use o componente <code>Camera</code> para solicitar permissão e tirar
          fotos.
        </p>
      </div>

      {!permission.granted ? (
        <button
          className='ghost-button camera-button'
          type='button'
          onClick={requestPermission}
        >
          Permitir câmera
        </button>
      ) : !photoUri ? (
        <>
          <button
            className='ghost-button camera-button'
            type='button'
            onClick={tirarFoto}
          >
            Tirar foto
          </button>
          <CameraView ref={cameraRef} facing='front' className='camera-frame'>
            <div className='camera-overlay'>Preview da câmera</div>
          </CameraView>
        </>
      ) : (
        <>
          <button
            className='ghost-button camera-button'
            type='button'
            onClick={() => setPhotoUri(null)}
          >
            Tirar outra foto
          </button>
          <img className='camera-image' src={photoUri} alt='Foto capturada' />
        </>
      )}
    </section>
  );
}
