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
  'https://codesandbox.io',
];

const origins = allowedOrigins.length ? allowedOrigins : defaultAllowedOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isExactMatch = origins.includes(origin);

      let isCodeSandboxPreview = false;
      try {
        const hostname = new URL(origin).hostname;
        isCodeSandboxPreview = hostname.endsWith('.csb.app');
      } catch {
        isCodeSandboxPreview = false;
      }

      if (isExactMatch || isCodeSandboxPreview) {
        callback(null, true);
        return;
      }

      console.log('Origin bloqueada no CORS:', origin);
      callback(new Error('Origin não permitida no CORS.'));
    },
  }),
);
