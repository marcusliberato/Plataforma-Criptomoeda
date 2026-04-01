const AUTH_SESSION_KEY = 'criptmoeda.auth.session.v2';
const AUTH_REQUEST_TIMEOUT_MS = 5000;

function logAuth(event, details = {}) {
  // eslint-disable-next-line no-console
  console.info(`[auth] ${event}`, details);
}

function readJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeApiBase(base) {
  return String(base || '').trim().replace(/\/$/, '');
}

function isPrivateNetworkHostname(hostname) {
  if (!hostname) {
    return false;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }

  return /^(10|192\.168|172\.(1[6-9]|2\d|3[0-1]))\./.test(hostname);
}

export function getApiBaseUrl() {
  const envBase = normalizeApiBase(import.meta.env.VITE_AUTH_API_BASE_URL);
  if (envBase) {
    return envBase;
  }

  const { protocol, hostname, port, origin } = window.location;
  const isHttpProtocol = protocol === 'http:' || protocol === 'https:';
  const usesViteProxy = port === '5173' || port === '4173';

  if (isHttpProtocol && usesViteProxy) {
    return origin;
  }

  if (isHttpProtocol && isPrivateNetworkHostname(hostname)) {
    return `${protocol}//${hostname}:8787`;
  }

  if (isHttpProtocol && origin && origin !== 'null') {
    return origin;
  }

  return 'http://localhost:8787';
}

function getApiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = AUTH_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function getAuthSessionKey() {
  return AUTH_SESSION_KEY;
}

export function getSessionData() {
  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  const parsed = readJson(raw);
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const username =
    typeof parsed.username === 'string' && parsed.username.trim()
      ? parsed.username.trim()
      : null;
  const accessToken =
    typeof parsed.accessToken === 'string' && parsed.accessToken.trim()
      ? parsed.accessToken.trim()
      : null;
  const expiresAt = Number(parsed.expiresAt);

  if (!username || !accessToken || !Number.isFinite(expiresAt)) {
    return null;
  }

  return {
    username,
    accessToken,
    expiresAt,
  };
}

export function hasActiveSession() {
  const session = getSessionData();
  if (!session) {
    return false;
  }

  if (Date.now() >= session.expiresAt) {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    return false;
  }

  return true;
}

function parseErrorMessage(payload, fallbackMessage) {
  if (!payload || typeof payload !== 'object') {
    return fallbackMessage;
  }

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error.trim();
  }

  return fallbackMessage;
}

export async function signIn(username, password) {
  const apiUrl = getApiUrl('/api/auth/login');
  logAuth('login_request_started', { apiUrl });

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
  } catch (error) {
    logAuth('login_request_failed', {
      apiUrl,
      message: error instanceof Error ? error.message : String(error),
    });
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
    logAuth('login_request_denied', { status: response.status, payload });
    return {
      ok: false,
      error: parseErrorMessage(payload, 'Não foi possível autenticar.'),
    };
  }

  const normalizedUsername = String(payload?.username || '')
    .trim()
    .toLowerCase();
  const accessToken = String(payload?.accessToken || '').trim();
  const expiresAt = Number(payload?.expiresAt);

  if (!normalizedUsername || !accessToken || !Number.isFinite(expiresAt)) {
    return {
      ok: false,
      error: 'Resposta inválida da autenticação.',
    };
  }

  window.localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      username: normalizedUsername,
      accessToken,
      expiresAt,
    }),
  );

  logAuth('login_request_success', { username: normalizedUsername, expiresAt });

  return {
    ok: true,
    username: normalizedUsername,
  };
}

export async function fetchAuthenticatedUser() {
  const session = getSessionData();
  if (!session) {
    return {
      ok: false,
      error: 'Sessão não encontrada.',
    };
  }

  const apiUrl = getApiUrl('/api/auth/me');
  logAuth('session_check_started', { apiUrl, username: session.username });

  let response;
  try {
    response = await fetchWithTimeout(apiUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
  } catch (error) {
    signOut();
    logAuth('session_check_failed', {
      apiUrl,
      message: error instanceof Error ? error.message : String(error),
    });
    return {
      ok: false,
      error: 'Servidor de autenticação indisponível.',
    };
  }

  if (!response.ok) {
    signOut();
    logAuth('session_check_denied', { status: response.status });
    return {
      ok: false,
      error: 'Sessão inválida ou expirada.',
    };
  }

  const payload = await response.json();
  const normalizedUsername = String(payload?.username || session.username)
    .trim()
    .toLowerCase();
  logAuth('session_check_success', { username: normalizedUsername });

  return {
    ok: true,
    username: normalizedUsername,
  };
}

export function signOut() {
  window.localStorage.removeItem(AUTH_SESSION_KEY);
}
