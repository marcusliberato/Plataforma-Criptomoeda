import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function GaleriaCamera() {
  const [imageUri, setImageUri] = useState(null);

  async function escolherImagem() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Galeria</Text>
      <Pressable style={styles.button} onPress={escolherImagem}>
        <Text style={styles.buttonText}>Escolher imagem</Text>
      </Pressable>

      {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : null}
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
  },
  button: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 20,
  },
});
