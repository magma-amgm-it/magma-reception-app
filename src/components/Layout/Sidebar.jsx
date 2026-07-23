import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  PackageSearch,
  Warehouse,
  ShoppingCart,
  Mail,
  X,
  BellRing,
  LogOut,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin, isReception } from '../../services/admin';
import magmaLogoWhite from '../../assets/magma-logo-white.png';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Client Log', receptionOnly: true },
  { to: '/requests', icon: PackageSearch, label: 'Supply Requests' },
  { to: '/inventory', icon: Warehouse, label: 'Inventory' },
  { to: '/orders', icon: ShoppingCart, label: 'Purchase Orders' },
  { to: '/mail', icon: Mail, label: 'Mail Pickup' },
];

const adminNavItem = { to: '/admin', icon: Wrench, label: 'Admin', adminOnly: true };

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  const userName = user?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();
  const showAdmin = isAdmin(user?.email);
  const showReception = isReception(user?.email);
  // Client Log (client data) is reception-only; everyone else never sees it.
  const baseNav = navItems.filter((n) => !n.receptionOnly || showReception);
  const visibleNavItems = showAdmin ? [...baseNav, adminNavItem] : baseNav;

  return (
    <>
      {/* Floating bell button — always visible */}
      <button
        className="sidebar-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        style={{
          position: 'fixed',
          top: 8,
          left: 16,
          zIndex: 200,
          width: 48,
          height: 48,
          borderRadius: 14,
          background: '#413C60',
          border: 'none',
          display: open ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(40, 39, 64, 0.22)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#37324F';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(40, 39, 64, 0.32)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#413C60';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(40, 39, 64, 0.22)';
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
            className="sidebar"
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
              <img
                src={magmaLogoWhite}
                alt="MAGMA AMGM"
                style={{ width: 182, height: 'auto', objectFit: 'contain' }}
              />
              <button
                className="sidebar-close"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 4,
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.55)',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
              {visibleNavItems.map((item) => (
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
                    border: '2px solid rgba(255,255,255,0.25)',
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
                    color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
                    background: 'transparent', border: 'none', flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#E06B7A';
                    e.currentTarget.style.background = 'rgba(241,98,120,0.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
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
