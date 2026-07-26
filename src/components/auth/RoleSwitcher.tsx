import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types';
import { authService, DEMO_PROFILES } from '../../services/authService';
import { Shield, Utensils, Popcorn, Activity, ChevronDown, Check, UserCheck } from 'lucide-react';

interface RoleSwitcherProps {
  currentUser: UserProfile | null;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);

  const roles: { role: UserRole; label: string; icon: any; color: string; desc: string }[] = [
    {
      role: 'patron',
      label: 'Patron (Moviegoer)',
      icon: Popcorn,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      desc: 'Seat-Delivery Food Ordering'
    },
    {
      role: 'kitchen',
      label: 'Kitchen Staff (KDS)',
      icon: Utensils,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      desc: 'Order Queue & Runner Dispatch'
    },
    {
      role: 'admin',
      label: 'Cinema Admin / Manager',
      icon: Shield,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      desc: 'Stock Control & Offers Engine'
    },
    {
      role: 'simulator',
      label: 'System Architect',
      icon: Activity,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      desc: 'Digital Twin Load Benchmarks'
    }
  ];

  const currentRoleObj = roles.find(r => r.role === currentUser?.role) || roles[0];
  const IconComponent = currentRoleObj.icon;

  const handleSelectRole = (role: UserRole) => {
    authService.switchDemoRole(role);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      
      {/* Active Role Selector Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all text-xs"
      >
        <div className={`p-1 rounded-lg ${currentRoleObj.color}`}>
          <IconComponent className="w-3.5 h-3.5" />
        </div>
        <div className="text-left hidden sm:block">
          <span className="text-[10px] text-slate-400 block font-mono uppercase">Role Access</span>
          <span className="font-bold text-white text-xs">{currentRoleObj.label.split(' ')[0]}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel p-2 border border-amber-500/30 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>SWITCH EVALUATION ROLE</span>
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="space-y-1 pt-1">
            {roles.map(r => {
              const RoleIcon = r.icon;
              const isSelected = currentUser?.role === r.role;

              return (
                <button
                  key={r.role}
                  onClick={() => handleSelectRole(r.role)}
                  className={`w-full p-2.5 rounded-xl text-left flex items-start space-x-3 transition-all ${
                    isSelected ? 'bg-amber-500/15 border border-amber-500/40' : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg mt-0.5 ${r.color}`}>
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{r.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 block">{r.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
