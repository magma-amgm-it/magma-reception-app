import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  PackageSearch,
  Warehouse,
  ShoppingCart,
  X,
  BellRing,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Client Log' },
  { to: '/requests', icon: PackageSearch, label: 'Supply Requests' },
  { to: '/inventory', icon: Warehouse, label: 'Inventory' },
  { to: '/orders', icon: ShoppingCart, label: 'Purchase Orders' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  const userName = user?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Floating bell button — always visible */}
      <button
        className="sidebar-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 200,
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'rgba(0, 212, 255, 0.1)',
          border: '1px solid rgba(0, 212, 255, 0.25)',
          display: open ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#00d4ff',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <BellRing size={22} />
      </button>

      {/* Backdrop overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 299,
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar drawer */}
      <AnimatePresence>
        {open && (
          <motion.aside
            className="sidebar glass-heavy"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 260,
              zIndex: 300,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Logo + close button */}
            <div className="sidebar-logo">
              <div className="logo-icon">
                <BellRing size={24} />
              </div>
              <span className="logo-text">MAGMA</span>
              <button
                className="sidebar-close"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                style={{
                  marginLeft: 'auto',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ff3d5a';
                  e.currentTarget.style.background = 'rgba(255, 61, 90, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  onClick={() => setOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          className="nav-active-indicator"
                          layoutId="activeIndicator"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                      <div className="nav-icon">
                        <item.icon size={20} strokeWidth={1.8} />
                      </div>
                      <span className="nav-label">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Bottom section — logged in user */}
            <div className="sidebar-bottom">
              <div className="sidebar-user">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt={userName} style={{
                    width: 36, height: 36, borderRadius: 10, objectFit: 'cover',
                    border: '2px solid rgba(0,212,255,0.3)',
                  }} />
                ) : (
                  <div className="user-avatar">{userInitial}</div>
                )}
                <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
                  <span className="user-name" style={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'block', maxWidth: 140,
                  }}>{userName}</span>
                  {user?.email && (
                    <span className="user-role" style={{
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      display: 'block', maxWidth: 140, fontSize: 11,
                    }}>{user.email}</span>
                  )}
                </div>
                <button
                  onClick={() => { setOpen(false); logout(); }}
                  aria-label="Sign out"
                  title="Sign out"
                  style={{
                    marginLeft: 'auto', width: 34, height: 34, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    background: 'transparent', border: 'none', flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ff3d5a';
                    e.currentTarget.style.background = 'rgba(255,61,90,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
