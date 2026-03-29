import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './MarketOverview.css';

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

const EXCHANGES = [
  { key: 'binance', label: 'Binance' },
  { key: 'bybit', label: 'Bybit' },
];

const HOUR_PERIOD_NUMBER_OPTIONS = Array.from({ length: 24 }, (_, index) => index + 1);
const DAY_PERIOD_NUMBER_OPTIONS = Array.from({ length: 30 }, (_, index) => index + 1);
const CUSTOM_DAY_OPTION = 'custom';
const PERIOD_UNIT_OPTIONS = [
  { key: 'h', label: 'Hora(s)' },
  { key: 'd', label: 'Dia(s)' },
];

const PAIRS_PER_PAGE = 8;
const ORDER_BOOK_LEVELS = 10;

const INITIAL_PAIRS = EXCHANGES.reduce((accumulator, exchange) => {
  accumulator[exchange.key] = [];
  return accumulator;
}, {});

const INITIAL_PAGES = EXCHANGES.reduce((accumulator, exchange) => {
  accumulator[exchange.key] = 1;
  return accumulator;
}, {});

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

function formatQuantity(value) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(value);
}

function isAbortError(error) {
  return (
    !!error &&
    typeof error === 'object' &&
    'name' in error &&
    error.name === 'AbortError'
  );
}

function normalizeOrderLevels(levels) {
  if (!Array.isArray(levels)) {
    return [];
  }

  return levels.slice(0, ORDER_BOOK_LEVELS).map((level) => ({
    price: parseNumber(level[0]),
    quantity: parseNumber(level[1]),
  }));
}

function parseWrappedArrayPayload(payload) {
  let current = payload;

  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(current)) {
      return current;
    }

    if (typeof current === 'string') {
      try {
        current = JSON.parse(current);
        continue;
      } catch {
        return null;
      }
    }

    if (!current || typeof current !== 'object') {
      return null;
    }

    const next =
      current.data ??
      current.result ??
      current.contents ??
      current.body ??
      current.payload ??
      current.response;

    if (next === undefined || next === null) {
      return null;
    }

    current = next;
  }

  return null;
}

function parseWrappedObjectPayload(payload) {
  let current = payload;

  for (let depth = 0; depth < 6; depth += 1) {
    if (typeof current === 'string') {
      try {
        current = JSON.parse(current);
        continue;
      } catch {
        break;
      }
    }

    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      break;
    }

    const next =
      current.data ??
      current.result ??
      current.contents ??
      current.body ??
      current.payload ??
      current.response;

    if (next === undefined || next === null) {
      return current;
    }

    current = next;
  }

  return payload && typeof payload === 'object' && !Array.isArray(payload)
    ? payload
    : {};
}

function parseOpenCloseFromCandles(candles) {
  if (!Array.isArray(candles) || candles.length === 0) {
    return null;
  }

  const normalized = candles
    .filter((candle) => Array.isArray(candle) && candle.length >= 5)
    .sort((a, b) => parseNumber(a[0]) - parseNumber(b[0]));

  if (!normalized.length) {
    return null;
  }

  const first = normalized[0];
  const last = normalized[normalized.length - 1];

  return {
    open: parseNumber(first[1]),
    close: parseNumber(last[4]),
  };
}

function getPeriodLabel(amount, unit) {
  return `${amount}${unit === 'd' ? 'D' : 'H'}`;
}

function toPositiveInteger(value, fallback = 1) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getCandleQueryConfig(period) {
  const amount = Number.isFinite(period?.amount)
    ? Math.max(1, Math.floor(period.amount))
    : 1;
  const unit = period?.unit === 'd' ? 'd' : 'h';

  return {
    amount,
    binanceInterval: unit === 'd' ? '1d' : '1h',
    bybitInterval: unit === 'd' ? 'D' : '60',
  };
}

async function fetchBinanceUrl(path, params = {}, signal) {
  let lastError = null;

  for (const baseUrl of BINANCE_BASE_URLS) {
    try {
      const url = baseUrl.startsWith('/')
        ? new URL(`${baseUrl}${path}`, window.location.origin)
        : new URL(path, baseUrl);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });

      const response = await fetch(url.toString(), { cache: 'no-store', signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return { response, baseUrl };
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(
    `Falha Binance: ${lastError?.message || 'nenhuma resposta do servidor'}`,
  );
}

async function fetchBinanceTickers() {
  const { response, baseUrl } = await fetchBinanceUrl('/api/v3/ticker/24hr');
  const payloadRaw = await response.json();
  const payload = parseWrappedArrayPayload(payloadRaw);

  if (!payload) {
    throw new Error(
      `Falha Binance: resposta nao eh um array, tipo=${typeof payloadRaw}`,
    );
  }

  return {
    baseUrl,
    tickers: payload
      .map((ticker) => ({
        symbol: ticker.symbol,
        lastPrice: parseNumber(ticker.lastPrice),
        changePercent: parseNumber(ticker.priceChangePercent),
        quoteVolume: parseNumber(ticker.quoteVolume),
      }))
      .filter(
        (ticker) =>
          typeof ticker.symbol === 'string' && ticker.symbol.length > 0,
      )
      .sort((a, b) => a.symbol.localeCompare(b.symbol)),
  };
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

  return {
    tickers: list
      .map((ticker) => ({
        symbol: ticker.symbol,
        lastPrice: parseNumber(ticker.lastPrice),
        changePercent: parseNumber(ticker.price24hPcnt) * 100,
        quoteVolume: parseNumber(ticker.turnover24h || ticker.volume24h),
      }))
      .filter(
        (ticker) =>
          typeof ticker.symbol === 'string' && ticker.symbol.length > 0,
      )
      .sort((a, b) => a.symbol.localeCompare(b.symbol)),
  };
}

async function fetchBinanceOrderBook(symbol, signal) {
  const { response } = await fetchBinanceUrl(
    '/api/v3/depth',
    {
      symbol,
      limit: ORDER_BOOK_LEVELS,
    },
    signal,
  );

  const payloadRaw = await response.json();
  const payload = parseWrappedObjectPayload(payloadRaw);

  return {
    bids: normalizeOrderLevels(payload?.bids),
    asks: normalizeOrderLevels(payload?.asks),
  };
}

async function fetchBybitOrderBook(symbol, signal) {
  const url = new URL('/v5/market/orderbook', BYBIT_BASE_URL);
  url.searchParams.set('category', 'spot');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('limit', String(ORDER_BOOK_LEVELS));
  url.searchParams.set('_', String(Date.now()));

  const response = await fetch(url.toString(), { cache: 'no-store', signal });
  if (!response.ok) {
    throw new Error(`Falha Bybit order book: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const result = payload?.result;

  if (payload?.retCode !== 0 || !result) {
    throw new Error('Falha Bybit order book: formato de dados invalido');
  }

  return {
    bids: normalizeOrderLevels(result.b),
    asks: normalizeOrderLevels(result.a),
  };
}

async function fetchBinanceCandle(symbol, period, signal) {
  const { amount, binanceInterval } = getCandleQueryConfig(period);

  const { response } = await fetchBinanceUrl(
    '/api/v3/klines',
    {
      symbol,
      interval: binanceInterval,
      limit: String(amount),
    },
    signal,
  );

  const payloadRaw = await response.json();
  const payload = parseWrappedArrayPayload(payloadRaw);
  if (!payload || payload.length === 0) {
    throw new Error('Falha Binance candle: formato de dados invalido');
  }

  const candles = payload.slice(-amount);
  const openClose = parseOpenCloseFromCandles(candles);
  if (!openClose) {
    throw new Error('Falha Binance candle: formato de dados invalido');
  }

  return openClose;
}

async function fetchBybitKlineList(symbol, interval, limit, signal) {
  const url = new URL('/v5/market/kline', BYBIT_BASE_URL);
  url.searchParams.set('category', 'spot');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('_', String(Date.now()));

  const response = await fetch(url.toString(), { cache: 'no-store', signal });
  if (!response.ok) {
    throw new Error(`Falha Bybit candle: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const list = payload?.result?.list;
  if (payload?.retCode !== 0 || !Array.isArray(list) || list.length === 0) {
    throw new Error('Falha Bybit candle: formato de dados invalido');
  }

  return list;
}

async function fetchBybitCandle(symbol, period, signal) {
  const { amount, bybitInterval } = getCandleQueryConfig(period);
  const list = await fetchBybitKlineList(symbol, bybitInterval, amount, signal);

  const candles = list.slice(-amount);
  const openClose = parseOpenCloseFromCandles(candles);
  if (!openClose) {
    throw new Error('Falha Bybit candle: formato de dados invalido');
  }

  return openClose;
}

export default function MarketOverview() {
  const [pairsByExchange, setPairsByExchange] = useState(INITIAL_PAIRS);
  const [pairPages, setPairPages] = useState(INITIAL_PAGES);
  const [pairsStatus, setPairsStatus] = useState('idle');
  const [pairsError, setPairsError] = useState('');
  const [pairsNotice, setPairsNotice] = useState('');
  const [lastPairsUpdate, setLastPairsUpdate] = useState(null);

  const [selectedExchangeKey, setSelectedExchangeKey] = useState(
    EXCHANGES[0].key,
  );
  const [selectedPairSymbol, setSelectedPairSymbol] = useState('');
  const [selectedHourAmount, setSelectedHourAmount] = useState(
    HOUR_PERIOD_NUMBER_OPTIONS[0],
  );
  const [selectedDaySelection, setSelectedDaySelection] = useState(
    String(DAY_PERIOD_NUMBER_OPTIONS[0]),
  );
  const [customDayAmount, setCustomDayAmount] = useState(31);
  const [selectedPeriodUnit, setSelectedPeriodUnit] = useState(
    PERIOD_UNIT_OPTIONS[0].key,
  );

  const [candleData, setCandleData] = useState({ open: 0, close: 0 });
  const [candleStatus, setCandleStatus] = useState('idle');
  const [candleError, setCandleError] = useState('');

  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [orderBookStatus, setOrderBookStatus] = useState('idle');
  const [orderBookError, setOrderBookError] = useState('');
  const [refreshDistance, setRefreshDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshHint, setRefreshHint] = useState('Puxe para atualizar');
  const pairSwipeStartRef = useRef({});
  const refreshStartRef = useRef(null);
  const candleRequestIdRef = useRef(0);
  const orderBookRequestIdRef = useRef(0);
  const candleAbortRef = useRef(null);
  const orderBookAbortRef = useRef(null);

  const selectedExchange =
    EXCHANGES.find((exchange) => exchange.key === selectedExchangeKey) ||
    EXCHANGES[0];
  const selectedPairs = useMemo(
    () => pairsByExchange[selectedExchangeKey] || [],
    [pairsByExchange, selectedExchangeKey],
  );

  const selectedPeriod = useMemo(
    () => ({
      amount:
        selectedPeriodUnit === 'h'
          ? selectedHourAmount
          : selectedDaySelection === CUSTOM_DAY_OPTION
            ? customDayAmount
            : toPositiveInteger(selectedDaySelection, 1),
      unit: selectedPeriodUnit,
      label: getPeriodLabel(
        selectedPeriodUnit === 'h'
          ? selectedHourAmount
          : selectedDaySelection === CUSTOM_DAY_OPTION
            ? customDayAmount
            : toPositiveInteger(selectedDaySelection, 1),
        selectedPeriodUnit,
      ),
    }),
    [
      customDayAmount,
      selectedDaySelection,
      selectedHourAmount,
      selectedPeriodUnit,
    ],
  );

  const selectedTicker = useMemo(
    () =>
      selectedPairs.find((pair) => pair.symbol === selectedPairSymbol) || null,
    [selectedPairSymbol, selectedPairs],
  );

  const selectedPeriodNumberValue =
    selectedPeriodUnit === 'h' ? String(selectedHourAmount) : selectedDaySelection;

  function handlePeriodNumberChange(event) {
    const value = event.target.value;

    if (selectedPeriodUnit === 'h') {
      setSelectedHourAmount(
        Math.min(
          Math.max(toPositiveInteger(value, 1), HOUR_PERIOD_NUMBER_OPTIONS[0]),
          HOUR_PERIOD_NUMBER_OPTIONS[HOUR_PERIOD_NUMBER_OPTIONS.length - 1],
        ),
      );
      return;
    }

    setSelectedDaySelection(value);
    if (value === CUSTOM_DAY_OPTION && customDayAmount < 31) {
      setCustomDayAmount(31);
    }
  }

  function handleCustomDayAmountChange(event) {
    setCustomDayAmount(toPositiveInteger(event.target.value, 1));
  }

  const paginatedPairs = useMemo(
    () =>
      EXCHANGES.map((exchange) => {
        const pairs = pairsByExchange[exchange.key] || [];
        const totalPages = Math.max(
          1,
          Math.ceil(pairs.length / PAIRS_PER_PAGE),
        );
        const currentPage = Math.min(pairPages[exchange.key] || 1, totalPages);
        const start = (currentPage - 1) * PAIRS_PER_PAGE;

        return {
          ...exchange,
          totalPairs: pairs.length,
          totalPages,
          currentPage,
          pairs: pairs.slice(start, start + PAIRS_PER_PAGE),
        };
      }),
    [pairPages, pairsByExchange],
  );

  const lastUpdateLabel = useMemo(() => {
    if (!lastPairsUpdate) {
      return 'Aguardando a primeira atualizacao dos pares';
    }

    return `Atualizado as ${lastPairsUpdate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
  }, [lastPairsUpdate]);

  const loadCandle = useCallback(async () => {
    if (!selectedPairSymbol) {
      candleRequestIdRef.current += 1;
      candleAbortRef.current?.abort();
      candleAbortRef.current = null;
      setCandleData({ open: 0, close: 0 });
      setCandleStatus('idle');
      setCandleError('');
      return;
    }

    const requestId = candleRequestIdRef.current + 1;
    candleRequestIdRef.current = requestId;
    candleAbortRef.current?.abort();
    const abortController = new AbortController();
    candleAbortRef.current = abortController;
    const exchangeKeyAtRequest = selectedExchangeKey;
    const pairSymbolAtRequest = selectedPairSymbol;
    const periodAtRequest = selectedPeriod;

    setCandleStatus('loading');
    setCandleError('');

    try {
      const candle =
        exchangeKeyAtRequest === 'binance'
          ? await fetchBinanceCandle(
              pairSymbolAtRequest,
              periodAtRequest,
              abortController.signal,
            )
          : await fetchBybitCandle(
              pairSymbolAtRequest,
              periodAtRequest,
              abortController.signal,
            );

      if (requestId !== candleRequestIdRef.current) {
        return;
      }

      setCandleData(candle);
      setCandleStatus('ok');
    } catch (error) {
      if (requestId !== candleRequestIdRef.current || isAbortError(error)) {
        return;
      }
      console.error(error);
      setCandleStatus('error');
      setCandleError(
        `Nao foi possivel carregar o preco de abertura/fechamento para ${pairSymbolAtRequest}.`,
      );
    } finally {
      if (requestId === candleRequestIdRef.current) {
        candleAbortRef.current = null;
      }
    }
  }, [selectedExchangeKey, selectedPairSymbol, selectedPeriod]);

  const loadPairs = useCallback(async () => {
    setPairsStatus('loading');
    setPairsError('');
    setPairsNotice('');

    const [binanceResult, bybitResult] = await Promise.allSettled([
      fetchBinanceTickers(),
      fetchBybitTickers(),
    ]);

    const hasBinance = binanceResult.status === 'fulfilled';
    const hasBybit = bybitResult.status === 'fulfilled';

    if (!hasBinance && !hasBybit) {
      setPairsStatus('error');
      setPairsError(
        'Binance e Bybit nao responderam no momento. Verifique sua conexao e tente novamente.',
      );
      return;
    }

    setPairsByExchange((previous) => ({
      binance: hasBinance ? binanceResult.value.tickers : previous.binance,
      bybit: hasBybit ? bybitResult.value.tickers : previous.bybit,
    }));

    setSelectedExchangeKey((currentExchange) => {
      if (currentExchange === 'binance' && !hasBinance && hasBybit) {
        return 'bybit';
      }

      if (currentExchange === 'bybit' && !hasBybit && hasBinance) {
        return 'binance';
      }

      return currentExchange;
    });

    setLastPairsUpdate(new Date());
    setPairsStatus('ok');

    if (hasBinance && hasBybit) {
      setPairsNotice('');
      return;
    }

    if (!hasBinance) {
      setPairsNotice(
        'Binance nao respondeu. Exibindo dados anteriores ou use Bybit.',
      );
    } else if (!hasBybit) {
      setPairsNotice(
        'Bybit nao respondeu. Exibindo dados anteriores ou use Binance.',
      );
    }
  }, []);

  const loadOrderBook = useCallback(async () => {
    if (!selectedPairSymbol) {
      orderBookRequestIdRef.current += 1;
      orderBookAbortRef.current?.abort();
      orderBookAbortRef.current = null;
      setOrderBook({ bids: [], asks: [] });
      setOrderBookStatus('idle');
      setOrderBookError('');
      return;
    }

    const requestId = orderBookRequestIdRef.current + 1;
    orderBookRequestIdRef.current = requestId;
    orderBookAbortRef.current?.abort();
    const abortController = new AbortController();
    orderBookAbortRef.current = abortController;
    const exchangeKeyAtRequest = selectedExchangeKey;
    const pairSymbolAtRequest = selectedPairSymbol;
    const exchangeLabelAtRequest =
      EXCHANGES.find((exchange) => exchange.key === exchangeKeyAtRequest)
        ?.label || EXCHANGES[0].label;

    setOrderBookStatus('loading');
    setOrderBookError('');

    try {
      const payload =
        exchangeKeyAtRequest === 'binance'
          ? await fetchBinanceOrderBook(
              pairSymbolAtRequest,
              abortController.signal,
            )
          : await fetchBybitOrderBook(
              pairSymbolAtRequest,
              abortController.signal,
            );

      if (requestId !== orderBookRequestIdRef.current) {
        return;
      }

      setOrderBook(payload);
      setOrderBookStatus('ok');
    } catch (error) {
      if (requestId !== orderBookRequestIdRef.current || isAbortError(error)) {
        return;
      }
      setOrderBookStatus('error');
      setOrderBookError(
        `Nao foi possivel carregar o livro de ofertas de ${exchangeLabelAtRequest} para ${pairSymbolAtRequest}.`,
      );
    } finally {
      if (requestId === orderBookRequestIdRef.current) {
        orderBookAbortRef.current = null;
      }
    }
  }, [selectedExchangeKey, selectedPairSymbol]);

  useEffect(() => {
    loadPairs();
    const intervalId = setInterval(loadPairs, 60_000);

    return () => clearInterval(intervalId);
  }, [loadPairs]);

  useEffect(() => {
    const pairs = pairsByExchange[selectedExchangeKey] || [];

    if (!pairs.length) {
      if (selectedPairSymbol) {
        setSelectedPairSymbol('');
      }
      return;
    }

    const pairExists = pairs.some((pair) => pair.symbol === selectedPairSymbol);
    if (!pairExists) {
      setSelectedPairSymbol(pairs[0].symbol);
    }
  }, [pairsByExchange, selectedExchangeKey, selectedPairSymbol]);

  useEffect(() => {
    setPairPages((previous) => {
      const next = { ...previous };
      let changed = false;

      EXCHANGES.forEach((exchange) => {
        const totalPages = Math.max(
          1,
          Math.ceil(
            (pairsByExchange[exchange.key]?.length || 0) / PAIRS_PER_PAGE,
          ),
        );
        const previousPage = previous[exchange.key];
        const safePage =
          Number.isFinite(previousPage) && previousPage > 0 ? previousPage : 1;
        const clampedPage = Math.min(safePage, totalPages);

        if (clampedPage !== previousPage) {
          next[exchange.key] = clampedPage;
          changed = true;
        }
      });

      return changed ? next : previous;
    });
  }, [pairsByExchange]);

  useEffect(() => {
    loadOrderBook();
    const intervalId = setInterval(loadOrderBook, 20_000);

    return () => clearInterval(intervalId);
  }, [loadOrderBook]);

  useEffect(() => {
    loadCandle();
  }, [loadCandle]);

  useEffect(
    () => () => {
      candleAbortRef.current?.abort();
      orderBookAbortRef.current?.abort();
    },
    [],
  );

  function setExchangePage(exchangeKey, page, totalPages) {
    const nextPage = Math.min(Math.max(page, 1), totalPages);

    setPairPages((previous) => ({
      ...previous,
      [exchangeKey]: nextPage,
    }));
  }

  function handlePairTouchStart(exchangeKey, event) {
    const touch = event.changedTouches?.[0];
    if (!touch) {
      return;
    }

    pairSwipeStartRef.current[exchangeKey] = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  function handlePairTouchEnd(exchangeKey, currentPage, totalPages, event) {
    const touch = event.changedTouches?.[0];
    const start = pairSwipeStartRef.current[exchangeKey];
    pairSwipeStartRef.current[exchangeKey] = null;

    if (!touch || !start || totalPages <= 1) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const isHorizontalSwipe =
      Math.abs(deltaX) >= 60 && Math.abs(deltaX) > Math.abs(deltaY);

    if (!isHorizontalSwipe) {
      return;
    }

    if (deltaX < 0) {
      setExchangePage(exchangeKey, currentPage + 1, totalPages);
      return;
    }

    setExchangePage(exchangeKey, currentPage - 1, totalPages);
  }

  function getScrollTop() {
    return (
      document.scrollingElement?.scrollTop ||
      document.documentElement.scrollTop ||
      0
    );
  }

  function handleRefreshTouchStart(event) {
    if (getScrollTop() > 0 || isRefreshing) {
      refreshStartRef.current = null;
      return;
    }

    const touch = event.touches?.[0];
    if (!touch) {
      return;
    }

    refreshStartRef.current = touch.clientY;
  }

  function handleRefreshTouchMove(event) {
    if (refreshStartRef.current === null || isRefreshing) {
      return;
    }

    const touch = event.touches?.[0];
    if (!touch) {
      return;
    }

    const distance = Math.min(
      Math.max(touch.clientY - refreshStartRef.current, 0),
      120,
    );
    setRefreshDistance(distance);
    setRefreshHint(
      distance >= 80 ? 'Solte para atualizar' : 'Puxe para atualizar',
    );
  }

  async function handleRefreshTouchEnd() {
    if (refreshStartRef.current === null || isRefreshing) {
      setRefreshDistance(0);
      return;
    }

    const distance = refreshDistance;
    refreshStartRef.current = null;
    setRefreshDistance(0);

    if (distance < 80) {
      setRefreshHint('Puxe para atualizar');
      return;
    }

    setIsRefreshing(true);
    setRefreshHint('Atualizando...');

    try {
      await Promise.all([loadPairs(), loadOrderBook(), loadCandle()]);
      setRefreshHint('Dados atualizados');
    } finally {
      setIsRefreshing(false);
      window.setTimeout(() => setRefreshHint('Puxe para atualizar'), 1200);
    }
  }

  return (
    <div
      className='market-dashboard'
      onTouchStart={handleRefreshTouchStart}
      onTouchMove={handleRefreshTouchMove}
      onTouchEnd={handleRefreshTouchEnd}
      style={{
        transform: refreshDistance
          ? `translateY(${refreshDistance}px)`
          : undefined,
      }}
    >
      <div className='dashboard-toolbar'>
        <div className='dashboard-meta'>
          <p>{lastUpdateLabel}</p>
        </div>

        <div className='dashboard-filters'>
          <label className='dashboard-filter'>
            <span>Exchange</span>
            <select
              value={selectedExchangeKey}
              onChange={(event) => setSelectedExchangeKey(event.target.value)}
            >
              {EXCHANGES.map((exchange) => (
                <option key={exchange.key} value={exchange.key}>
                  {exchange.label}
                </option>
              ))}
            </select>
          </label>

          <label className='dashboard-filter'>
            <span>Par</span>
            <select
              value={selectedPairSymbol}
              onChange={(event) => setSelectedPairSymbol(event.target.value)}
              disabled={!selectedPairs.length}
            >
              {selectedPairs.length ? (
                selectedPairs.map((pair) => (
                  <option
                    key={`${selectedExchangeKey}-${pair.symbol}`}
                    value={pair.symbol}
                  >
                    {pair.symbol}
                  </option>
                ))
              ) : (
                <option value=''>Sem pares</option>
              )}
            </select>
          </label>

          <button
            className='ghost-button'
            type='button'
            onClick={loadPairs}
            disabled={pairsStatus === 'loading'}
          >
            {pairsStatus === 'loading' ? 'Atualizando...' : 'Atualizar dados'}
          </button>
        </div>
      </div>

      <div
        className='refresh-indicator'
        style={{
          height: refreshDistance || isRefreshing ? '38px' : '0px',
          opacity: refreshDistance || isRefreshing ? 1 : 0,
        }}
      >
        {isRefreshing ? 'Atualizando dados...' : refreshHint}
      </div>

      {pairsError && <p className='dashboard-error'>{pairsError}</p>}
      {pairsNotice && <p className='dashboard-notice'>{pairsNotice}</p>}

      <div className='dashboard-grid'>
        <article className='dashboard-card'>
          <div className='dashboard-card-header-row'>
            <p className='dashboard-card-tag'>Último preço</p>
            <div className='dashboard-period-select'>
              <span>Período</span>
              <div className='dashboard-period-controls'>
                <select
                  aria-label='Número do período'
                  value={selectedPeriodNumberValue}
                  onChange={handlePeriodNumberChange}
                >
                  {selectedPeriodUnit === 'h'
                    ? HOUR_PERIOD_NUMBER_OPTIONS.map((periodNumber) => (
                        <option key={periodNumber} value={periodNumber}>
                          {periodNumber}
                        </option>
                      ))
                    : [
                        ...DAY_PERIOD_NUMBER_OPTIONS.map((periodNumber) => (
                          <option key={periodNumber} value={periodNumber}>
                            {periodNumber}
                          </option>
                        )),
                        <option key={CUSTOM_DAY_OPTION} value={CUSTOM_DAY_OPTION}>
                          Mais
                        </option>,
                      ]}
                </select>
                <select
                  aria-label='Unidade do período'
                  value={selectedPeriodUnit}
                  onChange={(event) => setSelectedPeriodUnit(event.target.value)}
                >
                  {PERIOD_UNIT_OPTIONS.map((periodUnit) => (
                    <option key={periodUnit.key} value={periodUnit.key}>
                      {periodUnit.label}
                    </option>
                  ))}
                </select>
              </div>
              {selectedPeriodUnit === 'd' &&
              selectedDaySelection === CUSTOM_DAY_OPTION ? (
                <input
                  aria-label='Quantidade de dias'
                  className='dashboard-period-custom-input'
                  min='1'
                  step='1'
                  type='number'
                  value={customDayAmount}
                  onChange={handleCustomDayAmountChange}
                />
              ) : null}
            </div>
          </div>
          {selectedTicker ? (
            <>
              <h3>
                {selectedExchange.label} - {selectedTicker.symbol}
              </h3>
              <p className='dashboard-price-value'>
                US$ {formatPrice(selectedTicker.lastPrice)}
              </p>
              <p
                className={`dashboard-change ${
                  selectedTicker.changePercent >= 0 ? 'up' : 'down'
                }`}
              >
                {formatPercent(selectedTicker.changePercent)} em 24h
              </p>
              <p className='dashboard-volume'>
                Volume: {formatVolume(selectedTicker.quoteVolume)}
              </p>
              <div className='dashboard-candle-info'>
                {candleStatus === 'loading' ? (
                  <p>Carregando abert./fechamento...</p>
                ) : candleStatus === 'error' ? (
                  <p className='dashboard-error'>{candleError}</p>
                ) : (
                  <>
                    <p>
                      Abertura ({selectedPeriod.label}): US${' '}
                      {formatPrice(candleData.open)}
                    </p>
                    <p>
                      Fechamento ({selectedPeriod.label}): US${' '}
                      {formatPrice(candleData.close)}
                    </p>
                  </>
                )}
              </div>
            </>
          ) : (
            <p className='dashboard-empty'>
              Sem pares disponiveis para esta exchange.
            </p>
          )}
        </article>

        <article className='dashboard-card'>
          <div className='orderbook-header'>
            <p className='dashboard-card-tag'>Livro de ofertas</p>
            <span>
              {selectedExchange.label}
              {selectedPairSymbol ? ` - ${selectedPairSymbol}` : ''}
            </span>
          </div>

          {orderBookError && (
            <p className='dashboard-error'>{orderBookError}</p>
          )}

          {orderBookStatus === 'loading' &&
          !orderBook.bids.length &&
          !orderBook.asks.length ? (
            <p className='dashboard-empty'>Carregando livro de ofertas...</p>
          ) : (
            <div className='orderbook-grid'>
              <div className='orderbook-column'>
                <p>Compras (bids)</p>
                <div className='orderbook-list'>
                  {orderBook.bids.length ? (
                    orderBook.bids.map((level, index) => (
                      <div
                        key={`bid-${index}-${level.price}`}
                        className='orderbook-row bid'
                      >
                        <span>{formatPrice(level.price)}</span>
                        <span>{formatQuantity(level.quantity)}</span>
                      </div>
                    ))
                  ) : (
                    <p className='dashboard-empty'>Sem dados de compra.</p>
                  )}
                </div>
              </div>

              <div className='orderbook-column'>
                <p>Vendas (asks)</p>
                <div className='orderbook-list'>
                  {orderBook.asks.length ? (
                    orderBook.asks.map((level, index) => (
                      <div
                        key={`ask-${index}-${level.price}`}
                        className='orderbook-row ask'
                      >
                        <span>{formatPrice(level.price)}</span>
                        <span>{formatQuantity(level.quantity)}</span>
                      </div>
                    ))
                  ) : (
                    <p className='dashboard-empty'>Sem dados de venda.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </article>
      </div>

      <section className='pairs-section'>
        <div className='pairs-grid'>
          {paginatedPairs.map((exchangeData) => (
            <article
              key={exchangeData.key}
              className='pairs-card'
              onTouchStart={(event) =>
                handlePairTouchStart(exchangeData.key, event)
              }
              onTouchEnd={(event) =>
                handlePairTouchEnd(
                  exchangeData.key,
                  exchangeData.currentPage,
                  exchangeData.totalPages,
                  event,
                )
              }
            >
              <div className='pairs-card-header'>
                <h4>{exchangeData.label}</h4>
                <span>{exchangeData.totalPairs} pares</span>
              </div>

              <p className='pairs-card-note'>
                Deslize na lista para trocar de página de pares.
              </p>

              <div className='pairs-list'>
                {exchangeData.pairs.length ? (
                  exchangeData.pairs.map((pair) => {
                    const isSelected =
                      selectedExchangeKey === exchangeData.key &&
                      selectedPairSymbol === pair.symbol;

                    return (
                      <button
                        key={`${exchangeData.key}-${pair.symbol}`}
                        type='button'
                        className={`pair-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedExchangeKey(exchangeData.key);
                          setSelectedPairSymbol(pair.symbol);
                        }}
                      >
                        <div>
                          <p>{pair.symbol}</p>
                          <small>Volume {formatVolume(pair.quoteVolume)}</small>
                        </div>
                        <div>
                          <strong>US$ {formatPrice(pair.lastPrice)}</strong>
                          <small
                            className={pair.changePercent >= 0 ? 'up' : 'down'}
                          >
                            {formatPercent(pair.changePercent)}
                          </small>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className='dashboard-empty'>Sem pares disponiveis.</p>
                )}
              </div>

              <div className='pairs-pagination'>
                <button
                  className='ghost-button'
                  type='button'
                  onClick={() =>
                    setExchangePage(
                      exchangeData.key,
                      exchangeData.currentPage - 1,
                      exchangeData.totalPages,
                    )
                  }
                  disabled={exchangeData.currentPage <= 1}
                >
                  Anterior
                </button>

                <span>
                  Pagina {exchangeData.currentPage} de {exchangeData.totalPages}
                </span>

                <button
                  className='ghost-button'
                  type='button'
                  onClick={() =>
                    setExchangePage(
                      exchangeData.key,
                      exchangeData.currentPage + 1,
                      exchangeData.totalPages,
                    )
                  }
                  disabled={exchangeData.currentPage >= exchangeData.totalPages}
                >
                  Próxima
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
