import './TransactionsPage.css';

const transactions = [
  {
    type: 'Compra',
    asset: 'Bitcoin',
    amount: '0,024 BTC',
    status: 'Concluida',
    statusKey: 'done',
    time: 'Hoje, 09:48',
    value: 'R$ 7.184,22',
  },
  {
    type: 'Venda',
    asset: 'Ethereum',
    amount: '1,4 ETH',
    status: 'Processando',
    statusKey: 'pending',
    time: 'Hoje, 09:20',
    value: 'R$ 20.115,10',
  },
  {
    type: 'Compra',
    asset: 'Solana',
    amount: '22 SOL',
    status: 'Concluida',
    statusKey: 'done',
    time: 'Hoje, 08:31',
    value: 'R$ 18.004,80',
  },
  {
    type: 'Compra',
    asset: 'Ethereum',
    amount: '0,35 ETH',
    status: 'Concluida',
    statusKey: 'done',
    time: 'Ontem, 22:14',
    value: 'R$ 5.028,70',
  },
];

export default function TransactionsPage() {
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
            <button className='primary-button' type='button'>
              Exportar extrato
            </button>
          </div>
        </nav>
      </header>

      <main className='page-main'>
        <section className='section'>
          <div className='section-header'>
            <div>
              <p className='section-tag'>Historico dedicado</p>
              <h2>Painel de transações</h2>
              <p className='market-meta'>
                Visualização separada para compras, vendas e status em tempo
                real.
              </p>
            </div>
            <a className='ghost-button link-button' href='/'>
              Voltar para home
            </a>
          </div>

          <div className='transaction-list transaction-page-list'>
            {transactions.map((t, idx) => (
              <article key={`${t.asset}-${idx}`} className='transaction-item'>
                <div>
                  <p className='transaction-type'>{t.type}</p>
                  <p className='transaction-asset'>{t.asset}</p>
                  <span>{t.amount}</span>
                </div>

                <div className='transaction-meta'>
                  <strong>{t.value}</strong>
                  <span className={`status ${t.statusKey}`}>{t.status}</span>
                  <small>{t.time}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className='footer'>
        <div>
          <p className='brand-title'>Criptmoeda</p>
          <p>Painel dedicado de historico de transacoes.</p>
        </div>

        <div className='footer-links'>
          <a href='/'>Pagina inicial</a>
          <a href='#!' onClick={(e) => e.preventDefault()}>
            Suporte
          </a>
        </div>
      </footer>
    </div>
  );
}
