import { Platform } from 'react-native';

const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

const paletteByPlatform = {
  ios: {
    appBackground: '#eef5ff',
    headerBackground: '#e6f0ff',
    cardBackground: '#ffffff',
    controlBackground: '#f4f8ff',
    controlBorder: '#c6d8ff',
    activeControlBackground: '#dbeafe',
    activeControlText: '#1d4ed8',
    accent: '#1d4ed8',
    mutedText: '#5f6f89',
    titleText: '#0f172a',
    logoutBackground: '#0f172a',
    logoutText: '#ffffff',
    badgeBackground: '#dbeafe',
    badgeText: '#1e40af',
  },
  android: {
    appBackground: '#eef8f0',
    headerBackground: '#e5f4e8',
    cardBackground: '#ffffff',
    controlBackground: '#f2fbf4',
    controlBorder: '#b7dfc0',
    activeControlBackground: '#dcfce7',
    activeControlText: '#166534',
    accent: '#166534',
    mutedText: '#5d7065',
    titleText: '#10231a',
    logoutBackground: '#14532d',
    logoutText: '#ffffff',
    badgeBackground: '#dcfce7',
    badgeText: '#166534',
  },
  web: {
    appBackground: '#f4f6fb',
    headerBackground: '#f2edff',
    cardBackground: '#ffffff',
    controlBackground: '#eef2ff',
    controlBorder: '#c7d2fe',
    activeControlBackground: '#dfe4ff',
    activeControlText: '#3730a3',
    accent: '#4f46e5',
    mutedText: '#667085',
    titleText: '#1f2a56',
    logoutBackground: '#111827',
    logoutText: '#ffffff',
    badgeBackground: '#eef2ff',
    badgeText: '#4f46e5',
  },
};

const shapeByPlatform = {
  ios: {
    controlRadius: 18,
    surfaceRadius: 26,
    headerTopPadding: 16,
    screenPaddingBottom: 48,
  },
  android: {
    controlRadius: 12,
    surfaceRadius: 18,
    headerTopPadding: 10,
    screenPaddingBottom: 36,
  },
  web: {
    controlRadius: 14,
    surfaceRadius: 22,
    headerTopPadding: 12,
    screenPaddingBottom: 40,
  },
};

const surfaceShadowByPlatform = Platform.select({
  ios: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  android: {
    elevation: 4,
  },
  default: {},
});

function getPlatformLabel(value) {
  if (value === 'ios') {
    return 'iOS';
  }
  if (value === 'android') {
    return 'Android';
  }
  return 'Web';
}

export const platformTheme = {
  platform,
  label: getPlatformLabel(platform),
  ...paletteByPlatform[platform],
  ...shapeByPlatform[platform],
  surfaceShadow: surfaceShadowByPlatform,
};

