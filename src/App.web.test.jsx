import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockUseAuthSession = vi.fn();

vi.mock('./features/market/MarketHighlights.jsx', () => ({
  default: function MockMarketHighlights() {
    return <div data-testid='home-highlights-mock'>Home Highlights Mock</div>;
  },
}));

vi.mock('./features/auth/useAuthSession.js', () => ({
  default: () => mockUseAuthSession(),
}));

import App from './App.web.jsx';

afterEach(() => {
  window.localStorage.clear();
  mockUseAuthSession.mockReset();
});

describe('App', () => {
  it('renderiza a home pública sem exigir login', () => {
    mockUseAuthSession.mockReturnValue({
      isAuthenticated: false,
      username: '',
      isLoading: false,
      isCheckingSession: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);

    expect(
      screen.getByRole('heading', { level: 2, name: /resumo das principais criptomoedas/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'Início' }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: 'Mercado' }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Transações' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull();
    expect(screen.getByTestId('home-highlights-mock')).toBeInTheDocument();
  });

  it('mostra ações de sessão na home quando o usuário já está autenticado', () => {
    mockUseAuthSession.mockReturnValue({
      isAuthenticated: true,
      username: 'aluno',
      isLoading: false,
      isCheckingSession: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
    expect(screen.getByText(/usuário: aluno/i)).toBeInTheDocument();
  });
});
