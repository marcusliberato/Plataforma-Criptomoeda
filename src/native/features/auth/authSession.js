import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const AUTH_SESSION_KEY = 'criptmoeda.auth.session.v3';
const AUTH_REQUEST_TIMEOUT_MS = 5000;

function normalizeApiBase(base) {
  return String(base || '').trim().replace(/\/$/, '');
}

function getConfiguredApiBaseUrl() {
  return (
    normalizeApiBase(process.env.EXPO_PUBLIC_AUTH_API_BASE_URL) ||
    normalizeApiBase(process.env.VITE_AUTH_API_BASE_URL)
  );
}

function getExpoBundleHost() {
  const scriptURL = String(NativeModules?.SourceCode?.scriptURL || '').trim();
  if (!scriptURL) {
    return '';
  }

  try {
    const { hostname } = new URL(scriptURL);
    if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
      return '';
    }

    return hostname;
  } catch {
    return '';
  }
}

function getApiBaseUrl() {
  const envBase = getConfiguredApiBaseUrl();
  if (envBase) {
    return envBase;
  }

  const expoBundleHost = getExpoBundleHost();
  if (expoBundleHost) {
    return `http://${expoBundleHost}:8787`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8787';
  }

  return 'http://localhost:8787';
}

function getApiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = AUTH_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getSessionData() {
  const raw = await AsyncStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.username === 'string' &&
      typeof parsed.accessToken === 'string' &&
      Number.isFinite(Number(parsed.expiresAt))
    ) {
      return {
        username: parsed.username,
        accessToken: parsed.accessToken,
        expiresAt: Number(parsed.expiresAt),
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function hasActiveSession() {
  const session = await getSessionData();
  if (!session) {
    return false;
  }

  if (Date.now() >= session.expiresAt) {
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
    return false;
  }

  return true;
}

export async function signIn(username, password) {
  const apiUrl = getApiUrl('/api/auth/login');
  let response;
  try {
    response = await fetchWithTimeout(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: String(username || '').trim(),
        password: String(password || ''),
      }),
    });
  } catch {
    return {
      ok: false,
      error: `Não foi possível conectar ao servidor de autenticação (${apiUrl}).`,
    };
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      error: payload?.error || 'Não foi possível autenticar.',
    };
  }

  const usernameValue = String(payload?.username || '').trim().toLowerCase();
  const accessToken = String(payload?.accessToken || '').trim();
  const expiresAt = Number(payload?.expiresAt);

  if (!usernameValue || !accessToken || !Number.isFinite(expiresAt)) {
    return {
      ok: false,
      error: 'Resposta inválida da autenticação.',
    };
  }

  await AsyncStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      username: usernameValue,
      accessToken,
      expiresAt,
    }),
  );

  return {
    ok: true,
    username: usernameValue,
  };
}

export async function fetchAuthenticatedUser() {
  const session = await getSessionData();
  if (!session) {
    return {
      ok: false,
      error: 'Sessão não encontrada.',
    };
  }

  const apiUrl = getApiUrl('/api/auth/me');
  let response;
  try {
    response = await fetchWithTimeout(apiUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
  } catch {
    await signOut();
    return {
      ok: false,
      error: `Servidor de autenticação indisponível (${apiUrl}).`,
    };
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    await signOut();
    return {
      ok: false,
      error: payload?.error || 'Sessão inválida.',
    };
  }

  return {
    ok: true,
    username: String(payload?.username || session.username || '').trim().toLowerCase(),
  };
}

export async function signOut() {
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
}
