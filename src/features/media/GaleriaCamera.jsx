import { useEffect, useRef, useState } from 'react';
import * as ImagePicker from './imagePicker.web.js';
import './MediaPanel.css';

export default function GaleriaCamera() {
  const platform = 'web';
  const [imageUri, setImageUri] = useState(null);
  const [statusMessage, setStatusMessage] = useState(
    'Use o botão abaixo para selecionar uma imagem com o Image Picker.',
  );
  const objectUrlRef = useRef('');

  function updateImageUri(nextUri) {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }

    if (typeof nextUri === 'string' && nextUri.startsWith('blob:')) {
      objectUrlRef.current = nextUri;
    }

    setImageUri(nextUri || null);
  }

  useEffect(() => {
    const body = document.body;
    body.classList.remove('platform-ios', 'platform-android', 'platform-web');
    body.classList.add('platform-web');

    return () => {
      body.classList.remove('platform-web');
    };
  }, []);

  useEffect(
    () => () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    },
    [],
  );

  async function escolherImagem() {
    try {
      setStatusMessage('Abrindo Image Picker...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        window.alert('Permissão negada');
        setStatusMessage(
          platform === 'android'
            ? 'Permissão negada no Android. Habilite mídia/imagens nas configurações do app.'
            : 'Não foi possível liberar o acesso à galeria.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        updateImageUri(result.assets[0].uri);
        setStatusMessage('Imagem selecionada com o Image Picker.');
        return;
      }

      setStatusMessage('Nenhuma imagem foi selecionada.');
    } catch (error) {
      console.error(error);
      setStatusMessage('Não foi possível abrir o Image Picker no dispositivo.');
    }
  }

  return (
    <section className='mobile-device-section'>
      <div className='mobile-device-header'>
        <div>
          <p className='section-tag'>Recursos nativos</p>
          <h2>Galeria com Image Picker</h2>
          <p className='market-meta'>
            Exemplo de seleção de imagem da galeria usando a interface do Image Picker.
          </p>
        </div>
      </div>

      <p className='platform-help'>
        {platform === 'ios'
          ? 'No iOS, a galeria segue o fluxo de permissões do sistema.'
          : null}
        {platform === 'android'
          ? 'No Android, o app solicita acesso à mídia antes do uso.'
          : null}
        {platform === 'web'
          ? 'Na Web, a seleção depende do navegador.'
          : null}
      </p>

      <div className='mobile-device-actions'>
        <button className='ghost-button' type='button' onClick={escolherImagem}>
          Escolher imagem
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
