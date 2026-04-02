import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getApiBaseUrl } from './authSession.js';

describe('getApiBaseUrl', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        protocol: 'http:',
        hostname: 'localhost',
        port: '5173',
        origin: 'http://localhost:5173',
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    vi.unstubAllEnvs();
  });

  it('usa a origem atual quando está rodando com proxy do vite', () => {
    expect(getApiBaseUrl()).toBe('http://localhost:5173');
  });

  it('usa a porta 8787 no mesmo host para servidores locais sem proxy', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        protocol: 'http:',
        hostname: 'localhost',
        port: '8081',
        origin: 'http://localhost:8081',
      },
    });

    expect(getApiBaseUrl()).toBe('http://localhost:8787');
  });

  it('prioriza a variavel de ambiente quando configurada', () => {
    vi.stubEnv('VITE_AUTH_API_BASE_URL', 'http://192.168.0.10:8787/');

    expect(getApiBaseUrl()).toBe('http://192.168.0.10:8787');
  });
});
