import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import ClientLog from './pages/ClientLog';
import SupplyRequests from './pages/SupplyRequests';
import Inventory from './pages/Inventory';
import PurchaseOrders from './pages/PurchaseOrders';
import { msalInstance, loginRequest, initializeMsal, getAccessToken } from './services/auth';
import { BellRing, LogIn, Shield, Loader2 } from 'lucide-react';

function LoginScreen({ onLogin, loading, error }) {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0a1a 100%)',
      flexDirection: 'column',
      gap: 32,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          padding: 48,
          borderRadius: 24,
          background: 'rgba(22, 27, 34, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          maxWidth: 420,
          width: '90%',
        }}
      >
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(255,0,110,0.15))',
          border: '1px solid rgba(0,212,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <BellRing size={36} color="#00d4ff" />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #00d4ff, #ff006e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8,
          }}>
            MAGMA Reception
          </h1>
          <p style={{ color: '#8b949e', fontSize: 14 }}>
            Operations Center
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 8,
          background: 'rgba(0,212,255,0.05)',
          border: '1px solid rgba(0,212,255,0.1)',
        }}>
          <Shield size={14} color="#00d4ff" />
          <span style={{ color: '#8b949e', fontSize: 12 }}>
            Sign in with your MAGMA Microsoft account
          </span>
        </div>

        {error && (
          <div style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: 'rgba(255,61,90,0.1)',
            border: '1px solid rgba(255,61,90,0.2)',
            color: '#ff3d5a',
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
            borderRadius: 12,
            background: loading ? 'rgba(0,212,255,0.1)' : 'linear-gradient(135deg, #00d4ff, #0099cc)',
            border: 'none',
            color: '#fff',
            fontSize: 16,
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

      <p style={{ color: '#484f58', fontSize: 11 }}>
        MAGMA Settlement & Community Services
      </p>
    </div>
  );
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
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          msalInstance.setActiveAccount(accounts[0]);
          setUser(accounts[0]);
          setIsAuthenticated(true);
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
      const response = await msalInstance.loginPopup(loginRequest);
      msalInstance.setActiveAccount(response.account);
      setUser(response.account);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Login error:', err);
      setLoginError(err.message || 'Login failed. Please try again.');
    } finally {
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
        background: '#0a0a0f',
      }}>
        <Loader2 size={32} color="#00d4ff" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} loading={loading} error={loginError} />;
  }

  return (
    <BrowserRouter basename="/magma-reception-app">
      <Sidebar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ClientLog />} />
          <Route path="/requests" element={<SupplyRequests />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/orders" element={<PurchaseOrders />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
