import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { platformTheme } from '../../theme/platformTheme.js';

export default function Camera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const cameraRef = useRef(null);

  async function tirarFoto() {
    if (!cameraRef.current) {
      return;
    }

    const photo = await cameraRef.current.takePictureAsync();
    setPhotoUri(photo.uri);
  }

  if (!permission) {
    return <View style={styles.wrapper} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.title}>Câmera</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Permitir câmera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Câmera</Text>
      {!photoUri ? (
        <>
          <Pressable style={styles.button} onPress={tirarFoto}>
            <Text style={styles.buttonText}>Tirar foto</Text>
          </Pressable>
          <CameraView ref={cameraRef} facing='front' style={styles.camera} />
        </>
      ) : (
        <>
          <Pressable style={styles.button} onPress={() => setPhotoUri(null)}>
            <Text style={styles.buttonText}>Tirar outra foto</Text>
          </Pressable>
          <Image source={{ uri: photoUri }} style={styles.camera} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: platformTheme.titleText,
  },
  button: {
    backgroundColor: platformTheme.logoutBackground,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: platformTheme.controlRadius,
    alignItems: 'center',
  },
  buttonText: {
    color: platformTheme.logoutText,
    fontWeight: '700',
  },
  camera: {
    width: '100%',
    height: 240,
    borderRadius: platformTheme.surfaceRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: platformTheme.controlBorder,
  },
});
