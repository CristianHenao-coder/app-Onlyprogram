import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '@/contexts/I18nContext';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard/Overview';
import Pricing from '@/pages/Pricing';
import Register from '@/pages/Register';
import ProtectedRoute from '@/components/ProtectedRoute';
import '@/styles/index.css';

function App() {
  return (
    <I18nProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </I18nProvider>
  );
}

export default App;
