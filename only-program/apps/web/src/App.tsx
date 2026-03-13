import { useEffect, lazy, Suspense } from 'react';
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

// Public Pages
const Home = lazy(() => import('@/pages/Home'));
const Features = lazy(() => import('@/pages/Features'));
const Pricing = lazy(() => import('./pages/Pricing'));

// Auth Pages
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const VerifyDevice = lazy(() => import('@/pages/VerifyDevice'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Welcome = lazy(() => import('./pages/Welcome'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));

// Anti-Ban Pages
const SmartLinkLanding = lazy(() => import('@/pages/SmartLinkLanding'));
const LoadingPage = lazy(() => import('@/pages/LoadingPage'));
const SafePage = lazy(() => import('@/pages/SafePage'));

// Dashboard Pages
const HomeDashboard = lazy(() => import('@/pages/Dashboard/Home'));
const Links = lazy(() => import('@/pages/Dashboard/Links'));
const Analytics = lazy(() => import('@/pages/Dashboard/Analytics'));
const Telegram = lazy(() => import('@/pages/Dashboard/Telegram'));
const Domains = lazy(() => import('@/pages/Dashboard/Domains'));
const Settings = lazy(() => import('@/pages/Dashboard/Settings'));
const Payments = lazy(() => import('@/pages/Dashboard/Payments'));
const DashboardPricing = lazy(() => import('@/pages/Dashboard/Pricing'));
const Affiliates = lazy(() => import('@/pages/Dashboard/Affiliates'));
const Support = lazy(() => import('@/pages/Dashboard/Support'));

// Admin Pages
const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard'));
const CmsEditor = lazy(() => import('@/pages/Admin/CmsEditor'));
const ProductPricing = lazy(() => import('@/pages/Admin/ProductPricing'));
const UserManager = lazy(() => import('@/pages/Admin/UserManager'));
const CouponManager = lazy(() => import('@/pages/Admin/CouponManager'));
const AdminSettings = lazy(() => import('@/pages/Admin/Settings'));
const DomainRequests = lazy(() => import('@/pages/Admin/DomainRequests'));
const Inbox = lazy(() => import('@/pages/Admin/Inbox'));
const AdminAffiliates = lazy(() => import('@/pages/Admin/AdminAffiliates'));

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

            <Suspense fallback={<LoadingScreen />}>
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
                <Route path="/auth/verify" element={<VerifyDevice />} />
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
                  <Route path="pricing" element={<DashboardPricing />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="affiliates" element={<Affiliates />} />
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
                    <Route path="coupons" element={<CouponManager />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="domains" element={<DomainRequests />} />
                    <Route path="affiliates" element={<AdminAffiliates />} />
                    <Route path="inbox" element={<Inbox />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </DomainResolver>
      </ModalProvider>
    </I18nProvider>
  );
}

export default App;
