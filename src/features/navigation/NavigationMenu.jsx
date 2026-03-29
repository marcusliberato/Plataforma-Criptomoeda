import './NavigationMenu.css';

const routes = [
  { label: 'Início', href: '/' },
  { label: 'Mercado', href: '/mercado.html' },
];

function normalizePath(pathname) {
  const path = pathname.replace(/\\/g, '/');
  if (path.endsWith('/index.html') || path === '/index.html' || path === '/') {
    return '/';
  }
  return path;
}

export default function NavigationMenu() {
  const currentPath = normalizePath(window.location.pathname);

  return (
    <nav className='navigation-menu' aria-label='Menu de navegação'>
      {routes.map((route) => {
        const isActive = normalizePath(route.href) === currentPath;
        return (
          <a
            key={route.href}
            href={route.href}
            className={`navigation-link ${isActive ? 'active' : ''}`}
          >
            {route.label}
          </a>
        );
      })}
      <span className='navigation-hint'>
        Deslize para navegar entre as páginas.
      </span>
    </nav>
  );
}
