import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Camera,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
} from 'lucide-react';
import PageWrapper from '../components/Layout/PageWrapper';

// MOCK DATA - replace with useSharePointList hook
const inventoryItems = [
  {
    id: 1,
    name: 'Paper 8x11',
    category: 'Office',
    quantity: 3,
    threshold: 10,
    vendor: 'Staples',
  },
  {
    id: 2,
    name: 'Facial Tissue',
    category: 'Bathroom',
    quantity: 12,
    threshold: 10,
    vendor: 'Costco',
  },
  {
    id: 3,
    name: 'Paper Towel',
    category: 'Kitchen',
    quantity: 2,
    threshold: 8,
    vendor: 'Costco',
  },
  {
    id: 4,
    name: 'CELPIP Water',
    category: 'CELPIP',
    quantity: 8,
    threshold: 12,
    vendor: 'Costco',
  },
  {
    id: 5,
    name: 'Pens',
    category: 'Office',
    quantity: 1,
    threshold: 15,
    vendor: 'Staples',
  },
];
// END MOCK DATA

const categoryColor = {
  Office: '#00d4ff',
  Kitchen: '#00e676',
  Bathroom: '#a855f7',
  CELPIP: '#26c6da',
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

function getStockColor(quantity, threshold) {
  if (quantity <= threshold * 0.3) return '#ff3d5a';
  if (quantity <= threshold * 0.7) return '#ffab00';
  return '#00e676';
}

function getStockPercent(quantity, threshold) {
  return Math.min(100, (quantity / (threshold * 2)) * 100);
}

const s = {
  controlsRow: {
    display: 'flex',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-6)',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchWrap: {
    flex: 1,
    minWidth: 220,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-dim)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: 'var(--space-3) var(--space-4) var(--space-3) 42px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-md)',
    minHeight: 48,
    outline: 'none',
  },
  modeToggle: {
    display: 'flex',
    gap: 0,
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    border: '1px solid var(--glass-border)',
  },
  modeBtn: (active, color) => ({
    padding: 'var(--space-3) var(--space-6)',
    background: active ? color + '20' : 'rgba(255,255,255,0.03)',
    color: active ? color : 'var(--text-muted)',
    fontWeight: 700,
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
    border: 'none',
    minHeight: 48,
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    transition: 'all 0.2s',
  }),
  scanBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
    minHeight: 48,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 'var(--space-5)',
  },
  card: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardName: {
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  catBadge: (color) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 'var(--radius-full)',
    background: color + '18',
    color,
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    alignSelf: 'flex-start',
  }),
  qtyRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--space-2)',
  },
  qtyNumber: (color) => ({
    fontSize: '2.2rem',
    fontWeight: 800,
    color,
    lineHeight: 1,
  }),
  qtyLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  progressFill: (percent, color) => ({
    width: `${percent}%`,
    height: '100%',
    borderRadius: 3,
    background: color,
    transition: 'width 0.5s ease',
  }),
  lowBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: '3px 10px',
    borderRadius: 'var(--radius-full)',
    background: 'rgba(255,61,90,0.18)',
    color: '#ff3d5a',
    fontSize: '10px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  vendorBadge: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-dim)',
    marginTop: 'auto',
  },
};

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('in');

  const filtered = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageWrapper title="Inventory">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        {/* Controls Row */}
        <motion.div style={s.controlsRow} variants={fadeInUp} custom={0}>
          <div style={s.searchWrap}>
            <Search size={18} style={s.searchIcon} />
            <input
              style={s.searchInput}
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={s.modeToggle}>
            <motion.button
              style={s.modeBtn(mode === 'in', '#00e676')}
              onClick={() => setMode('in')}
              whileTap={{ scale: 0.97 }}
            >
              <ArrowDownCircle size={16} />
              CHECK IN
            </motion.button>
            <motion.button
              style={s.modeBtn(mode === 'out', '#ff3d5a')}
              onClick={() => setMode('out')}
              whileTap={{ scale: 0.97 }}
            >
              <ArrowUpCircle size={16} />
              CHECK OUT
            </motion.button>
          </div>

          <motion.button
            style={s.scanBtn}
            whileHover={{
              scale: 1.04,
              boxShadow: '0 0 16px rgba(0,212,255,0.25)',
            }}
            whileTap={{ scale: 0.96 }}
          >
            <Camera size={18} />
            Scan
          </motion.button>
        </motion.div>

        {/* Item Grid */}
        <motion.div style={s.grid} variants={stagger}>
          {filtered.map((item, i) => {
            const isLow = item.quantity <= item.threshold;
            const stockColor = getStockColor(item.quantity, item.threshold);
            const percent = getStockPercent(item.quantity, item.threshold);
            const catColor = categoryColor[item.category] || '#8b949e';

            return (
              <motion.div
                key={item.id}
                style={s.card}
                variants={fadeInUp}
                custom={1 + i}
                whileHover={{
                  y: -4,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {/* Low Stock Badge */}
                {isLow && (
                  <motion.div
                    style={s.lowBadge}
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <AlertTriangle size={10} />
                    LOW STOCK
                  </motion.div>
                )}

                <div style={s.cardName}>{item.name}</div>
                <span style={s.catBadge(catColor)}>{item.category}</span>

                <div style={s.qtyRow}>
                  <span style={s.qtyNumber(stockColor)}>{item.quantity}</span>
                  <span style={s.qtyLabel}>/ {item.threshold} threshold</span>
                </div>

                <div style={s.progressTrack}>
                  <div style={s.progressFill(percent, stockColor)} />
                </div>

                <div style={s.vendorBadge}>Preferred: {item.vendor}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-12)',
              color: 'var(--text-dim)',
            }}
          >
            No items match your search.
          </div>
        )}
      </motion.div>
    </PageWrapper>
  );
}
