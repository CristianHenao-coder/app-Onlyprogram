import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { I18nProvider } from '@/contexts/I18nContext';
import { ModalProvider } from '@/contexts/ModalContext';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Pricing from './pages/Pricing';
import Welcome from './pages/Welcome';
import CompleteProfile from './pages/CompleteProfile';

// Dashboard Pages
import Analytics from '@/pages/Dashboard/Analytics';
import Links from '@/pages/Dashboard/Links';
import Telegram from '@/pages/Dashboard/Telegram';
import Settings from '@/pages/Dashboard/Settings';
import CreateLink from '@/pages/Dashboard/CreateLink';
import LinkConfigurator from '@/pages/Dashboard/LinkConfigurator';
import Support from '@/pages/Dashboard/Support';
import Pricing from './pages/Pricing';

import Welcome from './pages/Welcome';
import CompleteProfile from './pages/CompleteProfile';
import Payments from '@/pages/Dashboard/Payments';
import HomeDashboard from '@/pages/Dashboard/Home';

// Admin Pages
import AdminDashboard from '@/pages/Admin/Dashboard';
import CmsEditor from '@/pages/Admin/CmsEditor';
import UserManager from '@/pages/Admin/UserManager';
import GlobalLinks from '@/pages/Admin/GlobalLinks';
import CouponManager from '@/pages/Admin/CouponManager';
import AdminSettings from '@/pages/Admin/Settings';
import AuditLogs from './pages/Admin/AuditLogs';

// Components
import DashboardLayout from '@/components/DashboardLayout';

import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';

import AdminLayout from '@/components/AdminLayout';
import MotionManager from '@/components/MotionManager';
import { Outlet } from 'react-router-dom';
import { ModalProvider } from '@/contexts/ModalContext';
import LoadingScreen from '@/components/LoadingScreen';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import AdminLayout from '@/components/AdminLayout';
import MotionManager from '@/components/MotionManager';
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
      <LoadingScreen />
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
              <Route index element={<Navigate to="/dashboard/links" replace />} />
              <Route path="home" element={<HomeDashboard />} />
              <Route path="links" element={<Links />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="telegram" element={<Telegram />} />
              <Route path="settings" element={<Settings />} />
              <Route path="payments" element={<Payments />} />
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
  );
}

export default App;
