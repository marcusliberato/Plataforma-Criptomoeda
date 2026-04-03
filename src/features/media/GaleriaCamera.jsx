import * as ImagePicker from './imagePicker.web.js';
import './MediaPanel.css';

export default function GaleriaCamera({
  imageItems = [],
  selectedImageIds = [],
  statusMessage = '',
  onImageAdd,
  onImageSelectionToggle,
  onDeleteSelectedImages,
}) {
  async function escolherImagem() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        window.alert('Permissão negada');
        onImageAdd?.(
          null,
          'Não foi possível liberar o acesso à galeria.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        onImageAdd?.(
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            uri: result.assets[0].uri,
            source: 'gallery',
          },
          'Imagem adicionada à galeria.',
        );
        return;
      }

      onImageAdd?.(null, '');
    } catch (error) {
      console.error(error);
      onImageAdd?.(null, 'Não foi possível abrir o Image Picker no dispositivo.');
    }
  }

  return (
    <section className='mobile-device-section'>
      <div className='mobile-device-header mobile-device-header-centered'>
        <div>
          <h2>Galeria de Imagens</h2>
          <p>Selecione uma imagem do dispositivo.</p>
        </div>
      </div>

      <div className='mobile-device-actions'>
        <button className='ghost-button' type='button' onClick={escolherImagem}>
          Escolher imagem
        </button>
        <button
          className='ghost-button gallery-delete-button'
          type='button'
          onClick={onDeleteSelectedImages}
          disabled={!selectedImageIds.length}
        >
          Apagar selecionadas
        </button>
      </div>

      <div className='mobile-device-preview mobile-device-gallery'>
        {imageItems.length ? (
          <div className='mobile-device-grid'>
            {imageItems.map((imageItem, index) => (
              <button
                className={`mobile-device-thumb ${
                  selectedImageIds.includes(imageItem.id) ? 'is-selected' : ''
                }`}
                key={imageItem.id}
                type='button'
                onClick={() => onImageSelectionToggle?.(imageItem.id)}
                aria-pressed={selectedImageIds.includes(imageItem.id)}
                aria-label={`Selecionar imagem ${index + 1} da galeria`}
              >
                <img
                  src={imageItem.uri}
                  alt={`Imagem ${index + 1} da galeria`}
                />
              </button>
            ))}
          </div>
        ) : (
          <div className='mobile-device-empty'>
            Nenhuma imagem selecionada ainda.
          </div>
        )}
      </div>

      {statusMessage ? <p className='mobile-device-status'>{statusMessage}</p> : null}
    </section>
  );
}
