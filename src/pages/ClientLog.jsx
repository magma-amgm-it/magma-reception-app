import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Check,
  Loader2,
  User,
  AlertCircle,
  RefreshCw,
  Calendar,
  BarChart3,
  X,
  Pencil,
  Save,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import PageWrapper from '../components/Layout/PageWrapper';
import { useSharePointList } from '../hooks/useSharePointList';
import {
  createClientLogEntry,
  updateClientLogEntry,
  deleteClientLogEntry,
  getClientLogReasonChoices,
  addClientLogReasonChoice,
  getClientLogLanguageChoices,
  addClientLogLanguageChoice,
} from '../services/graphApi';

const FALLBACK_REASONS = [
  'Settlement Services',
  'Language Assessment',
  'Information Request',
  'Document Assistance',
  'Appointment',
  'Walk-in',
  'Phone Call',
  'Referral',
  'Other',
];

const FALLBACK_LANGUAGES = ['English', 'French'];

const statusOptions = [
  { label: 'PR', color: '#00d4ff' },
  { label: 'WP', color: '#00e676' },
  { label: 'SP', color: '#a855f7' },
  { label: 'VV', color: '#ffab00' },
  { label: 'AS', color: '#ff006e' },
  { label: 'Refugee', color: '#26a69a' },
];

const interactionTypes = ['In-Person Visit', 'Phone Call', 'Email'];
const interactionLabels = { 'In-Person Visit': 'In-Person', 'Phone Call': 'Phone', 'Email': 'Email' };

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
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-6)',
    flexWrap: 'wrap',
  },
  badge: {
    padding: '4px 14px',
    borderRadius: 'var(--radius-full)',
    background: 'rgba(0,212,255,0.15)',
    color: '#00d4ff',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
  },
  formCard: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-8)',
    marginBottom: 'var(--space-8)',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-6)',
  },
  label: {
    display: 'block',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    marginBottom: 'var(--space-2)',
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-md)',
    minHeight: 48,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  sectionLabel: {
    fontSize: 'var(--text-md)',
    fontWeight: 600,
    marginBottom: 'var(--space-3)',
    color: 'var(--text-primary)',
  },
  optionGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-6)',
  },
  optionBtn: (selected) => ({
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-md)',
    background: selected ? 'rgba(0,212,255,0.18)' : 'rgba(255,255,255,0.04)',
    border: selected ? '1px solid rgba(0,212,255,0.5)' : '1px solid var(--glass-border)',
    color: selected ? '#00d4ff' : 'var(--text-muted)',
    fontWeight: 500,
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
    minHeight: 48,
    minWidth: 48,
    transition: 'all 0.2s',
  }),
  statusBtn: (selected, color) => ({
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-md)',
    background: selected ? color + '22' : 'rgba(255,255,255,0.04)',
    border: selected ? `1px solid ${color}60` : '1px solid var(--glass-border)',
    color: selected ? color : 'var(--text-muted)',
    fontWeight: 600,
    fontSize: 'var(--text-md)',
    cursor: 'pointer',
    minHeight: 48,
    minWidth: 56,
    transition: 'all 0.2s',
  }),
  langToggle: {
    display: 'flex',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-6)',
  },
  langBtn: (active) => ({
    flex: 1,
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    background: active ? 'rgba(0,212,255,0.18)' : 'rgba(255,255,255,0.04)',
    border: active ? '1px solid rgba(0,212,255,0.5)' : '1px solid var(--glass-border)',
    color: active ? '#00d4ff' : 'var(--text-muted)',
    fontWeight: 600,
    fontSize: 'var(--text-md)',
    cursor: 'pointer',
    minHeight: 48,
  }),
  stepper: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-6)',
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-primary)',
  },
  stepperNum: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#00d4ff',
    minWidth: 48,
    textAlign: 'center',
  },
  interactionRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-6)',
  },
  interactionBtn: (selected) => ({
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    background: selected ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.04)',
    border: selected ? '1px solid rgba(0,230,118,0.4)' : '1px solid var(--glass-border)',
    color: selected ? '#00e676' : 'var(--text-muted)',
    fontWeight: 600,
    fontSize: 'var(--text-md)',
    cursor: 'pointer',
    minHeight: 52,
  }),
  collapseHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) 0',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    marginBottom: 'var(--space-2)',
  },
  submitBtn: (loading, success) => ({
    width: '100%',
    padding: 'var(--space-4)',
    borderRadius: 'var(--radius-md)',
    background: loading
      ? 'rgba(0,212,255,0.1)'
      : success
      ? 'rgba(0,230,118,0.2)'
      : 'linear-gradient(135deg, #00d4ff 0%, #0090b3 100%)',
    border: 'none',
    color: loading ? '#00d4ff' : success ? '#00e676' : '#0a0a0f',
    fontWeight: 700,
    fontSize: 'var(--text-lg)',
    cursor: loading ? 'not-allowed' : 'pointer',
    minHeight: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    marginTop: 'var(--space-4)',
  }),
  entriesCard: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
  },
  entryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--border-default)',
  },
  entryName: {
    fontWeight: 600,
    flex: 1,
  },
  entryReason: {
    color: 'var(--text-muted)',
    fontSize: 'var(--text-sm)',
  },
  entryBadge: (color) => ({
    padding: '2px 10px',
    borderRadius: 'var(--radius-full)',
    background: color + '20',
    color,
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
  }),
  entryTime: {
    color: 'var(--text-dim)',
    fontSize: 'var(--text-xs)',
    whiteSpace: 'nowrap',
  },
};

function getStatusColor(status) {
  const opt = statusOptions.find((o) => o.label === status);
  return opt ? opt.color : '#8b949e';
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday ? format(d, 'h:mm a') : format(d, 'MMM d, h:mm a');
  } catch {
    return '';
  }
}

// Format ISO date for <input type="datetime-local"> value
function toLocalDatetimeInput(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

// ─── Filter presets ───
const PRESETS = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '6m', label: 'Last 6 months' },
  { key: '1y', label: 'Last year' },
];

function getDateRange(preset, monthYear) {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now), label: 'Today' };
    case 'week':
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }), label: 'This Week' };
    case '7d':
      return { from: startOfDay(subDays(now, 7)), to: endOfDay(now), label: 'Last 7 days' };
    case '30d':
      return { from: startOfDay(subDays(now, 30)), to: endOfDay(now), label: 'Last 30 days' };
    case '6m':
      return { from: startOfDay(subMonths(now, 6)), to: endOfDay(now), label: 'Last 6 months' };
    case '1y':
      return { from: startOfDay(subMonths(now, 12)), to: endOfDay(now), label: 'Last year' };
    case 'month': {
      if (!monthYear) return null;
      const [y, m] = monthYear.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      return { from: startOfMonth(d), to: endOfMonth(d), label: format(d, 'MMMM yyyy') };
    }
    default:
      return null; // 'all' = no filter
  }
}

// ─── Filter + stats styles ───
const f = {
  filterCard: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
    marginBottom: 'var(--space-5)',
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-2)',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  chip: (active) => ({
    padding: '7px 14px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid',
    borderColor: active ? '#00d4ff' : 'var(--glass-border)',
    background: active ? 'rgba(0,212,255,0.15)' : 'transparent',
    color: active ? '#00d4ff' : 'var(--text-muted)',
    transition: 'all 0.15s',
  }),
  monthInput: {
    padding: '7px 14px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    outline: 'none',
    colorScheme: 'dark',
    minWidth: 140,
    cursor: 'pointer',
  },
  statsCard: {
    background: 'linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(168,85,247,0.06) 100%)',
    border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    marginBottom: 'var(--space-5)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: 'var(--space-6)',
    alignItems: 'start',
  },
  statsCount: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    borderRight: '1px solid rgba(255,255,255,0.08)',
    paddingRight: 'var(--space-6)',
  },
  statsCountNum: {
    fontSize: '3rem',
    fontWeight: 800,
    color: '#00d4ff',
    lineHeight: 1,
  },
  statsCountLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  statsCountPeriod: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-dim)',
    marginTop: 4,
  },
  breakdownGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--space-4)',
  },
  breakdownBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  breakdownRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
  },
  breakdownDot: (color) => ({ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }),
  breakdownLabel: { color: 'var(--text-primary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  breakdownCount: { color: 'var(--text-muted)', fontWeight: 600 },
  breakdownEmpty: { fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' },
};

const reasonColors = ['#00d4ff', '#a855f7', '#ff006e', '#00e676', '#ffab00', '#26a69a'];
const langColors = { English: '#00d4ff', French: '#ff006e' };

export default function ClientLog() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [reason, setReason] = useState('');
  const [statusCanada, setStatusCanada] = useState('');
  const [language, setLanguage] = useState('English');
  const [familyMembers, setFamilyMembers] = useState(1);
  const [interaction, setInteraction] = useState('In-Person Visit');
  const [showMore, setShowMore] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // ── Filter state ──
  const [preset, setPreset] = useState('all');
  const [monthYear, setMonthYear] = useState(''); // 'YYYY-MM' format

  // ── Dynamic reason + language lists ──
  const [reasons, setReasons] = useState(FALLBACK_REASONS);
  const [languages, setLanguages] = useState(FALLBACK_LANGUAGES);
  const [showAddReason, setShowAddReason] = useState(false);
  const [newReasonName, setNewReasonName] = useState('');
  const [addingReason, setAddingReason] = useState(false);
  const [addReasonError, setAddReasonError] = useState(null);
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [newLanguageName, setNewLanguageName] = useState('');
  const [addingLanguage, setAddingLanguage] = useState(false);
  const [addLanguageError, setAddLanguageError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getClientLogReasonChoices();
        if (!cancelled && r.length > 0) setReasons(r);
      } catch (err) { console.warn('Could not load reasons:', err.message); }
    })();
    (async () => {
      try {
        const l = await getClientLogLanguageChoices();
        if (!cancelled && l.length > 0) setLanguages(l);
      } catch (err) { console.warn('Could not load languages:', err.message); }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleAddNewReason = async () => {
    const name = newReasonName.trim();
    if (!name) { setAddReasonError('Reason name cannot be empty'); return; }
    if (reasons.some((r) => r.toLowerCase() === name.toLowerCase())) { setAddReasonError('That reason already exists'); return; }
    setAddingReason(true); setAddReasonError(null);
    try {
      const updated = await addClientLogReasonChoice(name);
      setReasons(updated);
      setReason(name);
      setShowAddReason(false);
      setNewReasonName('');
    } catch (err) {
      setAddReasonError(err.message || 'Failed to add reason');
    } finally {
      setAddingReason(false);
    }
  };

  const handleAddNewLanguage = async () => {
    const name = newLanguageName.trim();
    if (!name) { setAddLanguageError('Language name cannot be empty'); return; }
    if (languages.some((l) => l.toLowerCase() === name.toLowerCase())) { setAddLanguageError('That language already exists'); return; }
    setAddingLanguage(true); setAddLanguageError(null);
    try {
      const updated = await addClientLogLanguageChoice(name);
      setLanguages(updated);
      setLanguage(name);
      setShowAddLanguage(false);
      setNewLanguageName('');
    } catch (err) {
      setAddLanguageError(err.message || 'Failed to add language');
    } finally {
      setAddingLanguage(false);
    }
  };

  // ── Edit entry state ──
  const [editingEntry, setEditingEntry] = useState(null); // The entry object being edited
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSaveSuccess, setEditSaveSuccess] = useState(false);
  const [editSaveError, setEditSaveError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingEntry, setDeletingEntry] = useState(false);

  const handleOpenEditEntry = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      FirstName: entry.firstName,
      LastName: entry.lastName,
      ReasonForVisit: entry.reason !== '—' ? entry.reason : '',
      StatusInCanada: entry.status !== '—' ? entry.status : '',
      PreferredLanguage: entry.language || 'English',
      NumberOfFamilyMembers: entry.familyMembers,
      InteractionType: entry.interactionType,
      PhoneNumber: entry.phone,
      EmailAddress: entry.email,
      Notes: entry.notes,
      DateOfInteraction: toLocalDatetimeInput(entry.rawDate),
    });
    setEditSaveError(null);
    setEditSaveSuccess(false);
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  const handleCloseEditEntry = () => {
    if (savingEdit || deletingEntry) return;
    setEditingEntry(null);
    setEditForm(null);
    setShowDeleteConfirm(false);
  };

  const updateEditField = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveEditEntry = async (e) => {
    e?.preventDefault?.();
    if (savingEdit || !editForm) return;
    if (!editForm.FirstName.trim() || !editForm.LastName.trim()) {
      setEditSaveError('First name and last name are required');
      return;
    }
    setSavingEdit(true);
    setEditSaveError(null);
    try {
      const payload = {
        Title: `${editForm.FirstName.trim()} ${editForm.LastName.trim()}`,
        FirstName: editForm.FirstName.trim(),
        LastName: editForm.LastName.trim(),
        ReasonForVisit: editForm.ReasonForVisit || null,
        StatusInCanada: editForm.StatusInCanada || null,
        PreferredLanguage: editForm.PreferredLanguage || 'English',
        NumberOfFamilyMembers: Number(editForm.NumberOfFamilyMembers) || 1,
        InteractionType: editForm.InteractionType || 'In-Person Visit',
        PhoneNumber: editForm.PhoneNumber || null,
        EmailAddress: editForm.EmailAddress || null,
        Notes: editForm.Notes || null,
      };
      // Convert datetime-local back to ISO if changed
      if (editForm.DateOfInteraction) {
        payload.DateOfInteraction = new Date(editForm.DateOfInteraction).toISOString();
      }
      await updateClientLogEntry(editingEntry.id, payload);
      setEditSaveSuccess(true);
      refresh();
      setTimeout(() => {
        setEditingEntry(null);
        setEditForm(null);
        setEditSaveSuccess(false);
      }, 1000);
    } catch (err) {
      setEditSaveError(err.message || 'Failed to save changes');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (deletingEntry || !editingEntry) return;
    if (deleteConfirmText.trim().toLowerCase() !== editingEntry.name.trim().toLowerCase()) {
      setEditSaveError(`Type the name exactly: "${editingEntry.name}"`);
      return;
    }
    setDeletingEntry(true);
    setEditSaveError(null);
    try {
      await deleteClientLogEntry(editingEntry.id);
      refresh();
      setEditingEntry(null);
      setEditForm(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      setEditSaveError(err.message || 'Failed to delete entry');
    } finally {
      setDeletingEntry(false);
    }
  };

  const { data: rawData, loading, error, refresh } = useSharePointList('clientLog');

  // Map SharePoint fields to UI shape (keep rawDate for filtering, plus full data for editing)
  const entries = useMemo(() => rawData.map((item) => ({
    id: item.id,
    name: item.fields?.Title || `${item.fields?.FirstName || ''} ${item.fields?.LastName || ''}`.trim() || 'Unknown',
    firstName: item.fields?.FirstName || '',
    lastName: item.fields?.LastName || '',
    reason: item.fields?.ReasonForVisit || '—',
    status: item.fields?.StatusInCanada || '—',
    language: item.fields?.PreferredLanguage || null,
    familyMembers: item.fields?.NumberOfFamilyMembers ?? 1,
    interactionType: item.fields?.InteractionType || 'In-Person Visit',
    phone: item.fields?.PhoneNumber || '',
    email: item.fields?.EmailAddress || '',
    notes: item.fields?.Notes || '',
    time: formatTime(item.fields?.DateOfInteraction),
    rawDate: item.fields?.DateOfInteraction || item.createdDateTime || null,
  })), [rawData]);

  // ── Apply filter ──
  const activePreset = monthYear ? 'month' : preset;
  const range = getDateRange(activePreset, monthYear);
  const filteredEntries = useMemo(() => {
    if (!range) return entries;
    return entries.filter((e) => {
      if (!e.rawDate) return false;
      const d = new Date(e.rawDate);
      return d >= range.from && d <= range.to;
    });
  }, [entries, range?.from?.getTime?.(), range?.to?.getTime?.()]);

  // ── Compute stats ──
  const stats = useMemo(() => {
    const reasonCounts = {};
    const statusCounts = {};
    const langCounts = { English: 0, French: 0 };
    let peopleServed = 0;
    filteredEntries.forEach((e) => {
      if (e.reason && e.reason !== '—') reasonCounts[e.reason] = (reasonCounts[e.reason] || 0) + 1;
      if (e.status && e.status !== '—') statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
      if (e.language === 'English' || e.language === 'French') langCounts[e.language]++;
      // Sum family members — defaults to 1 for missing/zero values so a single visitor still counts
      const fam = Number(e.familyMembers);
      peopleServed += Number.isFinite(fam) && fam > 0 ? fam : 1;
    });
    const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const statusBreakdown = statusOptions
      .map((opt) => ({ label: opt.label, color: opt.color, count: statusCounts[opt.label] || 0 }))
      .filter((s) => s.count > 0);
    return { topReasons, statusBreakdown, langCounts, peopleServed };
  }, [filteredEntries]);

  // All-time total people served (for the header badge)
  const allTimePeople = useMemo(() => {
    return entries.reduce((sum, e) => {
      const fam = Number(e.familyMembers);
      return sum + (Number.isFinite(fam) && fam > 0 ? fam : 1);
    }, 0);
  }, [entries]);

  const activeFilterLabel = range?.label || 'All time';

  const handleSubmit = async () => {
    if (!firstName || !lastName) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createClientLogEntry({
        Title: `${firstName} ${lastName}`,
        FirstName: firstName,
        LastName: lastName,
        ReasonForVisit: reason || undefined,
        StatusInCanada: statusCanada || undefined,
        PreferredLanguage: language,
        NumberOfFamilyMembers: familyMembers,
        InteractionType: interaction,
        PhoneNumber: phone || undefined,
        EmailAddress: email || undefined,
        Notes: notes || undefined,
        DateOfInteraction: new Date().toISOString(),
      });
      setSuccess(true);
      setFirstName('');
      setLastName('');
      setReason('');
      setStatusCanada('');
      setLanguage('English');
      setFamilyMembers(1);
      setInteraction('In-Person Visit');
      setPhone('');
      setEmail('');
      setNotes('');
      refresh();
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to submit client log:', err);
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper title="Client Log">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        {/* Header with count badge */}
        <motion.div style={s.header} variants={fadeInUp} custom={0}>
          <span style={s.badge}>
            {loading ? '...' : allTimePeople} {allTimePeople === 1 ? 'person' : 'people'} served · {entries.length} total {entries.length === 1 ? 'visit' : 'visits'}
          </span>
        </motion.div>

        {/* Form */}
        <motion.div style={s.formCard} variants={fadeInUp} custom={1}>
          {/* Name row */}
          <div style={s.row}>
            <div>
              <label style={s.label}>First Name</label>
              <input
                style={s.input}
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label style={s.label}>Last Name</label>
              <input
                style={s.input}
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Reason for Visit */}
          <p style={s.sectionLabel}>Reason for Visit</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
            <select
              style={{ ...s.input, flex: 1, minWidth: 200 }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">Choose a reason...</option>
              {reasons.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {!showAddReason && (
              <button type="button"
                style={{ padding: '0 14px', borderRadius: 'var(--radius-md)', border: '1px dashed #00d4ff80', background: 'transparent', color: '#00d4ff', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', minHeight: 48 }}
                onClick={() => { setShowAddReason(true); setAddReasonError(null); setNewReasonName(''); }}>
                <Plus size={12} /> New
              </button>
            )}
          </div>
          {showAddReason && (
            <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                style={{ ...s.input, flex: 1, minWidth: 200 }}
                placeholder="New reason name..."
                value={newReasonName}
                onChange={(e) => setNewReasonName(e.target.value)}
                autoFocus
                disabled={addingReason}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewReason(); } }}
              />
              <button type="button"
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#00d4ff', color: '#061218', fontWeight: 700, fontSize: 12, cursor: addingReason ? 'not-allowed' : 'pointer', minHeight: 40 }}
                onClick={handleAddNewReason} disabled={addingReason}>
                {addingReason ? <Loader2 size={12} style={{ animation: 'clientlog-spin 1s linear infinite' }} /> : <Check size={12} />}
              </button>
              <button type="button"
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', minHeight: 40 }}
                onClick={() => { setShowAddReason(false); setNewReasonName(''); setAddReasonError(null); }} disabled={addingReason}>
                <X size={12} />
              </button>
            </div>
          )}
          {addReasonError && showAddReason && (
            <div style={{ color: '#ff3d5a', fontSize: 12, marginTop: -12, marginBottom: 'var(--space-4)' }}>{addReasonError}</div>
          )}

          {/* Status in Canada */}
          <p style={s.sectionLabel}>Status in Canada</p>
          <div style={s.optionGrid}>
            {statusOptions.map((opt) => (
              <motion.button
                key={opt.label}
                style={s.statusBtn(statusCanada === opt.label, opt.color)}
                onClick={() => setStatusCanada(opt.label)}
                whileTap={{ scale: 0.95 }}
                animate={
                  statusCanada === opt.label
                    ? { boxShadow: `0 0 12px ${opt.color}40` }
                    : { boxShadow: 'none' }
                }
              >
                {opt.label}
              </motion.button>
            ))}
          </div>

          {/* Preferred Language */}
          <p style={s.sectionLabel}>Preferred Language</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
            <select
              style={{ ...s.input, flex: 1, minWidth: 200 }}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languages.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
            </select>
            {!showAddLanguage && (
              <button type="button"
                style={{ padding: '0 14px', borderRadius: 'var(--radius-md)', border: '1px dashed #00d4ff80', background: 'transparent', color: '#00d4ff', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', minHeight: 48 }}
                onClick={() => { setShowAddLanguage(true); setAddLanguageError(null); setNewLanguageName(''); }}>
                <Plus size={12} /> New
              </button>
            )}
          </div>
          {showAddLanguage && (
            <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                style={{ ...s.input, flex: 1, minWidth: 200 }}
                placeholder="New language name..."
                value={newLanguageName}
                onChange={(e) => setNewLanguageName(e.target.value)}
                autoFocus
                disabled={addingLanguage}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewLanguage(); } }}
              />
              <button type="button"
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#00d4ff', color: '#061218', fontWeight: 700, fontSize: 12, cursor: addingLanguage ? 'not-allowed' : 'pointer', minHeight: 40 }}
                onClick={handleAddNewLanguage} disabled={addingLanguage}>
                {addingLanguage ? <Loader2 size={12} style={{ animation: 'clientlog-spin 1s linear infinite' }} /> : <Check size={12} />}
              </button>
              <button type="button"
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', minHeight: 40 }}
                onClick={() => { setShowAddLanguage(false); setNewLanguageName(''); setAddLanguageError(null); }} disabled={addingLanguage}>
                <X size={12} />
              </button>
            </div>
          )}
          {addLanguageError && showAddLanguage && (
            <div style={{ color: '#ff3d5a', fontSize: 12, marginTop: -12, marginBottom: 'var(--space-4)' }}>{addLanguageError}</div>
          )}

          {/* Family Members */}
          <p style={s.sectionLabel}>Number of Family Members</p>
          <div style={s.stepper}>
            <motion.button
              style={s.stepperBtn}
              whileTap={{ scale: 0.9 }}
              onClick={() => setFamilyMembers(Math.max(1, familyMembers - 1))}
            >
              <Minus size={20} />
            </motion.button>
            <span style={s.stepperNum}>{familyMembers}</span>
            <motion.button
              style={s.stepperBtn}
              whileTap={{ scale: 0.9 }}
              onClick={() => setFamilyMembers(familyMembers + 1)}
            >
              <Plus size={20} />
            </motion.button>
          </div>

          {/* Interaction Type */}
          <p style={s.sectionLabel}>Interaction Type</p>
          <div style={s.interactionRow}>
            {interactionTypes.map((type) => (
              <motion.button
                key={type}
                style={s.interactionBtn(interaction === type)}
                onClick={() => setInteraction(type)}
                whileTap={{ scale: 0.95 }}
                animate={
                  interaction === type
                    ? { boxShadow: '0 0 12px rgba(0,230,118,0.3)' }
                    : { boxShadow: 'none' }
                }
              >
                {interactionLabels[type] || type}
              </motion.button>
            ))}
          </div>

          {/* Collapsible More Details */}
          <div style={s.collapseHeader} onClick={() => setShowMore(!showMore)}>
            {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            More Details
          </div>
          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ ...s.row, marginBottom: 'var(--space-4)' }}>
                  <div>
                    <label style={s.label}>Phone</label>
                    <input
                      style={s.input}
                      placeholder="Phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={s.label}>Email</label>
                    <input
                      style={s.input}
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label style={s.label}>Notes</label>
                  <textarea
                    style={{ ...s.input, minHeight: 80, resize: 'vertical' }}
                    placeholder="Additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Error */}
          {submitError && (
            <div style={{ color: '#ff3d5a', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)', textAlign: 'center' }}>
              {submitError}
            </div>
          )}

          {/* Submit */}
          <motion.button
            style={s.submitBtn(submitting, success)}
            onClick={handleSubmit}
            disabled={submitting || !firstName || !lastName}
            whileHover={
              !submitting && !success
                ? { scale: 1.02, boxShadow: '0 0 30px rgba(0,212,255,0.4)' }
                : {}
            }
            whileTap={!submitting ? { scale: 0.98 } : {}}
          >
            {submitting ? (
              <>
                <Loader2
                  size={20}
                  style={{ animation: 'clientlog-spin 1s linear infinite' }}
                />
                Submitting...
              </>
            ) : success ? (
              <>
                <Check size={20} />
                Submitted!
              </>
            ) : (
              'Log Client Visit'
            )}
          </motion.button>
        </motion.div>

        {/* ── Filter Controls ── */}
        <motion.div style={f.filterCard} variants={fadeInUp} custom={2}>
          <div style={f.filterRow}>
            <span style={f.filterLabel}>
              <Calendar size={12} /> Filter:
            </span>
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                style={f.chip(preset === p.key && !monthYear)}
                onClick={() => { setPreset(p.key); setMonthYear(''); }}
              >
                {p.label}
              </button>
            ))}
            <input
              type="month"
              style={f.monthInput}
              value={monthYear}
              onChange={(e) => { setMonthYear(e.target.value); if (e.target.value) setPreset('month'); }}
              placeholder="Pick month"
            />
          </div>
        </motion.div>

        {/* ── Stats Card ── */}
        <motion.div style={f.statsCard} variants={fadeInUp} custom={3}>
          <div style={f.statsGrid}>
            {/* Count */}
            <div style={f.statsCount}>
              <div style={f.statsCountNum}>{stats.peopleServed}</div>
              <div style={f.statsCountLabel}>
                {stats.peopleServed === 1 ? 'person' : 'people'} served
              </div>
              <div style={f.statsCountPeriod}>
                across {filteredEntries.length} {filteredEntries.length === 1 ? 'visit' : 'visits'} · {activeFilterLabel}
              </div>
            </div>

            {/* Breakdowns */}
            <div style={f.breakdownGrid}>
              {/* Top Reasons */}
              <div style={f.breakdownBlock}>
                <div style={f.breakdownTitle}>Top Reasons</div>
                {stats.topReasons.length === 0 ? (
                  <div style={f.breakdownEmpty}>No data</div>
                ) : (
                  stats.topReasons.map(([reason, count], i) => (
                    <div key={reason} style={f.breakdownRow}>
                      <span style={f.breakdownDot(reasonColors[i % reasonColors.length])} />
                      <span style={f.breakdownLabel}>{reason}</span>
                      <span style={f.breakdownCount}>{count}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Status Split */}
              <div style={f.breakdownBlock}>
                <div style={f.breakdownTitle}>Immigration Status</div>
                {stats.statusBreakdown.length === 0 ? (
                  <div style={f.breakdownEmpty}>No data</div>
                ) : (
                  stats.statusBreakdown.slice(0, 4).map((s) => (
                    <div key={s.label} style={f.breakdownRow}>
                      <span style={f.breakdownDot(s.color)} />
                      <span style={f.breakdownLabel}>{s.label}</span>
                      <span style={f.breakdownCount}>{s.count}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Language Split */}
              <div style={f.breakdownBlock}>
                <div style={f.breakdownTitle}>Language</div>
                {stats.langCounts.English === 0 && stats.langCounts.French === 0 ? (
                  <div style={f.breakdownEmpty}>No data</div>
                ) : (
                  <>
                    <div style={f.breakdownRow}>
                      <span style={f.breakdownDot(langColors.English)} />
                      <span style={f.breakdownLabel}>English</span>
                      <span style={f.breakdownCount}>{stats.langCounts.English}</span>
                    </div>
                    <div style={f.breakdownRow}>
                      <span style={f.breakdownDot(langColors.French)} />
                      <span style={f.breakdownLabel}>French</span>
                      <span style={f.breakdownCount}>{stats.langCounts.French}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Entries heading */}
        <motion.div variants={fadeInUp} custom={4}>
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <BarChart3 size={18} style={{ color: '#00d4ff' }} />
            Entries — {activeFilterLabel}
            <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 400, marginLeft: 6 }}>
              ({filteredEntries.length})
            </span>
          </h2>
        </motion.div>

        {loading && rawData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
            <Loader2 size={24} style={{ animation: 'clientlog-spin 1s linear infinite' }} />
          </div>
        ) : error && rawData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: '#ff3d5a' }}>
            <AlertCircle size={24} />
            <p style={{ marginTop: 8 }}>Failed to load entries</p>
            <button style={{ ...s.input, maxWidth: 120, cursor: 'pointer', marginTop: 8, textAlign: 'center' }} onClick={refresh}>
              Retry
            </button>
          </div>
        ) : (
          <motion.div style={s.entriesCard} variants={stagger}>
            {filteredEntries.length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-dim)' }}>
                {entries.length === 0
                  ? 'No entries yet. Log your first client visit above.'
                  : `No entries found for ${activeFilterLabel.toLowerCase()}.`}
              </div>
            )}
            {filteredEntries.slice(0, 50).map((entry, i) => (
              <motion.div
                key={entry.id}
                style={{ ...s.entryItem, cursor: 'pointer' }}
                variants={fadeInUp}
                custom={3 + i}
                whileHover={{ backgroundColor: 'rgba(0,212,255,0.06)' }}
                onClick={() => handleOpenEditEntry(entry)}
                title="Click to edit"
              >
                <User size={16} color="var(--text-dim)" />
                <div style={{ flex: 1 }}>
                  <div style={s.entryName}>{entry.name}</div>
                  <div style={s.entryReason}>{entry.reason}</div>
                </div>
                <span style={s.entryBadge(getStatusColor(entry.status))}>
                  {entry.status}
                </span>
                <span style={s.entryTime}>{entry.time}</span>
                <Pencil size={13} color="var(--text-dim)" style={{ opacity: 0.5 }} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Spin keyframes */}
        <style>{`
          @keyframes clientlog-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>

      {/* ── Edit Entry Modal ── */}
      <AnimatePresence>
        {editingEntry && editForm && (
          <motion.div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, overflow: 'auto' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && handleCloseEditEntry()}
          >
            <motion.div
              style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 580, position: 'relative', maxHeight: '92vh', overflowY: 'auto' }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <button
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={handleCloseEditEntry} disabled={savingEdit || deletingEntry}
              >
                <X size={20} />
              </button>

              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                <Pencil size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: '#00d4ff' }} />
                Edit Client Visit
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Update any field. Click Save Changes to commit.
              </div>

              <form onSubmit={handleSaveEditEntry}>
                {/* First + Last Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={s.label}>First Name *</label>
                    <input style={s.input} value={editForm.FirstName} onChange={(e) => updateEditField('FirstName', e.target.value)} />
                  </div>
                  <div>
                    <label style={s.label}>Last Name *</label>
                    <input style={s.input} value={editForm.LastName} onChange={(e) => updateEditField('LastName', e.target.value)} />
                  </div>
                </div>

                {/* Date / Time */}
                <div style={{ marginBottom: 14 }}>
                  <label style={s.label}>Date & Time of Visit</label>
                  <input
                    type="datetime-local"
                    style={s.input}
                    value={editForm.DateOfInteraction}
                    onChange={(e) => updateEditField('DateOfInteraction', e.target.value)}
                  />
                </div>

                {/* Reason */}
                <div style={{ marginBottom: 14 }}>
                  <label style={s.label}>Reason for Visit</label>
                  <select style={s.input} value={editForm.ReasonForVisit} onChange={(e) => updateEditField('ReasonForVisit', e.target.value)}>
                    <option value="">— None —</option>
                    {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Status */}
                <div style={{ marginBottom: 14 }}>
                  <label style={s.label}>Status in Canada</label>
                  <select style={s.input} value={editForm.StatusInCanada} onChange={(e) => updateEditField('StatusInCanada', e.target.value)}>
                    <option value="">— None —</option>
                    {statusOptions.map((opt) => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                  </select>
                </div>

                {/* Language + Family + Interaction */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={s.label}>Preferred Language</label>
                    <select style={s.input} value={editForm.PreferredLanguage} onChange={(e) => updateEditField('PreferredLanguage', e.target.value)}>
                      {languages.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Family Members</label>
                    <input type="number" min="1" style={s.input}
                      value={editForm.NumberOfFamilyMembers}
                      onChange={(e) => updateEditField('NumberOfFamilyMembers', e.target.value)} />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={s.label}>Interaction Type</label>
                  <select style={s.input} value={editForm.InteractionType} onChange={(e) => updateEditField('InteractionType', e.target.value)}>
                    {interactionTypes.map((t) => <option key={t} value={t}>{interactionLabels[t] || t}</option>)}
                  </select>
                </div>

                {/* Phone + Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={s.label}>Phone</label>
                    <input style={s.input} value={editForm.PhoneNumber} onChange={(e) => updateEditField('PhoneNumber', e.target.value)} />
                  </div>
                  <div>
                    <label style={s.label}>Email</label>
                    <input style={s.input} value={editForm.EmailAddress} onChange={(e) => updateEditField('EmailAddress', e.target.value)} />
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 14 }}>
                  <label style={s.label}>Notes</label>
                  <textarea
                    style={{ ...s.input, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }}
                    value={editForm.Notes}
                    onChange={(e) => updateEditField('Notes', e.target.value)}
                  />
                </div>

                {editSaveError && (
                  <div style={{ color: '#ff3d5a', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{editSaveError}</div>
                )}

                <motion.button
                  type="submit"
                  style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 15, cursor: savingEdit ? 'not-allowed' : 'pointer', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: editSaveSuccess ? 'rgba(0,230,118,0.2)' : 'linear-gradient(135deg, #00d4ff 0%, #00b8d9 100%)', color: editSaveSuccess ? '#00e676' : '#061218' }}
                  disabled={savingEdit || deletingEntry}
                  whileHover={!savingEdit ? { scale: 1.02 } : {}}
                  whileTap={!savingEdit ? { scale: 0.98 } : {}}
                >
                  {savingEdit ? <><Loader2 size={16} style={{ animation: 'clientlog-spin 1s linear infinite' }} /> Saving...</>
                    : editSaveSuccess ? <><Check size={16} /> Saved!</>
                    : <><Save size={16} /> Save Changes</>}
                </motion.button>

                {/* Delete section */}
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--glass-border)' }}>
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(255,61,90,0.3)', background: 'rgba(255,61,90,0.08)', color: '#ff3d5a', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={savingEdit}
                    >
                      <Trash2 size={14} /> Delete This Entry
                    </button>
                  ) : (
                    <div style={{ background: 'rgba(255,61,90,0.08)', border: '1px solid rgba(255,61,90,0.3)', borderRadius: 10, padding: 14 }}>
                      <div style={{ color: '#ff3d5a', fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={14} /> This cannot be undone
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                        Type <strong style={{ color: 'var(--text-primary)' }}>{editingEntry.name}</strong> below to confirm:
                      </div>
                      <input
                        style={{ ...s.input, marginBottom: 10 }}
                        placeholder={editingEntry.name}
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        disabled={deletingEntry}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setEditSaveError(null); }}
                          disabled={deletingEntry}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#ff3d5a', color: '#fff', fontWeight: 700, fontSize: 13, cursor: deletingEntry ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                          onClick={handleDeleteEntry}
                          disabled={deletingEntry || deleteConfirmText.trim().toLowerCase() !== editingEntry.name.trim().toLowerCase()}
                        >
                          {deletingEntry ? <><Loader2 size={14} style={{ animation: 'clientlog-spin 1s linear infinite' }} /> Deleting...</> : <><Trash2 size={14} /> Delete Permanently</>}
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
