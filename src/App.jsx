import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import EmployeesPage from './pages/EmployeesPage';
import AttendancesPage from './pages/AttendancesPage';
import LeaveRequestsPage from './pages/LeaveRequestsPage';
import Layout from './components/Layout';
import { fetchCurrentUser } from './services/auth';

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetchCurrentUser().then((currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

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
      <Routes>
        <Route element={<Layout onLogout={handleLogout} />}>
          <Route path="/" element={<Navigate to="/employees" />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/attendances" element={<AttendancesPage />} />
          <Route path="/leave-requests" element={<LeaveRequestsPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;