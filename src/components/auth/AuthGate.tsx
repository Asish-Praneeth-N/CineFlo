import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clapperboard, Mail, Lock, User, Eye, EyeOff,
  AlertCircle, CheckCircle, ChefHat, Shield
} from 'lucide-react';
import { authService } from '../../services/authService';
import { UserRole } from '../../types';

interface AuthGateProps {
  onAuthenticated: () => void;
}

type AuthMode = 'login' | 'register';

const ROLE_OPTIONS: { value: UserRole; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { value: 'patron',  label: 'Patron',       description: 'Order food & beverages delivered to your seat', icon: User,    color: '#a78bfa' },
  { value: 'kitchen', label: 'Kitchen Staff', description: 'Manage and process orders on the Kitchen KDS',  icon: ChefHat, color: '#60a5fa' },
];

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  // Login state
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regFullName,  setRegFullName]  = useState('');
  const [regEmail,     setRegEmail]     = useState('');
  const [regPassword,  setRegPassword]  = useState('');
  const [regConfirm,   setRegConfirm]   = useState('');
  const [regRole,      setRegRole]      = useState<UserRole>('patron');

  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const clearErrors = () => { setError(''); setSuccess(''); };

  const handleLogin = async () => {
    clearErrors();
    if (!validateEmail(loginEmail)) { setError('Please enter a valid email address.'); return; }
    if (loginPassword.length < 4)  { setError('Password must be at least 4 characters.'); return; }

    setLoading(true);
    const result = await authService.loginWithCredentials(
      loginEmail.trim().toLowerCase(),
      loginPassword
    );
    setLoading(false);

    if (result.success) {
      onAuthenticated();
    } else {
      setError(result.error || 'Invalid email or password. Please try again.');
    }
  };

  const handleRegister = async () => {
    clearErrors();
    if (!regFullName.trim() || regFullName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).'); return;
    }
    if (!validateEmail(regEmail)) {
      setError('Please enter a valid email address.'); return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    if (regPassword !== regConfirm) {
      setError('Passwords do not match.'); return;
    }

    setLoading(true);
    const result = await authService.registerWithCredentials(
      regEmail.trim().toLowerCase(),
      regPassword,
      regFullName.trim(),
      regRole
    );
    setLoading(false);

    if (result.success) {
      setSuccess('Account created! Signing you in...');
      setTimeout(onAuthenticated, 1200);
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#07070a',
      backgroundImage: `
        radial-gradient(ellipse at 50% -10%, rgba(245,158,11,0.07) 0%, transparent 60%),
        radial-gradient(circle at 85% 85%, rgba(139,92,246,0.05) 0%, transparent 45%)
      `,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 28 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clapperboard size={20} color="#f59e0b" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.03em', lineHeight: 1 }}>CineFlo</div>
              <div style={{ fontSize: 10, color: '#3f3f46', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginTop: 3 }}>IN-CINEMA COMMERCE PLATFORM</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#71717a', marginTop: 8 }}>
            {mode === 'login' ? 'Sign in to your account to continue' : 'Create your CineFlo account'}
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 20, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}
        >
          {/* Mode toggle */}
          <div style={{ display: 'flex', background: '#09090b', border: '1px solid #1c1c20', borderRadius: 10, padding: 3, marginBottom: 24 }}>
            {(['login', 'register'] as AuthMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); clearErrors(); }}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                  background: mode === m ? '#fafafa' : 'transparent',
                  color: mode === m ? '#09090b' : '#71717a',
                  transition: 'all 150ms ease',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}>
                <LoginForm
                  email={loginEmail} setEmail={setLoginEmail}
                  password={loginPassword} setPassword={setLoginPassword}
                  showPass={showPass} setShowPass={setShowPass}
                  onSubmit={handleLogin} loading={loading}
                  onClearErrors={clearErrors}
                />
              </motion.div>
            ) : (
              <motion.div key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                <RegisterForm
                  fullName={regFullName}     setFullName={setRegFullName}
                  email={regEmail}           setEmail={setRegEmail}
                  password={regPassword}     setPassword={setRegPassword}
                  confirm={regConfirm}       setConfirm={setRegConfirm}
                  role={regRole}             setRole={setRegRole}
                  showPass={showPass}        setShowPass={setShowPass}
                  showConfirm={showConfirm}  setShowConfirm={setShowConfirm}
                  onSubmit={handleRegister}  loading={loading}
                  onClearErrors={clearErrors}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error / Success */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, overflow: 'hidden' }}
              >
                <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: '#f87171', lineHeight: 1.5 }}>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 9, overflow: 'hidden' }}
              >
                <CheckCircle size={14} color="#4ade80" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#4ade80' }}>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <button
            onClick={mode === 'login' ? handleLogin : handleRegister}
            disabled={loading}
            style={{
              width: '100%', padding: '11px 0', marginTop: 20,
              background: loading ? '#27272a' : '#fafafa',
              border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 600,
              color: loading ? '#71717a' : '#09090b',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)', transition: 'all 150ms ease',
            }}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login' ? 'Sign In' : 'Create Account'
            }
          </button>

          {/* Guest Login Option */}
          <div style={{ marginTop: 16, textAlign: 'center', borderTop: '1px solid #1c1c20', paddingTop: 16 }}>
            <button
              type="button"
              onClick={() => {
                authService.loginAsGuest();
                onAuthenticated();
              }}
              style={{
                width: '100%', padding: '9px 0',
                background: 'transparent', border: '1px solid #27272a',
                borderRadius: 10, fontSize: 13, fontWeight: 500,
                color: '#a1a1aa', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'all 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#52525b'; (e.currentTarget as HTMLElement).style.color = '#fafafa'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#27272a'; (e.currentTarget as HTMLElement).style.color = '#a1a1aa'; }}
            >
              <User size={14} color="#a78bfa" />
              <span>Continue as Guest Patron</span>
            </button>
            <div style={{ fontSize: 10, color: '#52525b', marginTop: 6 }}>
              No account required — prompt for name at seat checkout
            </div>
          </div>
        </motion.div>

        {/* Footer note */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#3f3f46', fontFamily: 'var(--font-mono)' }}>
          ApexFlo MTS-1 · In-Cinema Commerce Platform · ₹ INR
        </div>
      </div>
    </div>
  );
};

/* ─── LOGIN FORM ─── */
const LoginForm: React.FC<{
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  showPass: boolean; setShowPass: (v: boolean) => void;
  onSubmit: () => void; loading: boolean; onClearErrors: () => void;
}> = ({ email, setEmail, password, setPassword, showPass, setShowPass, onSubmit, loading, onClearErrors }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <Field label="Email Address">
      <div style={{ position: 'relative' }}>
        <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none' }} />
        <input
          className="input" type="email" placeholder="your@email.com"
          value={email} onChange={e => { setEmail(e.target.value); onClearErrors(); }}
          style={{ paddingLeft: 36, background: '#0d0d10', borderColor: '#27272a' }}
          autoComplete="email" autoFocus
        />
      </div>
    </Field>
    <Field label="Password">
      <div style={{ position: 'relative' }}>
        <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none' }} />
        <input
          className="input" type={showPass ? 'text' : 'password'} placeholder="Your password"
          value={password} onChange={e => { setPassword(e.target.value); onClearErrors(); }}
          style={{ paddingLeft: 36, paddingRight: 40, background: '#0d0d10', borderColor: '#27272a' }}
          autoComplete="current-password"
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
        />
        <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex', padding: 0 }}>
          {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </Field>
  </div>
);

/* ─── REGISTER FORM ─── */
const RegisterForm: React.FC<{
  fullName: string; setFullName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  confirm: string; setConfirm: (v: string) => void;
  role: UserRole; setRole: (v: UserRole) => void;
  showPass: boolean; setShowPass: (v: boolean) => void;
  showConfirm: boolean; setShowConfirm: (v: boolean) => void;
  onSubmit: () => void; loading: boolean; onClearErrors: () => void;
}> = ({ fullName, setFullName, email, setEmail, password, setPassword, confirm, setConfirm, role, setRole, showPass, setShowPass, showConfirm, setShowConfirm, onSubmit, loading, onClearErrors }) => {
  const ROLE_OPTIONS_REG = [
    { value: 'patron' as UserRole,  label: 'Patron',       description: 'Order food to your seat',   icon: User,    color: '#a78bfa' },
    { value: 'kitchen' as UserRole, label: 'Kitchen Staff', description: 'Manage orders on KDS',      icon: ChefHat, color: '#60a5fa' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Full Name">
        <div style={{ position: 'relative' }}>
          <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none' }} />
          <input
            className="input" placeholder="Your full name"
            value={fullName} onChange={e => { setFullName(e.target.value); onClearErrors(); }}
            style={{ paddingLeft: 36, background: '#0d0d10', borderColor: '#27272a' }}
            autoComplete="name" autoFocus
          />
        </div>
      </Field>
      <Field label="Email Address">
        <div style={{ position: 'relative' }}>
          <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none' }} />
          <input
            className="input" type="email" placeholder="your@email.com"
            value={email} onChange={e => { setEmail(e.target.value); onClearErrors(); }}
            style={{ paddingLeft: 36, background: '#0d0d10', borderColor: '#27272a' }}
            autoComplete="email"
          />
        </div>
      </Field>
      <Field label="Password">
        <div style={{ position: 'relative' }}>
          <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none' }} />
          <input
            className="input" type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
            value={password} onChange={e => { setPassword(e.target.value); onClearErrors(); }}
            style={{ paddingLeft: 36, paddingRight: 40, background: '#0d0d10', borderColor: '#27272a' }}
            autoComplete="new-password"
          />
          <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex', padding: 0 }}>
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </Field>
      <Field label="Confirm Password">
        <div style={{ position: 'relative' }}>
          <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none' }} />
          <input
            className="input" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password"
            value={confirm} onChange={e => { setConfirm(e.target.value); onClearErrors(); }}
            style={{ paddingLeft: 36, paddingRight: 40, background: '#0d0d10', borderColor: '#27272a' }}
            autoComplete="new-password"
            onKeyDown={e => e.key === 'Enter' && onSubmit()}
          />
          <button onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex', padding: 0 }}>
            {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </Field>
      <Field label="Account Type">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ROLE_OPTIONS_REG.map(opt => {
            const Icon = opt.icon;
            const isSelected = role === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setRole(opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10, border: '1px solid',
                  borderColor: isSelected ? opt.color + '55' : '#1c1c20',
                  background: isSelected ? opt.color + '0d' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)',
                  transition: 'all 150ms ease',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 9, background: opt.color + '18', border: '1px solid ' + opt.color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={opt.color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? '#fafafa' : '#a1a1aa' }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: '#52525b', marginTop: 1 }}>{opt.description}</div>
                </div>
                {isSelected && (
                  <div style={{ marginLeft: 'auto', width: 16, height: 16, borderRadius: '50%', background: opt.color + '22', border: '1px solid ' + opt.color + '55', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: opt.color }} />
                  </div>
                )}
              </button>
            );
          })}
          <div style={{ fontSize: 11, color: '#3f3f46', padding: '6px 10px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 8 }}>
            <Shield size={10} color="#f59e0b" style={{ display: 'inline', marginRight: 5 }} />
            Admin accounts are created by the Cinema Manager only.
          </div>
        </div>
      </Field>
    </div>
  );
};

/* ─── FIELD WRAPPER ─── */
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>
      {label}
    </label>
    {children}
  </div>
);
