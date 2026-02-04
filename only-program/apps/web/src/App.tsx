import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { I18nProvider } from '@/contexts/I18nContext';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard/Overview';
import Analytics from '@/pages/Dashboard/Analytics';
import Telegram from '@/pages/Dashboard/Telegram';
import Settings from '@/pages/Dashboard/Settings';
import CreateLink from '@/pages/Dashboard/CreateLink';
import LinkConfigurator from '@/pages/Dashboard/LinkConfigurator';
import Support from '@/pages/Dashboard/Support';
import Pricing from './pages/Pricing';
import Register from './pages/Register';
import Welcome from './pages/Welcome';
import CompleteProfile from './pages/CompleteProfile';

// Admin Pages
import AdminDashboard from '@/pages/Admin/Dashboard';
import CmsEditor from '@/pages/Admin/CmsEditor';
import UserManager from '@/pages/Admin/UserManager';
import GlobalLinks from '@/pages/Admin/GlobalLinks';
import CouponManager from '@/pages/Admin/CouponManager';
import AdminSettings from '@/pages/Admin/Settings';
import AuditLogs from './pages/Admin/AuditLogs';

import DashboardLayout from '@/components/DashboardLayout';
import Overview from '@/pages/Dashboard/Overview';
import Payments from '@/pages/Dashboard/Payments';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import DashboardLayout from '@/components/DashboardLayout';
import AdminLayout from '@/components/AdminLayout';
import MotionManager from '@/components/MotionManager';
import { Outlet } from 'react-router-dom';
import { ModalProvider } from '@/contexts/ModalContext';
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
    <I18nProvider>
      <ModalProvider>
        <Router>
          <ScrollToTop />
          <MotionManager />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            
            {/* Dashboard Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Outlet />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="telegram" element={<Telegram />} />
              <Route path="settings" element={<Settings />} />
              <Route path="links/new" element={<CreateLink />} />
              <Route path="links/:id/edit" element={<LinkConfigurator />} />
              <Route path="support" element={<Support />} />
            </Route>
  
            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminRoute />
                </ProtectedRoute>
              }
            >
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="cms" element={<CmsEditor />} />
                <Route path="users" element={<UserManager />} />
                <Route path="links" element={<GlobalLinks />} />
                <Route path="coupons" element={<CouponManager />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="audit-logs" element={<AuditLogs />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </ModalProvider>
    </I18nProvider>
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
