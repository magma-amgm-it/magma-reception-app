import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle,
  Filter,
  Calendar,
  User,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  Check,
  GripVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import PageWrapper from '../components/Layout/PageWrapper';
import { useSharePointList } from '../hooks/useSharePointList';
import { createSupplyRequest, updateSupplyRequest } from '../services/graphApi';

const columns = [
  { key: 'New', label: 'New', color: '#E06B7A' },
  { key: 'Received', label: 'Request received', color: '#FEA614' },
  { key: 'Pending Order', label: 'Pending Order', color: '#39C0E0' },
  { key: 'Ready to Pick Up', label: 'Ready to Pick Up', color: '#31D3AE' },
  { key: 'Completed', label: 'Completed', color: '#8792A0' },
];

const departments = ['All', 'Reception', 'CELPIP', 'Administration', 'Kitchen', 'Settlement', 'Language', 'IT', 'Finance', 'HR', 'Facilities'];
const deptChoices = departments.filter(d => d !== 'All');
const urgencies = ['All', 'Urgent', 'Normal'];

const urgencyColor = { Urgent: '#E05563', Normal: '#31D3AE' };
// Official MAGMA service colour-coding (Brand Kit). Departments that map to a
// MAGMA service get its brand colour; internal-only departments stay neutral navy.
const deptColor = {
  Settlement: '#31D3AE',     // Settlement/RAP → teal
  Language: '#FEA614',       // Language School → orange
  CELPIP: '#A4113A',         // CELPIP → maroon
  Administration: '#413C60', // Administration / IT / Marketing → navy
  IT: '#413C60',
  Reception: '#413C60', Finance: '#413C60', HR: '#413C60', Facilities: '#413C60', Kitchen: '#413C60',
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

// ─── Form styles ───
const f = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', position: 'relative' },
  title: { fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '12px 16px', borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 14, minHeight: 48, outline: 'none', colorScheme: 'light', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '12px 16px', borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 14, minHeight: 90, outline: 'none', resize: 'vertical' },
  group: { marginBottom: 20 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: (active, color = '#413C60') => ({ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s', background: active ? color + '22' : 'var(--bg-surface)', color: active ? 'var(--brand-ink)' : 'var(--text-muted)', borderWidth: 1, borderStyle: 'solid', borderColor: active ? color : 'var(--border-default)' }),
  submitBtn: (loading, success) => ({ width: '100%', padding: 16, borderRadius: 10, border: 'none', fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, background: loading ? '#8681A5' : success ? 'rgba(87,193,165,0.2)' : 'var(--brand-navy)', color: loading ? '#fff' : success ? '#3E9E85' : '#fff' }),
  error: { color: '#E05563', fontSize: 13, textAlign: 'center', marginTop: 8 },
};

const s = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' },
  newBtn: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', background: 'var(--brand-navy)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 'var(--text-sm)', cursor: 'pointer', minHeight: 48, border: 'none' },
  filterBar: { display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center' },
  filterIcon: { display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' },
  select: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', minHeight: 40, cursor: 'pointer', appearance: 'auto', colorScheme: 'light' },
  board: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))', gap: 'var(--space-4)', overflowX: 'auto', paddingBottom: 'var(--space-4)' },
  column: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minHeight: 300 },
  colHeader: (color) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: color, marginBottom: 'var(--space-2)', boxShadow: `0 3px 10px ${color}55` }),
  colName: { fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 'var(--text-sm)', color: '#fff', letterSpacing: '0.2px' },
  colCount: () => ({ background: 'rgba(255,255,255,0.28)', color: '#fff', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 700 }),
  card: { background: 'rgba(132,124,186,0.10)', border: '1px solid rgba(132,124,186,0.24)', borderLeft: '3px solid var(--brand-navy)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: 'var(--space-4)', cursor: 'grab', touchAction: 'none' },
  cardDragging: { background: 'rgba(132,124,186,0.16)', border: '1px solid var(--brand-navy)', borderLeft: '3px solid var(--brand-navy)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-md)', opacity: 0.97 },
  cardTitle: { fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)', color: 'var(--brand-ink)' },
  cardRow: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' },
  cardBadge: (color) => ({ display: 'inline-block', padding: '3px 9px', borderRadius: 'var(--radius-full)', background: color, color: '#fff', fontSize: '10px', fontWeight: 700 }),
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-3)' },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)', color: 'var(--text-muted)' },
  errorWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)', color: '#E05563' },
  retryBtn: { padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', background: 'rgba(241,98,120,0.12)', border: '1px solid rgba(241,98,120,0.3)', color: '#E05563', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
  dropHint: { fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 12 },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), 'MMM d'); } catch { return dateStr; }
}

// ─── Droppable Column ───
function DroppableColumn({ id, color, label, count, children }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} style={{
      ...s.column,
      background: isOver ? color + '08' : 'transparent',
      borderRadius: 12,
      border: isOver ? `2px dashed ${color}40` : '2px dashed transparent',
      padding: isOver ? 8 : 8,
      transition: 'all 0.2s ease',
    }}>
      <div style={s.colHeader(color)}>
        <span style={s.colName}>{label}</span>
        <span style={s.colCount(color)}>{count}</span>
      </div>
      {children}
      {count === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-dim)', fontSize: 'var(--text-xs)' }}>
          {isOver ? 'Drop here' : 'No items'}
        </div>
      )}
    </div>
  );
}

// ─── Draggable Card ───
function DraggableCard({ card }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });

  const style = {
    ...(isDragging ? s.cardDragging : s.card),
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <GripVertical size={12} color="var(--text-dim)" style={{ flexShrink: 0, opacity: 0.5 }} />
        <div style={s.cardTitle}>{card.title}</div>
      </div>
      <div style={s.cardRow}><User size={12} />{card.requester}</div>
      <div style={s.cardFooter}>
        <span style={s.cardBadge(deptColor[card.department] || '#8792A0')}>{card.department}</span>
        <span style={s.cardBadge(urgencyColor[card.urgency] || '#8792A0')}>{card.urgency}</span>
      </div>
      <div style={{ ...s.cardRow, marginTop: 8, marginBottom: 0 }}><Calendar size={11} />{card.date}</div>
    </div>
  );
}

// ─── Card Overlay (shown while dragging) ───
function CardOverlay({ card }) {
  if (!card) return null;
  return (
    <div style={s.cardDragging}>
      <div style={s.cardTitle}>{card.title}</div>
      <div style={s.cardRow}><User size={12} />{card.requester}</div>
      <div style={s.cardFooter}>
        <span style={s.cardBadge(deptColor[card.department] || '#8792A0')}>{card.department}</span>
        <span style={s.cardBadge(urgencyColor[card.urgency] || '#8792A0')}>{card.urgency}</span>
      </div>
    </div>
  );
}

export default function SupplyRequests() {
  const [deptFilter, setDeptFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const { data: rawData, loading, error, refresh } = useSharePointList('supplyRequests');

  // ── Drag state ──
  const [activeId, setActiveId] = useState(null);
  const [updating, setUpdating] = useState(null); // id of card being updated

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Form state ──
  const [showForm, setShowForm] = useState(false);
  const [fTitle, setFTitle] = useState('');
  const [fDept, setFDept] = useState('');
  const [fItems, setFItems] = useState('');
  const [fUrgency, setFUrgency] = useState('Normal');
  const [fCompDate, setFCompDate] = useState('');
  const [fNotes, setFNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const resetForm = () => {
    setFTitle(''); setFDept(''); setFItems(''); setFUrgency('Normal');
    setFCompDate(''); setFNotes('');
  };

  const handleSubmit = async () => {
    if (!fTitle || !fDept || !fItems) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createSupplyRequest({
        Title: fTitle, Department: fDept, RequestedItems: fItems, Urgency: fUrgency,
        Status: 'New',
        RequestedCompletionDate: fUrgency === 'Urgent' && fCompDate ? fCompDate : undefined,
        ReceptionNotes: fNotes || undefined,
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

  const requests = rawData.map((item) => ({
    id: item.id,
    title: item.fields?.Title || 'Untitled',
    // Prefer the explicit RequestedBy person column if set;
    // fall back to the system createdBy.user.displayName (always populated
    // by SharePoint to whoever submitted the entry).
    requester:
      item.fields?.RequestedBy?.LookupValue ||
      item.fields?.RequestedBy ||
      item.createdBy?.user?.displayName ||
      '—',
    department: item.fields?.Department || '—',
    urgency: item.fields?.Urgency || 'Normal',
    date: formatDate(item.fields?.DateOfRequest),
    status: item.fields?.Status || 'New',
  }));

  const filtered = requests.filter((r) => {
    if (deptFilter !== 'All' && r.department !== deptFilter) return false;
    if (urgencyFilter !== 'All' && r.urgency !== urgencyFilter) return false;
    return true;
  });

  const activeCard = activeId ? filtered.find(r => r.id === activeId) : null;

  // ── Drag handlers ──
  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const cardId = active.id;
    const newStatus = over.id; // droppable id = column key = status name

    const card = requests.find(r => r.id === cardId);
    if (!card || card.status === newStatus) return;

    // Optimistic update — show immediately, sync to SharePoint in background
    setUpdating(cardId);
    try {
      const updateData = { Status: newStatus };
      // If moving to Completed, set DateCompleted
      if (newStatus === 'Completed') {
        updateData.DateCompleted = new Date().toISOString();
      }
      await updateSupplyRequest(cardId, updateData);
      refresh();
    } catch (err) {
      console.error('Failed to update status:', err);
      // refresh to revert optimistic update
      refresh();
    } finally {
      setUpdating(null);
    }
  }, [requests, refresh]);

  if (loading && rawData.length === 0) {
    return (
      <PageWrapper title="Supply Requests">
        <div style={s.loadingWrap}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading supply requests...</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </PageWrapper>
    );
  }

  if (error && rawData.length === 0) {
    return (
      <PageWrapper title="Supply Requests">
        <div style={s.errorWrap}>
          <AlertCircle size={32} />
          <span>Failed to load supply requests</span>
          <span style={{ fontSize: 'var(--text-xs)', maxWidth: 400, textAlign: 'center', opacity: 0.7 }}>{error.message}</span>
          <button style={s.retryBtn} onClick={refresh}><RefreshCw size={14} /> Retry</button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Supply Requests">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        {/* Header */}
        <motion.div style={s.header} variants={fadeInUp} custom={0}>
          <motion.button style={s.newBtn}
            whileHover={{ scale: 1.04, boxShadow: 'var(--shadow-md)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowForm(true)}>
            <PlusCircle size={18} /> New Request
          </motion.button>
        </motion.div>

        {/* Filter Bar */}
        <motion.div style={s.filterBar} variants={fadeInUp} custom={1}>
          <span style={s.filterIcon}><Filter size={14} /> Filters</span>
          <select style={s.select} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            {departments.map((d) => <option key={d} value={d} style={{ background: 'var(--bg-card)' }}>{d === 'All' ? 'All Departments' : d}</option>)}
          </select>
          <select style={s.select} value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
            {urgencies.map((u) => <option key={u} value={u} style={{ background: 'var(--bg-card)' }}>{u === 'All' ? 'All Urgencies' : u}</option>)}
          </select>
        </motion.div>

        <div style={s.dropHint}>Drag cards between columns to update status</div>

        {/* Kanban Board with DnD */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <motion.div style={s.board} variants={stagger}>
            {columns.map((col, ci) => {
              const cards = filtered.filter((r) => r.status === col.key);
              return (
                <DroppableColumn key={col.key} id={col.key} color={col.color} label={col.label} count={cards.length}>
                  {cards.map((card) => (
                    <div key={card.id} style={{ position: 'relative' }}>
                      <DraggableCard card={card} />
                      {updating === card.id && (
                        <div style={{
                          position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)',
                          background: 'rgba(252,252,251,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Loader2 size={18} color="#413C60" style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </DroppableColumn>
              );
            })}
          </motion.div>

          <DragOverlay>
            <CardOverlay card={activeCard} />
          </DragOverlay>
        </DndContext>
      </motion.div>

      {/* ── New Request Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div style={f.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div style={f.modal} initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
              <div style={f.title}>
                New Supply Request
                <button style={f.closeBtn} onClick={() => setShowForm(false)}><X size={20} /></button>
              </div>
              <div style={f.group}>
                <label style={f.label}>Request Title *</label>
                <input style={f.input} placeholder="e.g. Paper 8x11 Restock" value={fTitle} onChange={(e) => setFTitle(e.target.value)} />
              </div>
              <div style={f.group}>
                <label style={f.label}>Department *</label>
                <div style={f.chips}>
                  {deptChoices.map(d => <button key={d} style={f.chip(fDept === d, deptColor[d])} onClick={() => setFDept(d)}>{d}</button>)}
                </div>
              </div>
              <div style={f.group}>
                <label style={f.label}>Requested Items *</label>
                <textarea style={f.textarea} placeholder={"e.g. Paper 8x11 \u2014 2 packs\nPens \u2014 1 box"} value={fItems} onChange={(e) => setFItems(e.target.value)} />
              </div>
              <div style={f.group}>
                <label style={f.label}>Urgency</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Normal', 'Urgent'].map(u => <button key={u} style={f.chip(fUrgency === u, urgencyColor[u])} onClick={() => setFUrgency(u)}>{u}</button>)}
                </div>
              </div>
              {fUrgency === 'Urgent' && (
                <div style={f.group}>
                  <label style={f.label}>Needed By Date</label>
                  <input style={f.input} type="date" value={fCompDate} onChange={(e) => setFCompDate(e.target.value)} />
                </div>
              )}
              <div style={f.group}>
                <label style={f.label}>Notes (optional)</label>
                <textarea style={{ ...f.textarea, minHeight: 60 }} placeholder="Additional details..." value={fNotes} onChange={(e) => setFNotes(e.target.value)} />
              </div>
              {submitError && <div style={f.error}>{submitError}</div>}
              <button style={f.submitBtn(submitting, submitSuccess)} onClick={handleSubmit} disabled={submitting || !fTitle || !fDept || !fItems}>
                {submitting ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
                  : submitSuccess ? <><Check size={18} /> Created!</>
                  : 'Submit Request'}
              </button>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
