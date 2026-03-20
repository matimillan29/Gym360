import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts (static imports - always needed)
import EntrenadorLayout from './layouts/EntrenadorLayout';
import EntrenadoLayout from './layouts/EntrenadoLayout';

// Pages (lazy loaded)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SetupPage = lazy(() => import('./pages/setup/SetupPage'));

// Public pages
const CheckinPublico = lazy(() => import('./pages/CheckinPublico'));

// Entrenador pages
const DashboardEntrenador = lazy(() => import('./pages/entrenador/DashboardEntrenador'));
const EntrenadosList = lazy(() => import('./pages/entrenador/EntrenadosList'));
const EntrenadoDetalle = lazy(() => import('./pages/entrenador/EntrenadoDetalle'));
const EjerciciosList = lazy(() => import('./pages/entrenador/EjerciciosList'));
const PlanesList = lazy(() => import('./pages/entrenador/PlanesList'));
const PlanEditor = lazy(() => import('./pages/entrenador/PlanEditor'));
const PlanSimpleEditor = lazy(() => import('./pages/entrenador/PlanSimpleEditor'));
const EvaluacionesList = lazy(() => import('./pages/entrenador/EvaluacionesList'));
const CuotasGestion = lazy(() => import('./pages/entrenador/CuotasGestion'));
const FeedbackGestion = lazy(() => import('./pages/entrenador/FeedbackGestion'));
const LinksGestion = lazy(() => import('./pages/entrenador/LinksGestion'));
const PlantillasGestion = lazy(() => import('./pages/entrenador/PlantillasGestion'));
const NegociosGestion = lazy(() => import('./pages/entrenador/NegociosGestion'));
const CuponesGestion = lazy(() => import('./pages/entrenador/CuponesGestion'));
const CalendarioGestion = lazy(() => import('./pages/entrenador/CalendarioGestion'));
const CheckinGestion = lazy(() => import('./pages/entrenador/CheckinGestion'));
const ClasesGestion = lazy(() => import('./pages/entrenador/ClasesGestion'));
const CalendarioClases = lazy(() => import('./pages/entrenador/CalendarioClases'));

// Entrenado pages
const DashboardEntrenado = lazy(() => import('./pages/entrenado/DashboardEntrenado'));
const MiPlan = lazy(() => import('./pages/entrenado/MiPlan'));
const MiPerfil = lazy(() => import('./pages/entrenado/MiPerfil'));
const RegistrarSesion = lazy(() => import('./pages/entrenado/RegistrarSesion'));
const Historial = lazy(() => import('./pages/entrenado/Historial'));
const Evaluaciones = lazy(() => import('./pages/entrenado/Evaluaciones'));
const Progresion = lazy(() => import('./pages/entrenado/Progresion'));
const MisCuotas = lazy(() => import('./pages/entrenado/MisCuotas'));
const MisCupones = lazy(() => import('./pages/entrenado/MisCupones'));
const MisLogros = lazy(() => import('./pages/entrenado/MisLogros'));
const MisClases = lazy(() => import('./pages/entrenado/MisClases'));

// Admin pages
const ConfiguracionGym = lazy(() => import('./pages/admin/ConfiguracionGym'));
const EntrenadoresList = lazy(() => import('./pages/admin/EntrenadoresList'));
const PlanesCuota = lazy(() => import('./pages/admin/PlanesCuota'));
const Auditoria = lazy(() => import('./pages/admin/Auditoria'));
const SucursalesGestion = lazy(() => import('./pages/admin/SucursalesGestion'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'entrenado') {
      return <Navigate to="/entrenado" replace />;
    }
    return <Navigate to="/entrenador" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, isAuthenticated, isLoading, needsSetup } = useAuth();

  // Mostrar loading mientras se inicializa
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  // Redirigir a setup si no está configurado
  if (needsSetup) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Cargando...</p></div>}>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="*" element={<Navigate to="/setup" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Cargando...</p></div>}>
    <Routes>
      {/* Setup inicial - ya no es necesario si ya está configurado */}
      <Route path="/setup" element={<Navigate to="/login" replace />} />

      {/* Public check-in (standalone window) */}
      <Route path="/checkin" element={<CheckinPublico />} />

      {/* Auth routes */}
      <Route path="/login" element={
        isAuthenticated ? (
          <Navigate to={user?.role === 'entrenado' ? '/entrenado' : '/entrenador'} replace />
        ) : (
          <LoginPage />
        )
      } />
      {/* Redirect old OTP route to main login */}
      <Route path="/login/otp" element={<Navigate to="/login" replace />} />

      {/* Entrenador/Admin routes */}
      <Route path="/entrenador" element={
        <ProtectedRoute allowedRoles={['admin', 'entrenador']}>
          <EntrenadorLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardEntrenador />} />
        <Route path="entrenados" element={<EntrenadosList />} />
        <Route path="entrenados/:id" element={<EntrenadoDetalle />} />
        <Route path="ejercicios" element={<EjerciciosList />} />
        <Route path="planes" element={<PlanesList />} />
        <Route path="planes/simple/nuevo" element={<PlanSimpleEditor />} />
        <Route path="planes/simple/:id" element={<PlanSimpleEditor />} />
        <Route path="planes/nuevo" element={<PlanEditor />} />
        <Route path="planes/:id" element={<PlanEditor />} />
        <Route path="evaluaciones" element={<EvaluacionesList />} />
        <Route path="cuotas" element={<CuotasGestion />} />
        <Route path="feedback" element={<FeedbackGestion />} />
        <Route path="links" element={<LinksGestion />} />
        <Route path="plantillas" element={<PlantillasGestion />} />
        <Route path="negocios" element={<NegociosGestion />} />
        <Route path="cupones" element={<CuponesGestion />} />
        <Route path="calendario" element={<CalendarioGestion />} />
        <Route path="checkin" element={<CheckinGestion />} />
        <Route path="clases" element={<ClasesGestion />} />
        <Route path="calendario-clases" element={<CalendarioClases />} />
      </Route>

      {/* Admin only routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <EntrenadorLayout />
        </ProtectedRoute>
      }>
        <Route path="configuracion" element={<ConfiguracionGym />} />
        <Route path="entrenadores" element={<EntrenadoresList />} />
        <Route path="planes-cuota" element={<PlanesCuota />} />
        <Route path="sucursales" element={<SucursalesGestion />} />
        <Route path="auditoria" element={<Auditoria />} />
      </Route>

      {/* Entrenado routes */}
      <Route path="/entrenado" element={
        <ProtectedRoute allowedRoles={['entrenado']}>
          <EntrenadoLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardEntrenado />} />
        <Route path="plan" element={<MiPlan />} />
        <Route path="perfil" element={<MiPerfil />} />
        <Route path="sesion" element={<RegistrarSesion />} />
        <Route path="sesion/:id" element={<RegistrarSesion />} />
        <Route path="historial" element={<Historial />} />
        <Route path="evaluaciones" element={<Evaluaciones />} />
        <Route path="progresion" element={<Progresion />} />
        <Route path="cuotas" element={<MisCuotas />} />
        <Route path="cupones" element={<MisCupones />} />
        <Route path="logros" element={<MisLogros />} />
        <Route path="clases" element={<MisClases />} />
      </Route>

      {/* Redirect root */}
      <Route path="/" element={
        isAuthenticated ? (
          <Navigate to={user?.role === 'entrenado' ? '/entrenado' : '/entrenador'} replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { borderRadius: '12px', padding: '12px 16px' },
                success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' }, duration: 4000 },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
