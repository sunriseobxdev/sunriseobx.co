'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

type TotpStep = 'idle' | 'setup' | 'verify' | 'recovery' | 'disable';

interface TotpSetupData {
  qrCodeDataUri: string;
  secret: string;
  uri: string;
}

const roleBadgeColors: Record<string, string> = {
  superadmin: '#c9a84c',
  admin: '#2196f3',
  manager: '#9c27b0',
  trader: '#4caf50',
  viewer: '#666',
};

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
  fontSize: '0.7rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const dangerBtnStyle: React.CSSProperties = {
  ...secondaryBtnStyle,
  border: '1px solid #e05555',
  color: '#e05555',
};

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.15rem 0.45rem',
      borderRadius: '9999px',
      fontSize: '0.6rem',
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color,
      background: bg,
      lineHeight: '1.4',
    }}>
      {label}
    </span>
  );
}

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
      <div style={{ padding: '2rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
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
          borderRadius: '3px',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.8rem',
          color: flash.type === 'success' ? '#4caf50' : '#e05555',
          background: flash.type === 'success' ? 'rgba(76,175,80,0.1)' : 'rgba(224,85,85,0.1)',
          border: `1px solid ${flash.type === 'success' ? 'rgba(76,175,80,0.3)' : 'rgba(224,85,85,0.3)'}`,
        }}>
          {flash.msg}
        </div>
      )}

      {/* User Info Card */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</span>
            <div style={{ color: 'var(--color-text)', marginTop: '0.25rem' }}>{profile.email as string}</div>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Display Name</span>
            <div style={{ color: 'var(--color-text)', marginTop: '0.25rem' }}>{(profile.displayName as string) || '\u2014'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Role</span>
            <div style={{ marginTop: '0.25rem' }}>
              <Badge label={user.role} color="#fff" bg={roleBadgeColors[user.role] || '#444'} />
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Member Since</span>
            <div style={{ color: 'var(--color-text)', marginTop: '0.25rem' }}>
              {profile.createdAt ? new Date(profile.createdAt as string).toLocaleDateString() : '\u2014'}
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Card */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Permissions</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {user.privileges.length > 0 ? user.privileges.map((priv) => (
            <Badge key={priv} label={priv.replace(/_/g, ' ')} color="var(--color-text)" bg="rgba(201,168,76,0.12)" />
          )) : (
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No privileges assigned</span>
          )}
        </div>
      </div>

      {/* Password Change Card */}
      <div style={cardStyle}>
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
              style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

      {/* Security / 2FA Card */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Two-Factor Authentication</h2>

        {totpStep === 'idle' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--color-text)' }}>Status:</span>
              {totpEnabled ? (
                <Badge label="Enabled" color="#4caf50" bg="rgba(76,175,80,0.12)" />
              ) : (
                <Badge label="Not Enabled" color="var(--color-text-muted)" bg="rgba(90,80,64,0.2)" />
              )}
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
              {totpEnabled
                ? 'Your account is protected with an authenticator app. You will need a code from your app each time you sign in.'
                : 'Add an extra layer of security by requiring a code from an authenticator app when signing in.'}
            </p>
            {totpEnabled ? (
              <button onClick={() => setTotpStep('disable')} style={dangerBtnStyle}>
                Disable 2FA
              </button>
            ) : (
              <button onClick={handleTotpSetup} disabled={loading} style={primaryBtnStyle}>
                {loading ? 'Setting up...' : 'Enable 2FA'}
              </button>
            )}
          </div>
        )}

        {totpStep === 'setup' && setupData && (
          <div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text)', marginBottom: '1rem', lineHeight: 1.5 }}>
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
                style={{ ...secondaryBtnStyle, fontSize: '0.65rem' }}
              >
                {showManualSecret ? 'Hide manual code' : "Can't scan this?"}
              </button>
              {showManualSecret && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  letterSpacing: '0.15em',
                  color: 'var(--color-gold)',
                  wordBreak: 'break-all',
                }}>
                  {setupData.secret}
                </div>
              )}
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text)', marginBottom: '0.6rem' }}>
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
                style={{ ...primaryBtnStyle, opacity: loading || totpCode.length !== 6 ? 0.6 : 1 }}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button onClick={() => { setTotpStep('idle'); setTotpCode(''); }} style={secondaryBtnStyle}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {totpStep === 'recovery' && (
          <div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: '#4caf50', marginBottom: '0.75rem', fontWeight: 600 }}>
              Two-factor authentication enabled!
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Save these recovery codes in a safe place. Each code can only be used once to sign in if you lose access to your authenticator app.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.4rem',
              padding: '1rem',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '3px',
              marginBottom: '1rem',
            }}>
              {recoveryCodes.map((code, i) => (
                <div key={i} style={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: 'var(--color-gold)',
                  letterSpacing: '0.1em',
                  padding: '0.2rem 0',
                }}>
                  {code}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button onClick={copyRecoveryCodes} style={secondaryBtnStyle}>
                Copy All
              </button>
              <button onClick={() => { setTotpStep('idle'); setRecoveryCodes([]); }} style={primaryBtnStyle}>
                Done
              </button>
            </div>
          </div>
        )}

        {totpStep === 'disable' && (
          <div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#e05555', marginBottom: '1rem', lineHeight: 1.5 }}>
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
              <button onClick={() => { setTotpStep('idle'); setTotpCode(''); }} style={secondaryBtnStyle}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* API Keys Card */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>API Keys</h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Use API keys to authenticate with the Sunrise CLI or SDK. Pass the key via the <code style={{ color: 'var(--color-gold)', background: '#1a1a1a', padding: '0.1rem 0.3rem', borderRadius: '2px' }}>X-API-Key</code> header.
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
            style={{ ...primaryBtnStyle, opacity: loading || !newKeyName ? 0.6 : 1, whiteSpace: 'nowrap' }}
          >
            Generate Key
          </button>
        </div>

        {/* Show newly created key */}
        {newKeyResult && (
          <div style={{
            padding: '0.75rem 1rem',
            background: '#1a1a1a',
            border: '1px solid #4caf50',
            borderRadius: '3px',
            marginBottom: '1rem',
          }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: '#4caf50', marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Copy your API key now — it won&apos;t be shown again
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: 'var(--color-gold)',
              wordBreak: 'break-all',
              marginBottom: '0.5rem',
            }}>
              {newKeyResult}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => { navigator.clipboard.writeText(newKeyResult); showFlash('success', 'Copied to clipboard'); }}
                style={secondaryBtnStyle}
              >
                Copy
              </button>
              <button onClick={() => setNewKeyResult(null)} style={secondaryBtnStyle}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Keys list */}
        {apiKeys.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.4rem 0.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-gold-dark)', borderBottom: '1px solid #1a1a1a', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '0.4rem 0.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-gold-dark)', borderBottom: '1px solid #1a1a1a', textAlign: 'left' }}>Key</th>
                <th style={{ padding: '0.4rem 0.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-gold-dark)', borderBottom: '1px solid #1a1a1a', textAlign: 'left' }}>Last Used</th>
                <th style={{ padding: '0.4rem 0.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-gold-dark)', borderBottom: '1px solid #1a1a1a', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((k) => (
                <tr key={k.id}>
                  <td style={{ padding: '0.4rem 0.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--color-text)', borderBottom: '1px solid #1a1a1a' }}>{k.name}</td>
                  <td style={{ padding: '0.4rem 0.5rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)', borderBottom: '1px solid #1a1a1a' }}>{k.key_prefix}...</td>
                  <td style={{ padding: '0.4rem 0.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text-muted)', borderBottom: '1px solid #1a1a1a' }}>{k.last_used ? new Date(k.last_used).toLocaleDateString() : 'Never'}</td>
                  <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid #1a1a1a' }}>
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
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No API keys</p>
        )}
      </div>
    </div>
  );
}
