import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { isReception } from './services/admin';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import ClientLog from './pages/ClientLog';
import SupplyRequests from './pages/SupplyRequests';
import Inventory from './pages/Inventory';
import PurchaseOrders from './pages/PurchaseOrders';
import MailPickup from './pages/MailPickup';
import Admin from './pages/Admin';
import FeedbackWidget from './components/FeedbackWidget';
import { msalInstance, loginRequest, initializeMsal, getAccessToken } from './services/auth';
import { LogIn, Shield, Loader2 } from 'lucide-react';
import magmaLogo from './assets/magma-logo.png';

function LoginScreen({ onLogin, loading, error }) {
  return (
    <div style={{
      flex: 1,
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FCFCFB',
      flexDirection: 'column',
      gap: 24,
      fontFamily: "'Open Sans', sans-serif",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22,
          padding: '44px 48px',
          borderRadius: 16,
          background: '#FFFFFF',
          border: '1px solid #E4E4E8',
          boxShadow: '0 8px 28px rgba(40, 39, 64, 0.08)',
          maxWidth: 420,
          width: '90%',
        }}
      >
        <img src={magmaLogo} alt="MAGMA AMGM" style={{ width: '100%', maxWidth: 260, height: 'auto', objectFit: 'contain' }} />

        <p style={{ color: '#9AA0A6', fontSize: 13, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600, marginTop: -4 }}>
          Reception Operations Center
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 16px',
          borderRadius: 8,
          background: '#F9F9F9',
          border: '1px solid #EEEEF0',
        }}>
          <Shield size={14} color="#FEA614" />
          <span style={{ color: '#525366', fontSize: 12.5 }}>
            Sign in with your MAGMA Microsoft account
          </span>
        </div>

        {error && (
          <div style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: 'rgba(241,98,120,0.1)',
            border: '1px solid rgba(241,98,120,0.25)',
            color: '#D8455A',
            fontSize: 13,
            width: '100%',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: 10,
            background: loading ? '#6B6690' : '#413C60',
            border: 'none',
            color: '#fff',
            fontFamily: "'Poppins', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {loading ? (
            <>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              Signing in...
            </>
          ) : (
            <>
              <LogIn size={20} />
              Sign in with Microsoft
            </>
          )}
        </motion.button>
      </motion.div>

      <p style={{ color: '#B9BDC4', fontSize: 11 }}>
        MAGMA Settlement &amp; Community Services
      </p>
    </div>
  );
}

// Client Log holds sensitive client data — only reception/admins may open it.
// General staff who deep-link to /clients are bounced back to their dashboard.
function ReceptionRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!isReception(user?.email)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        await initializeMsal();
        // Handle redirect response (comes back from Microsoft login)
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
          msalInstance.setActiveAccount(response.account);
          setUser(response.account);
          setIsAuthenticated(true);
        } else {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            msalInstance.setActiveAccount(accounts[0]);
            setUser(accounts[0]);
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error('MSAL init error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setLoginError(null);
    try {
      await msalInstance.loginRedirect(loginRequest);
    } catch (err) {
      console.error('Login error:', err);
      setLoginError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  if (loading && !isAuthenticated) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FCFCFB',
      }}>
        <Loader2 size={32} color="#FEA614" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} loading={loading} error={loginError} />;
  }

  return (
    <BrowserRouter basename="/magma-reception-app">
      <Sidebar />
      <FeedbackWidget />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ReceptionRoute><ClientLog /></ReceptionRoute>} />
          <Route path="/requests" element={<SupplyRequests />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/orders" element={<PurchaseOrders />} />
          <Route path="/mail" element={<MailPickup />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
