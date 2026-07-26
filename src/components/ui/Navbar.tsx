import React, { useState, useEffect } from 'react';
import { Film, ShoppingBag, ShieldCheck, Activity, FileText, Popcorn, User, LogOut, Database, Key } from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { authService } from '../../services/authService';
import { isLiveSupabaseConfigured } from '../../services/supabaseClient';
import { RoleSwitcher } from '../auth/RoleSwitcher';
import { AuthModal } from '../auth/AuthModal';

interface NavbarProps {
  activeTab: 'patron' | 'admin' | 'simulator' | 'docs';
  setActiveTab: (tab: 'patron' | 'admin' | 'simulator' | 'docs') => void;
  cartCount: number;
  openCart: () => void;
  selectedScreenName: string;
  selectedSeat: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  openCart,
  selectedScreenName,
  selectedSeat
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsub = authService.subscribe((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-amber-500/20 backdrop-blur-xl cinema-screen-glow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('patron')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Film className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent">
                  CineFlo
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                  MTS-1
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono hidden sm:flex">
                <span>In-Cinema Physical AI Commerce</span>
                <span className="text-slate-600">•</span>
                <span className={`flex items-center space-x-1 ${isLiveSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                  <Database className="w-3 h-3" />
                  <span>{isLiveSupabaseConfigured ? 'Supabase DB Live' : '.env Loaded'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Mode Switcher (Role-Filtered) */}
          <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {(currentUser?.role === 'patron' || !currentUser) && (
              <button
                onClick={() => setActiveTab('patron')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'patron'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Popcorn className="w-3.5 h-3.5" />
                <span>Patron Menu</span>
              </button>
            )}

            {(currentUser?.role === 'kitchen' || currentUser?.role === 'admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin & KDS</span>
              </button>
            )}

            {(currentUser?.role === 'simulator' || currentUser?.role === 'admin') && (
              <button
                onClick={() => setActiveTab('simulator')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'simulator'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-cyan-300" />
                <span>Digital Twin</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'docs'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-extrabold shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden md:inline">Design Doc</span>
            </button>
          </nav>

          {/* Right Controls: Role Switcher, User Profile, Cart */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Demo Role Switcher Dropdown */}
            <RoleSwitcher currentUser={currentUser} />

            {/* Auth / Login Trigger */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/30 transition-all flex items-center space-x-1 text-xs"
              title="Supabase Auth Credentials Login"
            >
              <User className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline font-mono">{currentUser?.fullName.split(' ')[0]}</span>
            </button>

            {/* Patron Cart Button */}
            <button
              onClick={openCart}
              className="relative p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all flex items-center justify-center"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/40 animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
};
