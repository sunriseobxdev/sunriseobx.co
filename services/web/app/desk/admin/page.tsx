'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cardStyle, cardTitleStyle, inputStyle, labelStyle, buttonPrimary, buttonSecondary, badgeStyle, colors, thStyle, tdStyle, tableStyle } from '@/lib/desk-styles';

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

const roleBadgeVariant: Record<string, 'accent' | 'info' | 'warning' | 'success' | 'muted'> = {
  superadmin: 'accent',
  admin: 'info',
  manager: 'warning',
  trader: 'success',
  viewer: 'muted',
};

function roleRank(role: string): number {
  const idx = ROLE_HIERARCHY.indexOf(role);
  return idx === -1 ? 0 : idx;
}

function RoleBadge({ role }: { role: string }) {
  const variant = roleBadgeVariant[role] || 'muted';
  return (
    <span style={badgeStyle(variant)}>
      {role}
    </span>
  );
}

function StatusBadge({ disabled }: { disabled: boolean }) {
  return (
    <span style={badgeStyle(disabled ? 'danger' : 'success')}>
      {disabled ? 'Disabled' : 'Active'}
    </span>
  );
}

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
      <div style={{ color: colors.danger, padding: '2rem' }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{
          fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
          fontWeight: 800,
          letterSpacing: '0.08em',
          color: colors.heading,
          textTransform: 'uppercase',
        }}>
          User Management
        </h1>
        <Link href="/desk/admin/audit" style={{
          ...buttonSecondary,
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
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: message.type === 'success' ? colors.success : colors.danger,
          background: message.type === 'success' ? colors.successBg : colors.dangerBg,
          border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          {message.text}
        </div>
      )}

      {/* Create User Section */}
      <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            ...buttonSecondary,
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
              ...buttonPrimary,
              opacity: creating ? 0.6 : 1,
            }}>
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </form>
        )}
      </div>

      {/* Password Change Inline */}
      {passwordId && (
        <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
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
              ...buttonPrimary,
              opacity: changingPassword ? 0.6 : 1,
            }}>
              {changingPassword ? 'Changing...' : 'Confirm'}
            </button>
            <button type="button" onClick={() => { setPasswordId(null); setNewPassword(''); }} style={buttonSecondary}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <div style={cardTitleStyle}>Users</div>

        {loading ? (
          <div style={{ color: colors.muted, fontSize: '0.85rem' }}>
            Loading...
          </div>
        ) : users.length === 0 ? (
          <div style={{ color: colors.muted, fontSize: '0.85rem' }}>
            No users found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
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
                        <span style={{ color: colors.heading }}>{u.email}</span>
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
                            ...buttonSecondary,
                            color: editDisabled ? colors.danger : colors.success,
                            borderColor: editDisabled ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
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
                          ...buttonPrimary,
                          padding: '0.35rem 0.7rem',
                          fontSize: '0.6rem',
                          opacity: saving ? 0.6 : 1,
                        }}>
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={cancelEdit} style={buttonSecondary}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={u.id}>
                      <td style={{ ...tdStyle, color: colors.heading, fontWeight: 500 }}>
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
                            <button onClick={() => startEdit(u)} style={buttonSecondary}>
                              Edit
                            </button>
                            <button onClick={() => handleToggleDisable(u)} style={{
                              ...buttonSecondary,
                              color: u.disabled ? colors.success : colors.danger,
                              borderColor: u.disabled ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                            }}>
                              {u.disabled ? 'Enable' : 'Disable'}
                            </button>
                            <button onClick={() => { setPasswordId(u.id); setNewPassword(''); setEditingId(null); }} style={buttonSecondary}>
                              Password
                            </button>
                            <button onClick={() => handleDelete(u)} style={{
                              ...buttonSecondary,
                              color: colors.danger,
                              borderColor: 'rgba(239,68,68,0.3)',
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
