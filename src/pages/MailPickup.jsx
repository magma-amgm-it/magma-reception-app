import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Send,
  User,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
  X,
  Clock,
  CheckCircle2,
  Inbox,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import PageWrapper from '../components/Layout/PageWrapper';
import { useSharePointList } from '../hooks/useSharePointList';
import {
  createMailPickup,
  updateMailPickup,
  deleteMailPickup,
  searchOrgUsers,
} from '../services/graphApi';
import { useAuth } from '../hooks/useAuth';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

const statusColor = {
  Pending: '#ffab00',
  'Picked Up': '#00e676',
  Cancelled: '#8b949e',
};

const s = {
  hero: {
    background: 'linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(168,85,247,0.06) 100%)',
    border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    marginBottom: 'var(--space-6)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-5)',
  },
  heroIcon: {
    width: 56, height: 56, borderRadius: 14,
    background: 'rgba(0,212,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  heroTitle: { fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 },
  heroSubtitle: { fontSize: 'var(--text-sm)', color: 'var(--text-muted)' },
  formCard: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    marginBottom: 'var(--space-6)',
  },
  label: {
    display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  searchWrap: { position: 'relative' },
  searchIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' },
  input: {
    width: '100%', padding: '12px 14px 12px 44px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none', minHeight: 48,
    boxSizing: 'border-box', colorScheme: 'dark',
  },
  inputPlain: {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none', minHeight: 48,
    boxSizing: 'border-box', colorScheme: 'dark',
  },
  textarea: {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
    minHeight: 80, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
    background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
    borderRadius: 10, maxHeight: 280, overflowY: 'auto', zIndex: 50,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  dropdownItem: {
    padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
    borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s',
  },
  dropdownItemActive: {
    padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
    borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,212,255,0.1)',
  },
  avatarSmall: {
    width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,212,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#00d4ff', fontWeight: 700, fontSize: 12, flexShrink: 0,
  },
  selectedRecipient: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', borderRadius: 10,
    background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.3)',
  },
  selectedClearBtn: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', padding: 4, display: 'flex',
  },
  submitBtn: (loading, success) => ({
    width: '100%', padding: 14, borderRadius: 10, border: 'none',
    fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
    minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 8,
    background: success ? 'rgba(0,230,118,0.2)' : 'linear-gradient(135deg, #00d4ff 0%, #00b8d9 100%)',
    color: success ? '#00e676' : '#061218',
  }),
  error: { color: '#ff3d5a', fontSize: 13, marginTop: 8, textAlign: 'center' },
  // Tabs
  tabRow: {
    display: 'flex', gap: 4, marginBottom: 'var(--space-4)',
    borderBottom: '1px solid var(--glass-border)',
  },
  tab: (active) => ({
    padding: '12px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
    color: active ? '#00d4ff' : 'var(--text-muted)',
    borderBottom: active ? '2px solid #00d4ff' : '2px solid transparent',
    background: 'none', border: 'none', borderRadius: 0,
    marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
  }),
  // List
  listCard: {
    background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)',
    transition: 'background 0.15s',
  },
  rowMain: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  rowName: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 },
  rowEmail: { fontSize: 12, color: 'var(--text-dim)' },
  rowDesc: { fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 },
  rowMeta: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 110 },
  badge: (color) => ({
    padding: '3px 10px', borderRadius: 'var(--radius-full)',
    background: color + '20', color, fontSize: 11, fontWeight: 700,
  }),
  rowDate: { fontSize: 11, color: 'var(--text-dim)' },
  rowActions: { display: 'flex', gap: 6 },
  actionBtn: (color) => ({
    padding: '6px 10px', borderRadius: 8,
    background: color + '15', border: `1px solid ${color}40`,
    color, fontWeight: 600, fontSize: 12, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 4,
  }),
  emptyState: {
    textAlign: 'center', padding: 'var(--space-12)',
    color: 'var(--text-dim)', fontSize: 14,
  },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)', color: 'var(--text-muted)' },
  errorWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)', color: '#ff3d5a' },
  retryBtn: { padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', background: 'rgba(255,61,90,0.15)', border: '1px solid rgba(255,61,90,0.3)', color: '#ff3d5a', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
};

function initials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday ? format(d, 'h:mm a') : format(d, 'MMM d, h:mm a');
  } catch {
    return '';
  }
}

function daysBetween(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
}

export default function MailPickup() {
  const { user } = useAuth();
  const { data: rawData, loading, error, refresh } = useSharePointList('mailPickups');

  // ── Form state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedRecipient, setSelectedRecipient] = useState(null); // { id, name, email, title }
  const [mailDescription, setMailDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'

  // ── Per-row action state ──
  const [actionItemId, setActionItemId] = useState(null);
  const [actionType, setActionType] = useState(null); // 'pickup' | 'cancel' | 'delete'
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // ── Type-ahead search (debounced) ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim() || selectedRecipient) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchOrgUsers(searchQuery);
        setSearchResults(results);
        setShowDropdown(true);
        setActiveIdx(0);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [searchQuery, selectedRecipient]);

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectRecipient = (u) => {
    setSelectedRecipient(u);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleClearRecipient = () => {
    setSelectedRecipient(null);
    setSearchQuery('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (submitting) return;
    if (!selectedRecipient) {
      setSubmitError('Please select a recipient');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createMailPickup({
        Title: `Mail for ${selectedRecipient.name}`,
        RecipientName: selectedRecipient.name,
        RecipientEmail: selectedRecipient.email,
        MailDescription: mailDescription.trim() || null,
        DateNotified: new Date().toISOString(),
        Status: 'Pending',
        ReminderSent: false,
      });
      setSubmitSuccess(true);
      // Reset form
      setSelectedRecipient(null);
      setMailDescription('');
      refresh();
      setTimeout(() => setSubmitSuccess(false), 2500);
    } catch (err) {
      setSubmitError(err.message || 'Failed to create notification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const u = searchResults[activeIdx];
      if (u) handleSelectRecipient(u);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // ── Pickup actions ──
  const handleMarkPickedUp = async (item) => {
    setActionItemId(item.id);
    setActionType('pickup');
    setActionLoading(true);
    setActionError(null);
    try {
      await updateMailPickup(item.id, {
        Status: 'Picked Up',
        DatePickedUp: new Date().toISOString(),
      });
      refresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
      setActionItemId(null);
      setActionType(null);
    }
  };

  const handleCancelPickup = async (item) => {
    setActionItemId(item.id);
    setActionType('cancel');
    setActionLoading(true);
    setActionError(null);
    try {
      await updateMailPickup(item.id, { Status: 'Cancelled' });
      refresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
      setActionItemId(null);
      setActionType(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete the mail pickup record for ${item.recipientName}? This removes it from the list permanently.`)) return;
    setActionItemId(item.id);
    setActionType('delete');
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteMailPickup(item.id);
      refresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
      setActionItemId(null);
      setActionType(null);
    }
  };

  // ── Map data ──
  const items = useMemo(() => {
    const mapped = rawData.map((it) => ({
      id: it.id,
      title: it.fields?.Title || '',
      recipientName: it.fields?.RecipientName || 'Unknown',
      recipientEmail: it.fields?.RecipientEmail || '',
      description: it.fields?.MailDescription || '',
      status: it.fields?.Status || 'Pending',
      dateNotified: it.fields?.DateNotified || it.createdDateTime || null,
      datePickedUp: it.fields?.DatePickedUp || null,
      reminderSent: it.fields?.ReminderSent === true,
    }));
    // Newest first
    return mapped.sort((a, b) => {
      const da = a.dateNotified ? new Date(a.dateNotified).getTime() : 0;
      const db = b.dateNotified ? new Date(b.dateNotified).getTime() : 0;
      return db - da;
    });
  }, [rawData]);

  const pendingItems = items.filter((i) => i.status === 'Pending');
  const historyItems = items.filter((i) => i.status !== 'Pending');

  const visibleItems = activeTab === 'pending' ? pendingItems : historyItems;

  // ── Render ──
  if (loading && rawData.length === 0) {
    return (
      <PageWrapper title="Mail Pickup">
        <div style={s.loadingWrap}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading mail pickups...</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </PageWrapper>
    );
  }

  if (error && rawData.length === 0) {
    return (
      <PageWrapper title="Mail Pickup">
        <div style={s.errorWrap}>
          <AlertCircle size={32} />
          <span>Failed to load mail pickups</span>
          <span style={{ fontSize: 12, maxWidth: 500, textAlign: 'center', opacity: 0.7 }}>
            {error.message}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center', maxWidth: 500 }}>
            If this is your first time on this page, make sure the SharePoint list "Mail Pickups" exists.
          </span>
          <button style={s.retryBtn} onClick={refresh}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Mail Pickup">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        {/* Hero */}
        <motion.div style={s.hero} variants={fadeInUp} custom={0}>
          <div style={s.heroIcon}>
            <Mail size={28} color="#00d4ff" />
          </div>
          <div>
            <div style={s.heroTitle}>Mail Pickup Notifications</div>
            <div style={s.heroSubtitle}>
              Notify staff when mail or packages have arrived for them at reception.
              {user?.name && <> Sent on behalf of <strong style={{ color: '#00d4ff' }}>{user.name}</strong>.</>}
            </div>
          </div>
        </motion.div>

        {/* New notification form */}
        <motion.div style={s.formCard} variants={fadeInUp} custom={1}>
          <form onSubmit={handleSubmit}>
            <label style={s.label}>Recipient *</label>
            {selectedRecipient ? (
              <div style={s.selectedRecipient}>
                <div style={s.avatarSmall}>{initials(selectedRecipient.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedRecipient.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedRecipient.email}</div>
                </div>
                <button type="button" style={s.selectedClearBtn} onClick={handleClearRecipient}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div style={s.searchWrap} ref={dropdownRef}>
                <Search size={16} style={s.searchIcon} />
                <input
                  style={s.input}
                  placeholder="Type a name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                />
                {searching && (
                  <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-dim)' }} />
                  </div>
                )}
                {showDropdown && searchResults.length > 0 && (
                  <div style={s.dropdown}>
                    {searchResults.map((u, i) => (
                      <div
                        key={u.id}
                        style={i === activeIdx ? s.dropdownItemActive : s.dropdownItem}
                        onMouseEnter={() => setActiveIdx(i)}
                        onClick={() => handleSelectRecipient(u)}
                      >
                        <div style={s.avatarSmall}>{initials(u.name)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.email}{u.title ? ` · ${u.title}` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showDropdown && searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                  <div style={s.dropdown}>
                    <div style={{ padding: 14, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                      No matching staff found.
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Mail Description (optional)</label>
              <textarea
                style={s.textarea}
                placeholder="e.g. Letter from CRA, Package from Amazon, Courier from UPS..."
                value={mailDescription}
                onChange={(e) => setMailDescription(e.target.value)}
              />
            </div>

            {submitError && <div style={s.error}>{submitError}</div>}

            <button type="submit" style={s.submitBtn(submitting, submitSuccess)} disabled={submitting || !selectedRecipient}>
              {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                : submitSuccess ? <><Check size={16} /> Notification sent!</>
                : <><Send size={16} /> Notify Recipient</>}
            </button>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </form>
        </motion.div>

        {/* Tabs */}
        <motion.div style={s.tabRow} variants={fadeInUp} custom={2}>
          <button
            style={s.tab(activeTab === 'pending')}
            onClick={() => setActiveTab('pending')}
          >
            <Inbox size={14} /> Pending
            <span style={{ ...s.badge('#ffab00'), marginLeft: 4 }}>{pendingItems.length}</span>
          </button>
          <button
            style={s.tab(activeTab === 'history')}
            onClick={() => setActiveTab('history')}
          >
            <CheckCircle2 size={14} /> History
            <span style={{ ...s.badge('#8b949e'), marginLeft: 4 }}>{historyItems.length}</span>
          </button>
        </motion.div>

        {actionError && <div style={s.error}>{actionError}</div>}

        {/* List */}
        <motion.div style={s.listCard} variants={fadeInUp} custom={3}>
          {visibleItems.length === 0 ? (
            <div style={s.emptyState}>
              {activeTab === 'pending'
                ? 'No pending pickups. Notify someone above to get started.'
                : 'No history yet — picked-up and cancelled items will appear here.'}
            </div>
          ) : (
            visibleItems.map((item) => {
              const days = daysBetween(item.dateNotified);
              const isOld = activeTab === 'pending' && days >= 3;
              return (
                <motion.div
                  key={item.id}
                  style={s.row}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                >
                  <div style={s.avatarSmall}>{initials(item.recipientName)}</div>
                  <div style={s.rowMain}>
                    <div style={s.rowName}>
                      {item.recipientName}
                      {isOld && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#ff3d5a', background: 'rgba(255,61,90,0.15)', padding: '2px 6px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={10} /> {days}d waiting
                        </span>
                      )}
                    </div>
                    <div style={s.rowEmail}>{item.recipientEmail}</div>
                    {item.description && <div style={s.rowDesc}>"{item.description}"</div>}
                  </div>
                  <div style={s.rowMeta}>
                    <span style={s.badge(statusColor[item.status] || '#8b949e')}>
                      {item.status}
                    </span>
                    <span style={s.rowDate}>
                      <Clock size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                      {formatDate(item.dateNotified)}
                    </span>
                  </div>
                  <div style={s.rowActions}>
                    {item.status === 'Pending' ? (
                      <>
                        <button
                          style={s.actionBtn('#00e676')}
                          onClick={() => handleMarkPickedUp(item)}
                          disabled={actionLoading && actionItemId === item.id}
                          title="Mark as picked up"
                        >
                          {actionLoading && actionItemId === item.id && actionType === 'pickup'
                            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            : <><Check size={12} /> Picked up</>}
                        </button>
                        <button
                          style={s.actionBtn('#8b949e')}
                          onClick={() => handleCancelPickup(item)}
                          disabled={actionLoading && actionItemId === item.id}
                          title="Cancel notification"
                        >
                          {actionLoading && actionItemId === item.id && actionType === 'cancel'
                            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            : <X size={12} />}
                        </button>
                      </>
                    ) : (
                      <button
                        style={s.actionBtn('#ff3d5a')}
                        onClick={() => handleDelete(item)}
                        disabled={actionLoading && actionItemId === item.id}
                        title="Delete record"
                      >
                        {actionLoading && actionItemId === item.id && actionType === 'delete'
                          ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          : <Trash2 size={12} />}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
