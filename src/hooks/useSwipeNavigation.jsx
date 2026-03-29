import { useEffect } from 'react';

const routeOrder = ['/', '/mercado.html', '/imagens.html'];

function normalizePath(pathname) {
  const path = pathname.replace(/\\/g, '/');
  if (path.endsWith('/index.html') || path === '/index.html' || path === '/') {
    return '/';
  }
  return path;
}

export default function useSwipeNavigation() {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    function onTouchStart(event) {
      const touch = event.touches?.[0];
      if (!touch) {
        return;
      }
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    }

    function onTouchEnd(event) {
      const touch = event.changedTouches?.[0];
      if (!touch) {
        return;
      }

      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const dt = Date.now() - startTime;

      const isSwipe = Math.abs(dx) > 80 && Math.abs(dy) < 80 && dt < 500;
      if (!isSwipe) {
        return;
      }

      const currentPath = normalizePath(window.location.pathname);
      const currentIndex = routeOrder.indexOf(currentPath);
      if (currentIndex === -1) {
        return;
      }

      const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= routeOrder.length) {
        return;
      }

      window.location.assign(routeOrder[nextIndex]);
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);
}
