import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle,
  DollarSign,
  Clock,
  ShoppingCart,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  Check,
  Search,
  Filter as FilterIcon,
  Calendar,
  Pencil,
  Save,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, subMonths, startOfYear, endOfYear, startOfMonth } from 'date-fns';
import PageWrapper from '../components/Layout/PageWrapper';
import { useSharePointList } from '../hooks/useSharePointList';
import { createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, getVendorChoices, addVendorChoice } from '../services/graphApi';

const statusColor = {
  Ordered: '#39C0E0',
  Shipped: '#FEA614',
  Received: '#31D3AE',
  Delegated: '#7C76B8',
  Cancelled: '#E06B7A',
};

const FALLBACK_VENDORS = ['Amazon', 'Instacart', 'MCS', 'Denis', 'Walmart', 'Superstore', 'Dollarama', 'Ikea', 'Other'];
const deptChoices = ['Administration', 'Reception', 'Settlement', 'Language', 'IT', 'Finance', 'HR', 'Facilities', 'CELPIP', 'Kitchen'];

const vendorColor = {
  Amazon: '#ff9900', Instacart: '#43b02a', MCS: '#00d4ff', Denis: '#a855f7',
  Walmart: '#0071dc', Superstore: '#e1261c', Dollarama: '#ffd700', Ikea: '#ffda1a', Other: '#8b949e',
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

// ─── Form styles (shared pattern) ───
const f = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20,
  },
  modal: {
    background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
    borderRadius: 16, padding: 32, width: '100%', maxWidth: 540,
    maxHeight: '90vh', overflowY: 'auto', position: 'relative',
  },
  title: {
    fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '12px 16px', borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 14, minHeight: 48, outline: 'none', colorScheme: 'light', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '12px 16px', borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 14, minHeight: 70, outline: 'none', resize: 'vertical' },
  selectRow: { display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap' },
  addNewBtn: { padding: '0 14px', borderRadius: 10, border: '1px dashed #FEA61480', background: 'transparent', color: '#D98200', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', minHeight: 48 },
  group: { marginBottom: 20 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: (active, color = '#413C60') => ({
    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
    background: active ? color : 'var(--bg-surface)',
    color: active ? '#fff' : 'var(--text-muted)',
    borderWidth: 1, borderStyle: 'solid',
    borderColor: active ? color : 'var(--border-default)',
  }),
  submitBtn: (loading, success) => ({
    width: '100%', padding: 16, borderRadius: 10, border: 'none',
    fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
    minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
    background: loading ? '#8681A5' : success ? 'rgba(87,193,165,0.2)' : 'var(--brand-navy)',
    color: loading ? '#fff' : success ? '#3E9E85' : '#fff',
  }),
  error: { color: '#E05563', fontSize: 13, textAlign: 'center', marginTop: 8 },
};

const s = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' },
  newBtn: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', background: 'var(--brand-navy)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 'var(--text-sm)', cursor: 'pointer', minHeight: 48, border: 'none' },
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-8)' },
  summaryCard: { background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' },
  summaryIconWrap: (color) => ({ width: 44, height: 44, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: color, flexShrink: 0 }),
  summaryValue: { fontFamily: 'var(--font-head)', fontSize: '1.9rem', fontWeight: 700, color: 'var(--brand-ink)', lineHeight: 1, letterSpacing: '-0.5px' },
  summaryLabel: { fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', marginTop: 6 },
  tableWrap: { background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' },
  th: { textAlign: 'left', padding: 'var(--space-4) var(--space-5)', color: 'var(--text-muted)', fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--border-default)', whiteSpace: 'nowrap' },
  td: { padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle', color: 'var(--brand-ink)' },
  statusBadge: (color) => ({ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', borderRadius: 'var(--radius-full)', background: color, color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 700 }),
  cost: { fontWeight: 700, color: 'var(--brand-ink)', fontVariantNumeric: 'tabular-nums' },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)', color: 'var(--text-muted)' },
  errorWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)', color: '#E05563' },
  retryBtn: { padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', background: 'rgba(241,98,120,0.12)', border: '1px solid rgba(241,98,120,0.3)', color: '#E05563', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), 'MMM d, yyyy'); } catch { return dateStr; }
}

// ─── Filter presets ───
const TIME_PRESETS = [
  { key: 'all', label: 'All time' },
  { key: '30d', label: 'Last 30 days' },
  { key: '3m', label: 'Last 3 months' },
  { key: 'ytd', label: 'This Year (YTD)' },
  { key: '1y', label: 'Last year' },
];

function getDateRange(preset) {
  const now = new Date();
  switch (preset) {
    case '30d':
      return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
    case '3m':
      return { from: startOfDay(subMonths(now, 3)), to: endOfDay(now) };
    case 'ytd':
      return { from: startOfYear(now), to: endOfDay(now) };
    case '1y':
      return { from: startOfDay(subMonths(now, 12)), to: endOfDay(now) };
    default:
      return null;
  }
}

const STATUSES = ['Ordered', 'Shipped', 'Received', 'Delegated', 'Cancelled'];

// ─── Filter card styles ───
const ff = {
  filterCard: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
    marginBottom: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  searchWrap: { position: 'relative', width: '100%' },
  searchIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' },
  searchInput: {
    width: '100%',
    padding: '12px 14px 12px 44px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  chipsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  chipsLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  chip: (active) => ({
    padding: '7px 14px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid',
    borderColor: active ? 'var(--brand-navy)' : 'var(--border-default)',
    background: active ? 'var(--brand-navy)' : 'var(--bg-card)',
    color: active ? '#fff' : 'var(--text-muted)',
    transition: 'all 0.15s',
  }),
  dropdownsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 'var(--space-3)',
  },
  dropdownWrap: { display: 'flex', flexDirection: 'column', gap: 4 },
  dropdownLabel: { fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 },
  dropdown: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    cursor: 'pointer',
    colorScheme: 'light',
    minHeight: 40,
  },
  activeFilterNote: {
    fontSize: 12,
    color: 'var(--text-dim)',
    fontStyle: 'italic',
    marginLeft: 8,
  },
};

export default function PurchaseOrders() {
  const { data: rawData, loading, error, refresh } = useSharePointList('purchaseOrders');

  // ── Dynamic vendor list (synced with Inventory) ──
  const [vendors, setVendors] = useState(FALLBACK_VENDORS);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [addingVendor, setAddingVendor] = useState(false);
  const [addVendorError, setAddVendorError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const v = await getVendorChoices();
        if (!cancelled && v.length > 0) setVendors(v);
      } catch (err) {
        console.warn('Could not load vendor choices — using fallback:', err.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleAddNewVendor = async () => {
    const name = newVendorName.trim();
    if (!name) { setAddVendorError('Vendor name cannot be empty'); return; }
    if (vendors.some((v) => v.toLowerCase() === name.toLowerCase())) { setAddVendorError('That vendor already exists'); return; }
    setAddingVendor(true);
    setAddVendorError(null);
    try {
      const updated = await addVendorChoice(name);
      setVendors(updated);
      setPoVendor(name);
      setShowAddVendor(false);
      setNewVendorName('');
    } catch (err) {
      setAddVendorError(err.message || 'Failed to add vendor');
    } finally {
      setAddingVendor(false);
    }
  };

  // ── Form state ──
  const [showForm, setShowForm] = useState(false);
  const [poTitle, setPoTitle] = useState('');
  const [poItem, setPoItem] = useState('');
  const [poQty, setPoQty] = useState('');
  const [poVendor, setPoVendor] = useState('');
  const [poOtherVendor, setPoOtherVendor] = useState('');
  const [poDept, setPoDept] = useState('');
  const [poCost, setPoCost] = useState('');
  const [poDelivery, setPoDelivery] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const resetForm = () => {
    setPoTitle(''); setPoItem(''); setPoQty(''); setPoVendor('');
    setPoOtherVendor(''); setPoDept(''); setPoCost(''); setPoDelivery(''); setPoNotes('');
  };

  const handleSubmit = async () => {
    if (!poTitle || !poItem || !poQty || !poVendor || !poDept || !poCost) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createPurchaseOrder({
        Title: poTitle,
        ItemOrdered: poItem,
        Quantity: parseInt(poQty, 10),
        Vendor: poVendor,
        OtherVendor: poVendor === 'Other' ? poOtherVendor : undefined,
        ForDepartment: poDept,
        Cost: parseFloat(poCost),
        OrderStatus: 'Ordered',
        DateOrdered: new Date().toISOString(),
        ExpectedDelivery: poDelivery || undefined,
        Notes: poNotes || undefined,
      });
      setSubmitSuccess(true);
      resetForm();
      refresh();
      setTimeout(() => { setSubmitSuccess(false); setShowForm(false); }, 1200);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filter state ──
  const [search, setSearch] = useState('');
  const [timePreset, setTimePreset] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  const orders = useMemo(() => rawData.map((item) => ({
    id: item.id,
    title: item.fields?.Title || 'Untitled',
    item: item.fields?.ItemOrdered || '—',
    vendor: item.fields?.Vendor || '—',
    otherVendor: item.fields?.OtherVendor || '',
    department: item.fields?.ForDepartment || '—',
    status: item.fields?.OrderStatus || 'Ordered',
    cost: item.fields?.Cost ?? 0,
    quantity: item.fields?.Quantity ?? '',
    rawDate: item.fields?.DateOrdered || item.createdDateTime || null,
    rawExpectedDelivery: item.fields?.ExpectedDelivery || null,
    dateOrdered: formatDate(item.fields?.DateOrdered),
    expectedDelivery: formatDate(item.fields?.ExpectedDelivery),
    notes: item.fields?.Notes || '',
  })), [rawData]);

  // ── Edit Order state ──
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSaveSuccess, setEditSaveSuccess] = useState(false);
  const [editSaveError, setEditSaveError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingOrder, setDeletingOrder] = useState(false);

  const toLocalDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    } catch { return ''; }
  };

  const handleOpenEdit = (order) => {
    setEditingOrder(order);
    setEditForm({
      Title: order.title,
      ItemOrdered: order.item !== '—' ? order.item : '',
      Quantity: order.quantity,
      Vendor: order.vendor !== '—' ? order.vendor : '',
      OtherVendor: order.otherVendor || '',
      ForDepartment: order.department !== '—' ? order.department : '',
      Cost: order.cost,
      OrderStatus: order.status,
      ExpectedDelivery: toLocalDate(order.rawExpectedDelivery),
      Notes: order.notes,
    });
    setEditSaveError(null);
    setEditSaveSuccess(false);
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  const handleCloseEdit = () => {
    if (savingEdit || deletingOrder) return;
    setEditingOrder(null);
    setEditForm(null);
    setShowDeleteConfirm(false);
  };

  const updateEditField = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault?.();
    if (savingEdit || !editForm) return;
    if (!editForm.Title?.trim() || !editForm.ItemOrdered?.trim() || !editForm.Vendor || !editForm.ForDepartment || editForm.Cost === '' || editForm.Quantity === '') {
      setEditSaveError('Please fill in all required fields');
      return;
    }
    setSavingEdit(true);
    setEditSaveError(null);
    try {
      const payload = {
        Title: editForm.Title.trim(),
        ItemOrdered: editForm.ItemOrdered.trim(),
        Quantity: parseInt(editForm.Quantity, 10),
        Vendor: editForm.Vendor,
        OtherVendor: editForm.Vendor === 'Other' ? (editForm.OtherVendor || null) : null,
        ForDepartment: editForm.ForDepartment,
        Cost: parseFloat(editForm.Cost),
        OrderStatus: editForm.OrderStatus,
        ExpectedDelivery: editForm.ExpectedDelivery || null,
        Notes: editForm.Notes || null,
      };
      await updatePurchaseOrder(editingOrder.id, payload);
      setEditSaveSuccess(true);
      refresh();
      setTimeout(() => {
        setEditingOrder(null);
        setEditForm(null);
        setEditSaveSuccess(false);
      }, 1000);
    } catch (err) {
      setEditSaveError(err.message || 'Failed to save changes');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (deletingOrder || !editingOrder) return;
    if (deleteConfirmText.trim() !== editingOrder.title.trim()) {
      setEditSaveError(`Type the order title exactly: "${editingOrder.title}"`);
      return;
    }
    setDeletingOrder(true);
    setEditSaveError(null);
    try {
      await deletePurchaseOrder(editingOrder.id);
      refresh();
      setEditingOrder(null);
      setEditForm(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      setEditSaveError(err.message || 'Failed to delete order');
    } finally {
      setDeletingOrder(false);
    }
  };

  // Quick status change directly from the row (without opening full modal)
  const handleQuickStatusChange = async (orderId, newStatus) => {
    try {
      await updatePurchaseOrder(orderId, { OrderStatus: newStatus });
      refresh();
    } catch (err) {
      console.error('Quick status update failed:', err);
      alert('Failed to update status: ' + err.message);
    }
  };

  // ── Apply filters ──
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const range = getDateRange(timePreset);
    return orders.filter((o) => {
      // Search (Title + Item + Vendor)
      if (q && !(
        o.title.toLowerCase().includes(q) ||
        o.item.toLowerCase().includes(q) ||
        o.vendor.toLowerCase().includes(q)
      )) return false;
      // Time
      if (range && o.rawDate) {
        const d = new Date(o.rawDate);
        if (d < range.from || d > range.to) return false;
      } else if (range && !o.rawDate) {
        return false;
      }
      // Status
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      // Vendor
      if (vendorFilter !== 'all' && o.vendor !== vendorFilter) return false;
      // Department
      if (deptFilter !== 'all' && o.department !== deptFilter) return false;
      return true;
    });
  }, [orders, search, timePreset, statusFilter, vendorFilter, deptFilter]);

  const totalSpend = filteredOrders.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.cost || 0), 0);
  const pendingCount = filteredOrders.filter((o) => o.status === 'Ordered' || o.status === 'Shipped').length;

  const hasActiveFilter = search || timePreset !== 'all' || statusFilter !== 'all' || vendorFilter !== 'all' || deptFilter !== 'all';

  const summaryCards = [
    { label: hasActiveFilter ? 'Matching Orders' : 'Total Orders', value: filteredOrders.length, icon: ShoppingCart, color: '#413C60' },
    { label: hasActiveFilter ? 'Filtered Spend' : 'Total Spend', value: `$${totalSpend.toFixed(2)}`, icon: DollarSign, color: '#31D3AE' },
    { label: 'Pending', value: pendingCount, icon: Clock, color: '#FEA614' },
  ];

  const clearFilters = () => {
    setSearch(''); setTimePreset('all'); setStatusFilter('all'); setVendorFilter('all'); setDeptFilter('all');
  };

  if (loading && rawData.length === 0) {
    return (
      <PageWrapper title="Purchase Orders">
        <div style={s.loadingWrap}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading purchase orders...</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </PageWrapper>
    );
  }

  if (error && rawData.length === 0) {
    return (
      <PageWrapper title="Purchase Orders">
        <div style={s.errorWrap}>
          <AlertCircle size={32} />
          <span>Failed to load purchase orders</span>
          <span style={{ fontSize: 'var(--text-xs)', maxWidth: 400, textAlign: 'center', opacity: 0.7 }}>{error.message}</span>
          <button style={s.retryBtn} onClick={refresh}><RefreshCw size={14} /> Retry</button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Purchase Orders">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        {/* Header */}
        <motion.div style={s.header} variants={fadeInUp} custom={0}>
          <motion.button style={s.newBtn}
            whileHover={{ scale: 1.03, boxShadow: '0 6px 18px rgba(254,166,20,0.35)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowForm(true)}
          >
            <PlusCircle size={18} /> New Order
          </motion.button>
        </motion.div>

        {/* Summary Cards */}
        <motion.div style={s.summaryRow} variants={stagger}>
          {summaryCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} style={s.summaryCard} variants={fadeInUp} custom={1 + i}
                whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}>
                <div style={s.summaryIconWrap(card.color)}><Icon size={22} color="#fff" /></div>
                <div>
                  <div style={s.summaryValue}>{card.value}</div>
                  <div style={s.summaryLabel}>{card.label}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Filter Card ── */}
        <motion.div style={ff.filterCard} variants={fadeInUp} custom={4}>
          {/* Search */}
          <div style={ff.searchWrap}>
            <Search size={16} style={ff.searchIcon} />
            <input
              style={ff.searchInput}
              placeholder="Search by title, item, or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Time preset chips */}
          <div style={ff.chipsRow}>
            <span style={ff.chipsLabel}><Calendar size={11} /> Period:</span>
            {TIME_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                style={ff.chip(timePreset === p.key)}
                onClick={() => setTimePreset(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Dropdowns row */}
          <div style={ff.dropdownsRow}>
            <div style={ff.dropdownWrap}>
              <span style={ff.dropdownLabel}>Status</span>
              <select style={ff.dropdown} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
            <div style={ff.dropdownWrap}>
              <span style={ff.dropdownLabel}>Vendor</span>
              <select style={ff.dropdown} value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
                <option value="all">All vendors</option>
                {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div style={ff.dropdownWrap}>
              <span style={ff.dropdownLabel}>Department</span>
              <select style={ff.dropdown} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                <option value="all">All departments</option>
                {deptChoices.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {hasActiveFilter && (
              <div style={ff.dropdownWrap}>
                <span style={ff.dropdownLabel}>&nbsp;</span>
                <button
                  type="button"
                  style={{ ...ff.dropdown, cursor: 'pointer', color: '#ff3d5a', borderColor: 'rgba(255,61,90,0.3)', background: 'rgba(255,61,90,0.08)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={clearFilters}
                >
                  <X size={14} /> Clear filters
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div style={s.tableWrap} variants={fadeInUp} custom={5}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Order Title</th>
                <th style={s.th}>Item</th>
                <th style={s.th}>Vendor</th>
                <th style={s.th}>Dept</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Cost</th>
                <th style={s.th}>Date Ordered</th>
                <th style={s.th}>Expected Delivery</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ ...s.td, textAlign: 'center', color: 'var(--text-dim)', padding: 'var(--space-8)' }}>
                    {orders.length === 0
                      ? 'No purchase orders found.'
                      : hasActiveFilter
                      ? 'No orders match your filters. Try clearing them.'
                      : 'No orders.'}
                  </td>
                </tr>
              )}
              {filteredOrders.map((order) => (
                <motion.tr
                  key={order.id}
                  style={{ cursor: 'pointer' }}
                  whileHover={{ backgroundColor: 'rgba(64,58,96,0.04)' }}
                  transition={{ duration: 0.15 }}
                  onClick={() => handleOpenEdit(order)}
                  title="Click to edit this order"
                >
                  <td style={{ ...s.td, fontWeight: 600, color: 'var(--text-primary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {order.title}
                      <Pencil size={11} color="var(--text-dim)" style={{ opacity: 0.4 }} />
                    </span>
                  </td>
                  <td style={s.td}>{order.item}</td>
                  <td style={s.td}>{order.vendor}</td>
                  <td style={{ ...s.td, color: 'var(--text-muted)' }}>{order.department}</td>
                  <td style={s.td}><span style={s.statusBadge(statusColor[order.status] || '#8792A0')}>{order.status}</span></td>
                  <td style={{ ...s.td, ...s.cost }}>${(order.cost || 0).toFixed(2)}</td>
                  <td style={{ ...s.td, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{order.dateOrdered}</td>
                  <td style={{ ...s.td, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{order.expectedDelivery}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </motion.div>

      {/* ── New Order Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div style={f.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div style={f.modal} initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
              <div style={f.title}>
                New Purchase Order
                <button style={f.closeBtn} onClick={() => setShowForm(false)}><X size={20} /></button>
              </div>

              <div style={f.group}>
                <label style={f.label}>Order Title *</label>
                <input style={f.input} placeholder="e.g. Paper order - Amazon" value={poTitle} onChange={(e) => setPoTitle(e.target.value)} />
              </div>

              <div style={f.row2}>
                <div>
                  <label style={f.label}>Item Ordered *</label>
                  <input style={f.input} placeholder="e.g. Paper 8x11 (10 reams)" value={poItem} onChange={(e) => setPoItem(e.target.value)} />
                </div>
                <div>
                  <label style={f.label}>Quantity *</label>
                  <input style={f.input} type="number" min="1" placeholder="0" value={poQty} onChange={(e) => setPoQty(e.target.value)} />
                </div>
              </div>

              <div style={f.group}>
                <label style={f.label}>Vendor *</label>
                <div style={f.selectRow}>
                  <select style={{ ...f.input, flex: 1, minWidth: 180 }}
                    value={poVendor}
                    onChange={(e) => setPoVendor(e.target.value)}>
                    <option value="">Choose a vendor...</option>
                    {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                  {!showAddVendor && (
                    <button type="button" style={f.addNewBtn}
                      onClick={() => { setShowAddVendor(true); setAddVendorError(null); setNewVendorName(''); }}>
                      + New
                    </button>
                  )}
                </div>
                {showAddVendor && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      style={{ ...f.input, flex: 1, minWidth: 180, minHeight: 40 }}
                      placeholder="New vendor name..."
                      value={newVendorName}
                      onChange={(e) => setNewVendorName(e.target.value)}
                      autoFocus
                      disabled={addingVendor}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewVendor(); } }}
                    />
                    <button type="button"
                      style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#413C60', color: '#fff', fontWeight: 700, fontSize: 12, cursor: addingVendor ? 'not-allowed' : 'pointer' }}
                      onClick={handleAddNewVendor} disabled={addingVendor}>
                      {addingVendor ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
                    </button>
                    <button type="button"
                      style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                      onClick={() => { setShowAddVendor(false); setNewVendorName(''); setAddVendorError(null); }} disabled={addingVendor}>
                      <X size={12} />
                    </button>
                  </div>
                )}
                {addVendorError && showAddVendor && (
                  <div style={{ color: '#ff3d5a', fontSize: 12, marginTop: 6 }}>{addVendorError}</div>
                )}
              </div>

              {poVendor === 'Other' && (
                <div style={f.group}>
                  <label style={f.label}>Specify Vendor</label>
                  <input style={f.input} placeholder="Vendor name" value={poOtherVendor} onChange={(e) => setPoOtherVendor(e.target.value)} />
                </div>
              )}

              <div style={f.group}>
                <label style={f.label}>Department *</label>
                <div style={f.chips}>
                  {deptChoices.map(d => (
                    <button key={d} style={f.chip(poDept === d)} onClick={() => setPoDept(d)}>{d}</button>
                  ))}
                </div>
              </div>

              <div style={f.row2}>
                <div>
                  <label style={f.label}>Total Cost ($) *</label>
                  <input style={f.input} type="number" min="0" step="0.01" placeholder="0.00" value={poCost} onChange={(e) => setPoCost(e.target.value)} />
                </div>
                <div>
                  <label style={f.label}>Expected Delivery</label>
                  <input style={f.input} type="date" value={poDelivery} onChange={(e) => setPoDelivery(e.target.value)} />
                </div>
              </div>

              <div style={f.group}>
                <label style={f.label}>Notes (optional)</label>
                <textarea style={f.textarea} placeholder="Additional details..." value={poNotes} onChange={(e) => setPoNotes(e.target.value)} />
              </div>

              {submitError && <div style={f.error}>{submitError}</div>}

              <button style={f.submitBtn(submitting, submitSuccess)} onClick={handleSubmit}
                disabled={submitting || !poTitle || !poItem || !poQty || !poVendor || !poDept || !poCost}>
                {submitting ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
                  : submitSuccess ? <><Check size={18} /> Created!</>
                  : 'Create Purchase Order'}
              </button>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Order Modal ── */}
      <AnimatePresence>
        {editingOrder && editForm && (
          <motion.div style={f.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && handleCloseEdit()}>
            <motion.div style={f.modal} initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
              <div style={f.title}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Pencil size={18} color="#FEA614" />
                  Edit Purchase Order
                </span>
                <button style={f.closeBtn} onClick={handleCloseEdit} disabled={savingEdit || deletingOrder}><X size={20} /></button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div style={f.group}>
                  <label style={f.label}>Order Title *</label>
                  <input style={f.input} value={editForm.Title} onChange={(e) => updateEditField('Title', e.target.value)} />
                </div>

                <div style={f.row2}>
                  <div>
                    <label style={f.label}>Item Ordered *</label>
                    <input style={f.input} value={editForm.ItemOrdered} onChange={(e) => updateEditField('ItemOrdered', e.target.value)} />
                  </div>
                  <div>
                    <label style={f.label}>Quantity *</label>
                    <input style={f.input} type="number" min="1" value={editForm.Quantity} onChange={(e) => updateEditField('Quantity', e.target.value)} />
                  </div>
                </div>

                <div style={f.group}>
                  <label style={f.label}>Status *</label>
                  <select style={f.input} value={editForm.OrderStatus} onChange={(e) => updateEditField('OrderStatus', e.target.value)}>
                    <option value="Ordered">Ordered</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Received">Received</option>
                    <option value="Delegated">Delegated</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div style={f.group}>
                  <label style={f.label}>Vendor *</label>
                  <div style={f.selectRow}>
                    <select style={{ ...f.input, flex: 1, minWidth: 180 }} value={editForm.Vendor} onChange={(e) => updateEditField('Vendor', e.target.value)}>
                      <option value="">Choose a vendor...</option>
                      {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>

                {editForm.Vendor === 'Other' && (
                  <div style={f.group}>
                    <label style={f.label}>Specify Vendor</label>
                    <input style={f.input} placeholder="Vendor name" value={editForm.OtherVendor} onChange={(e) => updateEditField('OtherVendor', e.target.value)} />
                  </div>
                )}

                <div style={f.group}>
                  <label style={f.label}>Department *</label>
                  <select style={f.input} value={editForm.ForDepartment} onChange={(e) => updateEditField('ForDepartment', e.target.value)}>
                    <option value="">Choose a department...</option>
                    {deptChoices.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div style={f.row2}>
                  <div>
                    <label style={f.label}>Total Cost ($) *</label>
                    <input style={f.input} type="number" min="0" step="0.01" value={editForm.Cost} onChange={(e) => updateEditField('Cost', e.target.value)} />
                  </div>
                  <div>
                    <label style={f.label}>Expected Delivery</label>
                    <input style={f.input} type="date" value={editForm.ExpectedDelivery} onChange={(e) => updateEditField('ExpectedDelivery', e.target.value)} />
                  </div>
                </div>

                <div style={f.group}>
                  <label style={f.label}>Notes (optional)</label>
                  <textarea style={f.textarea} value={editForm.Notes} onChange={(e) => updateEditField('Notes', e.target.value)} />
                </div>

                {editSaveError && <div style={f.error}>{editSaveError}</div>}

                <button type="submit" style={f.submitBtn(savingEdit, editSaveSuccess)} disabled={savingEdit || deletingOrder}>
                  {savingEdit ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                    : editSaveSuccess ? <><Check size={18} /> Saved!</>
                    : <><Save size={18} /> Save Changes</>}
                </button>

                {/* Delete section */}
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--glass-border)' }}>
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(255,61,90,0.3)', background: 'rgba(255,61,90,0.08)', color: '#ff3d5a', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      onClick={() => setShowDeleteConfirm(true)} disabled={savingEdit}>
                      <Trash2 size={14} /> Delete This Order
                    </button>
                  ) : (
                    <div style={{ background: 'rgba(255,61,90,0.08)', border: '1px solid rgba(255,61,90,0.3)', borderRadius: 10, padding: 14 }}>
                      <div style={{ color: '#ff3d5a', fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={14} /> This cannot be undone
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                        Type the order title <strong style={{ color: 'var(--text-primary)' }}>{editingOrder.title}</strong> below to confirm deletion:
                      </div>
                      <input style={{ ...f.input, marginBottom: 10 }} placeholder={editingOrder.title}
                        value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} disabled={deletingOrder} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button"
                          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setEditSaveError(null); }}
                          disabled={deletingOrder}>
                          Cancel
                        </button>
                        <button type="button"
                          style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#ff3d5a', color: '#fff', fontWeight: 700, fontSize: 13, cursor: deletingOrder ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                          onClick={handleDeleteOrder}
                          disabled={deletingOrder || deleteConfirmText.trim() !== editingOrder.title.trim()}>
                          {deletingOrder ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Deleting...</> : <><Trash2 size={14} /> Delete Permanently</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
