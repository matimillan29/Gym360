import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import { APP_VERSION } from '../version';

export default function EntrenadoLayout() {
  const { user, gymConfig, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const navigation = [
    {
      name: 'Inicio',
      href: '/entrenado',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Mi Plan',
      href: '/entrenado/plan',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      name: 'Actividades',
      href: '/entrenado/clases',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: 'Historial',
      href: '/entrenado/historial',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Progreso',
      href: '/entrenado/progresion',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      name: 'Perfil',
      href: '/entrenado/perfil',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const isActive = (href: string) => {
    if (href === '/entrenado') {
      return location.pathname === '/entrenado';
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              {gymConfig?.logo ? (
                <img src={gymConfig.logo} alt={gymConfig.nombre} className="h-8 w-8 object-contain" />
              ) : (
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
                </svg>
              )}
              <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {gymConfig?.nombre || 'Pwr360'}
              </span>
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute right-4 top-14 w-56 rounded-xl shadow-lg border py-2 z-20" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--border-color)' }}>
              {user?.foto ? (
                <img src={user.foto} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">{user?.nombre?.[0]}{user?.apellido?.[0]}</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.nombre} {user?.apellido}</p>
                <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              </div>
            </div>
            <Link
              to="/entrenado/perfil"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2 px-4 py-2 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Ver perfil completo
            </Link>
            <Link
              to="/entrenado/cuotas"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2 px-4 py-2 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Mis cuotas
            </Link>
            <Link
              to="/entrenado/evaluaciones"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2 px-4 py-2 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Mis evaluaciones
            </Link>
            <Link
              to="/entrenado/cupones"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2 px-4 py-2 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Mis cupones
            </Link>
            <Link
              to="/entrenado/logros"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2 px-4 py-2 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Mis logros
            </Link>
            <div className="border-t my-1" style={{ borderColor: 'var(--border-color)' }} />
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between gap-2 px-4 py-2 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <div className="flex items-center gap-2">
                {isDark ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                {isDark ? 'Modo claro' : 'Modo oscuro'}
              </div>
              <div
                className={`relative w-9 h-5 rounded-full transition-colors ${isDark ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </div>
            </button>
            <div className="border-t my-1" style={{ borderColor: 'var(--border-color)' }} />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
            <div className="border-t my-1" style={{ borderColor: 'var(--border-color)' }} />
            <p className="text-center text-xs py-2" style={{ color: 'var(--text-muted)' }}>
              Pwr360 v{APP_VERSION}
            </p>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t safe-area-bottom" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="max-w-lg mx-auto px-4">
          <div className="flex justify-around py-2">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors"
                  style={{ color: active ? '#22c55e' : 'var(--text-muted)' }}
                >
                  {item.icon}
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
