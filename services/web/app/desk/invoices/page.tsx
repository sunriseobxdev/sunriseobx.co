'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cardStyle, cardTitleStyle, inputStyle, labelStyle, buttonPrimary, buttonSecondary, badgeStyle, colors, thStyle, tdStyle, tableStyle } from '@/lib/desk-styles';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  issue_date: string;
  due_date: string;
  total: string;
  status: string;
  pdf_path: string;
  job_id?: string;
  job_number?: string;
  job_title?: string;
  line_items?: { description: string; quantity: number; rate: number; amount: number }[];
  client_email?: string;
  client_address?: string;
  subtotal?: string;
  tax_rate?: string;
  tax_amount?: string;
  notes?: string;
}

function usd(n: string | number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));
}

const statusBadgeVariant: Record<string, 'muted' | 'info' | 'success' | 'danger'> = {
  draft: 'muted', sent: 'info', paid: 'success', overdue: 'danger',
};

type View = 'list' | 'create';

interface LineItem {
  description: string;
  quantity: string;
  rate: string;
}

export default function InvoicesPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.privileges.includes('manage_invoices');

  const [view, setView] = useState<View>('list');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string>('');

  // Create form
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: '1', rate: '' },
  ]);

  const showFlash = useCallback((type: 'success' | 'error', msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 4000);
  }, []);

  const loadInvoices = useCallback(async () => {
    try {
      const data = await apiFetch('/api/invoices');
      setInvoices(data);
    } catch { /* handled */ }
  }, []);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  // Pre-fill from job context via query params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qJob = params.get('job');
    const qClient = params.get('client');
    const qAddress = params.get('address');
    if (qJob) {
      setJobId(qJob);
      if (qClient) setClientName(qClient);
      if (qAddress) setClientAddress(qAddress);
      setView('create');
    }
  }, []);

  function addLineItem() {
    setLineItems([...lineItems, { description: '', quantity: '1', rate: '' }]);
  }

  function removeLineItem(idx: number) {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  }

  function updateLineItem(idx: number, key: keyof LineItem, value: string) {
    const updated = [...lineItems];
    updated[idx] = { ...updated[idx], [key]: value };
    setLineItems(updated);
  }

  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
  }, 0);

  async function handleCreate() {
    if (!invoiceNumber || !clientName || !issueDate || !dueDate) {
      showFlash('error', 'Invoice number, client, dates are required');
      return;
    }
    const items = lineItems.filter((li) => li.description && li.rate);
    if (items.length === 0) {
      showFlash('error', 'At least one line item is required');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          invoiceNumber, clientName, clientEmail, clientAddress,
          issueDate, dueDate,
          lineItems: items.map((li) => ({
            description: li.description,
            quantity: parseFloat(li.quantity) || 1,
            rate: parseFloat(li.rate) || 0,
          })),
          taxRate: parseFloat(taxRate) / 100 || 0,
          notes,
          ...(jobId ? { jobId } : {}),
        }),
      });
      showFlash('success', 'Invoice created');
      setView('list');
      loadInvoices();
      // Reset form
      setInvoiceNumber(''); setClientName(''); setClientEmail(''); setClientAddress('');
      setIssueDate(''); setDueDate(''); setTaxRate('0'); setNotes('');
      setLineItems([{ description: '', quantity: '1', rate: '' }]);
    } catch (err) {
      showFlash('error', err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function viewPdf(invoiceId: string) {
    try {
      const data = await apiFetch(`/api/invoices/${invoiceId}/pdf`);
      window.open(data.url, '_blank');
    } catch {
      showFlash('error', 'Failed to load PDF');
    }
  }

  async function updateStatus(invoiceId: string, status: string) {
    try {
      await apiFetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      loadInvoices();
    } catch {
      showFlash('error', 'Failed to update status');
    }
  }

  return (
    <div style={{ maxWidth: '900px', animation: 'fadeSlideUp 0.3s ease' }}>
      {flash && (
        <div style={{
          padding: '0.6rem 1rem', marginBottom: '1rem', borderRadius: '8px',
          fontSize: '0.8rem',
          color: flash.type === 'success' ? colors.success : colors.danger,
          background: flash.type === 'success' ? colors.successBg : colors.dangerBg,
          border: `1px solid ${flash.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          {flash.msg}
        </div>
      )}

      {view === 'list' && (
        <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h2 style={{ ...cardTitleStyle, marginBottom: 0 }}>Invoices</h2>
            {canManage && (
              <button onClick={() => setView('create')} style={buttonPrimary}>Create Invoice</button>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Invoice #</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Job</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Due</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={tdStyle}>{inv.invoice_number}</td>
                    <td style={tdStyle}>{inv.client_name}</td>
                    <td style={tdStyle}>
                      {inv.job_number ? (
                        <a href="/desk/jobs" onClick={(e) => { e.preventDefault(); /* TODO: navigate to job detail */ }} style={{ color: colors.accent, textDecoration: 'none', fontSize: '0.75rem' }}>
                          {inv.job_number}
                        </a>
                      ) : (
                        <span style={{ color: colors.muted, fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td style={tdStyle}>{new Date(inv.issue_date).toLocaleDateString()}</td>
                    <td style={tdStyle}>{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: colors.heading }}>{usd(inv.total)}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(statusBadgeVariant[inv.status] || 'muted')}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button onClick={() => viewPdf(inv.id)} style={buttonSecondary}>PDF</button>
                        {canManage && inv.status === 'draft' && (
                          <button onClick={() => updateStatus(inv.id, 'sent')} style={buttonSecondary}>Mark Sent</button>
                        )}
                        {canManage && inv.status === 'sent' && (
                          <button onClick={() => updateStatus(inv.id, 'paid')} style={{ ...buttonSecondary, color: colors.success, borderColor: 'rgba(16,185,129,0.3)' }}>Mark Paid</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: colors.muted }}>No invoices</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'create' && (
        <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h2 style={{ ...cardTitleStyle, marginBottom: 0 }}>Create Invoice</h2>
            <button onClick={() => setView('list')} style={buttonSecondary}>Back</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
            <div><label style={labelStyle}>Invoice Number *</label><input style={inputStyle} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-001" /></div>
            <div><label style={labelStyle}>Client Name *</label><input style={inputStyle} value={clientName} onChange={(e) => setClientName(e.target.value)} /></div>
            <div><label style={labelStyle}>Client Email</label><input style={inputStyle} value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} /></div>
            <div><label style={labelStyle}>Client Address</label><input style={inputStyle} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} /></div>
            <div><label style={labelStyle}>Issue Date *</label><input style={inputStyle} type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></div>
            <div><label style={labelStyle}>Due Date *</label><input style={inputStyle} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ ...labelStyle, marginBottom: '0.6rem' }}>Line Items</label>
            {lineItems.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input style={inputStyle} placeholder="Description" value={item.description} onChange={(e) => updateLineItem(idx, 'description', e.target.value)} />
                <input style={inputStyle} type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)} />
                <input style={inputStyle} type="number" placeholder="Rate" value={item.rate} onChange={(e) => updateLineItem(idx, 'rate', e.target.value)} />
                {lineItems.length > 1 && (
                  <button onClick={() => removeLineItem(idx)} style={{ ...buttonSecondary, color: colors.danger, borderColor: 'rgba(239,68,68,0.3)', padding: '0.4rem 0.6rem' }}>
                    &times;
                  </button>
                )}
              </div>
            ))}
            <button onClick={addLineItem} style={{ ...buttonSecondary, marginTop: '0.3rem' }}>+ Add Line Item</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
            <div><label style={labelStyle}>Tax Rate (%)</label><input style={inputStyle} type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></div>
            <div style={{ fontSize: '0.85rem', color: colors.accent, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '0.55rem' }}>
              Subtotal: {usd(subtotal)} | Total: {usd(subtotal * (1 + (parseFloat(taxRate) || 0) / 100))}
            </div>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, additional notes..."
            />
          </div>

          <button onClick={handleCreate} disabled={loading} style={{ ...buttonPrimary, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Creating...' : 'Create Invoice & Generate PDF'}
          </button>
        </div>
      )}
    </div>
  );
}
