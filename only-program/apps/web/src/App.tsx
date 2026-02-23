import { useEffect } from 'react';
// Force rebuild timestamp: 2026-02-07
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

import { I18nProvider } from '@/contexts/I18nContext';
import { ModalProvider } from '@/contexts/ModalContext';

import MotionManager from '@/components/MotionManager';
import LoadingScreen from '@/components/LoadingScreen';
import DomainResolver from '@/components/DomainResolver';

import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';

import DashboardLayout from '@/layouts/DashboardLayout';
import AdminLayout from '@/components/AdminLayout';

import Home from '@/pages/Home';
import Features from '@/pages/Features';
import Pricing from './pages/Pricing';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import Welcome from './pages/Welcome';
import CompleteProfile from './pages/CompleteProfile';

// Anti-Ban Pages
import SmartLinkLanding from '@/pages/SmartLinkLanding';
import LoadingPage from '@/pages/LoadingPage';
import SafePage from '@/pages/SafePage';

// Dashboard Pages
import HomeDashboard from '@/pages/Dashboard/Home';
import Links from '@/pages/Dashboard/Links';
import Analytics from '@/pages/Dashboard/Analytics';
import Telegram from '@/pages/Dashboard/Telegram';
import Domains from '@/pages/Dashboard/Domains';
import Settings from '@/pages/Dashboard/Settings';
import Payments from '@/pages/Dashboard/Payments';
import Checkout from '@/pages/Dashboard/Checkout';


import Support from '@/pages/Dashboard/Support';

// Admin Pages
import AdminDashboard from '@/pages/Admin/Dashboard';
import CmsEditor from '@/pages/Admin/CmsEditor';
import ProductPricing from '@/pages/Admin/ProductPricing';
import UserManager from '@/pages/Admin/UserManager';
import GlobalLinks from '@/pages/Admin/GlobalLinks';
import CouponManager from '@/pages/Admin/CouponManager';
import AdminSettings from '@/pages/Admin/Settings';
import AuditLogs from './pages/Admin/AuditLogs';
import LinksModeration from '@/pages/Admin/LinksModeration';

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
        <DomainResolver>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <MotionManager />

            <Routes>
              {/* Anti-Ban & Smart Links Routes */}
              <Route path="/s/:slug" element={<SmartLinkLanding />} />
              <Route path="/loading/:slug" element={<LoadingPage />} />
              <Route path="/safe" element={<SafePage />} />

              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />

              {/* Dashboard Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard/links" replace />} />
                <Route path="home" element={<HomeDashboard />} />
                <Route path="links" element={<Links />} />

                <Route path="analytics" element={<Analytics />} />
                <Route path="telegram" element={<Telegram />} />
                <Route path="domains" element={<Domains />} />
                <Route path="settings" element={<Settings />} />
                <Route path="payments" element={<Payments />} />
                <Route path="checkout" element={<Checkout />} />
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
                  <Route path="pricing" element={<ProductPricing />} />
                  <Route path="users" element={<UserManager />} />
                  <Route path="links" element={<GlobalLinks />} />
                  <Route path="coupons" element={<CouponManager />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="audit-logs" element={<AuditLogs />} />
                  <Route path="moderation" element={<LinksModeration />} />
                </Route>
              </Route>
            </Routes>
          </Router>
        </DomainResolver>
      </ModalProvider>
    </I18nProvider>
  );
}

export default App;
