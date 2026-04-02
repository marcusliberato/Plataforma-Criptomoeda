import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const port = Number(process.env.AUTH_API_PORT || 8787);
const jwtSecret = process.env.AUTH_JWT_SECRET || 'troque-este-segredo-no-env';
const jwtExpiresIn = process.env.AUTH_JWT_EXPIRES_IN || '12h';
const authUser = (process.env.AUTH_USER || 'aluno').trim().toLowerCase();
const authPassword = process.env.AUTH_PASSWORD || 'tpcriptomoeda';
const allowPrivateNetworkOrigins =
  String(process.env.AUTH_ALLOW_PRIVATE_NETWORK_ORIGINS || 'true').toLowerCase() !== 'false';

const allowedOrigins = (process.env.AUTH_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost',
];

const origins = allowedOrigins.length ? allowedOrigins : defaultAllowedOrigins;

function isPrivateNetworkHostname(hostname = '') {
  if (!hostname) {
    return false;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }

  return /^(10|192\.168|172\.(1[6-9]|2\d|3[0-1]))\./.test(hostname);
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (origins.includes(origin)) {
    return true;
  }

  if (!allowPrivateNetworkOrigins) {
    return false;
  }

  try {
    const { hostname } = new URL(origin);
    return isPrivateNetworkHostname(hostname);
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin não permitida no CORS.'));
    },
  }),
);

app.use(express.json());

function createAccessToken(username) {
  return jwt.sign({ sub: username, role: 'user' }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });
}

function parseBearerToken(authorizationHeader = '') {
  if (!authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice('Bearer '.length).trim();
}

function authMiddleware(req, res, next) {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: 'Token ausente.' });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'auth-api' });
});

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body?.username || '')
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || '');

  if (!username || !password) {
    res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    return;
  }

  if (username !== authUser || password !== authPassword) {
    res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    return;
  }

  const accessToken = createAccessToken(username);
  const decoded = jwt.decode(accessToken);
  const expiresAt =
    decoded && typeof decoded === 'object' && typeof decoded.exp === 'number'
      ? decoded.exp * 1000
      : Date.now() + 12 * 60 * 60 * 1000;

  res.status(200).json({
    accessToken,
    tokenType: 'Bearer',
    username,
    expiresAt,
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.status(200).json({ username: req.user.sub, role: req.user.role });
});

app.post('/api/auth/logout', authMiddleware, (_req, res) => {
  res.status(204).send();
});

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[auth-api] Rodando em http://localhost:${port} (pid: ${process.pid})`);
});

server.on('error', (error) => {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console
    console.error(`[auth-api] Porta ${port} já está em uso. Finalize o processo antigo antes de subir novamente.`);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.error('[auth-api] Falha inesperada ao iniciar servidor:', error);
  process.exit(1);
});
