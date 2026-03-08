import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MarketOverview from './MarketOverview.jsx';

const binanceTickers = [
  { symbol: 'ADAUSDT', lastPrice: '0.48', priceChangePercent: '1.5', quoteVolume: '1200000' },
  { symbol: 'AVAXUSDT', lastPrice: '36.52', priceChangePercent: '2.1', quoteVolume: '950000' },
  { symbol: 'BNBUSDT', lastPrice: '620.10', priceChangePercent: '-0.5', quoteVolume: '800000' },
  { symbol: 'BTCUSDT', lastPrice: '64000.00', priceChangePercent: '1.2', quoteVolume: '5000000' },
  { symbol: 'DOGEUSDT', lastPrice: '0.16', priceChangePercent: '3.0', quoteVolume: '650000' },
  { symbol: 'ETHUSDT', lastPrice: '3300.50', priceChangePercent: '0.8', quoteVolume: '2400000' },
  { symbol: 'LINKUSDT', lastPrice: '18.42', priceChangePercent: '-1.1', quoteVolume: '410000' },
  { symbol: 'SOLUSDT', lastPrice: '142.30', priceChangePercent: '4.4', quoteVolume: '1700000' },
  { symbol: 'XRPUSDT', lastPrice: '0.59', priceChangePercent: '0.2', quoteVolume: '700000' },
];

const bybitTickers = {
  retCode: 0,
  result: {
    list: [
      { symbol: 'BTCUSDT', lastPrice: '64200.00', price24hPcnt: '0.015', turnover24h: '4500000' },
      { symbol: 'ETHUSDT', lastPrice: '3320.20', price24hPcnt: '0.009', turnover24h: '2100000' },
    ],
  },
};

function jsonResponse(payload, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  });
}

describe('MarketOverview', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        const endpoint = String(url);

        if (endpoint.includes('/api/v3/ticker/24hr')) {
          return jsonResponse(binanceTickers);
        }

        if (endpoint.includes('/v5/market/tickers')) {
          return jsonResponse(bybitTickers);
        }

        if (endpoint.includes('/api/v3/depth')) {
          return jsonResponse({
            bids: [['64000.00', '0.42']],
            asks: [['64010.00', '0.39']],
          });
        }

        if (endpoint.includes('/v5/market/orderbook')) {
          return jsonResponse({
            retCode: 0,
            result: {
              b: [['64200.00', '0.31']],
              a: [['64220.00', '0.29']],
            },
          });
        }

        return jsonResponse({}, 404);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('carrega pares e mostra dados de último preço e livro de ofertas', async () => {
    render(<MarketOverview />);

    expect(await screen.findByRole('option', { name: 'ADAUSDT' })).toBeInTheDocument();
    expect(screen.getByText('Último preço')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v3/depth'));
    });
  });

  it('permite selecionar exchange e pagina os pares da Binance', async () => {
    render(<MarketOverview />);

    const exchangeSelect = await screen.findByLabelText('Exchange');
    await userEvent.selectOptions(exchangeSelect, 'bybit');

    expect(
      await screen.findByRole('heading', { level: 3, name: /Bybit - BTCUSDT/i }),
    ).toBeInTheDocument();

    const binanceCardTitle = await screen.findByRole('heading', {
      level: 4,
      name: 'Binance',
    });
    const binanceCard = binanceCardTitle.closest('article');

    if (!binanceCard) {
      throw new Error('Card da Binance não encontrado');
    }

    const nextPageButton = within(binanceCard).getByRole('button', {
      name: 'Próxima',
    });

    await userEvent.click(nextPageButton);

    expect(within(binanceCard).getByText('Pagina 2 de 2')).toBeInTheDocument();
  });
});
