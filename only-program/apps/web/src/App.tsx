import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { I18nProvider } from '@/contexts/I18nContext';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
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
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
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
    <I18nProvider>
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
          
          {/* Protected Routes */}
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
        </Routes>
      </Router>
    </I18nProvider>
  );
}

export default App;
