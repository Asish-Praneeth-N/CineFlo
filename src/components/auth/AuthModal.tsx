import React, { useState } from 'react';
import { UserRole } from '../../types';
import { authService } from '../../services/authService';
import { X, Lock, Mail, Shield, Popcorn, Utensils, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('nagavallikamma1979@gmail.com');
  const [password, setPassword] = useState('Admin@123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);

    if (!email || !password) {
      setAuthError('Email and Password are required.');
      return;
    }

    const res = await authService.loginWithCredentials(email, password, selectedRole);

    if (res.success && res.user) {
      setAuthSuccessMsg(`Successfully authenticated as ${res.user.fullName} (${res.user.role.toUpperCase()} role)!`);
      setTimeout(() => {
        onClose();
        setAuthSuccessMsg(null);
      }, 1000);
    } else {
      setAuthError(res.error || 'Authentication failed.');
    }
  };

  const handleQuickFillAdmin = () => {
    setEmail('nagavallikamma1979@gmail.com');
    setPassword('Admin@123');
    setSelectedRole('admin');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-amber-500/30 space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                {isSignUp ? 'Create CineFlo Account' : 'Supabase Auth Login'}
              </h3>
              <p className="text-xs text-slate-400">In-Cinema Commerce Authentication</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Admin Credentials Button */}
        <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center justify-between text-xs">
          <div>
            <span className="text-amber-400 font-bold block">Primary Admin Account</span>
            <span className="text-slate-400 font-mono text-[11px]">nagavallikamma1979@gmail.com</span>
          </div>
          <button
            type="button"
            onClick={handleQuickFillAdmin}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px]"
          >
            Auto-Fill
          </button>
        </div>

        {/* Role Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 block">Select Target Role</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { role: 'patron', label: 'Patron', icon: Popcorn },
              { role: 'kitchen', label: 'Kitchen KDS', icon: Utensils },
              { role: 'admin', label: 'Cinema Admin', icon: Shield },
              { role: 'simulator', label: 'Architect', icon: Activity }
            ].map(({ role, label, icon: Icon }) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role as UserRole)}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-2 ${
                  selectedRole === role
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="nagavallikamma1979@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input pl-10 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-10 text-xs font-mono"
              />
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            {isSignUp ? 'Sign Up & Assign Role' : 'Authenticate & Sign In'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-amber-400 hover:underline font-semibold"
          >
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>

      </div>
    </div>
  );
};
