import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { I18nProvider } from '@/contexts/I18nContext';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import DashboardLayout from '@/components/DashboardLayout';
import Overview from '@/pages/Dashboard/Overview';
import Payments from '@/pages/Dashboard/Payments';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import DashboardLayout from '@/components/DashboardLayout';
import AdminLayout from '@/components/AdminLayout';
import MotionManager from '@/components/MotionManager';
import { Outlet } from 'react-router-dom';
import '@/styles/index.css';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="payments" element={<Payments />} />
          {/* Aquí irían otras rutas como links, settings, etc. */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
