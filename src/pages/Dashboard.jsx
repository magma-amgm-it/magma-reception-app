import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  PackageSearch,
  CheckCircle2,
  Mail,
  Sparkles,
  Clock,
  ArrowRight,
  Inbox,
} from 'lucide-react';
import { format, parseISO, isSameMonth } from 'date-fns';
import PageWrapper from '../components/Layout/PageWrapper';
import { useSharePointList } from '../hooks/useSharePointList';
import { useAuth } from '../hooks/useAuth';

// ─── Stage colors (match Supply Requests board) ───
const STAGE_COLOR = {
  New: '#E06B7A',
  Received: '#FEA614',
  'Pending Order': '#39C0E0',
  'Ready to Pick Up': '#31D3AE',
  Completed: '#8792A0',
};
// Display label — the SharePoint status stays "Received", but we show
// "Request received" so staff don't think their item arrived.
const STAGE_LABEL = { Received: 'Request received' };
const stageLabel = (s) => STAGE_LABEL[s] || s;

// ─── Helpers ───
const lc = (v) => (v || '').toString().trim().toLowerCase();

function parseDate(val) {
  if (!val) return null;
  try {
    return typeof val === 'string' ? parseISO(val) : new Date(val);
  } catch {
    return null;
  }
}

// A request "belongs to me" if I created it, or the RequestedBy person is me.
function requestIsMine(item, user) {
  if (!user) return false;
  const email = lc(user.email);
  const name = lc(user.name);
  const cb = item.createdBy?.user || {};
  const rb = item.fields?.RequestedBy;
  const rbName = lc(rb?.LookupValue || rb);
  const rbEmail = lc(rb?.Email || rb?.email);
  return (
    (email && lc(cb.email) === email) ||
    (email && rbEmail === email) ||
    (name && lc(cb.displayName) === name) ||
    (name && rbName === name)
  );
}

function mailIsMine(item, user) {
  if (!user) return false;
  const email = lc(user.email);
  const name = lc(user.name);
  const re = lc(item.fields?.RecipientEmail);
  const rn = lc(item.fields?.RecipientName);
  return (email && re === email) || (name && rn === name);
}

// ─── Animated count ───
function CountUp({ value, color }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!value) { setN(0); return; }
    let raf;
    const dur = 800;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div style={{ fontFamily: 'var(--font-head)', fontSize: 34, fontWeight: 700, color: 'var(--brand-ink)', lineHeight: 1, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
      {n}
    </div>
  );
}

// ─── Stat card ───
function StatCard({ icon: Icon, label, value, sublabel, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, display: 'flex', alignItems: 'center', gap: 8 }}>
          {label}
        </span>
        <span style={{ width: 38, height: 38, borderRadius: 12, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={19} />
        </span>
      </div>
      <CountUp value={value} color={color} />
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sublabel}</div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: supplyData, loading: sl } = useSharePointList('supplyRequests');
  const { data: mailData, loading: ml } = useSharePointList('mailPickups');

  const firstName = (user?.name || 'there').split(' ')[0];

  const me = useMemo(() => {
    const myRequests = (supplyData || [])
      .filter((r) => requestIsMine(r, user))
      .map((r) => ({
        id: r.id,
        title: r.fields?.Title || r.fields?.RequestedItems || 'Request',
        status: r.fields?.Status || 'New',
        date: parseDate(r.fields?.DateOfRequest || r.createdDateTime),
        completedDate: parseDate(r.fields?.DateCompleted),
      }))
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

    const myMail = (mailData || [])
      .filter((m) => mailIsMine(m, user) && (m.fields?.Status || 'Pending') === 'Pending')
      .map((m) => ({
        id: m.id,
        desc: m.fields?.MailDescription || 'Mail / package',
        date: parseDate(m.fields?.DateNotified || m.createdDateTime),
      }))
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

    const open = myRequests.filter((r) => r.status !== 'Completed');
    const ready = myRequests.filter((r) => r.status === 'Ready to Pick Up');
    const completedThisMonth = myRequests.filter(
      (r) => r.status === 'Completed' && r.completedDate && isSameMonth(r.completedDate, new Date())
    );

    return { myRequests, open, ready, myMail, completedThisMonth };
  }, [supplyData, mailData, user]);

  const loading = (sl || ml) && supplyData.length === 0 && mailData.length === 0;

  return (
    <PageWrapper title="Dashboard">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Hi, {firstName} 👋
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Everything that's yours, in one place.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={PackageSearch} label="My open requests" value={me.open.length} sublabel="In progress right now" color="#FEA614" delay={0} />
        <StatCard icon={CheckCircle2} label="Ready to pick up" value={me.ready.length} sublabel="Waiting at reception for you" color="#31D3AE" delay={0.05} />
        <StatCard icon={Mail} label="Mail waiting" value={me.myMail.length} sublabel="Packages & letters for you" color="#39C0E0" delay={0.1} />
        <StatCard icon={Sparkles} label="Completed this month" value={me.completedThisMonth.length} sublabel="Requests fulfilled for you" color="#BFD330" delay={0.15} />
      </div>

      {/* Body: your requests + your mail */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        {/* Your requests */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: '1px solid var(--border-default)' }}>
            <PackageSearch size={18} color="var(--brand-navy)" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--brand-ink)' }}>Your requests</h3>
            <button onClick={() => navigate('/requests')} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--brand-orange)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          {loading ? (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
          ) : me.open.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No open requests — you're all caught up. ✨
            </div>
          ) : (
            <div style={{ padding: '6px 0' }}>
              {me.open.slice(0, 6).map((r) => {
                const c = STAGE_COLOR[r.status] || '#8b949e';
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: c, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'var(--brand-ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: c, color: '#fff', whiteSpace: 'nowrap' }}>{stageLabel(r.status)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Your mail */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: '1px solid var(--border-default)' }}>
            <Inbox size={18} color="var(--brand-navy)" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--brand-ink)' }}>Your mail</h3>
            <button onClick={() => navigate('/mail')} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--brand-orange)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          {loading ? (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
          ) : me.myMail.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No mail waiting for you right now.
            </div>
          ) : (
            <div style={{ padding: '6px 0' }}>
              {me.myMail.slice(0, 6).map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: '#39C0E0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={16} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: 'var(--brand-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.desc}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{m.date ? format(m.date, 'MMM d, h:mm a') : '—'}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: '#31D3AE', color: '#fff', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={11} /> Waiting
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
