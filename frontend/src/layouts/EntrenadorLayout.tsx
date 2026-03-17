import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { APP_VERSION } from '../version';

export default function EntrenadorLayout() {
  const { user, gymConfig, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const isAdmin = user?.role === 'admin';

  const navigation = [
    { name: 'Dashboard', href: '/entrenador', icon: 'home' },
    { name: 'Check-in', href: '/entrenador/checkin', icon: 'checkin' },
    { name: 'Entrenados', href: '/entrenador/entrenados', icon: 'users' },
    { name: 'Ejercicios', href: '/entrenador/ejercicios', icon: 'dumbbell' },
    { name: 'Planes', href: '/entrenador/planes', icon: 'clipboard' },
    { name: 'Actividades', href: '/entrenador/clases', icon: 'group' },
    { name: 'Plantillas', href: '/entrenador/plantillas', icon: 'template' },
    { name: 'Evaluaciones', href: '/entrenador/evaluaciones', icon: 'chart' },
    { name: 'Cuotas', href: '/entrenador/cuotas', icon: 'money' },
    { name: 'Cupones', href: '/entrenador/cupones', icon: 'ticket' },
    { name: 'Negocios', href: '/entrenador/negocios', icon: 'store' },
    { name: 'Calendario', href: '/entrenador/calendario', icon: 'calendar' },
    { name: 'Feedback', href: '/entrenador/feedback', icon: 'feedback' },
    { name: 'Links', href: '/entrenador/links', icon: 'link' },
  ];

  const adminNavigation = [
    { name: 'Entrenadores', href: '/admin/entrenadores', icon: 'user-cog' },
    { name: 'Planes de Cuota', href: '/admin/planes-cuota', icon: 'credit-card' },
    ...(gymConfig?.multi_sucursal ? [{ name: 'Sucursales', href: '/admin/sucursales', icon: 'building' }] : []),
    { name: 'Auditoría', href: '/admin/auditoria', icon: 'audit' },
    { name: 'Configuración', href: '/admin/configuracion', icon: 'settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/entrenador') {
      return location.pathname === '/entrenador';
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
  };

  const getIcon = (name: string, className: string) => {
    const icons: Record<string, React.ReactNode> = {
      home: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      users: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      checkin: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      dumbbell: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
        </svg>
      ),
      clipboard: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      chart: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      money: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      template: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      feedback: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      link: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      ticket: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      store: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      calendar: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      group: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      'user-cog': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'credit-card': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      audit: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      settings: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      building: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    };
    return icons[name] || null;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 shadow-lg transform transition-transform duration-200
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ backgroundColor: 'var(--bg-sidebar)' }}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <Link to="/entrenador" className="flex items-center gap-3">
              {gymConfig?.logo ? (
                <img src={gymConfig.logo} alt={gymConfig.nombre} className="h-10 w-10 object-contain rounded-lg" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
                  </svg>
                </div>
              )}
              <span className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                {gymConfig?.nombre || 'Pwr360'}
              </span>
            </Link>
            <button
              className="lg:hidden p-2 rounded-lg"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--bg-active)' : 'transparent',
                    color: active ? 'var(--text-active)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    {getIcon(item.icon, `h-5 w-5 ${active ? 'text-blue-500' : ''}`)}
                    {item.name}
                  </div>
                  {active && (
                    <svg className="h-4 w-4" style={{ color: 'var(--text-active)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>
              );
            })}

            {/* Admin section */}
            {isAdmin && (
              <>
                <div className="pt-6 pb-2">
                  <p className="px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Administración
                  </p>
                </div>
                {adminNavigation.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: active ? 'var(--bg-active)' : 'transparent',
                        color: active ? 'var(--text-active)' : 'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        {getIcon(item.icon, `h-5 w-5 ${active ? 'text-blue-500' : ''}`)}
                        {item.name}
                      </div>
                      {active && (
                        <svg className="h-4 w-4" style={{ color: 'var(--text-active)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* Theme toggle */}
          <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
            >
              <div className="flex items-center gap-3">
                {isDark ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
              </div>
              <div
                className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </div>
            </button>
          </div>

          {/* User info & logout */}
          <div className="border-t p-4" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {user?.nombre} {user?.apellido}
                </p>
                <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                  {user?.role === 'admin' ? 'Administrador' : 'Entrenador'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                title="Cerrar sesión"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
            {/* Versión */}
            <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Pwr360 v{APP_VERSION}
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-20 shadow-sm lg:hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/entrenador" className="flex items-center gap-2">
              {gymConfig?.logo ? (
                <img src={gymConfig.logo} alt={gymConfig.nombre} className="h-8 w-8 object-contain" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
                  </svg>
                </div>
              )}
              <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{gymConfig?.nombre || 'Pwr360'}</span>
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDark ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
