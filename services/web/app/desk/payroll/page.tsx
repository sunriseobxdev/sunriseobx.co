'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cardStyle, cardTitleStyle, inputStyle, labelStyle, buttonPrimary, buttonSecondary, colors, thStyle, tdStyle, tableStyle } from '@/lib/desk-styles';

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  title: string;
  department: string;
  annual_salary: string;
  start_date: string;
  end_date: string | null;
}

interface Paystub {
  id: string;
  stub_number: number;
  pay_date: string;
  period_start: string;
  period_end: string;
  gross_pay: string;
  net_pay: string;
  total_deductions: string;
  pdf_path: string;
}

function usd(n: string | number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));
}

type View = 'list' | 'create' | 'detail';

export default function PayrollPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.privileges.includes('manage_payroll');

  const [view, setView] = useState<View>('list');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [paystubs, setPaystubs] = useState<Paystub[]>([]);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    employeeId: '', fullName: '', email: '', title: '', department: '',
    streetAddress1: '', streetAddress2: '', cityStateZip: '',
    lastFourSsn: '', bankRouting: '', bankAccountLastFour: '',
    annualSalary: '', filingStatus: 'single', exemptions: '0', startDate: '',
  });

  const showFlash = useCallback((type: 'success' | 'error', msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 4000);
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await apiFetch('/api/payroll/employees');
      setEmployees(data);
    } catch { /* handled */ }
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  async function handleCreateEmployee() {
    if (!form.employeeId || !form.fullName || !form.annualSalary || !form.startDate) {
      showFlash('error', 'Employee ID, name, salary, and start date are required');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/api/payroll/employees', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      showFlash('success', 'Employee created');
      setView('list');
      loadEmployees();
      setForm({ employeeId: '', fullName: '', email: '', title: '', department: '', streetAddress1: '', streetAddress2: '', cityStateZip: '', lastFourSsn: '', bankRouting: '', bankAccountLastFour: '', annualSalary: '', filingStatus: 'single', exemptions: '0', startDate: '' });
    } catch (err) {
      showFlash('error', err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function selectEmployee(emp: Employee) {
    setSelectedEmployee(emp);
    setView('detail');
    try {
      const stubs = await apiFetch(`/api/payroll/employees/${emp.id}/paystubs`);
      setPaystubs(stubs);
    } catch { /* handled */ }
  }

  async function generatePaystubs(year: number) {
    if (!selectedEmployee) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/payroll/employees/${selectedEmployee.id}/paystubs/generate`, {
        method: 'POST',
        body: JSON.stringify({ year }),
      });
      showFlash('success', `Generated ${data.generated} paystubs (${data.skipped} already existed)`);
      const stubs = await apiFetch(`/api/payroll/employees/${selectedEmployee.id}/paystubs`);
      setPaystubs(stubs);
    } catch (err) {
      showFlash('error', err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function viewPdf(paystubId: string) {
    try {
      const data = await apiFetch(`/api/payroll/paystubs/${paystubId}/pdf`);
      window.open(data.url, '_blank');
    } catch (err) {
      showFlash('error', 'Failed to load PDF');
    }
  }

  const F = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

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
            <h2 style={{ ...cardTitleStyle, marginBottom: 0 }}>Employees</h2>
            {canManage && (
              <button onClick={() => setView('create')} style={buttonPrimary}>Add Employee</button>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Salary</th>
                  <th style={thStyle}>Start Date</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={tdStyle}>{emp.employee_id}</td>
                    <td style={tdStyle}>{emp.full_name}</td>
                    <td style={tdStyle}>{emp.title || '\u2014'}</td>
                    <td style={tdStyle}>{usd(emp.annual_salary)}</td>
                    <td style={tdStyle}>{new Date(emp.start_date).toLocaleDateString()}</td>
                    <td style={tdStyle}>
                      <button onClick={() => selectEmployee(emp)} style={buttonSecondary}>View</button>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: colors.muted }}>No employees</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'create' && (
        <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h2 style={{ ...cardTitleStyle, marginBottom: 0 }}>Add Employee</h2>
            <button onClick={() => setView('list')} style={buttonSecondary}>Back</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div><label style={labelStyle}>Employee ID *</label><input style={inputStyle} value={form.employeeId} onChange={F('employeeId')} /></div>
            <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} value={form.fullName} onChange={F('fullName')} /></div>
            <div><label style={labelStyle}>Email</label><input style={inputStyle} value={form.email} onChange={F('email')} /></div>
            <div><label style={labelStyle}>Title</label><input style={inputStyle} value={form.title} onChange={F('title')} /></div>
            <div><label style={labelStyle}>Department</label><input style={inputStyle} value={form.department} onChange={F('department')} /></div>
            <div><label style={labelStyle}>Annual Salary *</label><input style={inputStyle} type="number" value={form.annualSalary} onChange={F('annualSalary')} /></div>
            <div><label style={labelStyle}>Start Date *</label><input style={inputStyle} type="date" value={form.startDate} onChange={F('startDate')} /></div>
            <div><label style={labelStyle}>Filing Status</label>
              <select style={inputStyle} value={form.filingStatus} onChange={F('filingStatus')}>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="head_of_household">Head of Household</option>
              </select>
            </div>
            <div><label style={labelStyle}>Exemptions</label><input style={inputStyle} type="number" value={form.exemptions} onChange={F('exemptions')} /></div>
            <div><label style={labelStyle}>Street Address 1</label><input style={inputStyle} value={form.streetAddress1} onChange={F('streetAddress1')} /></div>
            <div><label style={labelStyle}>Street Address 2</label><input style={inputStyle} value={form.streetAddress2} onChange={F('streetAddress2')} /></div>
            <div><label style={labelStyle}>City, State ZIP</label><input style={inputStyle} value={form.cityStateZip} onChange={F('cityStateZip')} /></div>
            <div><label style={labelStyle}>Last 4 SSN</label><input style={inputStyle} maxLength={4} value={form.lastFourSsn} onChange={F('lastFourSsn')} /></div>
            <div><label style={labelStyle}>Bank Routing #</label><input style={inputStyle} maxLength={9} value={form.bankRouting} onChange={F('bankRouting')} /></div>
            <div><label style={labelStyle}>Bank Account (Last 4)</label><input style={inputStyle} maxLength={4} value={form.bankAccountLastFour} onChange={F('bankAccountLastFour')} /></div>
          </div>
          <div style={{ marginTop: '1.2rem' }}>
            <button onClick={handleCreateEmployee} disabled={loading} style={{ ...buttonPrimary, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </div>
      )}

      {view === 'detail' && selectedEmployee && (
        <>
          <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h2 style={{ ...cardTitleStyle, marginBottom: 0 }}>{selectedEmployee.full_name}</h2>
              <button onClick={() => setView('list')} style={buttonSecondary}>Back</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', fontSize: '0.8rem' }}>
              <div><span style={{ color: colors.muted, fontSize: '0.65rem', textTransform: 'uppercase' }}>Employee ID</span><div style={{ color: colors.heading }}>{selectedEmployee.employee_id}</div></div>
              <div><span style={{ color: colors.muted, fontSize: '0.65rem', textTransform: 'uppercase' }}>Salary</span><div style={{ color: colors.heading }}>{usd(selectedEmployee.annual_salary)}</div></div>
              <div><span style={{ color: colors.muted, fontSize: '0.65rem', textTransform: 'uppercase' }}>Start Date</span><div style={{ color: colors.heading }}>{new Date(selectedEmployee.start_date).toLocaleDateString()}</div></div>
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h2 style={{ ...cardTitleStyle, marginBottom: 0 }}>Paystubs</h2>
              {canManage && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => generatePaystubs(new Date().getFullYear())} disabled={loading} style={{ ...buttonPrimary, opacity: loading ? 0.6 : 1 }}>
                    {loading ? 'Generating...' : `Generate ${new Date().getFullYear()}`}
                  </button>
                  <button onClick={() => generatePaystubs(new Date().getFullYear() - 1)} disabled={loading} style={buttonSecondary}>
                    {new Date().getFullYear() - 1}
                  </button>
                </div>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Pay Date</th>
                    <th style={thStyle}>Period</th>
                    <th style={thStyle}>Gross</th>
                    <th style={thStyle}>Deductions</th>
                    <th style={thStyle}>Net</th>
                    <th style={thStyle}>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {paystubs.map((s) => (
                    <tr key={s.id}>
                      <td style={tdStyle}>{s.stub_number}</td>
                      <td style={tdStyle}>{new Date(s.pay_date).toLocaleDateString()}</td>
                      <td style={tdStyle}>{new Date(s.period_start).toLocaleDateString()} - {new Date(s.period_end).toLocaleDateString()}</td>
                      <td style={tdStyle}>{usd(s.gross_pay)}</td>
                      <td style={{ ...tdStyle, color: colors.danger }}>{usd(s.total_deductions)}</td>
                      <td style={{ ...tdStyle, color: colors.success }}>{usd(s.net_pay)}</td>
                      <td style={tdStyle}>
                        <button onClick={() => viewPdf(s.id)} style={buttonSecondary}>View</button>
                      </td>
                    </tr>
                  ))}
                  {paystubs.length === 0 && (
                    <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: colors.muted }}>No paystubs generated yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
