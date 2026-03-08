import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './MarketOverview.css';

const BINANCE_BASE_URL =
  import.meta.env.VITE_BINANCE_BASE_URL || 'https://data-api.binance.vision';
const BYBIT_BASE_URL =
  import.meta.env.VITE_BYBIT_BASE_URL || 'https://api.bybit.com';

const EXCHANGES = [
  { key: 'binance', label: 'Binance' },
  { key: 'bybit', label: 'Bybit' },
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

function normalizeOrderLevels(levels) {
  if (!Array.isArray(levels)) {
    return [];
  }

  return levels.slice(0, ORDER_BOOK_LEVELS).map((level) => ({
    price: parseNumber(level[0]),
    quantity: parseNumber(level[1]),
  }));
}

async function fetchBinanceTickers() {
  const url = new URL('/api/v3/ticker/24hr', BINANCE_BASE_URL);
  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Falha Binance: HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error('Falha Binance: formato de dados invalido');
  }

  return payload
    .map((ticker) => ({
      symbol: ticker.symbol,
      lastPrice: parseNumber(ticker.lastPrice),
      changePercent: parseNumber(ticker.priceChangePercent),
      quoteVolume: parseNumber(ticker.quoteVolume),
    }))
    .filter(
      (ticker) => typeof ticker.symbol === 'string' && ticker.symbol.length > 0,
    )
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

async function fetchBybitTickers() {
  const url = new URL('/v5/market/tickers', BYBIT_BASE_URL);
  url.searchParams.set('category', 'spot');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Falha Bybit: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const list = payload?.result?.list;

  if (payload?.retCode !== 0 || !Array.isArray(list)) {
    throw new Error('Falha Bybit: formato de dados invalido');
  }

  return list
    .map((ticker) => ({
      symbol: ticker.symbol,
      lastPrice: parseNumber(ticker.lastPrice),
      changePercent: parseNumber(ticker.price24hPcnt) * 100,
      quoteVolume: parseNumber(ticker.turnover24h || ticker.volume24h),
    }))
    .filter(
      (ticker) => typeof ticker.symbol === 'string' && ticker.symbol.length > 0,
    )
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

async function fetchBinanceOrderBook(symbol) {
  const url = new URL('/api/v3/depth', BINANCE_BASE_URL);
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('limit', String(ORDER_BOOK_LEVELS));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Falha Binance order book: HTTP ${response.status}`);
  }

  const payload = await response.json();

  return {
    bids: normalizeOrderLevels(payload?.bids),
    asks: normalizeOrderLevels(payload?.asks),
  };
}

async function fetchBybitOrderBook(symbol) {
  const url = new URL('/v5/market/orderbook', BYBIT_BASE_URL);
  url.searchParams.set('category', 'spot');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('limit', String(ORDER_BOOK_LEVELS));

  const response = await fetch(url.toString());
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

export default function MarketOverview() {
  const [pairsByExchange, setPairsByExchange] = useState(INITIAL_PAIRS);
  const [pairPages, setPairPages] = useState(INITIAL_PAGES);
  const [pairsStatus, setPairsStatus] = useState('idle');
  const [pairsError, setPairsError] = useState('');
  const [lastPairsUpdate, setLastPairsUpdate] = useState(null);

  const [selectedExchangeKey, setSelectedExchangeKey] = useState(
    EXCHANGES[0].key,
  );
  const [selectedPairSymbol, setSelectedPairSymbol] = useState('');

  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [orderBookStatus, setOrderBookStatus] = useState('idle');
  const [orderBookError, setOrderBookError] = useState('');
  const pairSwipeStartRef = useRef({});

  const selectedExchange =
    EXCHANGES.find((exchange) => exchange.key === selectedExchangeKey) ||
    EXCHANGES[0];
  const selectedPairs = useMemo(
    () => pairsByExchange[selectedExchangeKey] || [],
    [pairsByExchange, selectedExchangeKey],
  );

  const selectedTicker = useMemo(
    () =>
      selectedPairs.find((pair) => pair.symbol === selectedPairSymbol) || null,
    [selectedPairSymbol, selectedPairs],
  );

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

  const loadPairs = useCallback(async () => {
    setPairsStatus('loading');
    setPairsError('');

    const [binanceResult, bybitResult] = await Promise.allSettled([
      fetchBinanceTickers(),
      fetchBybitTickers(),
    ]);

    const hasBinance = binanceResult.status === 'fulfilled';
    const hasBybit = bybitResult.status === 'fulfilled';

    if (!hasBinance && !hasBybit) {
      setPairsStatus('error');
      setPairsError(
        'Nao foi possivel carregar os pares de Binance e Bybit no momento. Mantendo a ultima leitura.',
      );
      return;
    }

    setPairsByExchange((previous) => ({
      binance: hasBinance ? binanceResult.value : previous.binance,
      bybit: hasBybit ? bybitResult.value : previous.bybit,
    }));

    setLastPairsUpdate(new Date());
    setPairsStatus('ok');

    if (!hasBinance || !hasBybit) {
      setPairsError(
        'Uma exchange nao respondeu agora. Exibindo os pares que estao disponiveis.',
      );
    }
  }, []);

  const loadOrderBook = useCallback(async () => {
    if (!selectedPairSymbol) {
      setOrderBook({ bids: [], asks: [] });
      setOrderBookStatus('idle');
      setOrderBookError('');
      return;
    }

    setOrderBookStatus('loading');
    setOrderBookError('');

    try {
      const payload =
        selectedExchangeKey === 'binance'
          ? await fetchBinanceOrderBook(selectedPairSymbol)
          : await fetchBybitOrderBook(selectedPairSymbol);

      setOrderBook(payload);
      setOrderBookStatus('ok');
    } catch {
      setOrderBookStatus('error');
      setOrderBookError(
        `Nao foi possivel carregar o livro de ofertas de ${selectedExchange.label} para ${selectedPairSymbol}.`,
      );
    }
  }, [selectedExchange.label, selectedExchangeKey, selectedPairSymbol]);

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

  return (
    <div className='market-dashboard'>
      <div className='dashboard-toolbar'>
        <div className='dashboard-meta'>
          <p>{lastUpdateLabel}</p>
          <p>Sistema em modo informativo: apenas dados publicos das APIs.</p>
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

      {pairsError && <p className='dashboard-error'>{pairsError}</p>}

      <div className='dashboard-grid'>
        <article className='dashboard-card'>
          <p className='dashboard-card-tag'>Último preço</p>
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
