const BINANCE_BASE = process.env.EXPO_PUBLIC_BINANCE_BASE_URL || 'https://api.binance.com';
const BYBIT_BASE = process.env.EXPO_PUBLIC_BYBIT_BASE_URL || 'https://api.bybit.com';
const HIGHLIGHT_ASSETS = ['BTC', 'ETH', 'XRP', 'SOL', 'USDC'];
const HIGHLIGHT_SYMBOLS = HIGHLIGHT_ASSETS.map((asset) => `${asset}USDT`);

function parseNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeTicker(symbol, lastPrice, changePercent, volume) {
  return {
    symbol,
    asset: symbol.replace(/USDT$/, ''),
    lastPrice: parseNumber(lastPrice),
    changePercent: parseNumber(changePercent),
    quoteVolume: parseNumber(volume),
  };
}

export function formatPrice(value) {
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

export function formatPercent(value) {
  const numericValue = Number.isFinite(value) ? value : 0;
  const sign = numericValue >= 0 ? '+' : '-';
  const absolute = Math.abs(numericValue).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${sign}${absolute}%`;
}

export function formatVolume(value) {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

export async function fetchHomeHighlights() {
  const response = await fetch(`${BINANCE_BASE}/api/v3/ticker/24hr`);
  const payload = await response.json();

  if (!response.ok || !Array.isArray(payload)) {
    throw new Error('Não foi possível carregar o resumo do mercado.');
  }

  const tickerMap = new Map(
    payload.map((ticker) => [
      ticker.symbol,
      normalizeTicker(
        ticker.symbol,
        ticker.lastPrice,
        ticker.priceChangePercent,
        ticker.quoteVolume,
      ),
    ]),
  );

  return HIGHLIGHT_SYMBOLS.map((symbol) => tickerMap.get(symbol)).filter(Boolean);
}

export async function fetchExchangePairs(exchangeKey) {
  if (exchangeKey === 'binance') {
    const response = await fetch(`${BINANCE_BASE}/api/v3/ticker/24hr`);
    const payload = await response.json();

    if (!response.ok || !Array.isArray(payload)) {
      throw new Error('Falha ao carregar pares da Binance.');
    }

    return payload
      .filter((ticker) => String(ticker.symbol).endsWith('USDT'))
      .sort((a, b) => parseNumber(b.quoteVolume) - parseNumber(a.quoteVolume))
      .slice(0, 12)
      .map((ticker) =>
        normalizeTicker(
          ticker.symbol,
          ticker.lastPrice,
          ticker.priceChangePercent,
          ticker.quoteVolume,
        ),
      );
  }

  const url = new URL('/v5/market/tickers', BYBIT_BASE);
  url.searchParams.set('category', 'spot');
  const response = await fetch(url.toString());
  const payload = await response.json();
  const list = payload?.result?.list;

  if (!response.ok || payload?.retCode !== 0 || !Array.isArray(list)) {
    throw new Error('Falha ao carregar pares da Bybit.');
  }

  return list
    .filter((ticker) => String(ticker.symbol).endsWith('USDT'))
    .sort((a, b) => parseNumber(b.turnover24h || b.volume24h) - parseNumber(a.turnover24h || a.volume24h))
    .slice(0, 12)
    .map((ticker) =>
      normalizeTicker(
        ticker.symbol,
        ticker.lastPrice,
        parseNumber(ticker.price24hPcnt) * 100,
        ticker.turnover24h || ticker.volume24h,
      ),
    );
}
