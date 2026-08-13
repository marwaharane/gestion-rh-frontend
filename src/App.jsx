import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PublicApplyPage from './pages/PublicApplyPage';
import CareersPage from './pages/CareersPage';
import TrackApplicationPage from './pages/TrackApplicationPage';
import Layout from './components/Layout';
import { fetchCurrentUser } from './services/auth';

const HomePage = lazy(() => import('./pages/HomePage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const AttendancesPage = lazy(() => import('./pages/AttendancesPage'));
const LeaveRequestsPage = lazy(() => import('./pages/LeaveRequestsPage'));
const AttestationsPage = lazy(() => import('./pages/AttestationsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ExportPage = lazy(() => import('./pages/ExportPage'));
const PayrollPage = lazy(() => import('./pages/PayrollPage'));
const RecruitmentPage = lazy(() => import('./pages/RecruitmentPage'));
const TalentPoolPage = lazy(() => import('./pages/TalentPoolPage'));

function PageLoader() {
  return <div className="p-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>Chargement...</div>;
}

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const location = useLocation();

  const isPublicRoute = location.pathname.startsWith('/apply/')
    || location.pathname === '/forgot-password'
    || location.pathname.startsWith('/reset-password/')
    || location.pathname === '/careers'
    || location.pathname.startsWith('/track/');

  useEffect(() => {
    if (isPublicRoute) {
      setCheckingAuth(false);
      return;
    }
    fetchCurrentUser().then((currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });
  }, [isPublicRoute]);

  if (isPublicRoute) {
    return (
      <>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/apply/:jobPostId" element={<PublicApplyPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/track/:token" element={<TrackApplicationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Routes>
      </>
    );
  }

  const handleLoginSuccess = (loggedInUser) => setUser(loggedInUser);
  const handleLogout = () => setUser(null);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout onLogout={handleLogout} />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/attendances" element={<AttendancesPage />} />
            <Route path="/leave-requests" element={<LeaveRequestsPage />} />
            <Route path="/attestations" element={<AttestationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/recruitment" element={<RecruitmentPage />} />
            <Route path="/talent-pool" element={<TalentPoolPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;