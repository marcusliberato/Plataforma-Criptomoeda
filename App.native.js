import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import AuthGate from './src/native/features/auth/AuthGate.jsx';
import Camera from './src/native/features/media/Camera.jsx';
import GaleriaCamera from './src/native/features/media/GaleriaCamera.jsx';
import MarketHighlights from './src/native/features/market/MarketHighlights.jsx';
import MarketOverview from './src/native/features/market/MarketOverview.jsx';

function Header({ username, onNavigate, onLogout, currentScreen }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>Criptmoeda</Text>
        <Text style={styles.brandSubtitle}>Painel informativo</Text>
      </View>

      <View style={styles.headerActions}>
        <Pressable
          style={[styles.navButton, currentScreen === 'home' && styles.navButtonActive]}
          onPress={() => onNavigate('home')}
        >
          <Text style={[styles.navButtonText, currentScreen === 'home' && styles.navButtonTextActive]}>
            Início
          </Text>
        </Pressable>
        <Pressable
          style={[styles.navButton, currentScreen === 'mercado' && styles.navButtonActive]}
          onPress={() => onNavigate('mercado')}
        >
          <Text
            style={[
              styles.navButtonText,
              currentScreen === 'mercado' && styles.navButtonTextActive,
            ]}
          >
            Mercado
          </Text>
        </Pressable>
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </View>

      <Text style={styles.userText}>Usuário: {username}</Text>
    </View>
  );
}

function HomeScreen({ onOpenMarket }) {
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <Text style={styles.screenTitle}>Resumo das principais criptomoedas</Text>
      <Text style={styles.screenDescription}>
        A página inicial mostra apenas BTC, ETH, XRP, SOL e USDC.
      </Text>
      <MarketHighlights onOpenMarket={onOpenMarket} />
    </ScrollView>
  );
}

function MercadoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <Text style={styles.screenTitle}>Mercado</Text>
      <Text style={styles.screenDescription}>
        Acompanhe pares com maior volume e utilize câmera e galeria no app.
      </Text>
      <MarketOverview />
      <GaleriaCamera />
      <Camera />
    </ScrollView>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');

  return (
    <AuthGate
      title='Entrar na plataforma'
      description='Realize login para acessar as páginas internas.'
    >
      {({ username, logout }) => {
        return (
          <SafeAreaView style={styles.safeArea}>
            <StatusBar style='dark' />
            <Header
              username={username}
              onNavigate={setScreen}
              onLogout={logout}
              currentScreen={screen}
            />
            {screen === 'home' ? (
              <HomeScreen onOpenMarket={() => setScreen('mercado')} />
            ) : (
              <MercadoScreen />
            )}
          </SafeAreaView>
        );
      }}
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#f8f5ff',
    gap: 12,
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2a56',
  },
  brandSubtitle: {
    color: '#667085',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  navButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  navButtonActive: {
    backgroundColor: '#dfe4ff',
  },
  navButtonText: {
    color: '#334155',
    fontWeight: '700',
  },
  navButtonTextActive: {
    color: '#3730a3',
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#111827',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
  },
  userText: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  screenContent: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#101828',
  },
  screenDescription: {
    color: '#51607a',
    fontSize: 16,
    lineHeight: 22,
  },
});
