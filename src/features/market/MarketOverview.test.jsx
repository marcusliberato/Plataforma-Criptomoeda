import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

const binanceKlines = [[0, '63000.00', '0', '0', '64000.00']];

const bybitKlines = {
  retCode: 0,
  result: {
    list: [[0, '64000.00', '0', '0', '64200.00']],
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

        if (endpoint.includes('/api/v3/klines')) {
          return jsonResponse(binanceKlines);
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

        if (endpoint.includes('/v5/market/kline')) {
          return jsonResponse(bybitKlines);
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
      expect(
        fetch.mock.calls.some(([url]) => String(url).includes('/api/v3/depth')),
      ).toBe(true);
    });

    const binanceTickerUrl = fetch.mock.calls
      .map(([url]) => String(url))
      .find((url) => url.includes('/api/v3/ticker/24hr'));

    expect(binanceTickerUrl).toBeDefined();
    expect(binanceTickerUrl).not.toContain('_=');
  });

  it('ajusta opções do número conforme unidade e aceita dias personalizados', async () => {
    render(<MarketOverview />);

    const numberSelect = await screen.findByLabelText('Número do período');
    const unitSelect = await screen.findByLabelText('Unidade do período');

    expect(within(numberSelect).getByRole('option', { name: '1' })).toBeInTheDocument();
    expect(within(numberSelect).getByRole('option', { name: '24' })).toBeInTheDocument();
    expect(within(unitSelect).getByRole('option', { name: 'Hora(s)' })).toBeInTheDocument();
    expect(within(unitSelect).getByRole('option', { name: 'Dia(s)' })).toBeInTheDocument();

    await userEvent.selectOptions(unitSelect, 'd');

    expect(within(numberSelect).getByRole('option', { name: '30' })).toBeInTheDocument();
    expect(within(numberSelect).getByRole('option', { name: 'Mais' })).toBeInTheDocument();

    await userEvent.selectOptions(numberSelect, 'custom');

    const customDaysInput = await screen.findByLabelText('Quantidade de dias');
    fireEvent.change(customDaysInput, { target: { value: '45' } });

    expect(customDaysInput).toHaveValue(45);
    expect(await screen.findByText(/Abertura \(45D\): US\$/i)).toBeInTheDocument();
  });

  it('mostra abertura e fechamento e atualiza ao trocar período', async () => {
    fetch.mockImplementation((url) => {
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

      if (endpoint.includes('/api/v3/klines')) {
        if (endpoint.includes('interval=1d')) {
          return jsonResponse([[0, '0.40', '0', '0', '0.50']]);
        }

        return jsonResponse([[0, '0.45', '0', '0', '0.48']]);
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

      if (endpoint.includes('/v5/market/kline')) {
        return jsonResponse(bybitKlines);
      }

      return jsonResponse({}, 404);
    });

    render(<MarketOverview />);

    expect(
      await screen.findByText(/Abertura \(1H\): US\$\s*0,45/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Fechamento \(1H\): US\$\s*0,48/i)).toBeInTheDocument();

    const numberSelect = screen.getByLabelText('Número do período');
    const unitSelect = screen.getByLabelText('Unidade do período');
    await userEvent.selectOptions(numberSelect, '1');
    await userEvent.selectOptions(unitSelect, 'd');

    expect(
      await screen.findByText(/Abertura \(1D\): US\$\s*0,40/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Fechamento \(1D\): US\$\s*0,50/i)).toBeInTheDocument();
  });

  it('aceita resposta da Binance encapsulada em objeto com contents', async () => {
    fetch.mockImplementation((url) => {
      const endpoint = String(url);

      if (endpoint.includes('/api/v3/ticker/24hr')) {
        return jsonResponse({
          status: 200,
          contents: JSON.stringify(binanceTickers),
        });
      }

      if (endpoint.includes('/v5/market/tickers')) {
        return jsonResponse(bybitTickers);
      }

      if (endpoint.includes('/api/v3/depth')) {
        return jsonResponse({
          status: 200,
          contents: JSON.stringify({
            bids: [['64000.00', '0.42']],
            asks: [['64010.00', '0.39']],
          }),
        });
      }

      if (endpoint.includes('/api/v3/klines')) {
        return jsonResponse({
          status: 200,
          contents: JSON.stringify(binanceKlines),
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

      if (endpoint.includes('/v5/market/kline')) {
        return jsonResponse(bybitKlines);
      }

      return jsonResponse({}, 404);
    });

    render(<MarketOverview />);

    expect(
      await screen.findByRole('heading', { level: 3, name: /Binance - ADAUSDT/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Binance nao respondeu\. Exibindo dados anteriores/i),
    ).not.toBeInTheDocument();
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

  it('faz fallback para a Bybit quando a Binance estiver indisponivel', async () => {
    fetch.mockImplementation((url) => {
      const endpoint = String(url);

      if (endpoint.includes('/api/v3/')) {
        return Promise.reject(new TypeError('Failed to fetch'));
      }

      if (endpoint.includes('/v5/market/tickers')) {
        return jsonResponse(bybitTickers);
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

      if (endpoint.includes('/v5/market/kline')) {
        return jsonResponse(bybitKlines);
      }

      return jsonResponse({}, 404);
    });

    render(<MarketOverview />);

    const exchangeSelect = await screen.findByLabelText('Exchange');

    await waitFor(() => {
      expect(exchangeSelect).toHaveValue('bybit');
    });

    expect(
      await screen.findByRole('heading', { level: 3, name: /Bybit - BTCUSDT/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Binance e Bybit nao responderam no momento/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Binance indisponivel agora/i),
    ).not.toBeInTheDocument();
  });

  it('ignora erro atrasado da Binance apos trocar para Bybit', async () => {
    let rejectLateBinanceDepth;

    fetch.mockImplementation((url) => {
      const endpoint = String(url);

      if (endpoint.includes('/api/v3/ticker/24hr')) {
        return jsonResponse(binanceTickers);
      }

      if (endpoint.includes('/v5/market/tickers')) {
        return jsonResponse(bybitTickers);
      }

      if (endpoint.includes('/api/v3/depth')) {
        return new Promise((resolve, reject) => {
          rejectLateBinanceDepth = () =>
            reject(new Error('late binance depth failure'));
        });
      }

      if (endpoint.includes('/api/v3/klines')) {
        return jsonResponse(binanceKlines);
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

      if (endpoint.includes('/v5/market/kline')) {
        return jsonResponse(bybitKlines);
      }

      return jsonResponse({}, 404);
    });

    render(<MarketOverview />);

    await screen.findByRole('option', { name: 'ADAUSDT' });

    const exchangeSelect = await screen.findByLabelText('Exchange');
    await userEvent.selectOptions(exchangeSelect, 'bybit');

    expect(
      await screen.findByRole('heading', { level: 3, name: /Bybit - BTCUSDT/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(rejectLateBinanceDepth).toBeDefined();
    });

    rejectLateBinanceDepth();

    await waitFor(() => {
      expect(
        screen.queryByText(/Nao foi possivel carregar o livro de ofertas de Binance/i),
      ).not.toBeInTheDocument();
    });
  });
});
