import { useCallback, useEffect, useMemo, useState } from 'react';
import './MarketHighlights.css';

const BINANCE_BASE_URLS = [
  import.meta.env.VITE_BINANCE_BASE_URL ||
    (import.meta.env.DEV ? '/market-proxy' : 'https://api.binance.com'),
  'https://api1.binance.com',
  'https://api2.binance.com',
  'https://api3.binance.com',
  'https://api-gcp.binance.com',
  'https://data-api.binance.vision',
];

const BYBIT_BASE_URL =
  import.meta.env.VITE_BYBIT_BASE_URL || 'https://api.bybit.com';

const HIGHLIGHT_ASSETS = ['BTC', 'ETH', 'XRP', 'SOL', 'USDC'];
const HIGHLIGHT_SYMBOLS = HIGHLIGHT_ASSETS.map((asset) => `${asset}USDT`);

function parseNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPrice(value) {
  const absolute = Math.abs(value);
  let maximumFractionDigits = 8;

  if (absolute >= 1000) {
    maximumFractionDigits = 2;
  } else if (absolute >= 1) {
    maximumFractionDigits = 4;
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

function formatPercent(value) {
  const numericValue = Number.isFinite(value) ? value : 0;
  const sign = numericValue >= 0 ? '+' : '-';
  const absolute = Math.abs(numericValue).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${sign}${absolute}%`;
}

function formatVolume(value) {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

function normalizeHighlights(tickers) {
  const bySymbol = new Map(
    tickers.map((ticker) => [ticker.symbol, ticker]),
  );

  return HIGHLIGHT_SYMBOLS.map((symbol) => bySymbol.get(symbol)).filter(Boolean);
}

async function fetchBinanceTickers() {
  let lastError = null;

  for (const baseUrl of BINANCE_BASE_URLS) {
    try {
      const url = baseUrl.startsWith('/')
        ? new URL(`${baseUrl}/api/v3/ticker/24hr`, window.location.origin)
        : new URL('/api/v3/ticker/24hr', baseUrl);
      const response = await fetch(url.toString(), { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error('formato de dados invalido');
      }

      return normalizeHighlights(
        payload.map((ticker) => ({
          symbol: ticker.symbol,
          lastPrice: parseNumber(ticker.lastPrice),
          changePercent: parseNumber(ticker.priceChangePercent),
          quoteVolume: parseNumber(ticker.quoteVolume),
        })),
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(lastError?.message || 'Falha Binance');
}

async function fetchBybitTickers() {
  const url = new URL('/v5/market/tickers', BYBIT_BASE_URL);
  url.searchParams.set('category', 'spot');
  url.searchParams.set('_', String(Date.now()));

  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Falha Bybit: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const list = payload?.result?.list;

  if (payload?.retCode !== 0 || !Array.isArray(list)) {
    throw new Error('Falha Bybit: formato de dados invalido');
  }

  return normalizeHighlights(
    list.map((ticker) => ({
      symbol: ticker.symbol,
      lastPrice: parseNumber(ticker.lastPrice),
      changePercent: parseNumber(ticker.price24hPcnt) * 100,
      quoteVolume: parseNumber(ticker.turnover24h || ticker.volume24h),
    })),
  );
}

export default function MarketHighlights() {
  const [pairsByExchange, setPairsByExchange] = useState({
    binance: [],
    bybit: [],
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadHighlights = useCallback(async () => {
    setStatus('loading');
    setError('');

    const [binanceResult, bybitResult] = await Promise.allSettled([
      fetchBinanceTickers(),
      fetchBybitTickers(),
    ]);

    const hasBinance = binanceResult.status === 'fulfilled';
    const hasBybit = bybitResult.status === 'fulfilled';

    if (!hasBinance && !hasBybit) {
      setStatus('error');
      setError('Nao foi possivel carregar as cotacoes principais no momento.');
      return;
    }

    setPairsByExchange((current) => ({
      binance: hasBinance ? binanceResult.value : current.binance,
      bybit: hasBybit ? bybitResult.value : current.bybit,
    }));
    setLastUpdate(new Date());
    setStatus('ok');
  }, []);

  useEffect(() => {
    loadHighlights();
    const intervalId = setInterval(loadHighlights, 60_000);

    return () => clearInterval(intervalId);
  }, [loadHighlights]);

  const exchanges = useMemo(
    () => [
      { key: 'binance', label: 'Binance', pairs: pairsByExchange.binance },
      { key: 'bybit', label: 'Bybit', pairs: pairsByExchange.bybit },
    ],
    [pairsByExchange],
  );

  const lastUpdateLabel = useMemo(() => {
    if (!lastUpdate) {
      return 'Aguardando cotacoes iniciais.';
    }

    return `Atualizado as ${lastUpdate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
  }, [lastUpdate]);

  return (
    <section className='home-highlights'>
      <div className='home-highlights-header'>
        <p>{lastUpdateLabel}</p>
        <button
          className='ghost-button'
          type='button'
          onClick={loadHighlights}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Atualizando...' : 'Atualizar cotações'}
        </button>
      </div>

      {error ? <p className='dashboard-error'>{error}</p> : null}

      <div className='home-highlights-grid'>
        {exchanges.map((exchange) => (
          <article key={exchange.key} className='home-highlights-card'>
            <div className='pairs-card-header'>
              <h4>{exchange.label}</h4>
              <span>{exchange.pairs.length} cotações</span>
            </div>

            <p className='pairs-card-note'>
              BTC, ETH, XRP, SOL e USDC com atualização pública.
            </p>

            <div className='pairs-list'>
              {exchange.pairs.length ? (
                exchange.pairs.map((pair) => (
                  <article
                    key={`${exchange.key}-${pair.symbol}`}
                    className='pair-item home-pair-item'
                  >
                    <div>
                      <p>{pair.symbol}</p>
                      <small>Volume {formatVolume(pair.quoteVolume)}</small>
                    </div>
                    <div>
                      <strong>US$ {formatPrice(pair.lastPrice)}</strong>
                      <small className={pair.changePercent >= 0 ? 'up' : 'down'}>
                        {formatPercent(pair.changePercent)}
                      </small>
                    </div>
                  </article>
                ))
              ) : (
                <p className='dashboard-empty'>Sem cotacoes disponiveis.</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
