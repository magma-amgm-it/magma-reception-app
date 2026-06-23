import { useMemo, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Activity,
  TrendingUp,
  ShieldCheck,
  Inbox,
  Filter,
  CheckCircle2,
  Clock,
  Bug,
  Sparkles,
  Palette,
  HelpCircle,
  MoreHorizontal,
  PackageSearch,
  Mail,
  ShoppingCart,
  ClipboardList,
  Warehouse,
  LayoutDashboard,
  ExternalLink,
  ChevronRight,
  X,
  Trash2,
  Save,
  Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, isToday, parseISO, subDays, isAfter } from 'date-fns';
import PageWrapper from '../components/Layout/PageWrapper';
import { useSharePointList } from '../hooks/useSharePointList';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../services/admin';
import { updateFeedback, deleteFeedback } from '../services/graphApi';
import { AnimatePresence } from 'framer-motion';

// ─── Helpers ───────────────────────────────────────
const parseDate = (val) => {
  if (!val) return null;
  try {
    return typeof val === 'string' ? parseISO(val) : new Date(val);
  } catch {
    return null;
  }
};

const getItemUser = (item) => {
  const cb = item?.createdBy?.user;
  return {
    name: cb?.displayName || 'Unknown',
    email: cb?.email || cb?.userPrincipalName || '',
  };
};

const FEEDBACK_TYPE_META = {
  Bug: { icon: Bug, color: '#ff3d5a' },
  'Feature Request': { icon: Sparkles, color: '#00d4ff' },
  'UI Improvement': { icon: Palette, color: '#a855f7' },
  Question: { icon: HelpCircle, color: '#ffab00' },
  Other: { icon: MoreHorizontal, color: '#8b949e' },
};

const STATUS_COLORS = {
  New: '#ff3d5a',
  'In Review': '#ffab00',
  'In Progress': '#a855f7',
  Done: '#00e676',
  "Won't Do": '#8b949e',
};

const LIST_META = {
  supplyRequests: { label: 'Supply Request', icon: PackageSearch, color: '#00d4ff' },
  clientLog: { label: 'Client Visit', icon: Users, color: '#a855f7' },
  inventory: { label: 'Inventory', icon: Warehouse, color: '#00e676' },
  purchaseOrders: { label: 'Purchase Order', icon: ShoppingCart, color: '#ffab00' },
  mailPickups: { label: 'Mail Pickup', icon: Mail, color: '#26c6da' },
  appFeedback: { label: 'Feedback', icon: MessageSquare, color: '#ff006e' },
};

// ─── Glass card style ─────────────────────────────
const cardStyle = {
  background: 'rgba(22, 27, 34, 0.6)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding: 20,
};

// ─── Stat card ─────────────────────────────────────
function StatCard({ icon: Icon, label, value, sublabel, color = '#00d4ff', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        ...cardStyle,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}15`,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#e6edf3' }}>{value}</div>
      {sublabel && (
        <div style={{ fontSize: 12, color: '#8b949e' }}>{sublabel}</div>
      )}
    </motion.div>
  );
}

// ─── Sub-component: Feedback detail modal ─────────
function FeedbackDetailModal({ item, onClose, onChanged }) {
  const f = item.fields || {};
  const [status, setStatus] = useState(f.Status || 'New');
  const [adminNotes, setAdminNotes] = useState(f.AdminNotes || '');
  const [implementedCommit, setImplementedCommit] = useState(f.ImplementedCommit || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const user = getItemUser(item);
  const created = parseDate(item.createdDateTime);
  const type = f.FeedbackType || 'Other';
  const meta = FEEDBACK_TYPE_META[type] || FEEDBACK_TYPE_META.Other;
  const Icon = meta.icon;

  const dirty = status !== (f.Status || 'New')
    || adminNotes !== (f.AdminNotes || '')
    || implementedCommit !== (f.ImplementedCommit || '');

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      await updateFeedback(item.id, {
        Status: status,
        AdminNotes: adminNotes,
        ImplementedCommit: implementedCommit,
      });
      await onChanged();
      onClose();
    } catch (err) {
      console.error('Save failed', err);
      setError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true); setError(null);
    try {
      await deleteFeedback(item.id);
      await onChanged();
      onClose();
    } catch (err) {
      console.error('Delete failed', err);
      setError(err.message || 'Delete failed.');
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(620px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          background: 'rgba(22, 27, 34, 0.96)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: 28,
          color: '#e6edf3',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${meta.color}20`, border: `1px solid ${meta.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={20} color={meta.color} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: meta.color, fontWeight: 700, letterSpacing: 0.5 }}>
              {type.toUpperCase()} · {f.Severity || 'Medium'} severity
            </div>
            <div style={{ fontSize: 13, color: '#8b949e' }}>
              From <strong style={{ color: '#e6edf3' }}>{user.name}</strong> on {f.Page || '—'}
              {created && <> · {format(created, 'MMM d, yyyy h:mm a')}</>}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
            color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={18} /></button>
        </div>

        {/* Description */}
        <label style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>
          Description
        </label>
        <div style={{
          padding: 14, borderRadius: 10, marginBottom: 18,
          background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)',
          fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap',
        }}>
          {f.Description || '(no description)'}
        </div>

        {/* Status */}
        <label style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>
          Status
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          {['New', 'In Review', 'In Progress', 'Done', "Won't Do"].map((s) => {
            const active = status === s;
            const c = STATUS_COLORS[s] || '#8b949e';
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: active ? `${c}25` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? `${c}60` : 'rgba(255,255,255,0.08)'}`,
                  color: active ? c : '#e6edf3',
                }}
              >{s}</button>
            );
          })}
        </div>

        {/* Admin notes */}
        <label style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>
          Admin notes (only you see this)
        </label>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={3}
          placeholder="Triage notes, plan, follow-ups…"
          style={{
            width: '100%', padding: 12, borderRadius: 10, boxSizing: 'border-box',
            background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#e6edf3', fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
            outline: 'none', marginBottom: 14,
          }}
        />

        {/* Implemented commit */}
        <label style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>
          Implemented commit (optional)
        </label>
        <input
          type="text"
          value={implementedCommit}
          onChange={(e) => setImplementedCommit(e.target.value)}
          placeholder="e.g. ab3f576"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box',
            background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#e6edf3', fontSize: 13, fontFamily: 'monospace',
            outline: 'none', marginBottom: 18,
          }}
        />

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 14,
            background: 'rgba(255,61,90,0.1)', border: '1px solid rgba(255,61,90,0.2)',
            color: '#ff3d5a', fontSize: 13,
          }}>{error}</div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,61,90,0.25)',
                color: '#ff3d5a', fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Trash2 size={13} /> Delete
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#ff3d5a' }}>Sure?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(255,61,90,0.2)', border: '1px solid rgba(255,61,90,0.4)',
                  color: '#ff3d5a', fontSize: 12, fontWeight: 600,
                }}
              >{deleting ? 'Deleting…' : 'Yes, delete'}</button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e6edf3', fontSize: 12,
                }}
              >Cancel</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                color: '#e6edf3', fontSize: 13, fontWeight: 500,
              }}
            >Close</button>
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              style={{
                padding: '10px 18px', borderRadius: 10,
                cursor: !dirty || saving ? 'not-allowed' : 'pointer',
                background: !dirty || saving ? 'rgba(0,212,255,0.15)' : 'linear-gradient(135deg, #00d4ff, #a855f7)',
                border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><Save size={13} /> Save changes</>}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Sub-component: All users modal ───────────────
function AllUsersModal({ users, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(540px, 100%)',
          maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          background: 'rgba(22, 27, 34, 0.96)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: 24,
          color: '#e6edf3',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={18} color="#00d4ff" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>All users (last 30 days)</h3>
            <span style={{ fontSize: 12, color: '#8b949e' }}>({users.length})</span>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
            color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={18} /></button>
        </div>
        {users.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#8b949e', fontSize: 13 }}>
            No user activity in the last 30 days.
          </div>
        ) : (
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
            {users.map((u, i) => {
              const max = users[0].count;
              const pct = (u.count / max) * 100;
              return (
                <div key={u.email || `u-${i}`} style={{
                  display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'center',
                  padding: '8px 4px',
                }}>
                  <span style={{ fontSize: 11, color: '#8b949e', fontWeight: 600 }}>#{i + 1}</span>
                  <div>
                    <div style={{ fontSize: 13, color: '#e6edf3', marginBottom: 4 }}>{u.name}</div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #00d4ff, #a855f7)' }} />
                    </div>
                    {u.email && (
                      <div style={{ fontSize: 10, color: '#484f58', marginTop: 4, fontFamily: 'monospace' }}>{u.email}</div>
                    )}
                  </div>
                  <span style={{ fontSize: 14, color: '#e6edf3', fontWeight: 600 }}>{u.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Sub-component: Feedback inbox ─────────────────
function FeedbackInbox({ feedback, onRefresh, onCardClick }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [updating, setUpdating] = useState(null);

  const filtered = useMemo(() => {
    const items = (feedback || []).slice().sort((a, b) => {
      const da = parseDate(a.createdDateTime)?.getTime() || 0;
      const db = parseDate(b.createdDateTime)?.getTime() || 0;
      return db - da;
    });
    if (statusFilter === 'All') return items;
    return items.filter((it) => (it.fields?.Status || 'New') === statusFilter);
  }, [feedback, statusFilter]);

  const cycleStatus = async (item) => {
    const order = ['New', 'In Review', 'In Progress', 'Done'];
    const cur = item.fields?.Status || 'New';
    const next = order[(order.indexOf(cur) + 1) % order.length];
    setUpdating(item.id);
    try {
      await updateFeedback(item.id, { Status: next });
      await onRefresh();
    } catch (err) {
      console.error('Could not update feedback status:', err);
      alert(`Failed to update: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const statuses = ['All', 'New', 'In Review', 'In Progress', 'Done', "Won't Do"];

  return (
    <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Inbox size={18} color="#00d4ff" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Feedback Inbox</h3>
          <span style={{ fontSize: 12, color: '#8b949e' }}>({filtered.length})</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {statuses.map((s) => {
            const active = statusFilter === s;
            const c = STATUS_COLORS[s] || '#8b949e';
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '5px 11px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  background: active ? `${c}25` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? `${c}50` : 'rgba(255,255,255,0.08)'}`,
                  color: active ? c : '#e6edf3',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#8b949e', fontSize: 13 }}>
          No feedback in this view yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((item) => {
            const f = item.fields || {};
            const type = f.FeedbackType || 'Other';
            const meta = FEEDBACK_TYPE_META[type] || FEEDBACK_TYPE_META.Other;
            const Icon = meta.icon;
            const status = f.Status || 'New';
            const statusColor = STATUS_COLORS[status] || '#8b949e';
            const user = getItemUser(item);
            const created = parseDate(item.createdDateTime);

            return (
              <div
                key={item.id}
                onClick={() => onCardClick && onCardClick(item)}
                title="Click to manage"
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: 12,
                  alignItems: 'start',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,212,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${meta.color}15`,
                  border: `1px solid ${meta.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={15} color={meta.color} />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: meta.color, fontWeight: 600 }}>{type}</span>
                    <span style={{ fontSize: 11, color: '#484f58' }}>·</span>
                    <span style={{ fontSize: 11, color: '#8b949e' }}>{f.Page || '—'}</span>
                    <span style={{ fontSize: 11, color: '#484f58' }}>·</span>
                    <span style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                      background: f.Severity === 'High' ? '#ff3d5a20' : f.Severity === 'Medium' ? '#ffab0020' : '#00e67620',
                      color: f.Severity === 'High' ? '#ff3d5a' : f.Severity === 'Medium' ? '#ffab00' : '#00e676',
                    }}>{f.Severity || 'Medium'}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#e6edf3', lineHeight: 1.4, marginBottom: 4 }}>
                    {f.Description || '(no description)'}
                  </div>
                  <div style={{ fontSize: 11, color: '#8b949e' }}>
                    {user.name} · {created ? format(created, 'MMM d, h:mm a') : '—'}
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); cycleStatus(item); }}
                  disabled={updating === item.id}
                  title="Click to cycle status (or click anywhere on row to manage)"
                  style={{
                    padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: `${statusColor}25`,
                    border: `1px solid ${statusColor}50`,
                    color: statusColor,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {updating === item.id ? '…' : status}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: Live activity feed ─────────────
function ActivityFeed({ items }) {
  const navigate = useNavigate();
  const recent = useMemo(() => {
    return (items || []).slice(0, 30);
  }, [items]);

  return (
    <div style={{ ...cardStyle }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Activity size={18} color="#00e676" />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Live Activity</h3>
        <span style={{ fontSize: 11, color: '#8b949e' }}>(last 30 events)</span>
      </div>
      {recent.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#8b949e', fontSize: 12 }}>
          No activity to show.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 460, overflowY: 'auto', paddingRight: 4 }}>
          {recent.map((evt, i) => {
            const meta = LIST_META[evt.listKey] || LIST_META.supplyRequests;
            const Icon = meta.icon;
            return (
              <div
                key={`${evt.id}-${i}`}
                style={{
                  display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center',
                  padding: '8px 10px', borderRadius: 8,
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: `${meta.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={13} color={meta.color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                    {' · '}
                    {evt.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#8b949e' }}>
                    {evt.userName} · {evt.when ? format(evt.when, 'MMM d, h:mm a') : '—'}
                  </div>
                </div>
                {evt.navigateTo && (
                  <button
                    onClick={() => navigate(evt.navigateTo)}
                    style={{
                      width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent',
                      color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Go to list"
                  >
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────
export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Fetch all SharePoint lists
  const supplyRequests = useSharePointList('supplyRequests');
  const clientLog = useSharePointList('clientLog');
  const inventory = useSharePointList('inventory');
  const purchaseOrders = useSharePointList('purchaseOrders');
  const mailPickups = useSharePointList('mailPickups');
  const feedback = useSharePointList('appFeedback');

  // Modals
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Gate: redirect non-admins to Dashboard
  if (!authLoading && user && !isAdmin(user.email)) {
    navigate('/', { replace: true });
    return null;
  }

  const allLists = [supplyRequests, clientLog, inventory, purchaseOrders, mailPickups, feedback];
  const stillLoading = allLists.some((l) => l.loading);

  // ─── Compute analytics ───
  const analytics = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const thirtyDaysAgo = subDays(now, 30);

    // Combined activity log from every list
    const allActivities = [];
    const pushFromList = (listKey, rows) => {
      rows.forEach((item) => {
        const created = parseDate(item.createdDateTime);
        if (!created) return;
        const u = getItemUser(item);
        const f = item.fields || {};
        const meta = LIST_META[listKey];
        let title = f.Title || f.ItemName || f.ClientName || `#${item.id}`;
        const navigateTo = {
          supplyRequests: '/requests',
          clientLog: '/clients',
          inventory: '/inventory',
          purchaseOrders: '/orders',
          mailPickups: '/mail',
          appFeedback: '/admin',
        }[listKey];
        allActivities.push({
          id: item.id,
          listKey,
          title: String(title).slice(0, 60),
          userName: u.name,
          userEmail: u.email,
          when: created,
          navigateTo,
        });
      });
    };

    pushFromList('supplyRequests', supplyRequests.data);
    pushFromList('clientLog', clientLog.data);
    pushFromList('inventory', inventory.data);
    pushFromList('purchaseOrders', purchaseOrders.data);
    pushFromList('mailPickups', mailPickups.data);
    pushFromList('appFeedback', feedback.data);

    allActivities.sort((a, b) => b.when.getTime() - a.when.getTime());

    // Actions today
    const actionsToday = allActivities.filter((a) => isToday(a.when)).length;

    // Active users last 7 days
    const usersIn7d = new Set();
    allActivities.forEach((a) => {
      if (isAfter(a.when, sevenDaysAgo) && a.userEmail) usersIn7d.add(a.userEmail);
    });

    // Top users last 30 days
    const userCounts = {};
    allActivities.forEach((a) => {
      if (isAfter(a.when, thirtyDaysAgo) && a.userEmail) {
        const key = a.userEmail;
        if (!userCounts[key]) userCounts[key] = { email: a.userEmail, name: a.userName, count: 0 };
        userCounts[key].count++;
      }
    });
    const allUsersSorted = Object.values(userCounts).sort((a, b) => b.count - a.count);
    const topUsers = allUsersSorted.slice(0, 10);

    // Activity by department (Supply Requests)
    const deptCounts = {};
    supplyRequests.data.forEach((item) => {
      const dept = item.fields?.Department || 'Unknown';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    const deptData = Object.entries(deptCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Supply Request funnel
    const funnelStatuses = ['New', 'Received', 'Pending Order', 'Ready to Pick Up', 'Completed'];
    const funnelData = funnelStatuses.map((status) => ({
      status,
      count: supplyRequests.data.filter((it) => (it.fields?.Status || 'New') === status).length,
    }));

    // Day-of-week × hour heatmap
    const heatmap = {};
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) heatmap[`${d}-${h}`] = 0;
    }
    allActivities.forEach((a) => {
      const d = a.when.getDay();
      const h = a.when.getHours();
      heatmap[`${d}-${h}`]++;
    });

    // Feedback stats
    const newFeedback = feedback.data.filter((f) => (f.fields?.Status || 'New') === 'New').length;
    const feedbackByType = {};
    feedback.data.forEach((f) => {
      const t = f.fields?.FeedbackType || 'Other';
      feedbackByType[t] = (feedbackByType[t] || 0) + 1;
    });

    return {
      allActivities,
      actionsToday,
      activeUsers7d: usersIn7d.size,
      topUsers,
      allUsers: allUsersSorted,
      deptData,
      funnelData,
      heatmap,
      newFeedback,
      totalFeedback: feedback.data.length,
      feedbackByType: Object.entries(feedbackByType).map(([name, value]) => ({ name, value })),
    };
  }, [supplyRequests.data, clientLog.data, inventory.data, purchaseOrders.data, mailPickups.data, feedback.data]);

  const refreshAll = () => Promise.all(allLists.map((l) => l.refresh()));

  // ─── Heatmap render ─
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxHeat = Math.max(1, ...Object.values(analytics.heatmap));
  const heatColor = (n) => {
    if (n === 0) return 'rgba(255,255,255,0.03)';
    const intensity = n / maxHeat;
    return `rgba(0, 212, 255, ${0.15 + intensity * 0.7})`;
  };

  return (
    <PageWrapper title="Admin Dashboard" onRefresh={refreshAll}>
      {/* Privacy header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', borderRadius: 12, marginBottom: 18,
          background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
        }}
      >
        <ShieldCheck size={16} color="#a855f7" />
        <span style={{ fontSize: 12, color: '#a855f7', fontWeight: 600 }}>
          ADMIN-ONLY
        </span>
        <span style={{ fontSize: 12, color: '#8b949e' }}>
          You're seeing data not visible to other staff. Logged in as {user?.email}.
        </span>
      </motion.div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14, marginBottom: 20,
      }}>
        <StatCard
          icon={Users}
          label="Active users (7d)"
          value={analytics.activeUsers7d}
          sublabel="Unique signed-in staff"
          color="#00d4ff"
          delay={0}
        />
        <StatCard
          icon={Activity}
          label="Actions today"
          value={analytics.actionsToday}
          sublabel="Across all lists"
          color="#00e676"
          delay={0.05}
        />
        <StatCard
          icon={MessageSquare}
          label="New feedback"
          value={analytics.newFeedback}
          sublabel={`${analytics.totalFeedback} total submitted`}
          color="#ff006e"
          delay={0.1}
        />
        <StatCard
          icon={TrendingUp}
          label="Top contributor"
          value={analytics.topUsers[0]?.name?.split(' ')[0] || '—'}
          sublabel={analytics.topUsers[0] ? `${analytics.topUsers[0].count} actions / 30d` : 'No activity yet'}
          color="#a855f7"
          delay={0.15}
        />
      </div>

      {/* Row: Top users + Dept breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Top Users */}
        <div style={{ ...cardStyle }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users size={18} color="#00d4ff" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Top Users (30d)</h3>
            </div>
            {analytics.allUsers.length > 10 && (
              <button
                onClick={() => setShowAllUsers(true)}
                style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
                  color: '#00d4ff',
                }}
              >
                View all {analytics.allUsers.length}
              </button>
            )}
          </div>
          {analytics.topUsers.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#8b949e', fontSize: 12 }}>
              No activity in the last 30 days.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {analytics.topUsers.map((u, i) => {
                const max = analytics.topUsers[0].count;
                const pct = (u.count / max) * 100;
                return (
                  <div key={u.email} style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#8b949e', fontWeight: 600 }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 13, color: '#e6edf3', marginBottom: 4 }}>{u.name}</div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #00d4ff, #a855f7)' }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: '#e6edf3', fontWeight: 600 }}>{u.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity by Department */}
        <div style={{ ...cardStyle }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <ClipboardList size={18} color="#a855f7" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Supply Requests by Dept</h3>
          </div>
          {analytics.deptData.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#8b949e', fontSize: 12 }}>
              No supply requests yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={analytics.deptData}
                  cx="50%" cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={false}
                  fontSize={11}
                >
                  {analytics.deptData.map((_, i) => (
                    <Cell key={i} fill={['#00d4ff', '#a855f7', '#00e676', '#ffab00', '#ff006e', '#26c6da'][i % 6]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row: Funnel + Feedback breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Funnel */}
        <div style={{ ...cardStyle }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <CheckCircle2 size={18} color="#00e676" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Supply Request Funnel</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.funnelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="status" tick={{ fill: '#8b949e', fontSize: 10 }} />
              <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8 }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {analytics.funnelData.map((entry, i) => (
                  <Cell key={i} fill={['#ff3d5a', '#ffab00', '#a855f7', '#26c6da', '#00e676'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feedback by Type */}
        <div style={{ ...cardStyle }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <MessageSquare size={18} color="#ff006e" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Feedback Breakdown</h3>
          </div>
          {analytics.feedbackByType.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#8b949e', fontSize: 13 }}>
              No feedback yet. Click the 💬 button to send the first one!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.feedbackByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#8b949e', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#8b949e', fontSize: 11 }} width={110} />
                <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {analytics.feedbackByType.map((entry, i) => (
                    <Cell key={i} fill={FEEDBACK_TYPE_META[entry.name]?.color || '#8b949e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Clock size={18} color="#ffab00" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Usage Heatmap (when staff are most active)</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(24, 1fr)', gap: 2, minWidth: 720 }}>
            <div />
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} style={{ fontSize: 9, color: '#484f58', textAlign: 'center' }}>{h}</div>
            ))}
            {dayLabels.map((day, d) => (
              <Fragment key={`row-${d}`}>
                <div style={{ fontSize: 11, color: '#8b949e', display: 'flex', alignItems: 'center' }}>{day}</div>
                {Array.from({ length: 24 }).map((_, h) => {
                  const v = analytics.heatmap[`${d}-${h}`] || 0;
                  return (
                    <div
                      key={`${d}-${h}`}
                      title={`${day} ${h}:00 — ${v} action${v !== 1 ? 's' : ''}`}
                      style={{
                        height: 22,
                        background: heatColor(v),
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.02)',
                      }}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed + Feedback Inbox */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 16 }}>
        <ActivityFeed items={analytics.allActivities} />
        <div style={{ ...cardStyle }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <LayoutDashboard size={18} color="#26c6da" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>External Analytics</h3>
          </div>
          <p style={{ fontSize: 12, color: '#8b949e', marginTop: 0, marginBottom: 14 }}>
            Session replays, heatmaps, rage clicks, and JS errors live on Microsoft Clarity.
          </p>
          <a
            href="https://clarity.microsoft.com/projects/view/xbnoq84hwi"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px', borderRadius: 10,
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.25)',
              color: '#00d4ff', textDecoration: 'none', fontSize: 13, fontWeight: 600,
              width: 'fit-content',
            }}
          >
            Open Clarity dashboard <ExternalLink size={14} />
          </a>
          <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>What Clarity shows:</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#e6edf3', fontSize: 12, lineHeight: 1.7 }}>
              <li>Where users click most (heatmaps per page)</li>
              <li>Recorded sessions you can play back</li>
              <li>Rage clicks (frustration signal)</li>
              <li>Dead clicks (broken buttons)</li>
              <li>JavaScript errors with stack traces</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feedback inbox spans full width */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <FeedbackInbox
          feedback={feedback.data}
          onRefresh={feedback.refresh}
          onCardClick={(item) => setSelectedFeedback(item)}
        />
      </div>

      {stillLoading && (
        <div style={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 100,
          padding: '8px 14px', borderRadius: 8,
          background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(255,255,255,0.08)',
          fontSize: 12, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Activity size={12} style={{ animation: 'spin 1s linear infinite' }} />
          Loading data…
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAllUsers && (
          <AllUsersModal users={analytics.allUsers} onClose={() => setShowAllUsers(false)} />
        )}
        {selectedFeedback && (
          <FeedbackDetailModal
            item={selectedFeedback}
            onClose={() => setSelectedFeedback(null)}
            onChanged={feedback.refresh}
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
