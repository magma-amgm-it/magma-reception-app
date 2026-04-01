import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  PackageSearch,
  Warehouse,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  BellRing,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Client Log' },
  { to: '/requests', icon: PackageSearch, label: 'Supply Requests' },
  { to: '/inventory', icon: Warehouse, label: 'Inventory' },
  { to: '/orders', icon: ShoppingCart, label: 'Purchase Orders' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      className={`sidebar glass-heavy ${collapsed ? 'collapsed' : ''}`}
      animate={{ width: collapsed ? 70 : 250 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <BellRing size={24} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              className="logo-text"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
            >
              MAGMA
            </motion.span>
          )}
        </AnimatePresence>
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
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      className="nav-label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        {/* User */}
        <div className="sidebar-user">
          <div className="user-avatar">R</div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                className="user-info"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="user-name">Reception</span>
                <span className="user-role">Staff</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse toggle */}
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>
      </div>
    </motion.aside>
  );
}
