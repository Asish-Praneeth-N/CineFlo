import { UserProfile, UserRole } from '../types';
import { supabase, isLiveSupabaseConfigured } from './supabaseClient';

type AuthChangeListener = (user: UserProfile | null) => void;

const SESSION_KEY = 'cineflo_session_user';

// Demo role profiles for quick access
export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  patron: {
    id: 'usr-patron-101',
    email: 'patron@cineflo.com',
    fullName: 'Alex Rivera',
    role: 'patron',
    favoriteSeat: 'Seat F-14',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString()
  },
  kitchen: {
    id: 'usr-kitchen-202',
    email: 'kitchen@cineflo.com',
    fullName: 'Chef Marco',
    role: 'kitchen',
    avatarUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString()
  },
  admin: {
    id: 'usr-admin-303',
    email: 'nagavallikamma1979@gmail.com',
    fullName: 'Nagavalli Kamma',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString()
  },
  simulator: {
    id: 'usr-sim-404',
    email: 'engineer.twin@cineflo.com',
    fullName: 'Dr. Aris Thorne',
    role: 'simulator',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString()
  }
};

// Role derivation by email — fixed roles for known system accounts
const ROLE_BY_EMAIL: Record<string, UserRole> = {
  'nagavallikamma1979@gmail.com': 'admin',
  'kitchen@cineflo.com': 'kitchen',
  'marco.kitchen@cineflo.com': 'kitchen',
  'patron@cineflo.com': 'patron',
  'engineer.twin@cineflo.com': 'simulator',
};

class AuthService {
  private currentUser: UserProfile | null = null;
  private listeners: Set<AuthChangeListener> = new Set();

  constructor() {
    // Restore session from localStorage if present
    this.restoreLocalSession();
    this.initSupabaseAuthListener();
  }

  private restoreLocalSession() {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        this.currentUser = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to restore local user session:', e);
    }
  }

  private setCurrentUser(user: UserProfile | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    this.notify();
  }

  private initSupabaseAuthListener() {
    if (isLiveSupabaseConfigured) {
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const email = session.user.email || '';
          const derivedRole: UserRole = ROLE_BY_EMAIL[email.toLowerCase()] ||
            (session.user.user_metadata?.role as UserRole) || 'patron';

          const user: UserProfile = {
            id: session.user.id,
            email,
            fullName: session.user.user_metadata?.full_name || email.split('@')[0],
            role: derivedRole,
            createdAt: session.user.created_at
          };
          this.setCurrentUser(user);
        }
      });
    }
  }

  public subscribe(listener: AuthChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.currentUser));
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public switchDemoRole(role: UserRole) {
    this.setCurrentUser({ ...DEMO_PROFILES[role] });
  }

  /**
   * Login with email + password.
   * Role is derived from email for known accounts; otherwise uses provided role.
   */
  public async loginWithCredentials(
    email: string,
    password: string,
    fallbackRole: UserRole = 'patron'
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const effectiveRole: UserRole = ROLE_BY_EMAIL[cleanEmail] || fallbackRole;

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

        if (error) {
          console.warn('Supabase sign-in warning:', error.message);
        } else if (data?.user) {
          const user: UserProfile = {
            id: data.user.id,
            email: cleanEmail,
            fullName: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            role: ROLE_BY_EMAIL[cleanEmail] || (data.user.user_metadata?.role as UserRole) || 'patron',
            createdAt: data.user.created_at
          };
          this.setCurrentUser(user);
          return { success: true, user };
        }
      } catch (err: any) {
        console.warn('Supabase error:', err.message);
      }
    }

    // ─── LOCAL AUTH (offline / demo mode / fallback) ───
    if (cleanEmail === 'nagavallikamma1979@gmail.com' && password !== 'Admin@123') {
      return { success: false, error: 'Incorrect password for Cinema Admin account.' };
    }
    if ((cleanEmail === 'kitchen@cineflo.com' || cleanEmail === 'marco.kitchen@cineflo.com') && password !== 'Kitchen@123') {
      return { success: false, error: 'Incorrect password for Kitchen Staff account.' };
    }

    const user: UserProfile = {
      id: `usr-${Math.floor(10000 + Math.random() * 90000)}`,
      email: cleanEmail,
      fullName: cleanEmail === 'nagavallikamma1979@gmail.com'
        ? 'Nagavalli Kamma'
        : cleanEmail === 'kitchen@cineflo.com'
        ? 'Kitchen Staff'
        : cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      role: effectiveRole,
      createdAt: new Date().toISOString()
    };

    this.setCurrentUser(user);
    return { success: true, user };
  }

  /**
   * Log in as a Guest Patron (no password required upfront)
   */
  public loginAsGuest(guestName?: string): UserProfile {
    const guestId = `guest-${Math.floor(10000 + Math.random() * 90000)}`;
    const name = guestName?.trim() || 'Guest Patron';
    const user: UserProfile = {
      id: guestId,
      email: `${guestId}@guest.cineflo.com`,
      fullName: name,
      role: 'patron',
      createdAt: new Date().toISOString()
    };
    this.setCurrentUser(user);
    return user;
  }

  /**
   * Register a new account.
   * Admin role cannot be self-registered.
   */
  public async registerWithCredentials(
    email: string,
    password: string,
    fullName: string,
    role: UserRole = 'patron'
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    if (role === 'admin') {
      return { success: false, error: 'Admin accounts cannot be self-registered.' };
    }

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: fullName, role }
          }
        });

        if (error) {
          console.warn('Supabase sign-up warning:', error.message);
        } else if (data?.user) {
          const user: UserProfile = {
            id: data.user.id,
            email: cleanEmail,
            fullName,
            role,
            createdAt: data.user.created_at
          };
          this.setCurrentUser(user);
          return { success: true, user };
        }
      } catch (err: any) {
        console.warn('Supabase sign-up error:', err.message);
      }
    }

    // ─── LOCAL REGISTRATION ───
    const user: UserProfile = {
      id: `usr-${Math.floor(10000 + Math.random() * 90000)}`,
      email: cleanEmail,
      fullName,
      role,
      createdAt: new Date().toISOString()
    };

    this.setCurrentUser(user);
    return { success: true, user };
  }

  /**
   * Sign out — clears session and localStorage
   */
  public async logout(): Promise<void> {
    if (isLiveSupabaseConfigured) {
      try { await supabase.auth.signOut(); } catch { /* ignore */ }
    }
    this.setCurrentUser(null);
  }
}

export const authService = new AuthService();
