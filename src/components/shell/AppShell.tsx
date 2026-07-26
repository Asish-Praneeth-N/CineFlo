import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, ChefHat, Tag, BarChart3,
  Activity, FileText, ChevronLeft, ChevronRight,
  Search, User, Clapperboard, Package,
  LogOut, Mail, Shield, AlertCircle
} from 'lucide-react';
import { UserProfile } from '../../types';
import { authService } from '../../services/authService';
import { AppView } from '../../App';

interface AppShellProps {
  children: React.ReactNode;
  currentUser: UserProfile | null;
  activeView: AppView;
  setActiveView: (v: AppView) => void;
  cartCount: number;
  onOpenCart: () => void;
  orders: any[];
}

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ElementType;
  roles: string[];
  badge?: (orders: any[]) => number | undefined;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'patron',    label: 'Order Food',      icon: ShoppingCart, roles: ['patron', 'admin'] },
  { id: 'kitchen',   label: 'Kitchen (KDS)',    icon: ChefHat,      roles: ['kitchen', 'admin'],
    badge: (orders) => orders.filter(o => o.status !== 'delivered').length || undefined },
  { id: 'inventory', label: 'Inventory',        icon: Package,      roles: ['admin'] },
  { id: 'offers',    label: 'Offers Engine',    icon: Tag,          roles: ['admin'] },
  { id: 'analytics', label: 'Analytics',        icon: BarChart3,    roles: ['admin'] },
  { id: 'simulator', label: 'Digital Twin',     icon: Activity,     roles: ['admin', 'simulator'] },
  { id: 'docs',      label: 'Design Doc',       icon: FileText,     roles: ['admin', 'simulator', 'patron', 'kitchen'] },
];

const ROLE_COLOR: Record<string, string> = {
  admin: '#f59e0b',
  kitchen: '#60a5fa',
  patron: '#a78bfa',
  simulator: '#4ade80',
};

const ROLE_LABEL: Record<string, string> = {
  admin: 'Cinema Admin',
  kitchen: 'Kitchen Staff',
  patron: 'Patron',
  simulator: 'System Architect',
};

export const AppShell: React.FC<AppShellProps> = ({
  children, currentUser, activeView, setActiveView, cartCount, onOpenCart, orders
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowCommandPalette(v => !v); }
      if (e.key === 'Escape') { setShowCommandPalette(false); setShowLogoutConfirm(false); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const visibleNavItems = NAV_ITEMS.filter(item =>
    item.roles.includes(currentUser?.role || 'patron')
  );

  const fmt = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const handleLogout = async () => {
    await authService.logout();
    setShowLogoutConfirm(false);
    setShowUserMenu(false);
  };

  const isPatronView = activeView === 'patron' && currentUser?.role === 'patron';

  // ─── PATRON MOBILE LAYOUT (full-width, no sidebar) ───
  if (isPatronView) {
    return (
      <div className="patron-bg min-h-screen">
        <header style={{ background: 'rgba(9,9,11,0.92)', borderBottom: '1px solid #1c1c20', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clapperboard size={16} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', letterSpacing: '-0.02em' }}>CineFlo</div>
                <div style={{ fontSize: 10, color: '#52525b', marginTop: 0 }}>In-Seat Ordering</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* User info pill */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 9999, background: 'rgba(255,255,255,0.06)', border: '1px solid #27272a', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: ROLE_COLOR[currentUser?.role || 'patron'] + '20', border: '1px solid ' + ROLE_COLOR[currentUser?.role || 'patron'] + '40', overflow: 'hidden', flexShrink: 0 }}>
                    {currentUser?.avatarUrl
                      ? <img src={currentUser.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <User size={12} color={ROLE_COLOR[currentUser?.role || 'patron']} style={{ margin: '4px' }} />
                    }
                  </div>
                  <span style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 500 }}>
                    {currentUser?.fullName.split(' ')[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <UserMenu
                      user={currentUser}
                      onClose={() => setShowUserMenu(false)}
                      onLogout={() => setShowLogoutConfirm(true)}
                      upward={false}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Cart */}
              <button className="btn btn-secondary btn-sm" onClick={onOpenCart} style={{ position: 'relative' }}>
                <ShoppingCart size={14} />
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: -6, right: -6, background: '#f59e0b', color: '#09090b', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
        <main style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>
          {children}
        </main>

        {/* Logout Confirm */}
        <AnimatePresence>
          {showLogoutConfirm && <LogoutConfirmModal onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} />}
        </AnimatePresence>
      </div>
    );
  }

  // ─── OPS / ADMIN WORKSPACE LAYOUT (sidebar) ───
  return (
    <>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-canvas)' }}>

        {/* ─── SIDEBAR ─── */}
        <motion.nav
          animate={{ width: collapsed ? 60 : 228 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', overflow: 'hidden' }}
        >
          {/* Brand */}
          <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clapperboard size={16} color="#f59e0b" />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.15 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>CineFlo</div>
                    <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 1, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>MTS-1 OPS</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ─── Role badge (below brand) ─── */}
          <AnimatePresence>
            {!collapsed && currentUser && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ padding: '10px 14px 6px', borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 9, background: ROLE_COLOR[currentUser.role] + '10', border: '1px solid ' + ROLE_COLOR[currentUser.role] + '28' }}>
                  <Shield size={11} color={ROLE_COLOR[currentUser.role]} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: ROLE_COLOR[currentUser.role], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ROLE_LABEL[currentUser.role]}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-disabled)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-mono)' }}>
                      {currentUser.email}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav items */}
          <div style={{ padding: '8px 8px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {!collapsed && <div className="sidebar-section-label" style={{ padding: '8px 8px 4px' }}>Workspace</div>}

            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              const badgeCount = item.badge?.(orders);

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: collapsed ? '7px 14px' : '7px 12px',
                    borderRadius: 8, width: '100%',
                    border: '1px solid transparent',
                    background: isActive ? 'var(--bg-active)' : 'transparent',
                    borderColor: isActive ? 'var(--border-strong)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 500 : 400,
                    marginBottom: 2, transition: 'all 120ms ease',
                    fontFamily: 'var(--font-sans)',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; } }}
                >
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} style={{ flex: 1, textAlign: 'left' }}>
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {badgeCount !== undefined && !collapsed && (
                    <span style={{ background: 'var(--color-amber-subtle)', color: 'var(--color-amber-text)', border: '1px solid var(--color-amber-border)', borderRadius: 9999, fontSize: 10, fontWeight: 600, padding: '1px 6px', fontFamily: 'var(--font-mono)' }}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ─── BOTTOM: User profile + Logout + Collapse ─── */}
          <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>

            {/* User Button → opens user menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8, width: '100%',
                  background: 'transparent', border: '1px solid transparent',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  fontSize: 12, fontFamily: 'var(--font-sans)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  transition: 'all 120ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
              >
                <div style={{ width: 26, height: 26, borderRadius: 8, background: ROLE_COLOR[currentUser?.role || 'patron'] + '18', border: '1px solid ' + ROLE_COLOR[currentUser?.role || 'patron'] + '40', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {currentUser?.avatarUrl
                    ? <img src={currentUser.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <User size={14} color={ROLE_COLOR[currentUser?.role || 'patron']} />
                  }
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentUser?.fullName}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {currentUser?.role}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <UserMenu
                    user={currentUser}
                    onClose={() => setShowUserMenu(false)}
                    onLogout={() => { setShowUserMenu(false); setShowLogoutConfirm(true); }}
                    upward
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Collapse toggle */}
            <button
              onClick={() => setCollapsed(v => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', marginTop: 6, borderRadius: 8, width: '100%', background: 'transparent', border: '1px solid transparent', color: 'var(--text-disabled)', cursor: 'pointer', transition: 'all 120ms ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-disabled)'; }}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </motion.nav>

        {/* ─── MAIN WORKSPACE ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Top header */}
          <header style={{ height: 52, borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0, background: 'var(--bg-surface)' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>CineFlo</span>
              <span style={{ color: 'var(--border-strong)', fontSize: 12 }}>/</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                {NAV_ITEMS.find(n => n.id === activeView)?.label}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowCommandPalette(true)}
                style={{ gap: 6, minWidth: 160, justifyContent: 'space-between', color: 'var(--text-tertiary)', border: '1px solid var(--border-default)', borderRadius: 8 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Search size={13} />
                  <span style={{ fontSize: 12 }}>Search or jump...</span>
                </div>
                <kbd style={{ fontSize: 10, background: 'var(--bg-hover)', border: '1px solid var(--border-default)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)' }}>⌘K</kbd>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 9999, background: 'var(--color-green-subtle)', border: '1px solid var(--color-green-border)' }}>
                <div className="status-dot status-dot-live" style={{ width: 6, height: 6 }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-green-text)', fontFamily: 'var(--font-mono)' }}>LIVE</span>
              </div>

              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', minWidth: 80, textAlign: 'right' }}>
                {fmt(time)}
              </span>
            </div>
          </header>

          <main style={{ flex: 1, overflow: 'auto' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                style={{ minHeight: '100%' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          <footer style={{ height: 28, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16, flexShrink: 0, background: 'var(--bg-canvas)' }}>
            <span style={{ fontSize: 10, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>ApexFlo MTS-1 Engineering Assignment</span>
            <div className="divider-vertical" style={{ height: 12 }} />
            <span style={{ fontSize: 10, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>Logged in as: {currentUser?.email} · {ROLE_LABEL[currentUser?.role || 'patron']}</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>₹ INR · v1.0.0</span>
          </footer>
        </div>
      </div>

      <AnimatePresence>
        {showCommandPalette && (
          <CommandPalette
            onClose={() => setShowCommandPalette(false)}
            setActiveView={(v) => { setActiveView(v); setShowCommandPalette(false); }}
            visibleItems={visibleNavItems}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutConfirm && (
          <LogoutConfirmModal
            onConfirm={handleLogout}
            onCancel={() => setShowLogoutConfirm(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── USER MENU POPOVER ─── */
const UserMenu: React.FC<{
  user: UserProfile | null;
  onClose: () => void;
  onLogout: () => void;
  upward?: boolean;
}> = ({ user, onClose, onLogout, upward }) => (
  <>
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={onClose} />
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: upward ? 8 : -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.12 }}
      style={{
        position: 'absolute',
        [upward ? 'bottom' : 'top']: 'calc(100% + 6px)',
        left: 0,
        background: 'var(--bg-overlay)',
        border: '1px solid var(--border-strong)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-xl)',
        padding: 8,
        zIndex: 300,
        minWidth: 240,
      }}
    >
      {/* Account info */}
      <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', background: ROLE_COLOR[user?.role || 'patron'] + '18', border: '1px solid ' + ROLE_COLOR[user?.role || 'patron'] + '35', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <User size={16} color={ROLE_COLOR[user?.role || 'patron']} />
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Mail size={10} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, padding: '4px 8px', borderRadius: 9999, background: ROLE_COLOR[user?.role || 'patron'] + '12', border: '1px solid ' + ROLE_COLOR[user?.role || 'patron'] + '28', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Shield size={10} color={ROLE_COLOR[user?.role || 'patron']} />
          <span style={{ fontSize: 10, fontWeight: 600, color: ROLE_COLOR[user?.role || 'patron'], textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {ROLE_LABEL[user?.role || 'patron']}
          </span>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 9, width: '100%',
          background: 'transparent', border: 'none',
          color: 'var(--color-red-text)', cursor: 'pointer',
          fontSize: 13, fontFamily: 'var(--font-sans)',
          transition: 'all 120ms ease',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-red-subtle)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        <LogOut size={14} />
        Sign Out
      </button>
    </motion.div>
  </>
);

/* ─── LOGOUT CONFIRM MODAL ─── */
const LogoutConfirmModal: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
      style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', borderRadius: 18, padding: 28, maxWidth: 360, width: '100%', boxShadow: 'var(--shadow-2xl)' }}
    >
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-red-subtle)', border: '1px solid var(--color-red-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LogOut size={18} color="var(--color-red-text)" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Sign out of CineFlo?</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            You'll be returned to the login page. Any unsaved changes will be lost.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
        <button
          onClick={onConfirm}
          style={{ flex: 1, padding: '8px 0', background: 'var(--color-red-muted)', border: '1px solid var(--color-red-border)', borderRadius: 9, color: 'var(--color-red-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 120ms ease' }}
        >
          Sign Out
        </button>
      </div>
    </motion.div>
  </div>
);

/* ─── COMMAND PALETTE ─── */
const CommandPalette: React.FC<{ onClose: () => void; setActiveView: (v: AppView) => void; visibleItems: NavItem[] }> = ({ onClose, setActiveView, visibleItems }) => {
  const [query, setQuery] = useState('');
  const filtered = visibleItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="command-overlay" onClick={onClose}>
      <motion.div
        className="command-dialog"
        initial={{ opacity: 0, scale: 0.97, y: -16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--border-default)' }}>
          <Search size={16} color="var(--text-tertiary)" />
          <input className="command-input" placeholder="Jump to a section..." value={query} onChange={e => setQuery(e.target.value)} autoFocus style={{ padding: 0 }} />
          <kbd style={{ fontSize: 10, background: 'var(--bg-hover)', border: '1px solid var(--border-default)', borderRadius: 4, padding: '2px 6px', fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', flexShrink: 0 }}>ESC</kbd>
        </div>
        <div style={{ padding: '8px 0', maxHeight: 320, overflowY: 'auto' }}>
          {filtered.length === 0 && <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>No results found</div>}
          {filtered.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} className="command-item" onClick={() => setActiveView(item.id)}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} color="var(--text-secondary)" />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 450 }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
