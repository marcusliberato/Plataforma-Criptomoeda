import { useCallback, useEffect, useMemo, useState } from 'react';
import './MercadoPage.css';

const BINANCE_BASE_URL =
  import.meta.env.VITE_BINANCE_BASE_URL || 'https://data-api.binance.vision';

const trackedSymbols = [
  { apiSymbol: 'BTCUSDT', name: 'Bitcoin', symbol: 'BTC' },
  { apiSymbol: 'ETHUSDT', name: 'Ethereum', symbol: 'ETH' },
  { apiSymbol: 'SOLUSDT', name: 'Solana', symbol: 'SOL' },
  { apiSymbol: 'BNBUSDT', name: 'BNB', symbol: 'BNB' },
  { apiSymbol: 'XRPUSDT', name: 'XRP', symbol: 'XRP' },
  { apiSymbol: 'ADAUSDT', name: 'Cardano', symbol: 'ADA' },
  { apiSymbol: 'DOGEUSDT', name: 'Dogecoin', symbol: 'DOGE' },
  { apiSymbol: 'AVAXUSDT', name: 'Avalanche', symbol: 'AVAX' },
  { apiSymbol: 'LINKUSDT', name: 'Chainlink', symbol: 'LINK' },
];

const fallbackMarketData = trackedSymbols.map((asset) => ({
  name: asset.name,
  symbol: asset.symbol,
  price: 'US$ 0,00',
  change: '+0,0%',
  trend: 'up',
  volume: '0 USDT',
}));

function formatUsdPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value) {
  const numericValue = Number.isFinite(value) ? value : 0;
  const sign = numericValue >= 0 ? '+' : '-';
  const absolute = Math.abs(numericValue).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return `${sign}${absolute}%`;
}

function formatCompact(value) {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

async function fetchTicker24h(symbol) {
  const url = new URL('/api/v3/ticker/24hr', BINANCE_BASE_URL);
  url.searchParams.set('symbol', symbol);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Falha ao consultar ${symbol}: HTTP ${response.status}`);
  }

  return response.json();
}

export default function MercadoPage() {
  const [marketData, setMarketData] = useState(fallbackMarketData);
  const [marketStatus, setMarketStatus] = useState('idle');
  const [marketError, setMarketError] = useState('');
  const [lastMarketUpdate, setLastMarketUpdate] = useState(null);

  const loadMarketData = useCallback(async () => {
    setMarketStatus('loading');
    setMarketError('');

    try {
      const tickers = await Promise.all(
        trackedSymbols.map((asset) => fetchTicker24h(asset.apiSymbol)),
      );

      const parsed = tickers.map((ticker, index) => {
        const asset = trackedSymbols[index];
        const price = Number.parseFloat(ticker.lastPrice);
        const changePercent = Number.parseFloat(ticker.priceChangePercent);
        const quoteVolume = Number.parseFloat(ticker.quoteVolume);

        return {
          name: asset.name,
          symbol: asset.symbol,
          price: formatUsdPrice(price),
          change: formatPercent(changePercent),
          trend: changePercent >= 0 ? 'up' : 'down',
          volume: `${formatCompact(quoteVolume)} USDT`,
        };
      });

      setMarketData(parsed);
      setLastMarketUpdate(new Date());
      setMarketStatus('ok');
    } catch {
      setMarketStatus('error');
      setMarketError(
        'Nao foi possivel atualizar os precos da Binance agora. Exibindo ultima leitura.',
      );
    }
  }, []);

  useEffect(() => {
    loadMarketData();
    const intervalId = setInterval(loadMarketData, 30_000);

    return () => clearInterval(intervalId);
  }, [loadMarketData]);

  const marketUpdateLabel = useMemo(() => {
    if (!lastMarketUpdate) {
      return 'Aguardando primeira atualizacao';
    }

    return `Atualizado as ${lastMarketUpdate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
  }, [lastMarketUpdate]);

  return (
    <div className='app page-shell'>
      <header className='hero page-header'>
        <nav className='nav'>
          <div className='brand'>
            <span className='brand-dot' aria-hidden='true' />
            <div>
              <p className='brand-title'>Criptmoeda</p>
              <p className='brand-subtitle'>Plataforma Digital</p>
            </div>
          </div>

          <div className='nav-actions'>
            <a className='ghost-button' href='/'>
              Inicio
            </a>
            <a className='ghost-button' href='/transacoes.html'>
              Transacoes
            </a>
          </div>
        </nav>
      </header>

      <main className='page-main'>
        <section className='section'>
          <div className='section-header'>
            <div>
              <p className='section-tag'>Mercado dedicado</p>
              <h2>Explorar mercado</h2>
              <p className='market-meta'>{marketUpdateLabel}</p>
            </div>

            <button
              className='ghost-button'
              type='button'
              onClick={loadMarketData}
              disabled={marketStatus === 'loading'}
            >
              {marketStatus === 'loading' ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {marketError && <p className='market-error'>{marketError}</p>}

          <div className='market-grid'>
            {marketData.map((asset) => (
              <article key={asset.symbol} className='market-card'>
                <div>
                  <p className='asset-name'>
                    {asset.name} <span>{asset.symbol}</span>
                  </p>
                  <h3>{asset.price}</h3>
                </div>

                <div className={`asset-change ${asset.trend}`}>
                  <span>{asset.change}</span>
                  <p>Volume {asset.volume}</p>
                </div>
              </article>
            ))}
          </div>

          <div className='market-back-home'>
            <a className='ghost-button link-button' href='/'>
              Voltar para home
            </a>
          </div>
        </section>
      </main>

      <footer className='footer'>
        <div>
          <p className='brand-title'>Criptmoeda</p>
          <p>Painel dedicado de acompanhamento de mercado.</p>
        </div>

        <div className='footer-links'>
          <a href='/'>Pagina inicial</a>
          <a href='/transacoes.html'>Transacoes</a>
        </div>
      </footer>
    </div>
  );
}
