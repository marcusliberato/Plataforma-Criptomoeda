import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./features/market/MarketHighlights.jsx', () => ({
  default: function MockMarketHighlights() {
    return <div data-testid='home-highlights-mock'>Home Highlights Mock</div>;
  },
}));

vi.mock('./features/auth/useAuthSession.js', () => ({
  default: () => ({
    isAuthenticated: true,
    username: 'aluno',
    isLoading: false,
    isCheckingSession: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

import App from './App.web.jsx';

afterEach(() => {
  window.localStorage.clear();
});

describe('App', () => {
  it('renderiza navegação principal e conteúdo da home', () => {
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
    expect(screen.getByTestId('home-highlights-mock')).toBeInTheDocument();
  });
});
