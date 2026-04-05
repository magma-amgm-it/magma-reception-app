import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Camera,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  Check,
  Plus,
  Minus,
  Printer,
  CameraOff,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import PageWrapper from '../components/Layout/PageWrapper';
import { useSharePointList } from '../hooks/useSharePointList';
import { updateInventoryItem } from '../services/graphApi';
import { useScanner } from '../hooks/useScanner';
import { QR_PREFIX } from '../components/Inventory/QRSheet';

const categoryColor = {
  'Office Supplies': '#00d4ff',
  'Kitchen/Break Room': '#00e676',
  Cleaning: '#26a69a',
  Bathroom: '#a855f7',
  CELPIP: '#26c6da',
  Other: '#8b949e',
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

function getStockColor(quantity, threshold) {
  if (!threshold || threshold === 0) return '#00e676';
  if (quantity <= threshold * 0.3) return '#ff3d5a';
  if (quantity <= threshold * 0.7) return '#ffab00';
  return '#00e676';
}

function getStockPercent(quantity, threshold) {
  if (!threshold || threshold === 0) return 50;
  return Math.min(100, (quantity / (threshold * 2)) * 100);
}

const s = {
  controlsRow: { display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center' },
  searchWrap: { flex: 1, minWidth: 220, position: 'relative' },
  searchIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: 'var(--space-3) var(--space-4) var(--space-3) 42px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: 'var(--text-md)', minHeight: 48, outline: 'none' },
  modeToggle: { display: 'flex', gap: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--glass-border)' },
  modeBtn: (active, color) => ({ padding: 'var(--space-3) var(--space-6)', background: active ? color + '20' : 'rgba(255,255,255,0.03)', color: active ? color : 'var(--text-muted)', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer', border: 'none', minHeight: 48, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', transition: 'all 0.2s' }),
  actionBtn: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 'var(--text-sm)', cursor: 'pointer', minHeight: 48 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-5)' },
  card: { background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur))', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', position: 'relative', overflow: 'hidden', cursor: 'pointer' },
  cardName: { fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' },
  catBadge: (color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-full)', background: color + '18', color, fontSize: 'var(--text-xs)', fontWeight: 600, alignSelf: 'flex-start' }),
  qtyRow: { display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' },
  qtyNumber: (color) => ({ fontSize: '2.2rem', fontWeight: 800, color, lineHeight: 1 }),
  qtyLabel: { fontSize: 'var(--text-xs)', color: 'var(--text-muted)' },
  progressTrack: { width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  progressFill: (percent, color) => ({ width: `${percent}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.5s ease' }),
  lowBadge: { position: 'absolute', top: 12, right: 12, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(255,61,90,0.18)', color: '#ff3d5a', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 },
  vendorBadge: { fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginTop: 'auto' },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)', color: 'var(--text-muted)' },
  errorWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)', color: '#ff3d5a' },
  retryBtn: { padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', background: 'rgba(255,61,90,0.15)', border: '1px solid rgba(255,61,90,0.3)', color: '#ff3d5a', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
};

// ─── Modal styles ───
const m = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, position: 'relative', textAlign: 'center' },
  title: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 },
  subtitle: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 },
  closeBtn: { position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 },
  stepBtn: { width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' },
  stepNum: (color) => ({ fontSize: 40, fontWeight: 800, color, minWidth: 60, textAlign: 'center', lineHeight: 1 }),
  confirmBtn: (loading, success, color) => ({ width: '100%', padding: 14, borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: loading ? color + '15' : success ? 'rgba(0,230,118,0.2)' : color + '20', color: success ? '#00e676' : color, borderWidth: 1, borderStyle: 'solid', borderColor: success ? 'rgba(0,230,118,0.4)' : color + '40' }),
  error: { color: '#ff3d5a', fontSize: 13, marginBottom: 12 },
  currentQty: { fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 },
};

// ─── Scanner overlay styles ───
const sc = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  title: { color: '#fff', fontSize: 16, fontWeight: 700 },
  closeBtn: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 16px', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 },
  viewfinder: { width: 280, height: 280, borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(0,212,255,0.4)', boxShadow: '0 0 40px rgba(0,212,255,0.15)' },
  hint: { color: 'var(--text-muted)', fontSize: 13, marginTop: 20, textAlign: 'center' },
  errorMsg: { color: '#ff3d5a', fontSize: 14, marginTop: 16, textAlign: 'center', maxWidth: 300 },
  successMsg: { color: '#00e676', fontSize: 14, fontWeight: 600, marginTop: 16 },
};

const SCANNER_ID = 'magma-inv-scanner';

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('in');
  const { data: rawData, loading, error, refresh } = useSharePointList('inventory');

  // ── Update modal state ──
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // ── Scanner state ──
  const [showScanner, setShowScanner] = useState(false);
  const [scanMessage, setScanMessage] = useState(null);
  const { startScanning, stopScanning, lastScannedCode, clearLastCode, isScanning, error: scanError } = useScanner();

  const items = rawData.map((item) => ({
    id: item.id,
    name: item.fields?.Title || 'Unnamed',
    category: item.fields?.Category || 'Other',
    quantity: item.fields?.CurrentQuantity ?? 0,
    threshold: item.fields?.MinimumThreshold ?? 0,
    vendor: item.fields?.PreferredVendor || '—',
    unit: item.fields?.Unit || '',
  }));

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCardClick = (item) => {
    setSelectedItem(item);
    setAdjustQty(1);
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  const handleUpdate = async () => {
    if (!selectedItem || adjustQty < 1) return;
    const newQty = mode === 'in'
      ? selectedItem.quantity + adjustQty
      : Math.max(0, selectedItem.quantity - adjustQty);
    setUpdating(true);
    setUpdateError(null);
    try {
      await updateInventoryItem(selectedItem.id, { CurrentQuantity: newQty });
      setUpdateSuccess(true);
      refresh();
      setTimeout(() => { setUpdateSuccess(false); setSelectedItem(null); }, 1000);
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // ── Scanner handlers ──
  const handleOpenScanner = useCallback(async () => {
    clearLastCode(); // Reset previous scan so it doesn't auto-trigger
    setShowScanner(true);
    setScanMessage(null);
    // Small delay to let the DOM render the scanner container
    setTimeout(() => startScanning(SCANNER_ID), 300);
  }, [startScanning, clearLastCode]);

  const handleCloseScanner = useCallback(async () => {
    await stopScanning();
    setShowScanner(false);
    setScanMessage(null);
  }, [stopScanning]);

  // Handle scanned QR code
  useEffect(() => {
    if (!lastScannedCode || !showScanner) return;

    // Check if it's a MAGMA inventory QR code
    if (!lastScannedCode.startsWith(QR_PREFIX)) {
      setScanMessage({ type: 'error', text: 'Not a MAGMA inventory QR code' });
      return;
    }

    const itemId = lastScannedCode.slice(QR_PREFIX.length);
    const matchedItem = items.find(i => String(i.id) === String(itemId));

    if (!matchedItem) {
      setScanMessage({ type: 'error', text: `Item not found (ID: ${itemId})` });
      return;
    }

    // Found it — close scanner and open check-in/out modal
    setScanMessage({ type: 'success', text: `Found: ${matchedItem.name}` });
    setTimeout(async () => {
      await stopScanning();
      setShowScanner(false);
      setScanMessage(null);
      handleCardClick(matchedItem);
    }, 800);
  }, [lastScannedCode, showScanner, items, stopScanning]);

  // ── Print QR Sheet ──
  const handlePrintQR = useCallback(() => {
    // Open QR sheet in a new window
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Please allow popups to print QR codes');
      return;
    }

    // Dynamically import and render QR sheet
    import('../components/Inventory/QRSheet.jsx').then(({ default: QRSheet }) => {
      import('react-dom/client').then(({ createRoot }) => {
        import('qrcode.react').then(() => {
          printWindow.document.title = 'MAGMA Inventory QR Codes';
          printWindow.document.body.style.margin = '0';
          const root = printWindow.document.createElement('div');
          printWindow.document.body.appendChild(root);
          createRoot(root).render(
            // Can't use JSX in dynamic import context, so we use createElement
            null
          );
        });
      });
    });

    // Simpler approach: build HTML with QR codes directly
    const categoryOrder = ['Office Supplies', 'Kitchen/Break Room', 'Cleaning', 'Bathroom', 'CELPIP', 'Other'];
    const grouped = {};
    items.forEach(item => {
      const cat = item.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    const sortedCats = categoryOrder.filter(c => grouped[c]);
    Object.keys(grouped).forEach(c => { if (!sortedCats.includes(c)) sortedCats.push(c); });

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Use the Google Charts QR API for the print page (simplest cross-window approach)
    const qrUrl = (id) => `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(QR_PREFIX + id)}`;

    const html = `<!DOCTYPE html>
<html><head><title>MAGMA Inventory QR Codes</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #1a1a1a; padding: 20px 30px; }
  .header { text-align: center; border-bottom: 3px solid #0078D4; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; color: #0078D4; }
  .header p { font-size: 11px; color: #666; margin-top: 6px; }
  .cat-title { font-size: 15px; font-weight: 700; border-bottom: 2px solid #e0e0e0; padding-bottom: 6px; margin-top: 28px; margin-bottom: 16px; page-break-after: avoid; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 12px; }
  .card { border: 1px solid #d0d0d0; border-radius: 8px; padding: 12px; text-align: center; page-break-inside: avoid; background: #fafafa; }
  .card img { width: 100px; height: 100px; margin-bottom: 8px; }
  .card .name { font-size: 11px; font-weight: 700; line-height: 1.3; margin-bottom: 3px; }
  .card .cat { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .card .iid { font-size: 7px; color: #bbb; margin-top: 4px; font-family: monospace; }
  .footer { text-align: center; border-top: 1px solid #e0e0e0; padding-top: 12px; margin-top: 32px; font-size: 10px; color: #999; }
  .print-btn { position: fixed; bottom: 24px; right: 24px; padding: 14px 28px; border-radius: 10px; background: #0078D4; color: #fff; font-weight: 700; font-size: 15px; border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
  @media print { .print-btn { display: none; } @page { margin: 0.5in; } }
</style></head><body>
<div class="header">
  <h1>MAGMA Reception — Inventory QR Codes</h1>
  <p>Scan any code with the MAGMA Reception App to check in/out items instantly<br/>Generated: ${today} | ${items.length} items</p>
</div>
${sortedCats.map(cat => `
  <div class="cat-title">${cat}</div>
  <div class="grid">
    ${grouped[cat].map(item => `
      <div class="card">
        <img src="${qrUrl(item.id)}" alt="QR: ${item.name}" />
        <div class="name">${item.name}</div>
        <div class="cat">${cat}</div>
        <div class="iid">ID: ${item.id}</div>
      </div>
    `).join('')}
  </div>
`).join('')}
<div class="footer">MAGMA Reception Inventory Management System<br/>Keep this sheet at the reception desk. Reprint when new items are added.</div>
<button class="print-btn" onclick="window.print()">Print This Sheet</button>
</body></html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }, [items]);

  const modeColor = mode === 'in' ? '#00e676' : '#ff3d5a';
  const modeLabel = mode === 'in' ? 'Check In' : 'Check Out';

  if (loading && rawData.length === 0) {
    return (
      <PageWrapper title="Inventory">
        <div style={s.loadingWrap}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading inventory...</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </PageWrapper>
    );
  }

  if (error && rawData.length === 0) {
    return (
      <PageWrapper title="Inventory">
        <div style={s.errorWrap}>
          <AlertCircle size={32} />
          <span>Failed to load inventory</span>
          <span style={{ fontSize: 'var(--text-xs)', maxWidth: 400, textAlign: 'center', opacity: 0.7 }}>{error.message}</span>
          <button style={s.retryBtn} onClick={refresh}><RefreshCw size={14} /> Retry</button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Inventory">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        {/* Controls Row */}
        <motion.div style={s.controlsRow} variants={fadeInUp} custom={0}>
          <div style={s.searchWrap}>
            <Search size={18} style={s.searchIcon} />
            <input style={s.searchInput} placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={s.modeToggle}>
            <motion.button style={s.modeBtn(mode === 'in', '#00e676')} onClick={() => setMode('in')} whileTap={{ scale: 0.97 }}>
              <ArrowDownCircle size={16} /> CHECK IN
            </motion.button>
            <motion.button style={s.modeBtn(mode === 'out', '#ff3d5a')} onClick={() => setMode('out')} whileTap={{ scale: 0.97 }}>
              <ArrowUpCircle size={16} /> CHECK OUT
            </motion.button>
          </div>
          <motion.button style={s.actionBtn} onClick={handleOpenScanner}
            whileHover={{ scale: 1.04, boxShadow: '0 0 16px rgba(0,212,255,0.25)' }} whileTap={{ scale: 0.96 }}>
            <Camera size={18} /> Scan
          </motion.button>
          <motion.button style={s.actionBtn} onClick={handlePrintQR}
            whileHover={{ scale: 1.04, boxShadow: '0 0 16px rgba(0,212,255,0.25)' }} whileTap={{ scale: 0.96 }}>
            <Printer size={18} /> Print QR Sheet
          </motion.button>
        </motion.div>

        {/* Tap hint */}
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16, textAlign: 'center' }}>
          Tap an item to {modeLabel.toLowerCase()}, or scan a QR code
        </div>

        {/* Item Grid */}
        <motion.div style={s.grid} variants={stagger}>
          {filtered.map((item, i) => {
            const isLow = item.threshold > 0 && item.quantity <= item.threshold;
            const stockColor = getStockColor(item.quantity, item.threshold);
            const percent = getStockPercent(item.quantity, item.threshold);
            const catColor = categoryColor[item.category] || '#8b949e';
            return (
              <motion.div key={item.id} style={{ ...s.card, borderColor: mode === 'out' ? 'rgba(255,61,90,0.15)' : 'var(--glass-border)' }}
                variants={fadeInUp} custom={1 + i}
                whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', borderColor: modeColor + '40' }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => handleCardClick(item)}>
                {isLow && (
                  <motion.div style={s.lowBadge} animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <AlertTriangle size={10} /> LOW STOCK
                  </motion.div>
                )}
                <div style={s.cardName}>{item.name}</div>
                <span style={s.catBadge(catColor)}>{item.category}</span>
                <div style={s.qtyRow}>
                  <span style={s.qtyNumber(stockColor)}>{item.quantity}</span>
                  <span style={s.qtyLabel}>{item.unit ? `${item.unit} ` : ''}/ {item.threshold} threshold</span>
                </div>
                <div style={s.progressTrack}><div style={s.progressFill(percent, stockColor)} /></div>
                <div style={s.vendorBadge}>Preferred: {item.vendor}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-dim)' }}>
            {search ? 'No items match your search.' : 'No inventory items found.'}
          </div>
        )}
      </motion.div>

      {/* ── Scanner Overlay ── */}
      <AnimatePresence>
        {showScanner && (
          <motion.div style={sc.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={sc.header}>
              <span style={sc.title}>Scan Inventory QR Code</span>
              <button style={sc.closeBtn} onClick={handleCloseScanner}>
                <CameraOff size={14} /> Close
              </button>
            </div>
            <div id={SCANNER_ID} style={sc.viewfinder} />
            {!scanError && !scanMessage && (
              <div style={sc.hint}>Point your camera at an inventory QR code</div>
            )}
            {scanError && <div style={sc.errorMsg}>{scanError}</div>}
            {scanMessage?.type === 'error' && <div style={sc.errorMsg}>{scanMessage.text}</div>}
            {scanMessage?.type === 'success' && <div style={sc.successMsg}>{scanMessage.text}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Update Quantity Modal ── */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div style={m.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setSelectedItem(null)}>
            <motion.div style={m.modal} initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
              <button style={m.closeBtn} onClick={() => setSelectedItem(null)}><X size={20} /></button>
              <div style={m.title}>{modeLabel}: {selectedItem.name}</div>
              <div style={m.subtitle}>{selectedItem.category} {selectedItem.unit ? `(${selectedItem.unit})` : ''}</div>
              <div style={m.currentQty}>
                Current stock: <strong style={{ color: 'var(--text-primary)' }}>{selectedItem.quantity}</strong>
                {' → '}
                <strong style={{ color: modeColor }}>
                  {mode === 'in' ? selectedItem.quantity + adjustQty : Math.max(0, selectedItem.quantity - adjustQty)}
                </strong>
              </div>
              <div style={m.stepper}>
                <motion.button style={m.stepBtn} whileTap={{ scale: 0.9 }} onClick={() => setAdjustQty(Math.max(1, adjustQty - 1))}><Minus size={20} /></motion.button>
                <span style={m.stepNum(modeColor)}>{adjustQty}</span>
                <motion.button style={m.stepBtn} whileTap={{ scale: 0.9 }} onClick={() => setAdjustQty(adjustQty + 1)}><Plus size={20} /></motion.button>
              </div>
              {updateError && <div style={m.error}>{updateError}</div>}
              <motion.button style={m.confirmBtn(updating, updateSuccess, modeColor)} onClick={handleUpdate} disabled={updating}
                whileHover={!updating ? { scale: 1.02 } : {}} whileTap={!updating ? { scale: 0.98 } : {}}>
                {updating ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</>
                  : updateSuccess ? <><Check size={16} /> Updated!</>
                  : <>{mode === 'in' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />} {modeLabel} {adjustQty} {selectedItem.unit || 'units'}</>}
              </motion.button>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
