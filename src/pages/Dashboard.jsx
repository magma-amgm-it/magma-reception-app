import { useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  AlertTriangle,
  Package,
  UserPlus,
  PlusCircle,
  ScanBarcode,
  Clock,
  Loader2,
  Heart,
  DollarSign,
  TrendingUp,
  BarChart3,
  Globe,
  ShieldCheck,
  Zap,
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
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  CartesianGrid,
} from 'recharts';
import { format, isToday, parseISO, subDays, startOfMonth, isAfter, isBefore, differenceInDays } from 'date-fns';
import PageWrapper from '../components/Layout/PageWrapper';
import { useSharePointList } from '../hooks/useSharePointList';
import SparkLine from '../components/Dashboard/SparkLine';
import { lazy } from 'react';

// Lazy load the 3D orb — it's heavy
const OrbVisual = lazy(() => import('../components/Dashboard/OrbVisual.jsx'));

// ─── Animations ──────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

// ─── Color Maps ──────────────────────────────────────────
const statusColorMap = {
  New: '#ff3d5a',
  Received: '#ffab00',
  'Pending Order': '#a855f7',
  'Ready to Pick Up': '#26c6da',
  Completed: '#00e676',
  Cancelled: '#8b949e',
};

const immigrationColors = {
  PR: '#00d4ff',
  WP: '#00e676',
  SP: '#a855f7',
  VV: '#ffab00',
  AS: '#ff006e',
  Refugee: '#26a69a',
};

const vendorColors = {
  Amazon: '#ff9900',
  Instacart: '#43b02a',
  MCS: '#00d4ff',
  Denis: '#a855f7',
  Walmart: '#0071dc',
  Superstore: '#e1261c',
  Dollarama: '#ffd700',
  Ikea: '#ffda1a',
  Other: '#8b949e',
};

const categoryColors = {
  'Office Supplies': '#00d4ff',
  'Kitchen/Break Room': '#00e676',
  Cleaning: '#26a69a',
  Bathroom: '#a855f7',
  CELPIP: '#26c6da',
  Other: '#8b949e',
};

// ─── Styles ──────────────────────────────────────────────
const s = {
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 20,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: (color) => ({
    width: 28,
    height: 28,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: color + '18',
    flexShrink: 0,
  }),
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 16,
    marginBottom: 32,
  },
  kpiCard: (color) => ({
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 14,
    padding: '20px 20px 16px',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
  }),
  kpiTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  kpiValue: (color) => ({
    fontSize: 32,
    fontWeight: 800,
    color,
    lineHeight: 1,
    marginBottom: 4,
    fontVariantNumeric: 'tabular-nums',
  }),
  kpiSpark: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  kpiTrend: (positive) => ({
    fontSize: 11,
    fontWeight: 600,
    color: positive ? '#00e676' : '#ff3d5a',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  }),
  kpiGlow: (color) => ({
    position: 'absolute',
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: color,
    opacity: 0.06,
    filter: 'blur(20px)',
    pointerEvents: 'none',
  }),
  chartCard: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 14,
    padding: 24,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 16,
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 20,
    marginBottom: 32,
  },
  row3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
    marginBottom: 32,
  },
  pipelineBar: {
    display: 'flex',
    gap: 4,
    marginBottom: 24,
  },
  pipelineStage: (color, widthPct) => ({
    flex: widthPct || 1,
    background: color + '25',
    borderRadius: 6,
    padding: '12px 14px',
    textAlign: 'center',
    borderTop: `3px solid ${color}`,
    minWidth: 0,
  }),
  pipelineCount: (color) => ({
    fontSize: 22,
    fontWeight: 800,
    color,
    lineHeight: 1,
  }),
  pipelineLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: 4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  healthRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  healthItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  healthLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-primary)',
    minWidth: 110,
  },
  healthTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  healthFill: (pct, color) => ({
    width: `${Math.min(100, pct)}%`,
    height: '100%',
    borderRadius: 4,
    background: `linear-gradient(90deg, ${color}, ${color}88)`,
    transition: 'width 0.8s ease',
  }),
  healthPct: (color) => ({
    fontSize: 12,
    fontWeight: 700,
    color,
    minWidth: 36,
    textAlign: 'right',
  }),
  projectionCard: {
    background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(168,85,247,0.08))',
    border: '1px solid rgba(0,212,255,0.15)',
    borderRadius: 14,
    padding: 24,
    textAlign: 'center',
  },
  projLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  projValue: {
    fontSize: 40,
    fontWeight: 800,
    background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: 1,
    marginBottom: 8,
  },
  projSub: {
    fontSize: 12,
    color: 'var(--text-dim)',
  },
  actionsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: 32,
  },
  actionBtn: (color) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '16px 24px',
    borderRadius: 12,
    background: color + '14',
    border: `1px solid ${color}30`,
    color,
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    minHeight: 56,
  }),
  feedList: {
    maxHeight: 260,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  feedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 10,
    fontSize: 13,
  },
  feedTime: {
    marginLeft: 'auto',
    color: 'var(--text-dim)',
    fontSize: 11,
    whiteSpace: 'nowrap',
  },
};

// ─── Custom Tooltip ──────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#161b22',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      padding: '8px 14px',
      fontSize: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ color: '#e6edf3', fontWeight: 600, marginBottom: 4 }}>{label || payload[0].name}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#00d4ff', fontWeight: 500 }}>
          {p.name || 'Value'}: {typeof p.value === 'number' && p.name?.includes('$') ? `$${p.value.toFixed(2)}` : p.value}
        </div>
      ))}
    </div>
  );
};

// ─── Quick Actions Config ────────────────────────────────
const quickActions = [
  { label: 'Log Client', icon: UserPlus, color: '#00d4ff', path: '/clients' },
  { label: 'New Request', icon: PlusCircle, color: '#ff006e', path: '/requests' },
  { label: 'Scan Inventory', icon: ScanBarcode, color: '#00e676', path: '/inventory' },
];

// ─── Helper ──────────────────────────────────────────────
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  try { return format(date, 'MMM d'); } catch { return ''; }
}

function safeParseDate(dateStr) {
  if (!dateStr) return null;
  try { return parseISO(dateStr); } catch { return null; }
}

// ══════════════════════════════════════════════════════════
// DASHBOARD COMPONENT
// ══════════════════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate();
  const { data: clientData, loading: cl } = useSharePointList('clientLog');
  const { data: supplyData, loading: sl } = useSharePointList('supplyRequests');
  const { data: inventoryData, loading: il } = useSharePointList('inventory');
  const { data: orderData, loading: ol } = useSharePointList('purchaseOrders');
  const anyLoading = cl || sl || il || ol;

  // ── KPI Computations ────────────────────────────────────
  const kpis = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);

    const clientsToday = clientData.filter(i => {
      const d = safeParseDate(i.fields?.DateOfInteraction);
      return d && isToday(d);
    }).length;

    const totalPeopleServed = clientData.reduce((sum, i) =>
      sum + (i.fields?.NumberOfFamilyMembers ?? 1), 0);

    const activeRequests = supplyData.filter(i => {
      const st = i.fields?.Status;
      return st && st !== 'Completed' && st !== 'Cancelled';
    }).length;

    const lowStock = inventoryData.filter(i => {
      const q = i.fields?.CurrentQuantity ?? 0;
      const t = i.fields?.MinimumThreshold ?? 0;
      return t > 0 && q <= t;
    }).length;

    const pendingOrders = orderData.filter(i => {
      const st = i.fields?.OrderStatus;
      return st && st !== 'Received' && st !== 'Cancelled' && st !== 'Delegated';
    }).length;

    const monthlySpend = orderData.reduce((sum, i) => {
      const d = safeParseDate(i.fields?.DateOrdered);
      if (d && isAfter(d, monthStart) && i.fields?.OrderStatus !== 'Cancelled') {
        return sum + (i.fields?.Cost ?? 0);
      }
      return sum;
    }, 0);

    return { clientsToday, totalPeopleServed, activeRequests, lowStock, pendingOrders, monthlySpend };
  }, [clientData, supplyData, inventoryData, orderData]);

  // ── Sparkline Data (last 7 days) ────────────────────────
  const sparkData = useMemo(() => {
    const today = new Date();
    const days7 = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      return format(d, 'yyyy-MM-dd');
    });

    const clientSpark = days7.map(day =>
      clientData.filter(i => {
        const d = i.fields?.DateOfInteraction;
        return d && d.startsWith(day);
      }).length
    );

    const requestSpark = days7.map(day =>
      supplyData.filter(i => {
        const d = i.fields?.DateOfRequest;
        return d && d.startsWith(day);
      }).length
    );

    const orderSpark = days7.map(day =>
      orderData.filter(i => {
        const d = i.fields?.DateOrdered;
        return d && d.startsWith(day);
      }).length
    );

    return { clientSpark, requestSpark, orderSpark };
  }, [clientData, supplyData, orderData]);

  // ── System Health Score ─────────────────────────────────
  const healthScore = useMemo(() => {
    let score = 100;
    // Deduct for low stock items
    const lowCount = kpis.lowStock;
    score -= Math.min(40, lowCount * 10);
    // Deduct for old unresolved requests
    const urgentUnresolved = supplyData.filter(i => {
      const st = i.fields?.Status;
      const urg = i.fields?.Urgency;
      return st === 'New' && urg === 'Urgent';
    }).length;
    score -= Math.min(30, urgentUnresolved * 15);
    // Deduct for overdue orders
    const overdueOrders = orderData.filter(i => {
      const st = i.fields?.OrderStatus;
      const exp = safeParseDate(i.fields?.ExpectedDelivery);
      return st === 'Ordered' && exp && isBefore(exp, new Date());
    }).length;
    score -= Math.min(30, overdueOrders * 10);
    return Math.max(0, Math.min(100, score));
  }, [kpis, supplyData, orderData]);

  // ── Immigration Status Breakdown ────────────────────────
  const immigrationData = useMemo(() => {
    const counts = {};
    clientData.forEach(i => {
      const st = i.fields?.StatusInCanada;
      if (st) counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: immigrationColors[name] || '#8b949e',
    }));
  }, [clientData]);

  // ── Visit Reasons ───────────────────────────────────────
  const visitReasonData = useMemo(() => {
    const counts = {};
    clientData.forEach(i => {
      const r = i.fields?.ReasonForVisit;
      if (r) counts[r] = (counts[r] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [clientData]);

  // ── Language Split ──────────────────────────────────────
  const langData = useMemo(() => {
    const counts = { English: 0, French: 0 };
    clientData.forEach(i => {
      const l = i.fields?.PreferredLanguage;
      if (l && counts[l] !== undefined) counts[l]++;
    });
    return [
      { name: 'English', value: counts.English, color: '#00d4ff' },
      { name: 'French', value: counts.French, color: '#ff006e' },
    ].filter(d => d.value > 0);
  }, [clientData]);

  // ── Client Visit Trend (last 30 days) ──────────────────
  const visitTrendData = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(today, 29 - i);
      return { key: format(d, 'yyyy-MM-dd'), label: format(d, 'MMM d') };
    });
    return days.map(({ key, label }) => ({
      date: label,
      visits: clientData.filter(i => {
        const d = i.fields?.DateOfInteraction;
        return d && d.startsWith(key);
      }).length,
    }));
  }, [clientData]);

  // ── Supply Request Pipeline ─────────────────────────────
  const pipelineCounts = useMemo(() => {
    const counts = { New: 0, Received: 0, 'Pending Order': 0, 'Ready to Pick Up': 0, Completed: 0 };
    supplyData.forEach(i => {
      const st = i.fields?.Status;
      if (st && counts[st] !== undefined) counts[st]++;
    });
    return counts;
  }, [supplyData]);

  // ── Department Activity (Radar) ─────────────────────────
  const deptRadarData = useMemo(() => {
    const depts = {};
    supplyData.forEach(i => {
      const d = i.fields?.Department;
      if (d) depts[d] = (depts[d] || 0) + 1;
    });
    orderData.forEach(i => {
      const d = i.fields?.ForDepartment;
      if (d) depts[d] = (depts[d] || 0) + 1;
    });
    return Object.entries(depts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([dept, activity]) => ({ dept, activity }));
  }, [supplyData, orderData]);

  // ── Spending Trend (by month) ───────────────────────────
  const spendTrendData = useMemo(() => {
    const months = {};
    orderData.forEach(i => {
      const d = safeParseDate(i.fields?.DateOrdered);
      if (d && i.fields?.OrderStatus !== 'Cancelled') {
        const key = format(d, 'MMM yyyy');
        months[key] = (months[key] || 0) + (i.fields?.Cost ?? 0);
      }
    });
    return Object.entries(months)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-6)
      .map(([month, spend]) => ({ month, spend: Math.round(spend * 100) / 100 }));
  }, [orderData]);

  // ── Vendor Spend ────────────────────────────────────────
  const vendorSpendData = useMemo(() => {
    const vendors = {};
    orderData.forEach(i => {
      const v = i.fields?.Vendor;
      if (v && i.fields?.OrderStatus !== 'Cancelled') {
        vendors[v] = (vendors[v] || 0) + (i.fields?.Cost ?? 0);
      }
    });
    return Object.entries(vendors)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
        color: vendorColors[name] || '#8b949e',
      }));
  }, [orderData]);

  // ── Spend by Department ─────────────────────────────────
  const deptSpendData = useMemo(() => {
    const depts = {};
    orderData.forEach(i => {
      const d = i.fields?.ForDepartment;
      if (d && i.fields?.OrderStatus !== 'Cancelled') {
        depts[d] = (depts[d] || 0) + (i.fields?.Cost ?? 0);
      }
    });
    return Object.entries(depts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [orderData]);

  // ── Projected Annual Spend ──────────────────────────────
  const projectedAnnual = useMemo(() => {
    if (spendTrendData.length === 0) return 0;
    const totalSpend = spendTrendData.reduce((s, d) => s + d.spend, 0);
    const avgMonthly = totalSpend / spendTrendData.length;
    return Math.round(avgMonthly * 12);
  }, [spendTrendData]);

  // ── Inventory Category Health ───────────────────────────
  const categoryHealth = useMemo(() => {
    const cats = {};
    inventoryData.forEach(i => {
      const cat = i.fields?.Category || 'Other';
      const q = i.fields?.CurrentQuantity ?? 0;
      const t = i.fields?.MinimumThreshold ?? 1;
      if (!cats[cat]) cats[cat] = { totalPct: 0, count: 0 };
      cats[cat].totalPct += t > 0 ? (q / t) * 100 : 100;
      cats[cat].count++;
    });
    return Object.entries(cats).map(([name, { totalPct, count }]) => {
      const avgPct = Math.round(totalPct / count);
      const color = avgPct > 100 ? '#00e676' : avgPct > 50 ? '#ffab00' : '#ff3d5a';
      return { name, pct: avgPct, color, catColor: categoryColors[name] || '#8b949e' };
    });
  }, [inventoryData]);

  // ── Recent Activity Feed ────────────────────────────────
  const recentActivities = useMemo(() => {
    const acts = [];
    clientData.slice(0, 10).forEach(i => {
      const name = i.fields?.Title || `${i.fields?.FirstName || ''} ${i.fields?.LastName || ''}`.trim();
      const reason = i.fields?.ReasonForVisit || '';
      const d = safeParseDate(i.fields?.DateOfInteraction);
      acts.push({ id: `c-${i.id}`, text: `${name} checked in${reason ? ' — ' + reason : ''}`, date: d || new Date(0), time: d ? formatTimeAgo(d) : '' });
    });
    supplyData.slice(0, 8).forEach(i => {
      const d = safeParseDate(i.fields?.DateOfRequest);
      acts.push({ id: `s-${i.id}`, text: `Supply: ${i.fields?.Title || 'Request'} — ${i.fields?.Status || 'New'}`, date: d || new Date(0), time: d ? formatTimeAgo(d) : '' });
    });
    orderData.slice(0, 5).forEach(i => {
      const d = safeParseDate(i.fields?.DateOrdered);
      acts.push({ id: `o-${i.id}`, text: `PO: ${i.fields?.Title || 'Order'} — ${i.fields?.OrderStatus || 'Ordered'}`, date: d || new Date(0), time: d ? formatTimeAgo(d) : '' });
    });
    return acts.sort((a, b) => b.date - a.date).slice(0, 8);
  }, [clientData, supplyData, orderData]);

  // ── Clients this month for orb ──────────────────────────
  const clientsThisMonth = useMemo(() => {
    const ms = startOfMonth(new Date());
    return clientData.filter(i => {
      const d = safeParseDate(i.fields?.DateOfInteraction);
      return d && isAfter(d, ms);
    }).length;
  }, [clientData]);

  // ── KPI Card Configs ────────────────────────────────────
  const kpiCards = [
    { label: 'Clients Today', value: kpis.clientsToday, icon: Users, color: '#00d4ff', spark: sparkData.clientSpark, glow: '0 0 24px rgba(0,212,255,0.25)' },
    { label: 'People Served', value: kpis.totalPeopleServed.toLocaleString(), icon: Heart, color: '#ff006e', spark: [], glow: '0 0 24px rgba(255,0,110,0.25)' },
    { label: 'Active Requests', value: kpis.activeRequests, icon: ClipboardList, color: '#a855f7', spark: sparkData.requestSpark, glow: '0 0 24px rgba(168,85,247,0.25)' },
    { label: 'Low Stock', value: kpis.lowStock, icon: AlertTriangle, color: kpis.lowStock > 0 ? '#ff3d5a' : '#00e676', spark: [], glow: kpis.lowStock > 0 ? '0 0 24px rgba(255,61,90,0.3)' : '0 0 24px rgba(0,230,118,0.2)' },
    { label: 'Pending Orders', value: kpis.pendingOrders, icon: Package, color: '#ffab00', spark: sparkData.orderSpark, glow: '0 0 24px rgba(255,171,0,0.25)' },
    { label: 'Monthly Spend', value: `$${kpis.monthlySpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: DollarSign, color: '#00e676', spark: [], glow: '0 0 24px rgba(0,230,118,0.25)' },
  ];

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <PageWrapper title="Dashboard">
      <motion.div initial="hidden" animate="visible" variants={stagger}>

        {/* ── Hero Title ─────────────────────────────────── */}
        <motion.div style={{ textAlign: 'center', marginBottom: 28, paddingTop: 8 }} variants={fadeInUp} custom={0}>
          <h1 style={{
            fontSize: '2.2rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ff006e 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 4,
          }}>
            MAGMA Operations Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Real-time intelligence across all reception operations
            {anyLoading && (
              <span style={{ marginLeft: 8, color: 'var(--text-dim)' }}>
                <Loader2 size={12} style={{ animation: 'dspin 1s linear infinite', verticalAlign: 'middle', marginRight: 4 }} />
                syncing...
              </span>
            )}
          </p>
        </motion.div>

        {/* ── Section 1: KPI Strip ───────────────────────── */}
        <motion.div style={s.kpiGrid} variants={stagger}>
          {kpiCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                style={s.kpiCard(card.color)}
                variants={fadeInUp}
                custom={1 + i}
                whileHover={{ scale: 1.03, boxShadow: card.glow }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <div style={s.kpiGlow(card.color)} />
                <div style={s.kpiTopRow}>
                  <span style={s.kpiLabel}>{card.label}</span>
                  <Icon size={16} color={card.color} style={{ opacity: 0.6 }} />
                </div>
                <div style={s.kpiValue(card.color)}>{card.value}</div>
                {card.spark.length > 1 && (
                  <div style={s.kpiSpark}>
                    <SparkLine data={card.spark} color={card.color} width={70} height={22} />
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>7d trend</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Section 2: 3D Orb ──────────────────────────── */}
        <motion.div variants={fadeInUp} custom={7} style={{ marginBottom: 32 }}>
          <Suspense fallback={<div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}><Loader2 size={24} style={{ animation: 'dspin 1s linear infinite' }} /></div>}>
            <OrbVisual
              healthScore={healthScore}
              stats={{
                clientsThisMonth,
                monthlySpend: kpis.monthlySpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
              }}
            />
          </Suspense>
        </motion.div>

        {/* ── Section 3: Client Analytics ────────────────── */}
        <motion.div variants={fadeInUp} custom={8}>
          <div style={s.sectionTitle}>
            <span style={s.sectionIcon('#00d4ff')}><Globe size={16} color="#00d4ff" /></span>
            Client Analytics
          </div>
        </motion.div>

        <motion.div style={s.row2} variants={stagger}>
          {/* Immigration Status */}
          <motion.div style={s.chartCard} variants={fadeInUp} custom={9}>
            <div style={s.chartTitle}>Immigration Status Distribution</div>
            {immigrationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={immigrationData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                    {immigrationData.map(e => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#8b949e', fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="No client data" />}
          </motion.div>

          {/* Visit Trend */}
          <motion.div style={s.chartCard} variants={fadeInUp} custom={10}>
            <div style={s.chartTitle}>Client Visits — Last 30 Days</div>
            {visitTrendData.some(d => d.visits > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={visitTrendData}>
                  <defs>
                    <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#484f58', fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis tick={{ fill: '#484f58', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="visits" stroke="#00d4ff" strokeWidth={2} fill="url(#visitGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="No visit data" />}
          </motion.div>
        </motion.div>

        <motion.div style={s.row3} variants={stagger}>
          {/* Visit Reasons */}
          <motion.div style={s.chartCard} variants={fadeInUp} custom={11}>
            <div style={s.chartTitle}>Top Visit Reasons</div>
            {visitReasonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={visitReasonData} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#484f58', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#8b949e', fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" fill="#a855f7" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="No data" />}
          </motion.div>

          {/* Language Split */}
          <motion.div style={s.chartCard} variants={fadeInUp} custom={12}>
            <div style={s.chartTitle}>Language Preference</div>
            {langData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={langData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {langData.map(e => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#8b949e', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="No data" />}
          </motion.div>

          {/* Department Radar */}
          <motion.div style={s.chartCard} variants={fadeInUp} custom={13}>
            <div style={s.chartTitle}>Department Activity</div>
            {deptRadarData.length > 2 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={deptRadarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="dept" tick={{ fill: '#8b949e', fontSize: 9 }} />
                  <Radar name="Activity" dataKey="activity" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip content={<ChartTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="Need more data" />}
          </motion.div>
        </motion.div>

        {/* ── Section 4: Operations Pipeline ──────────────── */}
        <motion.div variants={fadeInUp} custom={14}>
          <div style={s.sectionTitle}>
            <span style={s.sectionIcon('#a855f7')}><Zap size={16} color="#a855f7" /></span>
            Supply Request Pipeline
          </div>
        </motion.div>
        <motion.div style={s.pipelineBar} variants={fadeInUp} custom={15}>
          {Object.entries(pipelineCounts).map(([stage, count]) => (
            <div key={stage} style={s.pipelineStage(statusColorMap[stage] || '#8b949e', Math.max(count, 1))}>
              <div style={s.pipelineCount(statusColorMap[stage] || '#8b949e')}>{count}</div>
              <div style={s.pipelineLabel}>{stage}</div>
            </div>
          ))}
        </motion.div>

        {/* ── Section 5: Financial Intelligence ────────────── */}
        <motion.div variants={fadeInUp} custom={16}>
          <div style={s.sectionTitle}>
            <span style={s.sectionIcon('#00e676')}><BarChart3 size={16} color="#00e676" /></span>
            Financial Intelligence
          </div>
        </motion.div>

        <motion.div style={s.row2} variants={stagger}>
          {/* Spending Trend */}
          <motion.div style={s.chartCard} variants={fadeInUp} custom={17}>
            <div style={s.chartTitle}>Monthly Spending Trend</div>
            {spendTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={spendTrendData}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e676" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#484f58', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#484f58', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="spend" stroke="#00e676" strokeWidth={2} fill="url(#spendGrad)" name="$ Spend" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="No spending data" />}
          </motion.div>

          {/* Vendor Spend */}
          <motion.div style={s.chartCard} variants={fadeInUp} custom={18}>
            <div style={s.chartTitle}>Spend by Vendor</div>
            {vendorSpendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={vendorSpendData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                    {vendorSpendData.map(e => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#8b949e', fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="No data" />}
          </motion.div>
        </motion.div>

        <motion.div style={{ ...s.row3, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }} variants={stagger}>
          {/* Department Spend */}
          <motion.div style={s.chartCard} variants={fadeInUp} custom={19}>
            <div style={s.chartTitle}>Spend by Department</div>
            {deptSpendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptSpendData} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#484f58', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#8b949e', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" fill="#00e676" radius={[0, 6, 6, 0]} name="$ Spend" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="No data" />}
          </motion.div>

          {/* Projected Annual Spend */}
          <motion.div style={s.projectionCard} variants={fadeInUp} custom={20}>
            <div style={s.projLabel}>Projected Annual Spend</div>
            <div style={s.projValue}>
              ${projectedAnnual.toLocaleString()}
            </div>
            <div style={s.projSub}>
              Based on {spendTrendData.length} month{spendTrendData.length !== 1 ? 's' : ''} of data
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#00d4ff', fontSize: 12 }}>
              <TrendingUp size={14} />
              <span>Avg ${spendTrendData.length > 0 ? Math.round(projectedAnnual / 12).toLocaleString() : 0}/month</span>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Section 6: Inventory Health ──────────────────── */}
        <motion.div variants={fadeInUp} custom={21}>
          <div style={s.sectionTitle}>
            <span style={s.sectionIcon('#ffab00')}><ShieldCheck size={16} color="#ffab00" /></span>
            Inventory Health by Category
          </div>
        </motion.div>
        <motion.div style={{ ...s.chartCard, marginBottom: 32 }} variants={fadeInUp} custom={22}>
          {categoryHealth.length > 0 ? (
            <div style={s.healthRow}>
              {categoryHealth.map((cat) => (
                <div key={cat.name} style={s.healthItem}>
                  <span style={s.healthLabel}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: cat.catColor, marginRight: 8 }} />
                    {cat.name}
                  </span>
                  <div style={s.healthTrack}>
                    <motion.div
                      style={s.healthFill(cat.pct, cat.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, cat.pct)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <span style={s.healthPct(cat.color)}>{cat.pct}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>No inventory data</div>
          )}
        </motion.div>

        {/* ── Section 7: Quick Actions + Feed ─────────────── */}
        <motion.div variants={fadeInUp} custom={23}>
          <div style={s.sectionTitle}>Quick Actions</div>
        </motion.div>
        <motion.div style={s.actionsRow} variants={stagger}>
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                style={s.actionBtn(action.color)}
                variants={fadeInUp}
                custom={24 + i}
                whileHover={{ scale: 1.04, boxShadow: `0 0 24px ${action.color}35` }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(action.path)}
              >
                <Icon size={20} />
                {action.label}
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div variants={fadeInUp} custom={27}>
          <div style={s.sectionTitle}>Recent Activity</div>
        </motion.div>
        <motion.div style={s.feedList} variants={stagger}>
          {recentActivities.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)', fontSize: 13 }}>No recent activity</div>
          )}
          {recentActivities.map((item, i) => (
            <motion.div key={item.id} style={s.feedItem} variants={fadeInUp} custom={28 + i}>
              <Clock size={13} color="var(--text-dim)" />
              <span>{item.text}</span>
              <span style={s.feedTime}>{item.time}</span>
            </motion.div>
          ))}
        </motion.div>

        <style>{`@keyframes dspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    </PageWrapper>
  );
}

function EmptyChart({ text }) {
  return (
    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
      {text}
    </div>
  );
}
