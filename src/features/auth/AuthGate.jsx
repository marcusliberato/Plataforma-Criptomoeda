import { useEffect, useState } from 'react';
import useAuthSession from './useAuthSession.js';
import './AuthGate.css';

export default function AuthGate({
  children,
  title = 'Acesso interno',
  description =
    'Entre com usuário e senha para acessar as páginas internas do sistema.',
  unauthenticatedMode = 'login',
  redirectTo = '/',
}) {
  const { isAuthenticated, username, isLoading, isCheckingSession, login, logout } =
    useAuthSession();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  function onChange(event) {
    const { name, value } = event.target;
    setCredentials((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');

    const result = await login(credentials.username, credentials.password);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setCredentials({ username: credentials.username.trim().toLowerCase(), password: '' });
  }

  useEffect(() => {
    if (isCheckingSession || isAuthenticated || unauthenticatedMode !== 'redirect') {
      return;
    }

    window.location.replace(redirectTo);
  }, [isAuthenticated, isCheckingSession, redirectTo, unauthenticatedMode]);

  if (isCheckingSession) {
    return (
      <main className='auth-shell' aria-label='Validação de sessão'>
        <section className='auth-card'>
          <div className='auth-brand auth-brand-loading'>
            <img
              className='auth-logo'
              src='/bitcoin_logo-removebg-preview.png'
              alt='Criptomoeda'
            />
            <div className='auth-brand-copy'>
              <p className='auth-brand-name'>Criptmoeda</p>
              <p className='auth-brand-subtitle'>Painel informativo</p>
            </div>
          </div>

          <div className='auth-copy'>
            <p className='auth-kicker'>Segurança</p>
            <h1>Validando sessão</h1>
            <p className='auth-description'>Aguarde enquanto verificamos seu acesso.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated && unauthenticatedMode === 'redirect') {
    return (
      <main className='auth-shell' aria-label='Redirecionamento de autenticação'>
        <section className='auth-card'>
          <div className='auth-brand auth-brand-loading'>
            <img
              className='auth-logo'
              src='/bitcoin_logo-removebg-preview.png'
              alt='Criptomoeda'
            />
            <div className='auth-brand-copy'>
              <p className='auth-brand-name'>Criptmoeda</p>
              <p className='auth-brand-subtitle'>Painel informativo</p>
            </div>
          </div>

          <div className='auth-copy'>
            <p className='auth-kicker'>Área restrita</p>
            <h1>Redirecionando</h1>
            <p className='auth-description'>
              Você será levado para a tela principal de login.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className='auth-shell' aria-label='Tela de autenticação'>
        <section className='auth-card'>
          <div className='auth-brand'>
            <img
              className='auth-logo'
              src='/bitcoin_logo-removebg-preview.png'
              alt='Criptomoeda'
            />
            <div className='auth-brand-copy'>
              <p className='auth-brand-name'>Criptmoeda</p>
              <p className='auth-brand-subtitle'>Painel informativo</p>
            </div>
          </div>

          <div className='auth-copy'>
            <p className='auth-kicker'>Projeto de Bloco 5</p>
            <h1>{title}</h1>
            <p className='auth-description'>{description}</p>
          </div>

          <form className='auth-form' onSubmit={onSubmit}>
            <label className='auth-field' htmlFor='username'>
              <span className='auth-field-label'>Usuário</span>
              <input
                id='username'
                name='username'
                type='text'
                autoComplete='username'
                value={credentials.username}
                onChange={onChange}
                disabled={isLoading}
                required
              />
            </label>

            <label className='auth-field' htmlFor='password'>
              <span className='auth-field-label'>Senha</span>
              <input
                id='password'
                name='password'
                type='password'
                autoComplete='current-password'
                value={credentials.password}
                onChange={onChange}
                disabled={isLoading}
                required
              />
            </label>

            {error ? <p className='auth-error'>{error}</p> : null}

            <button className='auth-submit' type='submit' disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (typeof children === 'function') {
    return children({ username, logout });
  }

  return children;
}
