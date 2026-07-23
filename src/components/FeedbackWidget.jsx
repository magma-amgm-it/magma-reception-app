import { useState, useEffect } from 'react';
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
  Lightbulb,
} from 'lucide-react';
import { createFeedback } from '../services/graphApi';
import { useAuth } from '../hooks/useAuth';

const TYPES = [
  { key: 'Bug', label: 'Bug', icon: Bug, color: '#E06B7A' },
  { key: 'Feature Request', label: 'Feature', icon: Sparkles, color: '#39C0E0' },
  { key: 'UI Improvement', label: 'UI', icon: Palette, color: '#7C76B8' },
  { key: 'Question', label: 'Question', icon: HelpCircle, color: '#FEA614' },
  { key: 'Other', label: 'Other', icon: MoreHorizontal, color: '#8792A0' },
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

const INTRO_DURATION_MS = 6000;
const introStorageKey = (email) => `magma_feedback_intro_dismissed_${(email || 'anon').toLowerCase()}`;

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('Bug');
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showIntro, setShowIntro] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const currentPage = PAGE_LABELS[location.pathname] || location.pathname;

  // Intro tooltip: show once ever per user, dismiss permanently after
  useEffect(() => {
    if (!user?.email) return;
    const key = introStorageKey(user.email);
    if (localStorage.getItem(key)) return;
    // small delay so it doesn't fight the page-load animation
    const showTimer = setTimeout(() => setShowIntro(true), 800);
    return () => clearTimeout(showTimer);
  }, [user?.email]);

  // Auto-dismiss after 6s
  useEffect(() => {
    if (!showIntro) return;
    const timer = setTimeout(() => dismissIntro(), INTRO_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIntro]);

  const dismissIntro = () => {
    if (user?.email) {
      localStorage.setItem(introStorageKey(user.email), new Date().toISOString());
    }
    setShowIntro(false);
  };

  const reset = () => {
    setFeedbackType('Bug');
    setSeverity('Medium');
    setDescription('');
    setError(null);
    setSuccess(false);
    setSubmitting(false);
  };

  const handleOpen = () => {
    dismissIntro();
    setOpen(true);
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
      {/* Pulse keyframes injected once */}
      <style>{`
        @keyframes feedbackPulse {
          0%, 100% { box-shadow: 0 8px 22px rgba(40, 39, 64, 0.22), 0 0 0 0 rgba(254, 166, 20, 0.5); }
          50%      { box-shadow: 0 8px 22px rgba(40, 39, 64, 0.22), 0 0 0 14px rgba(254, 166, 20, 0); }
        }
      `}</style>

      {/* Floating button — bottom-right on every page */}
      <motion.button
        onClick={handleOpen}
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
          background: '#413C60',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          display: open ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 22px rgba(40, 39, 64, 0.22)',
          animation: showIntro ? 'feedbackPulse 1.6s ease-in-out infinite' : 'none',
        }}
      >
        <MessageSquare size={24} />
      </motion.button>

      {/* Intro tooltip — first ever sign-in, 6s, dismisses forever */}
      <AnimatePresence>
        {showIntro && !open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={handleOpen}
            style={{
              position: 'fixed',
              bottom: 94,
              right: 24,
              zIndex: 251,
              maxWidth: 280,
              padding: '14px 16px',
              borderRadius: 14,
              background: '#FFFFFF',
              border: '1px solid #E4E4E8',
              boxShadow: '0 12px 32px rgba(40,39,64,0.16)',
              cursor: 'pointer',
              color: '#2B2740',
            }}
          >
            {/* Speech-bubble tail pointing to button */}
            <div style={{
              position: 'absolute',
              bottom: -7,
              right: 26,
              width: 14,
              height: 14,
              background: '#FFFFFF',
              borderRight: '1px solid #E4E4E8',
              borderBottom: '1px solid #E4E4E8',
              transform: 'rotate(45deg)',
            }} />

            <button
              onClick={(e) => { e.stopPropagation(); dismissIntro(); }}
              aria-label="Dismiss"
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 22,
                height: 22,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: '#9AA0A6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(40,39,64,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <X size={13} />
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingRight: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'rgba(254,166,20,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Lightbulb size={15} color="#FEA614" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 10, color: '#FEA614', fontWeight: 700, letterSpacing: 1,
                  marginBottom: 4,
                }}>
                  NEW
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45, fontWeight: 600, color: '#2B2740' }}>
                  Got an idea? Found a bug? Let me know!
                </div>
                <div style={{ fontSize: 11, color: '#9AA0A6', marginTop: 6 }}>
                  Click anywhere on this card to start.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal — centered via flexbox parent so framer transforms don't fight */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !submitting && setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(40, 39, 64, 0.4)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(520px, 100%)',
                maxHeight: '90vh',
                overflow: 'auto',
                background: '#FFFFFF',
                border: '1px solid #E4E4E8',
                borderRadius: 16,
                padding: 28,
                color: '#2B2740',
                boxShadow: '0 24px 64px rgba(40,39,64,0.22)',
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
                      background: 'rgba(87, 193, 165, 0.15)',
                      border: '2px solid rgba(87, 193, 165, 0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Check size={32} color="#31D3AE" strokeWidth={2.5} />
                  </motion.div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Thanks! 🙌</h3>
                  <p style={{ color: '#525366', fontSize: 13, margin: 0, textAlign: 'center' }}>
                    Your feedback was sent to the admin. We'll review and act on it.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'rgba(254,166,20,0.14)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <MessageSquare size={20} color="#FEA614" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Send feedback</h3>
                      <p style={{ fontSize: 12, color: '#9AA0A6', margin: '2px 0 0' }}>
                        From <strong style={{ color: '#2B2740' }}>{currentPage}</strong>
                        {user?.name && <> · as {user.name}</>}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => !submitting && setOpen(false)}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
                        color: '#9AA0A6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Type chips */}
                  <label style={{ fontSize: 12, color: '#9AA0A6', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                            background: active ? `${t.color}22` : '#F7F7F9',
                            border: `1px solid ${active ? `${t.color}80` : '#E4E4E8'}`,
                            color: active ? t.color : '#525366',
                          }}
                        >
                          <Icon size={14} />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Description */}
                  <label style={{ fontSize: 12, color: '#9AA0A6', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                      background: '#F9F9F9',
                      border: '1px solid #E4E4E8',
                      color: '#2B2740',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      minHeight: 100,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#FEA614'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#E4E4E8'}
                  />

                  {/* Severity */}
                  <label style={{ fontSize: 12, color: '#9AA0A6', marginTop: 16, marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    How urgent?
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    {SEVERITIES.map((s) => {
                      const active = severity === s;
                      const color = s === 'High' ? '#E06B7A' : s === 'Medium' ? '#FEA614' : '#31D3AE';
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSeverity(s)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: 10,
                            background: active ? `${color}22` : '#F7F7F9',
                            border: `1px solid ${active ? `${color}80` : '#E4E4E8'}`,
                            color: active ? color : '#525366',
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
                      background: 'rgba(241,98,120,0.1)', border: '1px solid rgba(241,98,120,0.25)',
                      color: '#D8455A', fontSize: 13,
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
                      borderRadius: 10,
                      background: submitting || !description.trim()
                        ? '#FFD48A'
                        : '#FEA614',
                      border: 'none',
                      color: '#fff',
                      fontFamily: "'Poppins', sans-serif",
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

                  <p style={{ fontSize: 11, color: '#B9BDC4', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
                    Sent to the admin's inbox. Your name & email are attached automatically.
                  </p>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
