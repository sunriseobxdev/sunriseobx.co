'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { cardStyle, cardTitleStyle, inputStyle, labelStyle, buttonPrimary, buttonSecondary, badgeStyle, colors, thStyle, tdStyle, tableStyle } from '@/lib/desk-styles';

interface Estimate {
  id: string;
  estimate_number: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  job_address?: string;
  description?: string;
  total: string;
  status: string;
  valid_until?: string;
  created_at: string;
  line_items?: { description: string; quantity: number; rate: number; amount: number }[];
}

function usd(n: string | number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));
}

const statusVariant: Record<string, 'muted' | 'info' | 'success' | 'danger' | 'warning'> = {
  draft: 'muted', sent: 'info', accepted: 'success', declined: 'danger', expired: 'warning',
};

interface LineItem { description: string; quantity: string; rate: string }

type View = 'list' | 'create';

export default function EstimatesPage() {
  const [view, setView] = useState<View>('list');
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [estimateNumber, setEstimateNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [jobAddress, setJobAddress] = useState('');
  const [description, setDescription] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: '1', rate: '' }]);

  const showFlash = useCallback((type: 'success' | 'error', msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 4000);
  }, []);

  const loadEstimates = useCallback(async () => {
    try {
      const data = await apiFetch('/api/estimates');
      setEstimates(data);
    } catch { /* handled */ }
  }, []);

  useEffect(() => { loadEstimates(); }, [loadEstimates]);

  // Auto-generate estimate number
  useEffect(() => {
    if (view === 'create' && !estimateNumber) {
      const num = `EST-${new Date().getFullYear()}-${String(estimates.length + 1).padStart(3, '0')}`;
      setEstimateNumber(num);
    }
  }, [view, estimates.length, estimateNumber]);

  const subtotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0), 0);

  async function handleCreate() {
    if (!estimateNumber || !clientName) {
      showFlash('error', 'Estimate number and client name are required');
      return;
    }
    const items = lineItems.filter((li) => li.description && li.rate);
    if (items.length === 0) {
      showFlash('error', 'At least one line item required');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/api/estimates', {
        method: 'POST',
        body: JSON.stringify({
          estimateNumber, clientName, clientEmail, clientAddress, clientPhone,
          jobAddress, description,
          lineItems: items.map((li) => ({
            description: li.description,
            quantity: parseFloat(li.quantity) || 1,
            rate: parseFloat(li.rate) || 0,
          })),
          taxRate: parseFloat(taxRate) / 100 || 0,
          notes, validUntil: validUntil || null,
        }),
      });
      showFlash('success', 'Estimate created');
      setView('list');
      loadEstimates();
      // Reset form
      setEstimateNumber(''); setClientName(''); setClientEmail(''); setClientPhone('');
      setClientAddress(''); setJobAddress(''); setDescription(''); setValidUntil('');
      setTaxRate('0'); setNotes('');
      setLineItems([{ description: '', quantity: '1', rate: '' }]);
    } catch (err) {
      showFlash('error', err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function viewPdf(id: string) {
    try {
      const data = await apiFetch(`/api/estimates/${id}/pdf`);
      window.open(data.url, '_blank');
    } catch { showFlash('error', 'Failed to load PDF'); }
  }

  async function sendEstimate(id: string) {
    try {
      await apiFetch(`/api/estimates/${id}/send`, { method: 'POST' });
      showFlash('success', 'Estimate sent to customer');
      loadEstimates();
    } catch (err) {
      showFlash('error', err instanceof Error ? err.message : 'Failed to send');
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await apiFetch(`/api/estimates/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      loadEstimates();
    } catch { showFlash('error', 'Failed to update'); }
  }

  async function deleteEstimate(id: string) {
    if (!confirm('Delete this estimate?')) return;
    await apiFetch(`/api/estimates/${id}`, { method: 'DELETE' });
    loadEstimates();
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/estimate/${id}`);
    showFlash('success', 'Estimate link copied');
  }

  async function convertToJob(id: string) {
    try {
      const result = await apiFetch(`/api/estimates/${id}/convert`, { method: 'POST' });
      showFlash('success', `Job ${result.job?.job_number} created`);
      loadEstimates();
    } catch (err) {
      showFlash('error', err instanceof Error ? err.message : 'Failed to convert');
    }
  }

  return (
    <div style={{ maxWidth: '900px', animation: 'fadeSlideUp 0.3s ease' }}>
      {flash && (
        <div style={{
          padding: '0.6rem 1rem', marginBottom: '1rem', borderRadius: '8px', fontSize: '0.8rem',
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
            <h2 style={{ ...cardTitleStyle, marginBottom: 0 }}>Estimates</h2>
            <button onClick={() => setView('create')} style={buttonPrimary}>Create Estimate</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Estimate #</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>Valid Until</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {estimates.map((est) => (
                  <tr key={est.id}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: colors.accent }}>{est.estimate_number}</td>
                    <td style={tdStyle}>{est.client_name}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: colors.heading }}>{usd(est.total)}</td>
                    <td style={tdStyle}>{est.valid_until ? new Date(est.valid_until).toLocaleDateString() : '—'}</td>
                    <td style={tdStyle}><span style={badgeStyle(statusVariant[est.status] || 'muted')}>{est.status}</span></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        <button onClick={() => viewPdf(est.id)} style={buttonSecondary}>PDF</button>
                        <button onClick={() => copyLink(est.id)} style={buttonSecondary}>Link</button>
                        {est.status === 'draft' && est.client_email && (
                          <button onClick={() => sendEstimate(est.id)} style={{ ...buttonSecondary, color: colors.accent, borderColor: 'rgba(249,115,22,0.3)' }}>Send</button>
                        )}
                        {est.status === 'accepted' && (
                          <button onClick={() => convertToJob(est.id)} style={{ ...buttonSecondary, color: colors.success, borderColor: 'rgba(16,185,129,0.3)' }}>Create Job</button>
                        )}
                        <button onClick={() => deleteEstimate(est.id)} style={{ ...buttonSecondary, color: colors.danger, borderColor: 'rgba(239,68,68,0.3)' }}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {estimates.length === 0 && (
                  <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: colors.muted }}>No estimates</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'create' && (
        <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h2 style={{ ...cardTitleStyle, marginBottom: 0 }}>Create Estimate</h2>
            <button onClick={() => setView('list')} style={buttonSecondary}>Back</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
            <div><label style={labelStyle}>Estimate Number *</label><input style={inputStyle} value={estimateNumber} onChange={(e) => setEstimateNumber(e.target.value)} /></div>
            <div><label style={labelStyle}>Client Name *</label><input style={inputStyle} value={clientName} onChange={(e) => setClientName(e.target.value)} /></div>
            <div><label style={labelStyle}>Client Email</label><input style={inputStyle} value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} /></div>
            <div><label style={labelStyle}>Client Phone</label><input style={inputStyle} value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} /></div>
            <div><label style={labelStyle}>Client Address</label><input style={inputStyle} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} /></div>
            <div><label style={labelStyle}>Job Address</label><input style={inputStyle} value={jobAddress} onChange={(e) => setJobAddress(e.target.value)} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Scope of work summary..." /></div>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ ...labelStyle, marginBottom: '0.6rem' }}>Line Items</label>
            {lineItems.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input style={inputStyle} placeholder="Description" value={item.description} onChange={(e) => { const u = [...lineItems]; u[idx] = { ...u[idx], description: e.target.value }; setLineItems(u); }} />
                <input style={inputStyle} type="number" placeholder="Qty" value={item.quantity} onChange={(e) => { const u = [...lineItems]; u[idx] = { ...u[idx], quantity: e.target.value }; setLineItems(u); }} />
                <input style={inputStyle} type="number" placeholder="Rate" value={item.rate} onChange={(e) => { const u = [...lineItems]; u[idx] = { ...u[idx], rate: e.target.value }; setLineItems(u); }} />
                {lineItems.length > 1 && (
                  <button onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))} style={{ ...buttonSecondary, color: colors.danger, borderColor: 'rgba(239,68,68,0.3)', padding: '0.4rem 0.6rem' }}>&times;</button>
                )}
              </div>
            ))}
            <button onClick={() => setLineItems([...lineItems, { description: '', quantity: '1', rate: '' }])} style={{ ...buttonSecondary, marginTop: '0.3rem' }}>+ Add Line Item</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
            <div><label style={labelStyle}>Tax Rate (%)</label><input style={inputStyle} type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></div>
            <div><label style={labelStyle}>Valid Until</label><input style={inputStyle} type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
            <div style={{ fontSize: '0.85rem', color: colors.accent, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '0.55rem' }}>
              Subtotal: {usd(subtotal)} | Total: {usd(subtotal * (1 + (parseFloat(taxRate) || 0) / 100))}
            </div>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." />
          </div>

          <button onClick={handleCreate} disabled={loading} style={{ ...buttonPrimary, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Creating...' : 'Create Estimate & Generate PDF'}
          </button>
        </div>
      )}
    </div>
  );
}
