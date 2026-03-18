import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import LoginPage from './pages/auth/LoginPage';
import SetupPage from './pages/setup/SetupPage';

// Layouts
import EntrenadorLayout from './layouts/EntrenadorLayout';
import EntrenadoLayout from './layouts/EntrenadoLayout';

// Public pages
import CheckinPublico from './pages/CheckinPublico';

// Entrenador pages
import DashboardEntrenador from './pages/entrenador/DashboardEntrenador';
import EntrenadosList from './pages/entrenador/EntrenadosList';
import EntrenadoDetalle from './pages/entrenador/EntrenadoDetalle';
import EjerciciosList from './pages/entrenador/EjerciciosList';
import PlanesList from './pages/entrenador/PlanesList';
import PlanEditor from './pages/entrenador/PlanEditor';
import PlanSimpleEditor from './pages/entrenador/PlanSimpleEditor';
import EvaluacionesList from './pages/entrenador/EvaluacionesList';
import CuotasGestion from './pages/entrenador/CuotasGestion';
import FeedbackGestion from './pages/entrenador/FeedbackGestion';
import LinksGestion from './pages/entrenador/LinksGestion';
import PlantillasGestion from './pages/entrenador/PlantillasGestion';
import NegociosGestion from './pages/entrenador/NegociosGestion';
import CuponesGestion from './pages/entrenador/CuponesGestion';
import CalendarioGestion from './pages/entrenador/CalendarioGestion';
import CheckinGestion from './pages/entrenador/CheckinGestion';
import ClasesGestion from './pages/entrenador/ClasesGestion';
import CalendarioClases from './pages/entrenador/CalendarioClases';

// Entrenado pages
import DashboardEntrenado from './pages/entrenado/DashboardEntrenado';
import MiPlan from './pages/entrenado/MiPlan';
import MiPerfil from './pages/entrenado/MiPerfil';
import RegistrarSesion from './pages/entrenado/RegistrarSesion';
import Historial from './pages/entrenado/Historial';
import Evaluaciones from './pages/entrenado/Evaluaciones';
import Progresion from './pages/entrenado/Progresion';
import MisCuotas from './pages/entrenado/MisCuotas';
import MisCupones from './pages/entrenado/MisCupones';
import MisLogros from './pages/entrenado/MisLogros';
import MisClases from './pages/entrenado/MisClases';

// Admin pages
import ConfiguracionGym from './pages/admin/ConfiguracionGym';
import EntrenadoresList from './pages/admin/EntrenadoresList';
import PlanesCuota from './pages/admin/PlanesCuota';
import Auditoria from './pages/admin/Auditoria';
import SucursalesGestion from './pages/admin/SucursalesGestion';

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
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  return (
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
