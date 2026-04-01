import { motion } from 'framer-motion';
import { RefreshCw, Search } from 'lucide-react';
import './PageWrapper.css';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function PageWrapper({
  title,
  children,
  showSearch = false,
  onRefresh,
  lastUpdated,
}) {
  return (
    <motion.div
      className="page-wrapper"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">{title}</h1>
        </div>

        <div className="topbar-right">
          {showSearch && (
            <div className="topbar-search">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
                className="search-input"
              />
            </div>
          )}

          {lastUpdated && (
            <span className="topbar-timestamp">
              Updated {lastUpdated}
            </span>
          )}

          {onRefresh && (
            <button
              className="topbar-refresh"
              onClick={onRefresh}
              aria-label="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="page-content">
        {children}
      </main>
    </motion.div>
  );
}
