export const MediaTypeOptions = {
  Images: 'images',
};

function createFileInput({ capture } = {}) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  if (capture) {
    input.setAttribute('capture', capture);
  }

  return input;
}

function pickImage(options = {}) {
  return new Promise((resolve) => {
    const input = createFileInput(options);

    input.addEventListener(
      'change',
      () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        resolve({
          fileName: file.name,
          mimeType: file.type || 'image/jpeg',
          uri: URL.createObjectURL(file),
        });
      },
      { once: true },
    );

    input.click();
  });
}

export async function requestMediaLibraryPermissionsAsync() {
  return { granted: true, status: 'granted' };
}

export async function requestCameraPermissionsAsync() {
  return { granted: true, status: 'granted' };
}

export async function launchImageLibraryAsync(options = {}) {
  const asset = await pickImage();

  if (!asset) {
    return {
      canceled: true,
      assets: [],
    };
  }

  return {
    canceled: false,
    assets: [asset],
    options,
  };
}

export async function launchCameraAsync(options = {}) {
  const asset = await pickImage({ capture: 'environment' });

  if (!asset) {
    return {
      canceled: true,
      assets: [],
    };
  }

  return {
    canceled: false,
    assets: [asset],
    options,
  };
}
