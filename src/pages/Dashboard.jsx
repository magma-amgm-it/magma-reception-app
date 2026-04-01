import { motion } from 'framer-motion';
import {
  Users,
  ClipboardList,
  AlertTriangle,
  Package,
  UserPlus,
  PlusCircle,
  ScanBarcode,
  Clock,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import PageWrapper from '../components/Layout/PageWrapper';

// MOCK DATA - replace with useSharePointList hook
const kpiData = {
  clientsToday: 24,
  activeRequests: 7,
  lowStock: 3,
  pendingOrders: 4,
};

const supplyStatusData = [
  { name: 'New', value: 5, color: '#ff3d5a' },
  { name: 'Received', value: 3, color: '#ffab00' },
  { name: 'Pending', value: 2, color: '#a855f7' },
  { name: 'Completed', value: 8, color: '#00e676' },
];

const clientVisitsData = [
  { month: 'Jan', visits: 142 },
  { month: 'Feb', visits: 178 },
  { month: 'Mar', visits: 163 },
];

const recentActivities = [
  { id: 1, text: 'Maria S. checked in — Settlement Services', time: '2 min ago' },
  { id: 2, text: 'Supply request: Paper 8x11 — Approved', time: '8 min ago' },
  { id: 3, text: 'Ahmed K. checked in — Language Assessment', time: '15 min ago' },
  { id: 4, text: 'Inventory alert: Pens below threshold', time: '22 min ago' },
  { id: 5, text: 'Purchase order #PO-2026-018 received', time: '45 min ago' },
];
// END MOCK DATA

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const kpiCards = [
  { label: 'Clients Today', value: kpiData.clientsToday, icon: Users, color: '#00d4ff', glow: '0 0 20px rgba(0,212,255,0.3)' },
  { label: 'Active Requests', value: kpiData.activeRequests, icon: ClipboardList, color: '#ff006e', glow: '0 0 20px rgba(255,0,110,0.3)' },
  { label: 'Low Stock', value: kpiData.lowStock, icon: AlertTriangle, color: '#ffab00', glow: '0 0 20px rgba(255,171,0,0.3)' },
  { label: 'Pending Orders', value: kpiData.pendingOrders, icon: Package, color: '#00e676', glow: '0 0 20px rgba(0,230,118,0.3)' },
];

const quickActions = [
  { label: 'Log Client', icon: UserPlus, color: '#00d4ff' },
  { label: 'New Request', icon: PlusCircle, color: '#ff006e' },
  { label: 'Scan Inventory', icon: ScanBarcode, color: '#00e676' },
];

const styles = {
  hero: {
    textAlign: 'center',
    marginBottom: 'var(--space-10)',
    paddingTop: 'var(--space-4)',
  },
  heroTitle: {
    fontSize: '2.4rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: 'var(--space-2)',
  },
  heroSub: {
    color: 'var(--text-muted)',
    fontSize: 'var(--text-lg)',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 'var(--space-6)',
    marginBottom: 'var(--space-8)',
  },
  kpiCard: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-5)',
    cursor: 'pointer',
    minHeight: 100,
  },
  kpiIconWrap: (color) => ({
    width: 52,
    height: 52,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: color + '15',
    flexShrink: 0,
  }),
  kpiNumber: (color) => ({
    fontSize: '2rem',
    fontWeight: 700,
    color,
    lineHeight: 1,
  }),
  kpiLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 'var(--space-6)',
    marginBottom: 'var(--space-8)',
  },
  chartCard: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
  },
  chartTitle: {
    fontSize: 'var(--text-md)',
    fontWeight: 600,
    marginBottom: 'var(--space-4)',
    color: 'var(--text-primary)',
  },
  actionsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-8)',
  },
  actionBtn: (color) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-4) var(--space-6)',
    borderRadius: 'var(--radius-md)',
    background: color + '18',
    border: `1px solid ${color}40`,
    color,
    fontWeight: 600,
    fontSize: 'var(--text-md)',
    cursor: 'pointer',
    minHeight: 56,
  }),
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 600,
    marginBottom: 'var(--space-4)',
  },
  feedList: {
    maxHeight: 280,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  feedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
  },
  feedTime: {
    marginLeft: 'auto',
    color: 'var(--text-dim)',
    fontSize: 'var(--text-xs)',
    whiteSpace: 'nowrap',
  },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#161b22',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 13,
    }}>
      <p style={{ color: '#e6edf3', fontWeight: 600 }}>{label || payload[0].name}</p>
      <p style={{ color: payload[0].color || '#00d4ff' }}>
        {payload[0].value}
      </p>
    </div>
  );
};

export default function Dashboard() {
  return (
    <PageWrapper title="Dashboard">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Hero */}
        <motion.div style={styles.hero} variants={fadeInUp} custom={0}>
          <h1 style={styles.heroTitle}>Reception Operations Center</h1>
          <p style={styles.heroSub}>Real-time overview of MAGMA reception activity</p>
        </motion.div>

        {/* KPI Cards */}
        <motion.div style={styles.kpiGrid} variants={staggerContainer}>
          {kpiCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                style={styles.kpiCard}
                variants={fadeInUp}
                custom={i}
                whileHover={{ scale: 1.03, boxShadow: card.glow }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <div style={styles.kpiIconWrap(card.color)}>
                  <Icon size={26} color={card.color} />
                </div>
                <div>
                  <div style={styles.kpiNumber(card.color)}>{card.value}</div>
                  <div style={styles.kpiLabel}>{card.label}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts */}
        <motion.div style={styles.chartsRow} variants={staggerContainer}>
          {/* Donut Chart */}
          <motion.div style={styles.chartCard} variants={fadeInUp} custom={4}>
            <h3 style={styles.chartTitle}>Supply Request Status</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={supplyStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {supplyStatusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => (
                    <span style={{ color: '#8b949e', fontSize: 12 }}>{val}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Bar Chart */}
          <motion.div style={styles.chartCard} variants={fadeInUp} custom={5}>
            <h3 style={styles.chartTitle}>Client Visits by Month</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={clientVisitsData} barSize={36}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#8b949e', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#8b949e', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="visits" fill="#00d4ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeInUp} custom={6}>
          <h3 style={styles.sectionTitle}>Quick Actions</h3>
        </motion.div>
        <motion.div style={styles.actionsRow} variants={staggerContainer}>
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                style={styles.actionBtn(action.color)}
                variants={fadeInUp}
                custom={7 + i}
                whileHover={{
                  scale: 1.04,
                  boxShadow: `0 0 24px ${action.color}40`,
                }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon size={22} />
                {action.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Live Feed */}
        <motion.div variants={fadeInUp} custom={10}>
          <h3 style={styles.sectionTitle}>Live Activity Feed</h3>
        </motion.div>
        <motion.div style={styles.feedList} variants={staggerContainer}>
          {recentActivities.map((item, i) => (
            <motion.div
              key={item.id}
              style={styles.feedItem}
              variants={fadeInUp}
              custom={11 + i}
            >
              <Clock size={14} color="var(--text-dim)" />
              <span>{item.text}</span>
              <span style={styles.feedTime}>{item.time}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
