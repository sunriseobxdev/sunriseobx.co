'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface IAMUser {
  id: string;
  email: string;
  display_name?: string;
  displayName?: string;
  role: string;
  disabled: boolean;
  created_at?: string;
  createdAt?: string;
}

const ROLE_HIERARCHY = ['viewer', 'trader', 'manager', 'admin', 'superadmin'];

const roleBadgeColors: Record<string, string> = {
  superadmin: '#c9a84c',
  admin: '#2196f3',
  manager: '#9c27b0',
  trader: '#4caf50',
  viewer: '#666',
};

function roleRank(role: string): number {
  const idx = ROLE_HIERARCHY.indexOf(role);
  return idx === -1 ? 0 : idx;
}

function RoleBadge({ role }: { role: string }) {
  const bg = roleBadgeColors[role] || '#444';
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.15rem 0.45rem',
      borderRadius: '9999px',
      fontSize: '0.6rem',
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: '#fff',
      background: bg,
      lineHeight: '1.4',
    }}>
      {role}
    </span>
  );
}

function StatusBadge({ disabled }: { disabled: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.15rem 0.45rem',
      borderRadius: '9999px',
      fontSize: '0.6rem',
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: disabled ? '#e05555' : '#4caf50',
      background: disabled ? 'rgba(224,85,85,0.12)' : 'rgba(76,175,80,0.12)',
      lineHeight: '1.4',
    }}>
      {disabled ? 'Disabled' : 'Active'}
    </span>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#111',
  border: '1px solid var(--color-gold-dark)',
  borderRadius: '4px',
  padding: 'clamp(1rem, 3vw, 1.5rem)',
  marginBottom: '1.5rem',
};

const cardTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: '0.75rem',
  letterSpacing: '0.2em',
  color: 'var(--color-gold)',
  marginBottom: '1.2rem',
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '3px',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.85rem',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.65rem',
  letterSpacing: '0.1em',
  color: 'var(--color-gold)',
  textTransform: 'uppercase',
  marginBottom: '0.35rem',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '0.55rem 1.2rem',
  background: 'var(--color-gold)',
  border: 'none',
  borderRadius: '3px',
  color: '#0a0a0a',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '0.4rem 0.8rem',
  background: 'transparent',
  border: '1px solid #333',
  borderRadius: '3px',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.65rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.6rem 0.75rem',
  fontSize: '0.65rem',
  letterSpacing: '0.1em',
  color: 'var(--color-gold)',
  textTransform: 'uppercase',
  borderBottom: '1px solid #222',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
  fontSize: '0.8rem',
  color: 'var(--color-text-muted)',
  borderBottom: '1px solid #1a1a1a',
  whiteSpace: 'nowrap',
};

export default function AdminPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<IAMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('viewer');
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editName, setEditName] = useState('');
  const [editDisabled, setEditDisabled] = useState(false);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [passwordId, setPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const data = await apiFetch('/api/iam/users');
      setUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function flash(text: string, type: 'success' | 'error') {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  }

  function assignableRoles(): string[] {
    if (!currentUser) return [];
    const myRank = roleRank(currentUser.role);
    return ROLE_HIERARCHY.filter((_, i) => i < myRank);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch('/api/iam/users', {
        method: 'POST',
        body: JSON.stringify({
          email: createEmail,
          password: createPassword,
          displayName: createName,
          role: createRole,
        }),
      });
      flash('User created successfully', 'success');
      setCreateEmail('');
      setCreateName('');
      setCreatePassword('');
      setCreateRole('viewer');
      setShowCreate(false);
      await loadUsers();
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to create user', 'error');
    } finally {
      setCreating(false);
    }
  }

  function startEdit(u: IAMUser) {
    setEditingId(u.id);
    setEditRole(u.role);
    setEditName(u.display_name || u.displayName || '');
    setEditDisabled(u.disabled);
    setPasswordId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      await apiFetch(`/api/iam/users/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({
          role: editRole,
          displayName: editName,
          disabled: editDisabled,
        }),
      });
      flash('User updated successfully', 'success');
      setEditingId(null);
      await loadUsers();
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to update user', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleDisable(u: IAMUser) {
    try {
      await apiFetch(`/api/iam/users/${u.id}`, {
        method: 'PUT',
        body: JSON.stringify({ disabled: !u.disabled }),
      });
      flash(u.disabled ? 'User enabled' : 'User disabled', 'success');
      await loadUsers();
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to update user', 'error');
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordId) return;
    setChangingPassword(true);
    try {
      await apiFetch(`/api/iam/users/${passwordId}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword }),
      });
      flash('Password changed successfully', 'success');
      setPasswordId(null);
      setNewPassword('');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDelete(u: IAMUser) {
    if (!confirm(`Delete user ${u.email}? This action is soft-delete.`)) return;
    try {
      await apiFetch(`/api/iam/users/${u.id}`, { method: 'DELETE' });
      flash('User deleted', 'success');
      await loadUsers();
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to delete user', 'error');
    }
  }

  if (error) {
    return (
      <div style={{ color: '#e05555', fontFamily: 'var(--font-sans)', padding: '2rem' }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
          letterSpacing: '0.2em',
          color: 'var(--color-gold)',
          textTransform: 'uppercase',
        }}>
          User Management
        </h1>
        <Link href="/desk/admin/audit" style={{
          ...secondaryBtnStyle,
          textDecoration: 'none',
          display: 'inline-block',
        }}>
          Audit Log
        </Link>
      </div>

      {/* Flash message */}
      {message && (
        <div style={{
          padding: '0.6rem 1rem',
          marginBottom: '1rem',
          borderRadius: '3px',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-sans)',
          color: message.type === 'success' ? '#4caf50' : '#e05555',
          background: message.type === 'success' ? 'rgba(76,175,80,0.1)' : 'rgba(224,85,85,0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(76,175,80,0.3)' : 'rgba(224,85,85,0.3)'}`,
        }}>
          {message.text}
        </div>
      )}

      {/* Create User Section */}
      <div style={cardStyle}>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            ...secondaryBtnStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {showCreate ? '\u25BC' : '\u25B6'} Create User
        </button>

        {showCreate && (
          <form onSubmit={handleCreate} style={{ marginTop: '1rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '1rem',
              marginBottom: '1rem',
            }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  style={inputStyle}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label style={labelStyle}>Display Name</label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  style={inputStyle}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  required
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  style={inputStyle}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  style={{ ...inputStyle, appearance: 'auto' }}
                >
                  {assignableRoles().map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" disabled={creating} style={{
              ...primaryBtnStyle,
              opacity: creating ? 0.6 : 1,
            }}>
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </form>
        )}
      </div>

      {/* Password Change Inline */}
      {passwordId && (
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Change Password</div>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={labelStyle}>New Password for {users.find((u) => u.id === passwordId)?.email}</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={inputStyle}
                placeholder="New password"
              />
            </div>
            <button type="submit" disabled={changingPassword} style={{
              ...primaryBtnStyle,
              opacity: changingPassword ? 0.6 : 1,
            }}>
              {changingPassword ? 'Changing...' : 'Confirm'}
            </button>
            <button type="button" onClick={() => { setPasswordId(null); setNewPassword(''); }} style={secondaryBtnStyle}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>Users</div>

        {loading ? (
          <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
            Loading...
          </div>
        ) : users.length === 0 ? (
          <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
            No users found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
              <thead>
                <tr>
                  {['Email', 'Display Name', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  editingId === u.id ? (
                    <tr key={u.id}>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--color-text)' }}>{u.email}</span>
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ ...inputStyle, width: 'auto', minWidth: '120px' }}
                        />
                      </td>
                      <td style={tdStyle}>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          style={{ ...inputStyle, width: 'auto', appearance: 'auto' }}
                        >
                          {assignableRoles().map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                          {/* Keep current role if it's at or above our rank */}
                          {!assignableRoles().includes(u.role) && (
                            <option value={u.role}>{u.role}</option>
                          )}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => setEditDisabled(!editDisabled)}
                          style={{
                            ...secondaryBtnStyle,
                            color: editDisabled ? '#e05555' : '#4caf50',
                            borderColor: editDisabled ? 'rgba(224,85,85,0.3)' : 'rgba(76,175,80,0.3)',
                          }}
                        >
                          {editDisabled ? 'Disabled' : 'Active'}
                        </button>
                      </td>
                      <td style={tdStyle}>
                        {new Date(u.created_at || u.createdAt || '').toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td style={{ ...tdStyle, display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button onClick={handleSaveEdit} disabled={saving} style={{
                          ...primaryBtnStyle,
                          padding: '0.35rem 0.7rem',
                          fontSize: '0.6rem',
                          opacity: saving ? 0.6 : 1,
                        }}>
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={cancelEdit} style={secondaryBtnStyle}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={u.id}>
                      <td style={{ ...tdStyle, color: 'var(--color-text)', fontWeight: 500 }}>
                        {u.email}
                      </td>
                      <td style={tdStyle}>{u.display_name || u.displayName || ''}</td>
                      <td style={tdStyle}><RoleBadge role={u.role} /></td>
                      <td style={tdStyle}><StatusBadge disabled={u.disabled} /></td>
                      <td style={tdStyle}>
                        {new Date(u.created_at || u.createdAt || '').toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td style={{ ...tdStyle, display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {currentUser && roleRank(currentUser.role) > roleRank(u.role) && (
                          <>
                            <button onClick={() => startEdit(u)} style={secondaryBtnStyle}>
                              Edit
                            </button>
                            <button onClick={() => handleToggleDisable(u)} style={{
                              ...secondaryBtnStyle,
                              color: u.disabled ? '#4caf50' : '#e05555',
                              borderColor: u.disabled ? 'rgba(76,175,80,0.3)' : 'rgba(224,85,85,0.3)',
                            }}>
                              {u.disabled ? 'Enable' : 'Disable'}
                            </button>
                            <button onClick={() => { setPasswordId(u.id); setNewPassword(''); setEditingId(null); }} style={secondaryBtnStyle}>
                              Password
                            </button>
                            <button onClick={() => handleDelete(u)} style={{
                              ...secondaryBtnStyle,
                              color: '#e05555',
                              borderColor: 'rgba(224,85,85,0.3)',
                            }}>
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
