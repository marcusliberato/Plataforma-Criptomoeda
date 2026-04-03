import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { platformTheme } from '../../theme/platformTheme.js';

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
    color: platformTheme.titleText,
  },
  button: {
    backgroundColor: platformTheme.controlBackground,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: platformTheme.controlRadius,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: platformTheme.controlBorder,
  },
  buttonText: {
    color: platformTheme.accent,
    fontWeight: '700',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: platformTheme.surfaceRadius,
    borderWidth: 1,
    borderColor: platformTheme.controlBorder,
  },
});
