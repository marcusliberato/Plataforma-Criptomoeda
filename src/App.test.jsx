import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./components/MarketOverview.jsx', () => ({
  default: function MockMarketOverview() {
    return <div data-testid='market-overview-mock'>Market Overview Mock</div>;
  },
}));

import App from './App.jsx';

describe('App', () => {
  it('renderiza navegação principal e conteúdo da home', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 2, name: /cotações/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Início' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Mercado' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Transações' }).length).toBeGreaterThan(0);
    expect(screen.getByTestId('market-overview-mock')).toBeInTheDocument();
  });
});
