import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAuthenticatedUser,
  getSessionData,
  hasActiveSession,
  signIn,
  signOut,
} from './authSession.js';

export default function useAuthSession() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const activeSession = await hasActiveSession();
      const session = await getSessionData();

      if (active && activeSession && session?.username) {
        setIsAuthenticated(true);
        setUsername(session.username);
      }

      if (!activeSession) {
        if (active) {
          setIsCheckingSession(false);
        }
        return;
      }

      const result = await fetchAuthenticatedUser();
      if (!active) {
        return;
      }

      if (result.ok) {
        setIsAuthenticated(true);
        setUsername(result.username || '');
      } else {
        setIsAuthenticated(false);
        setUsername('');
      }

      setIsCheckingSession(false);
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (inputUsername, inputPassword) => {
    setIsLoading(true);
    try {
      const result = await signIn(inputUsername, inputPassword);
      if (result.ok) {
        setIsAuthenticated(true);
        setUsername(result.username || '');
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setIsAuthenticated(false);
    setUsername('');
    setIsCheckingSession(false);
  }, []);

  return useMemo(
    () => ({
      isAuthenticated,
      username,
      isLoading,
      isCheckingSession,
      login,
      logout,
    }),
    [isAuthenticated, username, isLoading, isCheckingSession, login, logout],
  );
}
