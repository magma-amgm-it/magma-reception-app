import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PlusCircle,
  Filter,
  Calendar,
  User,
} from 'lucide-react';
import PageWrapper from '../components/Layout/PageWrapper';

// MOCK DATA - replace with useSharePointList hook
const mockRequests = [
  {
    id: 1,
    title: 'Paper 8x11 Restock',
    requester: 'Sarah M.',
    department: 'Reception',
    urgency: 'High',
    date: 'Mar 28',
    status: 'New',
  },
  {
    id: 2,
    title: 'Whiteboard Markers',
    requester: 'James L.',
    department: 'CELPIP',
    urgency: 'Medium',
    date: 'Mar 27',
    status: 'New',
  },
  {
    id: 3,
    title: 'Facial Tissue Boxes',
    requester: 'Maria S.',
    department: 'Reception',
    urgency: 'Low',
    date: 'Mar 26',
    status: 'Received',
  },
  {
    id: 4,
    title: 'Printer Ink Cartridge',
    requester: 'David K.',
    department: 'Admin',
    urgency: 'High',
    date: 'Mar 25',
    status: 'Pending Order',
  },
  {
    id: 5,
    title: 'Hand Sanitizer Refill',
    requester: 'Aisha R.',
    department: 'Kitchen',
    urgency: 'Medium',
    date: 'Mar 24',
    status: 'Ready to Pick Up',
  },
  {
    id: 6,
    title: 'Stapler & Staples',
    requester: 'Carlos R.',
    department: 'Admin',
    urgency: 'Low',
    date: 'Mar 23',
    status: 'Completed',
  },
  {
    id: 7,
    title: 'CELPIP Test Water',
    requester: 'Sarah M.',
    department: 'CELPIP',
    urgency: 'High',
    date: 'Mar 28',
    status: 'New',
  },
  {
    id: 8,
    title: 'Paper Towel Roll',
    requester: 'James L.',
    department: 'Kitchen',
    urgency: 'Medium',
    date: 'Mar 22',
    status: 'Completed',
  },
];
// END MOCK DATA

const columns = [
  { key: 'New', label: 'New', color: '#ff3d5a' },
  { key: 'Received', label: 'Received', color: '#ffab00' },
  { key: 'Pending Order', label: 'Pending Order', color: '#f5c542' },
  { key: 'Ready to Pick Up', label: 'Ready to Pick Up', color: '#00e676' },
  { key: 'Completed', label: 'Completed', color: '#8b949e' },
];

const departments = ['All', 'Reception', 'CELPIP', 'Admin', 'Kitchen'];
const urgencies = ['All', 'High', 'Medium', 'Low'];

const urgencyColor = {
  High: '#ff3d5a',
  Medium: '#ffab00',
  Low: '#00e676',
};

const deptColor = {
  Reception: '#00d4ff',
  CELPIP: '#a855f7',
  Admin: '#ffab00',
  Kitchen: '#00e676',
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const s = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 'var(--space-6)',
    flexWrap: 'wrap',
    gap: 'var(--space-4)',
  },
  newBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-md)',
    background: 'linear-gradient(135deg, #00d4ff 0%, #0090b3 100%)',
    color: '#0a0a0f',
    fontWeight: 700,
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
    minHeight: 48,
    border: 'none',
  },
  filterBar: {
    display: 'flex',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-6)',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: 'var(--text-muted)',
    fontSize: 'var(--text-sm)',
  },
  select: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    minHeight: 40,
    cursor: 'pointer',
    appearance: 'auto',
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))',
    gap: 'var(--space-4)',
    overflowX: 'auto',
    paddingBottom: 'var(--space-4)',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    minHeight: 300,
  },
  colHeader: (color) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    background: color + '12',
    borderLeft: `3px solid ${color}`,
    marginBottom: 'var(--space-2)',
  }),
  colName: {
    fontWeight: 600,
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
  },
  colCount: (color) => ({
    background: color + '25',
    color,
    padding: '2px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 700,
  }),
  card: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-4)',
    cursor: 'pointer',
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: 'var(--text-sm)',
    marginBottom: 'var(--space-2)',
    color: 'var(--text-primary)',
  },
  cardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-1)',
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
  },
  cardBadge: (color) => ({
    display: 'inline-block',
    padding: '1px 8px',
    borderRadius: 'var(--radius-full)',
    background: color + '20',
    color,
    fontSize: '10px',
    fontWeight: 600,
  }),
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'var(--space-3)',
  },
};

export default function SupplyRequests() {
  const [deptFilter, setDeptFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');

  const filtered = mockRequests.filter((r) => {
    if (deptFilter !== 'All' && r.department !== deptFilter) return false;
    if (urgencyFilter !== 'All' && r.urgency !== urgencyFilter) return false;
    return true;
  });

  return (
    <PageWrapper title="Supply Requests">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        {/* Header */}
        <motion.div style={s.header} variants={fadeInUp} custom={0}>
          <motion.button
            style={s.newBtn}
            whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(0,212,255,0.4)' }}
            whileTap={{ scale: 0.96 }}
          >
            <PlusCircle size={18} />
            New Request
          </motion.button>
        </motion.div>

        {/* Filter Bar */}
        <motion.div style={s.filterBar} variants={fadeInUp} custom={1}>
          <span style={s.filterIcon}>
            <Filter size={14} /> Filters
          </span>
          <select
            style={s.select}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d} value={d} style={{ background: '#161b22' }}>
                {d === 'All' ? 'All Departments' : d}
              </option>
            ))}
          </select>
          <select
            style={s.select}
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
          >
            {urgencies.map((u) => (
              <option key={u} value={u} style={{ background: '#161b22' }}>
                {u === 'All' ? 'All Urgencies' : u}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Kanban Board */}
        <motion.div style={s.board} variants={stagger}>
          {columns.map((col, ci) => {
            const cards = filtered.filter((r) => r.status === col.key);
            return (
              <motion.div
                key={col.key}
                style={s.column}
                variants={fadeInUp}
                custom={2 + ci}
              >
                <div style={s.colHeader(col.color)}>
                  <span style={s.colName}>{col.label}</span>
                  <span style={s.colCount(col.color)}>{cards.length}</span>
                </div>

                {cards.map((card, i) => (
                  <motion.div
                    key={card.id}
                    style={s.card}
                    variants={fadeInUp}
                    custom={7 + i}
                    whileHover={{
                      y: -4,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <div style={s.cardTitle}>{card.title}</div>
                    <div style={s.cardRow}>
                      <User size={12} />
                      {card.requester}
                    </div>
                    <div style={s.cardFooter}>
                      <span
                        style={s.cardBadge(
                          deptColor[card.department] || '#8b949e'
                        )}
                      >
                        {card.department}
                      </span>
                      <span
                        style={s.cardBadge(
                          urgencyColor[card.urgency] || '#8b949e'
                        )}
                      >
                        {card.urgency}
                      </span>
                    </div>
                    <div
                      style={{ ...s.cardRow, marginTop: 8, marginBottom: 0 }}
                    >
                      <Calendar size={11} />
                      {card.date}
                    </div>
                  </motion.div>
                ))}

                {cards.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 'var(--space-6)',
                      color: 'var(--text-dim)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    No items
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
