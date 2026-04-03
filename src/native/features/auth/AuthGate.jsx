import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import useAuthSession from './useAuthSession.js';
import { platformTheme } from '../../theme/platformTheme.js';

export default function AuthGate({ children, title, description }) {
  const { isAuthenticated, username, isLoading, isCheckingSession, login, logout } =
    useAuthSession();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  async function onSubmit() {
    setError('');
    const result = await login(credentials.username, credentials.password);
    if (!result.ok) {
      setError(result.error);
    }
  }

  if (isCheckingSession) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size='large' color={platformTheme.accent} />
        <Text style={styles.helperText}>Validando sessão...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.authShell}>
        <View style={styles.authCard}>
          <Text style={styles.brand}>Criptmoeda</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <TextInput
            style={styles.input}
            placeholder='Usuário'
            autoCapitalize='none'
            value={credentials.username}
            onChangeText={(value) =>
              setCredentials((current) => ({ ...current, username: value }))
            }
          />
          <TextInput
            style={styles.input}
            placeholder='Senha'
            secureTextEntry
            value={credentials.password}
            onChangeText={(value) =>
              setCredentials((current) => ({ ...current, password: value }))
            }
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.submitButton} onPress={onSubmit} disabled={isLoading}>
            <Text style={styles.submitText}>{isLoading ? 'Entrando...' : 'Entrar'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return children({ username, logout });
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: platformTheme.appBackground,
  },
  helperText: {
    color: platformTheme.mutedText,
  },
  authShell: {
    flex: 1,
    backgroundColor: platformTheme.appBackground,
    justifyContent: 'center',
    padding: 24,
  },
  authCard: {
    backgroundColor: platformTheme.cardBackground,
    borderRadius: platformTheme.surfaceRadius,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: platformTheme.controlBorder,
    ...platformTheme.surfaceShadow,
  },
  brand: {
    fontSize: 24,
    fontWeight: '700',
    color: platformTheme.titleText,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: platformTheme.titleText,
  },
  description: {
    color: platformTheme.mutedText,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: platformTheme.controlBorder,
    borderRadius: platformTheme.controlRadius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: platformTheme.controlBackground,
  },
  error: {
    color: '#c03838',
  },
  submitButton: {
    backgroundColor: platformTheme.accent,
    borderRadius: platformTheme.controlRadius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
  },
});
