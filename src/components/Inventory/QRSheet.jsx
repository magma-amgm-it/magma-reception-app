import { QRCodeSVG } from 'qrcode.react';

const QR_PREFIX = 'MAGMA-INV-';

const categoryOrder = ['Office Supplies', 'Kitchen/Break Room', 'Cleaning', 'Bathroom', 'CELPIP', 'Other'];

const styles = {
  page: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    background: '#ffffff',
    color: '#1a1a1a',
    padding: '20px 30px',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    borderBottom: '3px solid #0078D4',
    paddingBottom: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0078D4',
    margin: 0,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  categoryHeader: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a1a',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: 6,
    marginTop: 28,
    marginBottom: 16,
    pageBreakAfter: 'avoid',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 12,
  },
  card: {
    border: '1px solid #d0d0d0',
    borderRadius: 8,
    padding: 12,
    textAlign: 'center',
    pageBreakInside: 'avoid',
    background: '#fafafa',
  },
  qrWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1a1a1a',
    lineHeight: 1.3,
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 9,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  itemId: {
    fontSize: 8,
    color: '#bbb',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  footer: {
    textAlign: 'center',
    borderTop: '1px solid #e0e0e0',
    paddingTop: 12,
    marginTop: 32,
    fontSize: 10,
    color: '#999',
  },
  printBtn: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    padding: '14px 28px',
    borderRadius: 10,
    background: '#0078D4',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    zIndex: 100,
  },
  noPrint: {
    '@media print': { display: 'none' },
  },
};

// Print CSS injected into the page
const printCSS = `
  @media print {
    .no-print { display: none !important; }
    body { margin: 0; padding: 0; }
    @page { margin: 0.5in; }
  }
`;

export default function QRSheet({ items = [] }) {
  // Group items by category
  const grouped = {};
  items.forEach(item => {
    const cat = item.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  // Sort categories by predefined order
  const sortedCategories = categoryOrder.filter(c => grouped[c]);
  // Add any categories not in the predefined list
  Object.keys(grouped).forEach(c => {
    if (!sortedCategories.includes(c)) sortedCategories.push(c);
  });

  const handlePrint = () => window.print();

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div style={styles.page}>
      <style>{printCSS}</style>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>MAGMA Reception — Inventory QR Codes</h1>
        <div style={styles.subtitle}>
          Scan any code with the MAGMA Reception App to check in/out items instantly
          <br />
          Generated: {today} | {items.length} items
        </div>
      </div>

      {/* Categories + QR Cards */}
      {sortedCategories.map(category => (
        <div key={category}>
          <div style={styles.categoryHeader}>{category}</div>
          <div style={styles.grid}>
            {grouped[category].map(item => (
              <div key={item.id} style={styles.card}>
                <div style={styles.qrWrap}>
                  <QRCodeSVG
                    value={`${QR_PREFIX}${item.id}`}
                    size={100}
                    level="M"
                    includeMargin={false}
                    bgColor="#fafafa"
                    fgColor="#1a1a1a"
                  />
                </div>
                <div style={styles.itemName}>{item.name}</div>
                <div style={styles.itemCategory}>{category}</div>
                <div style={styles.itemId}>ID: {item.id}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div style={styles.footer}>
        MAGMA Reception Inventory Management System
        <br />
        Keep this sheet at the reception desk. Reprint when new items are added.
      </div>

      {/* Print button (hidden when printing) */}
      <button className="no-print" style={styles.printBtn} onClick={handlePrint}>
        Print This Sheet
      </button>
    </div>
  );
}

export { QR_PREFIX };
