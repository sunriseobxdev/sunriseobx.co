'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cardStyle, cardTitleStyle, inputStyle, labelStyle, buttonPrimary, buttonSecondary, badgeStyle, colors, thStyle, tdStyle, tableStyle } from '@/lib/desk-styles';

type TotpStep = 'idle' | 'setup' | 'verify' | 'recovery' | 'disable';

interface TotpSetupData {
  qrCodeDataUri: string;
  secret: string;
  uri: string;
}

const roleBadgeVariant: Record<string, 'accent' | 'info' | 'warning' | 'success' | 'muted'> = {
  superadmin: 'accent',
  admin: 'info',
  manager: 'warning',
  trader: 'success',
  viewer: 'muted',
};

const dangerBtnStyle: React.CSSProperties = {
  ...buttonSecondary,
  border: `1px solid ${colors.danger}`,
  color: colors.danger,
};

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpStep, setTotpStep] = useState<TotpStep>('idle');
  const [setupData, setSetupData] = useState<TotpSetupData | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showManualSecret, setShowManualSecret] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // API keys
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key_prefix: string; last_used: string | null; created_at: string }[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null);

  const showFlash = useCallback((type: 'success' | 'error', msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 4000);
  }, []);

  const loadApiKeys = useCallback(async () => {
    try {
      const data = await apiFetch('/api/keys');
      setApiKeys(data);
    } catch { /* handled */ }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch('/auth/me');
        setProfile(data);
        setTotpEnabled(!!data.totpEnabled);
      } catch {
        // handled by apiFetch
      }
    }
    load();
    loadApiKeys();
  }, [loadApiKeys]);

  async function handlePasswordChange() {
    if (newPassword !== confirmPassword) {
      showFlash('error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      showFlash('error', 'Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await apiFetch(`/api/iam/users/${user?.id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      showFlash('success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showFlash('error', err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  async function handleTotpSetup() {
    setLoading(true);
    try {
      const data = await apiFetch('/api/totp/setup', { method: 'POST' });
      setSetupData(data);
      setTotpStep('setup');
    } catch (err) {
      showFlash('error', err instanceof Error ? err.message : 'Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  }

  async function handleTotpVerify() {
    if (totpCode.length !== 6) {
      showFlash('error', 'Enter a 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch('/api/totp/verify', {
        method: 'POST',
        body: JSON.stringify({ code: totpCode }),
      });
      setRecoveryCodes(data.recoveryCodes);
      setTotpEnabled(true);
      setTotpStep('recovery');
      setTotpCode('');
      if (user) setUser({ ...user, totpEnabled: true });
    } catch (err) {
      showFlash('error', err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  async function handleTotpDisable() {
    if (totpCode.length !== 6) {
      showFlash('error', 'Enter a 6-digit code to disable 2FA');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/api/totp/disable', {
        method: 'POST',
        body: JSON.stringify({ code: totpCode }),
      });
      setTotpEnabled(false);
      setTotpStep('idle');
      setTotpCode('');
      showFlash('success', 'Two-factor authentication disabled');
      if (user) setUser({ ...user, totpEnabled: false });
    } catch (err) {
      showFlash('error', err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  function copyRecoveryCodes() {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    showFlash('success', 'Recovery codes copied to clipboard');
  }

  if (!user || !profile) {
    return (
      <div style={{ padding: '2rem', color: colors.muted, fontSize: '0.85rem' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', animation: 'fadeSlideUp 0.3s ease' }}>
      {flash && (
        <div style={{
          padding: '0.6rem 1rem',
          marginBottom: '1rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: flash.type === 'success' ? colors.success : colors.danger,
          background: flash.type === 'success' ? colors.successBg : colors.dangerBg,
          border: `1px solid ${flash.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          {flash.msg}
        </div>
      )}

      {/* User Info Card */}
      <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <h2 style={cardTitleStyle}>Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: colors.muted, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</span>
            <div style={{ color: colors.heading, marginTop: '0.25rem' }}>{profile.email as string}</div>
          </div>
          <div>
            <span style={{ color: colors.muted, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Display Name</span>
            <div style={{ color: colors.heading, marginTop: '0.25rem' }}>{(profile.displayName as string) || '\u2014'}</div>
          </div>
          <div>
            <span style={{ color: colors.muted, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Role</span>
            <div style={{ marginTop: '0.25rem' }}>
              <span style={badgeStyle(roleBadgeVariant[user.role] || 'muted')}>{user.role}</span>
            </div>
          </div>
          <div>
            <span style={{ color: colors.muted, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Member Since</span>
            <div style={{ color: colors.heading, marginTop: '0.25rem' }}>
              {profile.createdAt ? new Date(profile.createdAt as string).toLocaleDateString() : '\u2014'}
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Card */}
      <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <h2 style={cardTitleStyle}>Permissions</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {user.privileges.length > 0 ? user.privileges.map((priv) => (
            <span key={priv} style={badgeStyle('accent')}>{priv.replace(/_/g, ' ')}</span>
          )) : (
            <span style={{ fontSize: '0.8rem', color: colors.muted }}>No privileges assigned</span>
          )}
        </div>
      </div>

      {/* Password Change Card */}
      <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <h2 style={cardTitleStyle}>Change Password</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxWidth: '360px' }}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <button
              onClick={handlePasswordChange}
              disabled={loading || !currentPassword || !newPassword}
              style={{ ...buttonPrimary, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

      {/* Security / 2FA Card */}
      <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <h2 style={cardTitleStyle}>Two-Factor Authentication</h2>

        {totpStep === 'idle' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: colors.heading }}>Status:</span>
              {totpEnabled ? (
                <span style={badgeStyle('success')}>Enabled</span>
              ) : (
                <span style={badgeStyle('muted')}>Not Enabled</span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: colors.muted, marginBottom: '1rem', lineHeight: 1.5 }}>
              {totpEnabled
                ? 'Your account is protected with an authenticator app. You will need a code from your app each time you sign in.'
                : 'Add an extra layer of security by requiring a code from an authenticator app when signing in.'}
            </p>
            {totpEnabled ? (
              <button onClick={() => setTotpStep('disable')} style={dangerBtnStyle}>
                Disable 2FA
              </button>
            ) : (
              <button onClick={handleTotpSetup} disabled={loading} style={buttonPrimary}>
                {loading ? 'Setting up...' : 'Enable 2FA'}
              </button>
            )}
          </div>
        )}

        {totpStep === 'setup' && setupData && (
          <div>
            <p style={{ fontSize: '0.75rem', color: colors.heading, marginBottom: '1rem', lineHeight: 1.5 }}>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.):
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <img
                src={setupData.qrCodeDataUri}
                alt="TOTP QR Code"
                style={{ width: '200px', height: '200px', borderRadius: '8px', background: '#fff', padding: '8px' }}
              />
            </div>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <button
                onClick={() => setShowManualSecret(!showManualSecret)}
                style={{ ...buttonSecondary, fontSize: '0.65rem' }}
              >
                {showManualSecret ? 'Hide manual code' : "Can't scan this?"}
              </button>
              {showManualSecret && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: colors.surfaceLight,
                  border: `1px solid ${colors.borderLight}`,
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  letterSpacing: '0.15em',
                  color: colors.accent,
                  wordBreak: 'break-all',
                }}>
                  {setupData.secret}
                </div>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: colors.heading, marginBottom: '0.6rem' }}>
              Enter the 6-digit code from your authenticator app:
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                style={{ ...inputStyle, width: '140px', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.3em' }}
              />
              <button
                onClick={handleTotpVerify}
                disabled={loading || totpCode.length !== 6}
                style={{ ...buttonPrimary, opacity: loading || totpCode.length !== 6 ? 0.6 : 1 }}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button onClick={() => { setTotpStep('idle'); setTotpCode(''); }} style={buttonSecondary}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {totpStep === 'recovery' && (
          <div>
            <p style={{ fontSize: '0.8rem', color: colors.success, marginBottom: '0.75rem', fontWeight: 600 }}>
              Two-factor authentication enabled!
            </p>
            <p style={{ fontSize: '0.75rem', color: colors.heading, marginBottom: '1rem', lineHeight: 1.5 }}>
              Save these recovery codes in a safe place. Each code can only be used once to sign in if you lose access to your authenticator app.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.4rem',
              padding: '1rem',
              background: colors.surfaceLight,
              border: `1px solid ${colors.borderLight}`,
              borderRadius: '8px',
              marginBottom: '1rem',
            }}>
              {recoveryCodes.map((code, i) => (
                <div key={i} style={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: colors.accent,
                  letterSpacing: '0.1em',
                  padding: '0.2rem 0',
                }}>
                  {code}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button onClick={copyRecoveryCodes} style={buttonSecondary}>
                Copy All
              </button>
              <button onClick={() => { setTotpStep('idle'); setRecoveryCodes([]); }} style={buttonPrimary}>
                Done
              </button>
            </div>
          </div>
        )}

        {totpStep === 'disable' && (
          <div>
            <p style={{ fontSize: '0.75rem', color: colors.danger, marginBottom: '1rem', lineHeight: 1.5 }}>
              Enter a code from your authenticator app to confirm disabling two-factor authentication.
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                style={{ ...inputStyle, width: '140px', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.3em' }}
              />
              <button
                onClick={handleTotpDisable}
                disabled={loading || totpCode.length !== 6}
                style={{ ...dangerBtnStyle, opacity: loading || totpCode.length !== 6 ? 0.6 : 1 }}
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
              <button onClick={() => { setTotpStep('idle'); setTotpCode(''); }} style={buttonSecondary}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* API Keys Card */}
      <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <h2 style={cardTitleStyle}>API Keys</h2>
        <p style={{ fontSize: '0.75rem', color: colors.muted, marginBottom: '1rem', lineHeight: 1.5 }}>
          Use API keys to authenticate with the Sunrise CLI or SDK. Pass the key via the <code style={{ color: colors.accent, background: colors.surfaceLight, padding: '0.1rem 0.3rem', borderRadius: '4px' }}>X-API-Key</code> header.
        </p>

        {/* Create new key */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Key Name</label>
            <input
              style={inputStyle}
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. CLI, CI/CD, Local Dev"
            />
          </div>
          <button
            onClick={async () => {
              if (!newKeyName) { showFlash('error', 'Key name is required'); return; }
              setLoading(true);
              try {
                const data = await apiFetch('/api/keys', {
                  method: 'POST',
                  body: JSON.stringify({ name: newKeyName }),
                });
                setNewKeyResult(data.key);
                setNewKeyName('');
                loadApiKeys();
              } catch (err) {
                showFlash('error', err instanceof Error ? err.message : 'Failed');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || !newKeyName}
            style={{ ...buttonPrimary, opacity: loading || !newKeyName ? 0.6 : 1, whiteSpace: 'nowrap' }}
          >
            Generate Key
          </button>
        </div>

        {/* Show newly created key */}
        {newKeyResult && (
          <div style={{
            padding: '0.75rem 1rem',
            background: colors.surfaceLight,
            border: `1px solid ${colors.success}`,
            borderRadius: '8px',
            marginBottom: '1rem',
          }}>
            <div style={{ fontSize: '0.7rem', color: colors.success, marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Copy your API key now — it won&apos;t be shown again
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: colors.accent,
              wordBreak: 'break-all',
              marginBottom: '0.5rem',
            }}>
              {newKeyResult}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => { navigator.clipboard.writeText(newKeyResult); showFlash('success', 'Copied to clipboard'); }}
                style={buttonSecondary}
              >
                Copy
              </button>
              <button onClick={() => setNewKeyResult(null)} style={buttonSecondary}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Keys list */}
        {apiKeys.length > 0 ? (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Key</th>
                <th style={thStyle}>Last Used</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((k) => (
                <tr key={k.id}>
                  <td style={{ ...tdStyle, color: colors.heading }}>{k.name}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.75rem' }}>{k.key_prefix}...</td>
                  <td style={tdStyle}>{k.last_used ? new Date(k.last_used).toLocaleDateString() : 'Never'}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={async () => {
                        try {
                          await apiFetch('/api/keys/' + k.id, { method: 'DELETE' });
                          loadApiKeys();
                          showFlash('success', 'Key revoked');
                        } catch { showFlash('error', 'Failed to revoke'); }
                      }}
                      style={dangerBtnStyle}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: '0.8rem', color: colors.muted }}>No API keys</p>
        )}
      </div>
    </div>
  );
}
