import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

const BINANCE_BASE_URL =
  import.meta.env.VITE_BINANCE_BASE_URL || 'https://data-api.binance.vision';

const trackedSymbols = [
  { apiSymbol: 'BTCUSDT', name: 'Bitcoin', symbol: 'BTC' },
  { apiSymbol: 'ETHUSDT', name: 'Ethereum', symbol: 'ETH' },
  { apiSymbol: 'SOLUSDT', name: 'Solana', symbol: 'SOL' },
];

const fallbackMarketData = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 'US$ 0,00',
    change: '+3,4%',
    trend: 'up',
    volume: '0 USDT',
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    price: 'US$ 0,00',
    change: '+2,1%',
    trend: 'up',
    volume: '0 USDT',
  },
  {
    name: 'Solana',
    symbol: 'SOL',
    price: 'US$ 0,00',
    change: '-1,2%',
    trend: 'down',
    volume: '0 USDT',
  },
];

const portfolioData = [
  { label: 'Saldo disponível', value: 'R$ 28.450,00' },
  { label: 'Criptos em carteira', value: '6 ativos' },
  { label: 'Variação 24h', value: '+2,8%' },
];

const transactions = [
  {
    type: 'Compra',
    asset: 'Bitcoin',
    amount: '0,024 BTC',
    status: 'Concluída',
    statusKey: 'done',
    time: 'Há 12 min',
  },
  {
    type: 'Venda',
    asset: 'Ethereum',
    amount: '1,4 ETH',
    status: 'Processando',
    statusKey: 'pending',
    time: 'Há 40 min',
  },
  {
    type: 'Compra',
    asset: 'Solana',
    amount: '22 SOL',
    status: 'Concluída',
    statusKey: 'done',
    time: 'Há 2h',
  },
];

const highlights = [
  {
    title: 'Cotação em tempo real',
    description:
      'Acompanhe variações, volume e tendências com atualizações automáticas a cada 30 segundos.',
  },
  {
    title: 'Carteira inteligente',
    description:
      'Distribuição de ativos, metas e alertas personalizados para apoiar suas decisões de investimento.',
  },
  {
    title: 'Operações rápidas',
    description:
      'Fluxo de compra e venda com confirmação em tempo real e histórico completo de transações.',
  },
];

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

export default function App() {
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
        'Não foi possível atualizar os preços da Binance agora. Exibindo última leitura.',
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
      return 'Aguardando primeira atualização';
    }

    return `Atualizado às ${lastMarketUpdate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
  }, [lastMarketUpdate]);

  return (
    <div className='app'>
      <header className='hero' style={{ paddingBottom: '10px' }}>
        <nav className='nav'>
          <div className='brand'>
            <span className='brand-dot' aria-hidden='true' />
            <div>
              <p className='brand-title'>Criptmoeda</p>
              <p className='brand-subtitle'>Plataforma Digital</p>
            </div>
          </div>

          <div className='nav-actions'>
            <a className='ghost-button' href='/mercado.html'>
              Mercado
            </a>
            <a className='ghost-button' href='/transacoes.html'>
              Transacoes
            </a>
            <button className='ghost-button' type='button'>
              Entrar
            </button>
            <button className='primary-button' type='button'>
              Criar conta
            </button>
          </div>
        </nav>

        <div className='hero-grid'>
          <div className='hero-content'>
            <h1>
              Compre, venda e monitore criptomoedas com uma experiência mobile
              em primeiro lugar.
            </h1>

            <p>
              Dashboard completo com dados em tempo real, histórico de
              transações e gestão inteligente de carteira. Tudo em uma aplicação
              moderna, rápida e segura.
            </p>

            <div className='hero-actions'>
              <a className='primary-button link-button' href='/mercado.html'>
                Explorar mercado
              </a>
              <a className='outline-button link-button' href='/transacoes.html'>
                Ver transações
              </a>
            </div>

            <div className='hero-metrics'>
              <div>
                <strong>90%</strong>
                <span>Score performance</span>
              </div>
              <div>
                <strong>+120k</strong>
                <span>Usuários ativos</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Atualização de preços</span>
              </div>
            </div>
          </div>

          <div className='hero-card'>
            <div className='card-header'>
              <div>
                <p className='card-title'>Resumo da carteira</p>
                <p className='card-subtitle'>Saldo total</p>
              </div>
              <span className='badge'>Ao vivo</span>
            </div>

            <h2>R$ 102.890,45</h2>
            <p className='card-change'>+4,5% nas últimas 24 horas</p>

            <div className='card-grid'>
              {portfolioData.map((item) => (
                <div key={item.label} className='stat-card'>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <button className='secondary-button' type='button'>
              Gerenciar carteira
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className='section' id='mercado'>
          <div className='section-header'>
            <div>
              <p className='section-tag'>Mercado agora</p>
              <h2>Principais criptomoedas</h2>
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
        </section>

        <section
          className='section highlight'
          style={{
            paddingLeft: '20px',
            paddingRight: '20px',
            paddingBottom: '25px',
            paddingTop: '25px',
          }}
        >
          <div className='highlight-content'>
            <p className='section-tag'>Experiência mobile</p>
            <h2>Componentes dinâmicos e reutilizáveis</h2>
            <p>
              Construímos módulos flexíveis que se adaptam a qualquer tamanho de
              tela. A navegação é fluida, com gestos touch e feedback imediato.
            </p>

            <div className='highlight-list'>
              {highlights.map((item) => (
                <div key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className='highlight-card'>
            <h3>Últimas transações</h3>

            <div className='transaction-list'>
              {transactions.map((t, idx) => (
                <div key={`${t.asset}-${idx}`} className='transaction-item'>
                  <div>
                    <p className='transaction-type'>{t.type}</p>
                    <p className='transaction-asset'>{t.asset}</p>
                    <span>{t.amount}</span>
                  </div>

                  <div className='transaction-meta'>
                    <span className={`status ${t.statusKey}`}>{t.status}</span>
                    <small>{t.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className='section' id='fluxo'>
          <div className='section-header'>
            <div>
              <p className='section-tag'>Fluxo de compra e venda</p>
              <h2>Simulação rápida de operação</h2>
            </div>
          </div>

          <div className='action-grid'>
            <div className='action-card'>
              <h3>Comprar cripto</h3>
              <p>Selecione o ativo e defina o valor. O cálculo é automático.</p>

              <div className='action-inputs'>
                <label>
                  Ativo
                  <select defaultValue='BTC'>
                    <option value='BTC'>BTC - Bitcoin</option>
                    <option value='ETH'>ETH - Ethereum</option>
                    <option value='SOL'>SOL - Solana</option>
                  </select>
                </label>

                <label>
                  Valor (R$)
                  <input type='text' placeholder='0,00' />
                </label>
              </div>

              <button className='primary-button' type='button'>
                Confirmar compra
              </button>
            </div>

            <div className='action-card'>
              <h3>Vender cripto</h3>
              <p>Veja o impacto na sua carteira e confirme em poucos toques.</p>

              <div className='action-inputs'>
                <label>
                  Ativo
                  <select defaultValue='ETH'>
                    <option value='BTC'>BTC - Bitcoin</option>
                    <option value='ETH'>ETH - Ethereum</option>
                    <option value='SOL'>SOL - Solana</option>
                  </select>
                </label>

                <label>
                  Quantidade
                  <input type='text' placeholder='0,00' />
                </label>
              </div>

              <button className='outline-button' type='button'>
                Simular venda
              </button>
            </div>
          </div>
        </section>

        <section className='section cta'>
          <div>
            <h2>Pronto para começar?</h2>
            <p>
              Crie sua conta, personalize alertas e acompanhe o mercado com
              segurança e alta performance.
            </p>
          </div>

          <div className='cta-actions'>
            <button className='primary-button' type='button'>
              Abrir conta gratuita
            </button>
            <button className='ghost-button' type='button'>
              Falar com o time
            </button>
          </div>
        </section>
      </main>

      <footer className='footer'>
        <div>
          <p className='brand-title'>Criptmoeda</p>
          <p>Projeto Integrador de Front-end com Frameworks.</p>
        </div>

        <div className='footer-links'>
          <a href='/mercado.html'>Mercado</a>
          <a href='/transacoes.html'>Transações</a>
          <a href='#!' onClick={(e) => e.preventDefault()}>
            Suporte
          </a>
        </div>
      </footer>
    </div>
  );
}

