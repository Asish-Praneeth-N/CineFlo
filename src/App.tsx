import React, { useState, useEffect, useCallback } from 'react';
import { MenuItem, InventoryItem, CartItem, Order, Offer, UserProfile } from './types';
import { inventoryService } from './services/inventoryService';
import { authService } from './services/authService';

import { AuthGate } from './components/auth/AuthGate';
import { AppShell } from './components/shell/AppShell';
import { PatronApp } from './components/patron/PatronApp';
import { KitchenCommandCenter } from './components/admin/KitchenCommandCenter';
import { InventoryControl } from './components/admin/InventoryControl';
import { OffersEngine } from './components/admin/OffersEngine';
import { AnalyticsDashboard } from './components/admin/AnalyticsDashboard';
import { DigitalTwinView } from './components/simulator/DigitalTwinView';
import { DesignDocView } from './components/docs/DesignDocView';

export type AppView =
  | 'patron'
  | 'kitchen'
  | 'inventory'
  | 'offers'
  | 'analytics'
  | 'simulator'
  | 'docs';

const DEFAULT_VIEW_BY_ROLE: Record<string, AppView> = {
  patron:    'patron',
  kitchen:   'kitchen',
  admin:     'kitchen',
  simulator: 'simulator',
};

const ALLOWED_VIEWS: Record<string, AppView[]> = {
  patron:    ['patron', 'docs'],
  kitchen:   ['kitchen', 'docs'],
  admin:     ['patron', 'kitchen', 'inventory', 'offers', 'analytics', 'simulator', 'docs'],
  simulator: ['simulator', 'docs'],
};

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [activeView,  setActiveView]  = useState<AppView>(() => {
    const user = authService.getCurrentUser();
    return user ? (DEFAULT_VIEW_BY_ROLE[user.role] || 'patron') : 'patron';
  });

  // Patron state
  const [selectedScreenName, setSelectedScreenName] = useState('Screen 1 (IMAX 3D AUDI 1)');
  const [selectedSeat,       setSelectedSeat]       = useState('Seat F-14');
  const [isSeatModalOpen,    setIsSeatModalOpen]    = useState(false);

  // Cart
  const [cart,        setCart]        = useState<CartItem[]>([]);
  const [isCartOpen,  setIsCartOpen]  = useState(false);

  // Live data — all sourced from Supabase via inventoryService
  const [menuItems,  setMenuItems]  = useState<MenuItem[]>([]);
  const [inventory,  setInventory]  = useState<Record<string, InventoryItem>>({});
  const [orders,     setOrders]     = useState<Order[]>([]);
  const [offers,     setOffers]     = useState<Offer[]>([]);

  useEffect(() => {
    // Auth subscription
    const unsubAuth = authService.subscribe((user) => {
      setCurrentUser(user);
      if (user) {
        // If current activeView is not allowed for this role, fallback to default
        const allowed = ALLOWED_VIEWS[user.role] || [];
        if (!allowed.includes(activeView)) {
          setActiveView(DEFAULT_VIEW_BY_ROLE[user.role] || 'patron');
        }
      }
    });

    // Data subscriptions — all from Supabase
    const unsubMenu   = inventoryService.subscribeMenu(setMenuItems);
    const unsubStock  = inventoryService.subscribeStock(setInventory);
    const unsubOrders = inventoryService.subscribeOrders(setOrders);
    const unsubOffers = inventoryService.subscribeOffers(setOffers);

    return () => {
      unsubAuth();
      unsubMenu();
      unsubStock();
      unsubOrders();
      unsubOffers();
    };
  }, [activeView]);

  const handleSetActiveView = useCallback((view: AppView) => {
    if (!currentUser) return;
    const allowed = ALLOWED_VIEWS[currentUser.role] || [];
    if (allowed.includes(view)) setActiveView(view);
  }, [currentUser]);

  const handleAddToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.item.id === item.id);
      if (existing) return prev.map(ci => ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      return [...prev, { item, quantity: 1 }];
    });
  }, []);

  const handleUpdateQuantity = useCallback((itemId: string, delta: number) => {
    setCart(prev => prev.map(ci => {
      if (ci.item.id !== itemId) return ci;
      const nextQty = ci.quantity + delta;
      return nextQty > 0 ? { ...ci, quantity: nextQty } : null;
    }).filter(Boolean) as CartItem[]);
  }, []);

  // ─── AUTH GATE ───────────────────────────────────────────────────────
  if (!currentUser) {
    return <AuthGate onAuthenticated={() => {
      const user = authService.getCurrentUser();
      if (user) setActiveView(DEFAULT_VIEW_BY_ROLE[user.role] || 'patron');
    }} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'patron':
        return (
          <PatronApp
            menuItems={menuItems}
            inventory={inventory}
            orders={orders}
            offers={offers}
            cart={cart}
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
            selectedScreenName={selectedScreenName}
            selectedSeat={selectedSeat}
            isSeatModalOpen={isSeatModalOpen}
            setIsSeatModalOpen={setIsSeatModalOpen}
            setSelectedScreenName={setSelectedScreenName}
            setSelectedSeat={setSelectedSeat}
            addToCart={handleAddToCart}
            updateQuantity={handleUpdateQuantity}
            clearCart={() => setCart([])}
            currentUserId={currentUser.id}
          />
        );
      case 'kitchen':
        return <KitchenCommandCenter orders={orders} />;
      case 'inventory':
        return <InventoryControl menuItems={menuItems} inventory={inventory} />;
      case 'offers':
        return <OffersEngine offers={offers} />;
      case 'analytics':
        return <AnalyticsDashboard orders={orders} />;
      case 'simulator':
        return <DigitalTwinView />;
      case 'docs':
        return <DesignDocView />;
      default:
        return null;
    }
  };

  return (
    <AppShell
      currentUser={currentUser}
      activeView={activeView}
      setActiveView={handleSetActiveView}
      cartCount={cart.reduce((a, c) => a + c.quantity, 0)}
      onOpenCart={() => setIsCartOpen(true)}
      orders={orders}
    >
      {renderView()}
    </AppShell>
  );
}
