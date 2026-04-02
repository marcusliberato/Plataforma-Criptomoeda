import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAuthenticatedUser,
  getSessionData,
  hasActiveSession,
  signIn,
  signOut,
} from './authSession.js';

export default function useAuthSession() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasActiveSession());
  const [username, setUsername] = useState(() => getSessionData()?.username || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(() => hasActiveSession());

  useEffect(() => {
    let active = true;

    async function validatePersistedSession() {
      if (!hasActiveSession()) {
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

    validatePersistedSession();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (inputUsername, inputPassword) => {
    setIsLoading(true);
    try {
      const result = await signIn(inputUsername, inputPassword);
      if (!result.ok) {
        return result;
      }

      setIsAuthenticated(true);
      setUsername(result.username || '');

      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    signOut();
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
