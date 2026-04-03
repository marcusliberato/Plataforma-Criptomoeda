import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import AuthGate from './src/native/features/auth/AuthGate.jsx';
import Camera from './src/native/features/media/Camera.jsx';
import GaleriaCamera from './src/native/features/media/GaleriaCamera.jsx';
import MarketHighlights from './src/native/features/market/MarketHighlights.jsx';
import MarketOverview from './src/native/features/market/MarketOverview.jsx';
import { platformTheme } from './src/native/theme/platformTheme.js';

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

      <View style={styles.headerMeta}>
        <Text style={styles.userText}>Usuário: {username}</Text>
        <Text style={styles.platformBadge}>App nativo {platformTheme.label}</Text>
      </View>
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
    backgroundColor: platformTheme.appBackground,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: platformTheme.headerTopPadding,
    paddingBottom: 16,
    backgroundColor: platformTheme.headerBackground,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: platformTheme.controlBorder,
    ...platformTheme.surfaceShadow,
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: platformTheme.titleText,
  },
  brandSubtitle: {
    color: platformTheme.mutedText,
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
    borderRadius: platformTheme.controlRadius,
    backgroundColor: platformTheme.controlBackground,
    borderWidth: 1,
    borderColor: platformTheme.controlBorder,
  },
  navButtonActive: {
    backgroundColor: platformTheme.activeControlBackground,
  },
  navButtonText: {
    color: '#334155',
    fontWeight: '700',
  },
  navButtonTextActive: {
    color: platformTheme.activeControlText,
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: platformTheme.controlRadius,
    backgroundColor: platformTheme.logoutBackground,
  },
  logoutText: {
    color: platformTheme.logoutText,
    fontWeight: '700',
  },
  headerMeta: {
    gap: 8,
  },
  userText: {
    color: platformTheme.accent,
    fontWeight: '700',
  },
  platformBadge: {
    alignSelf: 'flex-start',
    backgroundColor: platformTheme.badgeBackground,
    color: platformTheme.badgeText,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: platformTheme.controlRadius,
    borderWidth: 1,
    borderColor: platformTheme.controlBorder,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  screenContent: {
    padding: 20,
    gap: 24,
    paddingBottom: platformTheme.screenPaddingBottom,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: platformTheme.titleText,
  },
  screenDescription: {
    color: platformTheme.mutedText,
    fontSize: 16,
    lineHeight: 22,
  },
});
