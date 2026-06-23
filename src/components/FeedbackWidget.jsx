import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Bug,
  Sparkles,
  Palette,
  HelpCircle,
  MoreHorizontal,
  Loader2,
  Check,
} from 'lucide-react';
import { createFeedback } from '../services/graphApi';
import { useAuth } from '../hooks/useAuth';

const TYPES = [
  { key: 'Bug', label: 'Bug', icon: Bug, color: '#ff3d5a' },
  { key: 'Feature Request', label: 'Feature', icon: Sparkles, color: '#00d4ff' },
  { key: 'UI Improvement', label: 'UI', icon: Palette, color: '#a855f7' },
  { key: 'Question', label: 'Question', icon: HelpCircle, color: '#ffab00' },
  { key: 'Other', label: 'Other', icon: MoreHorizontal, color: '#8b949e' },
];

const SEVERITIES = ['Low', 'Medium', 'High'];

const PAGE_LABELS = {
  '/': 'Dashboard',
  '/clients': 'Client Log',
  '/requests': 'Supply Requests',
  '/inventory': 'Inventory',
  '/orders': 'Purchase Orders',
  '/mail': 'Mail Pickup',
  '/admin': 'Admin Dashboard',
};

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('Bug');
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const { user } = useAuth();

  const currentPage = PAGE_LABELS[location.pathname] || location.pathname;

  const reset = () => {
    setFeedbackType('Bug');
    setSeverity('Medium');
    setDescription('');
    setError(null);
    setSuccess(false);
    setSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const summary = description.trim().slice(0, 80);
      const title = `[${feedbackType}] ${summary}${description.length > 80 ? '…' : ''}`;
      await createFeedback({
        Title: title,
        FeedbackType: feedbackType,
        Page: currentPage,
        Description: description.trim(),
        Severity: severity,
        Status: 'New',
      });
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 1800);
    } catch (err) {
      console.error('Feedback submit failed:', err);
      setError(err.message || 'Could not submit. Try again or message Abhishek directly.');
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating button — bottom-right on every page */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Send feedback"
        title="Send feedback"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 250,
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          display: open ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(0, 212, 255, 0.35)',
        }}
      >
        <MessageSquare size={24} />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => !submitting && setOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                zIndex: 400,
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(520px, 92vw)',
                maxHeight: '90vh',
                overflow: 'auto',
                background: 'rgba(22, 27, 34, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: 28,
                zIndex: 401,
                color: '#e6edf3',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              }}
            >
              {success ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 32 }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    style={{
                      width: 64, height: 64, borderRadius: 16,
                      background: 'rgba(0, 230, 118, 0.15)',
                      border: '2px solid rgba(0, 230, 118, 0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Check size={32} color="#00e676" strokeWidth={2.5} />
                  </motion.div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Thanks! 🙌</h3>
                  <p style={{ color: '#8b949e', fontSize: 13, margin: 0, textAlign: 'center' }}>
                    Your feedback was sent to the admin. We'll review and act on it.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(168,85,247,0.2))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <MessageSquare size={20} color="#00d4ff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Send feedback</h3>
                      <p style={{ fontSize: 12, color: '#8b949e', margin: '2px 0 0' }}>
                        From <strong style={{ color: '#e6edf3' }}>{currentPage}</strong>
                        {user?.name && <> · as {user.name}</>}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => !submitting && setOpen(false)}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
                        color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Type chips */}
                  <label style={{ fontSize: 12, color: '#8b949e', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    What kind?
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                    {TYPES.map((t) => {
                      const Icon = t.icon;
                      const active = feedbackType === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setFeedbackType(t.key)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: active ? `${t.color}25` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${active ? `${t.color}60` : 'rgba(255,255,255,0.08)'}`,
                            color: active ? t.color : '#e6edf3',
                          }}
                        >
                          <Icon size={14} />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Description */}
                  <label style={{ fontSize: 12, color: '#8b949e', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    What's on your mind?
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      feedbackType === 'Bug'
                        ? "What went wrong? What did you expect to happen?"
                        : feedbackType === 'Feature Request'
                        ? "What would make your job easier?"
                        : "Tell us more…"
                    }
                    autoFocus
                    rows={5}
                    required
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 10,
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#e6edf3',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      minHeight: 100,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />

                  {/* Severity */}
                  <label style={{ fontSize: 12, color: '#8b949e', marginTop: 16, marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    How urgent?
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    {SEVERITIES.map((s) => {
                      const active = severity === s;
                      const color = s === 'High' ? '#ff3d5a' : s === 'Medium' ? '#ffab00' : '#00e676';
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSeverity(s)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: 10,
                            background: active ? `${color}25` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${active ? `${color}60` : 'rgba(255,255,255,0.08)'}`,
                            color: active ? color : '#e6edf3',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>

                  {/* Error */}
                  {error && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                      background: 'rgba(255,61,90,0.1)', border: '1px solid rgba(255,61,90,0.2)',
                      color: '#ff3d5a', fontSize: 13,
                    }}>
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting || !description.trim()}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      borderRadius: 12,
                      background: submitting || !description.trim()
                        ? 'rgba(0,212,255,0.15)'
                        : 'linear-gradient(135deg, #00d4ff, #a855f7)',
                      border: 'none',
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: submitting || !description.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Sending…
                      </>
                    ) : (
                      'Send feedback'
                    )}
                  </button>

                  <p style={{ fontSize: 11, color: '#484f58', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
                    Sent to the admin's inbox. Your name & email are attached automatically.
                  </p>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
