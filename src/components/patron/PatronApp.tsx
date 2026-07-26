import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, MapPin, ChevronRight, Plus, Minus, Sparkles, Clock, X, Tag, Check, CreditCard, QrCode, Banknote, User, ShieldCheck, Flame, ChefHat, Truck, CheckCircle2, Search, HelpCircle } from 'lucide-react';
import { MenuItem, InventoryItem, CartItem, Order, Offer, OrderStatus } from '../../types';
import { inventoryService } from '../../services/inventoryService';
import { OffersEngine as OffersEngineService } from '../../services/offersEngine';
import { AuditoriumSeatPicker } from './AuditoriumSeatPicker';

interface PatronAppProps {
  menuItems: MenuItem[];
  inventory: Record<string, InventoryItem>;
  orders: Order[];
  offers: Offer[];
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (v: boolean) => void;
  selectedScreenName: string;
  selectedSeat: string;
  isSeatModalOpen: boolean;
  setIsSeatModalOpen: (v: boolean) => void;
  setSelectedScreenName: (v: string) => void;
  setSelectedSeat: (v: string) => void;
  addToCart: (item: MenuItem) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  currentUserId: string;
}

const CATEGORIES = ['All', 'Combos', 'Popcorn', 'Hot Food', 'Beverages', 'Snacks', 'Desserts'] as const;
const TRACKED_IDS_STORAGE_KEY = 'cineflo_tracked_order_ids';

export const PatronApp: React.FC<PatronAppProps> = ({
  menuItems, inventory, orders, offers, cart,
  isCartOpen, setIsCartOpen,
  selectedScreenName, selectedSeat,
  isSeatModalOpen, setIsSeatModalOpen,
  setSelectedScreenName, setSelectedSeat,
  addToCart, updateQuantity, clearCart,
  currentUserId,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeTrackerOrder, setActiveTrackerOrder] = useState<Order | null>(null);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  // Saved tracked order IDs (persisted across guest logout & re-login)
  const [trackedOrderIds, setTrackedOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(TRACKED_IDS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveTrackedOrderId = (id: string) => {
    setTrackedOrderIds(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try { localStorage.setItem(TRACKED_IDS_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const cartTotal = cart.reduce((s, ci) => s + ci.item.price * ci.quantity, 0);
  const cartCount = cart.reduce((s, ci) => s + ci.quantity, 0);

  const filteredItems = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(i => i.category === activeCategory);

  // Combine orders belonging to current user OR explicitly tracked by Order ID
  const myOrders = orders.filter(o =>
    o.patronId === currentUserId ||
    trackedOrderIds.includes(o.id)
  );

  return (
    <div style={{ background: '#07070a', minHeight: '100vh' }}>

      {/* ─── Seat Context Banner & Track Order Button ─── */}
      <div
        style={{
          background: 'rgba(245,158,11,0.06)',
          borderBottom: '1px solid rgba(245,158,11,0.15)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          onClick={() => setIsSeatModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <MapPin size={13} color="#f59e0b" />
          <div>
            <div style={{ fontSize: 11, color: '#71717a', fontWeight: 500 }}>Ordering for</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fafafa' }}>
              {selectedSeat} · {selectedScreenName.split('(')[0].trim()}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#f59e0b', fontWeight: 500, marginLeft: 4 }}>
            Change <ChevronRight size={12} />
          </div>
        </div>

        {/* Track Order by ID Button */}
        <button
          onClick={() => setIsTrackModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: '#111113', border: '1px solid #27272a',
            fontSize: 11, fontWeight: 500, color: '#a78bfa',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            transition: 'all 120ms ease'
          }}
        >
          <Search size={12} color="#a78bfa" />
          <span>Track Order by ID</span>
        </button>
      </div>

      {/* ─── Live Order Tracker Section ─── */}
      {myOrders.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Live Order Status Tracker ({myOrders.length})</span>
            <button
              onClick={() => setIsTrackModalOpen(true)}
              style={{ fontSize: 10, color: '#a78bfa', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              + Lookup Order ID
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myOrders.map(order => (
              <LiveOrderCard
                key={order.id}
                order={order}
                onClick={() => setActiveTrackerOrder(order)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Category Pills ─── */}
      <div style={{ padding: '16px 16px 12px', overflowX: 'auto', display: 'flex', gap: 8, scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 14px', borderRadius: 9999, border: '1px solid', flexShrink: 0,
                fontSize: 12, fontWeight: isActive ? 600 : 400, cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                background: isActive ? '#fafafa' : 'transparent',
                color: isActive ? '#09090b' : '#71717a',
                borderColor: isActive ? '#fafafa' : '#27272a',
                transition: 'all 150ms ease',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ─── Menu Grid ─── */}
      <div style={{ padding: '0 16px 120px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <AnimatePresence>
          {filteredItems.map((item, i) => {
            const inv = inventory[item.id];
            const isSoldOut = !inv || inv.availableStock === 0;
            const isLow = inv && inv.availableStock > 0 && inv.availableStock <= 8;
            const cartItem = cart.find(ci => ci.item.id === item.id);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                className="food-card"
                style={{ opacity: isSoldOut ? 0.45 : 1 }}
              >
                {/* Image */}
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="food-card-img"
                    style={{ height: 150 }}
                  />
                  {item.isPopular && (
                    <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', borderRadius: 9999, padding: '2px 8px', border: '1px solid rgba(245,158,11,0.4)' }}>
                      <Sparkles size={9} color="#f59e0b" />
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Popular</span>
                    </div>
                  )}
                  {isSoldOut && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sold Out</span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fafafa', lineHeight: 1.35, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {item.name}
                  </div>

                  {isLow && !isSoldOut && (
                    <div style={{ fontSize: 10, color: '#fbbf24', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={9} />
                      Only {inv.availableStock} left
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fafafa', fontFamily: 'var(--font-mono)' }}>₹{item.price}</span>

                    {!isSoldOut && (
                      cartItem ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1c1c20', borderRadius: 8, padding: '4px 8px' }}>
                          <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                            <Minus size={13} />
                          </button>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', fontFamily: 'var(--font-mono)', minWidth: 16, textAlign: 'center' }}>
                            {cartItem.quantity}
                          </span>
                          <button onClick={() => addToCart(item)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          style={{
                            width: 30, height: 30, borderRadius: 9, background: '#fff',
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0, transition: 'all 120ms ease',
                          }}
                        >
                          <Plus size={15} color="#09090b" strokeWidth={2.5} />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ─── Floating Cart Bar ─── */}
      <AnimatePresence>
        {cartCount > 0 && !isCartOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              position: 'fixed',
              bottom: 24, left: 16, right: 16, zIndex: 200,
            }}
          >
            <button
              onClick={() => setIsCartOpen(true)}
              style={{
                width: '100%', padding: '14px 20px',
                background: '#fafafa', border: 'none', borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <ShoppingCart size={14} color="#fafafa" />
                  <span style={{ position: 'absolute', top: -5, right: -5, background: '#f59e0b', color: '#09090b', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cartCount}
                  </span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#09090b' }}>View Cart</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#09090b', fontFamily: 'var(--font-mono)' }}>₹{cartTotal.toLocaleString('en-IN')}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Cart Drawer ─── */}
      <AnimatePresence>
        {isCartOpen && (
          <CartDrawer
            cart={cart}
            offers={offers}
            updateQuantity={updateQuantity}
            clearCart={clearCart}
            selectedSeat={selectedSeat}
            selectedScreenName={selectedScreenName}
            onClose={() => setIsCartOpen(false)}
            onChangeSeat={() => { setIsCartOpen(false); setIsSeatModalOpen(true); }}
            currentUserId={currentUserId}
            onOrderPlaced={(newOrderId) => saveTrackedOrderId(newOrderId)}
          />
        )}
      </AnimatePresence>

      {/* ─── Live Order Status Detail Modal ─── */}
      <AnimatePresence>
        {activeTrackerOrder && (
          <LiveOrderModal
            order={activeTrackerOrder}
            onClose={() => setActiveTrackerOrder(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Order Lookup Modal ─── */}
      <AnimatePresence>
        {isTrackModalOpen && (
          <TrackOrderLookupModal
            allOrders={orders}
            onClose={() => setIsTrackModalOpen(false)}
            onSelectOrder={(order) => {
              saveTrackedOrderId(order.id);
              setActiveTrackerOrder(order);
              setIsTrackModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── Seat Picker ─── */}
      <AuditoriumSeatPicker
        isOpen={isSeatModalOpen}
        onClose={() => setIsSeatModalOpen(false)}
        selectedScreenName={selectedScreenName}
        selectedSeat={selectedSeat}
        onConfirmSeat={(screen, seat) => { setSelectedScreenName(screen); setSelectedSeat(seat); }}
      />
    </div>
  );
};

/* ─── LIVE ORDER CARD ─── */
const LiveOrderCard: React.FC<{ order: Order; onClick: () => void }> = ({ order, onClick }) => {
  const steps: { status: OrderStatus; label: string; icon: any; color: string }[] = [
    { status: 'placed', label: 'Order Received', icon: CheckCircle2, color: '#f59e0b' },
    { status: 'preparing', label: 'Chef Preparing', icon: Flame, color: '#60a5fa' },
    { status: 'ready', label: 'Out for Seat Delivery', icon: Truck, color: '#a78bfa' },
    { status: 'delivered', label: 'Delivered to Seat', icon: Check, color: '#4ade80' },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order.status);
  const activeStep = steps[currentStepIndex >= 0 ? currentStepIndex : 0];

  return (
    <div
      onClick={onClick}
      style={{
        background: '#111113',
        border: '1px solid #1c1c20',
        borderRadius: 16,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: activeStep.color }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', fontFamily: 'var(--font-mono)' }}>
            #{order.id.toUpperCase()}
          </span>
          <span style={{ fontSize: 11, color: '#71717a' }}>· {order.items.length} items</span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 9999,
          background: `${activeStep.color}15`, color: activeStep.color,
          border: `1px solid ${activeStep.color}30`, textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {activeStep.label}
        </span>
      </div>

      {/* Progress Line */}
      <div style={{ height: 4, background: '#1c1c20', borderRadius: 9999, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{
          height: '100%',
          width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
          background: activeStep.color,
          transition: 'width 300ms ease'
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#71717a' }}>
        <span>Deliver to: <strong style={{ color: '#fafafa' }}>{order.seatNumber}</strong> ({order.screenName.split('(')[0].trim()})</span>
        <span style={{ color: '#f59e0b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
          View Status <ChevronRight size={12} />
        </span>
      </div>
    </div>
  );
};

/* ─── LIVE ORDER STATUS DETAIL MODAL ─── */
const LiveOrderModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
  const steps: { status: OrderStatus; label: string; desc: string; icon: any; color: string }[] = [
    { status: 'placed', label: 'Order Received & Payment Verified', desc: 'Transmitted to Kitchen Command (KDS)', icon: CheckCircle2, color: '#f59e0b' },
    { status: 'preparing', label: 'Chef Preparing Food', desc: 'Being prepared fresh in kitchen', icon: Flame, color: '#60a5fa' },
    { status: 'ready', label: 'Out for Seat Delivery', desc: 'Runner en route to your auditorium seat', icon: Truck, color: '#a78bfa' },
    { status: 'delivered', label: 'Delivered to Seat', desc: 'Handed over at your seat. Enjoy the movie!', icon: Check, color: '#4ade80' },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order.status);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(7,7,10,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 24, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fafafa' }}>Live Order Tracker</div>
            <div style={{ fontSize: 12, color: '#71717a', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
              #{order.id.toUpperCase()} · {order.seatNumber}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={18} /></button>
        </div>

        {/* Target seat highlight */}
        <div style={{ padding: 14, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Delivery Seat</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa', marginTop: 2 }}>{order.seatNumber} · {order.screenName.split('(')[0].trim()}</div>
          </div>
          <div style={{ padding: '6px 12px', background: '#09090b', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
            ~5-7 mins
          </div>
        </div>

        {/* 4 Step Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.status} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, opacity: isDone ? 1 : 0.4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: isDone ? `${step.color}20` : '#1c1c20',
                  border: `1px solid ${isDone ? `${step.color}50` : '#27272a'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={16} color={isDone ? step.color : '#52525b'} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 500, color: isDone ? '#fafafa' : '#71717a' }}>
                    {step.label} {isCurrent && <span style={{ fontSize: 10, color: step.color, marginLeft: 6 }}>[Active]</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Items */}
        <div style={{ padding: 14, background: '#09090b', borderRadius: 12, border: '1px solid #1c1c20', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#71717a', marginBottom: 8, fontWeight: 600 }}>Order Items</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#a1a1aa' }}>{item.itemName} × {item.quantity}</span>
                <span style={{ color: '#fafafa', fontFamily: 'var(--font-mono)' }}>₹{item.unitPrice * item.quantity}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, borderTop: '1px solid #1c1c20', paddingTop: 6, marginTop: 4 }}>
              <span style={{ color: '#fafafa' }}>Total Paid</span>
              <span style={{ color: '#fafafa', fontFamily: 'var(--font-mono)' }}>₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
          Close Tracker
        </button>
      </motion.div>
    </div>
  );
};

/* ─── TRACK ORDER LOOKUP MODAL (SEARCH BY ORDER ID OR SEAT) ─── */
const TrackOrderLookupModal: React.FC<{
  allOrders: Order[];
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
}> = ({ allOrders, onClose, onSelectOrder }) => {
  const [query, setQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanRaw = query.trim().toLowerCase();
    const cleanAlphanumeric = cleanRaw.replace(/[^a-z0-9]/g, '');

    if (!cleanRaw) { setErrorMsg('Please enter an Order ID or Seat Number.'); return; }

    const match = allOrders.find(o => {
      const orderIdLower = o.id.toLowerCase();
      const orderIdAlpha = orderIdLower.replace(/[^a-z0-9]/g, '');
      const seatLower = o.seatNumber.toLowerCase();
      const seatAlpha = seatLower.replace(/[^a-z0-9]/g, '');

      return (
        orderIdLower === cleanRaw ||
        orderIdLower.includes(cleanRaw) ||
        (cleanAlphanumeric.length >= 3 && orderIdAlpha.includes(cleanAlphanumeric)) ||
        seatLower.includes(cleanRaw) ||
        (cleanAlphanumeric.length >= 2 && seatAlpha.includes(cleanAlphanumeric))
      );
    });

    if (match) {
      onSelectOrder(match);
    } else {
      setErrorMsg(`No active order found matching "${query.trim()}". Please verify your order receipt ID.`);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(7,7,10,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 24, width: '100%', maxWidth: 420, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fafafa' }}>Track Order Status</div>
            <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>
              Lookup order by Order ID or Seat Code
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={18} /></button>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>
              Order ID or Seat Number
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
              <input
                className="input"
                placeholder="e.g. ord-849201 or Seat F-14"
                value={query}
                onChange={e => { setQuery(e.target.value); setErrorMsg(''); }}
                style={{ paddingLeft: 36, fontFamily: 'var(--font-mono)' }}
                autoFocus
              />
            </div>
          </div>

          {errorMsg && (
            <div style={{ fontSize: 11, color: '#f87171', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
              <Search size={14} />
              Lookup Status
            </button>
          </div>
        </form>

        {/* Quick Recent Orders Hint */}
        {allOrders.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #1c1c20' }}>
            <div style={{ fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Recent Cinema Orders (Tap to select)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto' }}>
              {allOrders.slice(0, 5).map(o => (
                <button
                  key={o.id}
                  onClick={() => onSelectOrder(o)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: 8, background: '#09090b', border: '1px solid #1c1c20',
                    color: '#a1a1aa', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>#{o.id.toUpperCase()} · {o.seatNumber}</span>
                  <span style={{ color: '#f59e0b', fontSize: 10, textTransform: 'uppercase' }}>{o.status}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

/* ─── CART DRAWER (WITH GUEST NAME & TEST PAYMENT VALIDATION) ─── */
const CartDrawer: React.FC<{
  cart: CartItem[];
  offers: Offer[];
  updateQuantity: (id: string, d: number) => void;
  clearCart: () => void;
  selectedSeat: string;
  selectedScreenName: string;
  onClose: () => void;
  onChangeSeat: () => void;
  currentUserId: string;
  onOrderPlaced?: (orderId: string) => void;
}> = ({ cart, offers, updateQuantity, clearCart, selectedSeat, selectedScreenName, onClose, onChangeSeat, currentUserId, onOrderPlaced }) => {
  const isGuest = currentUserId.startsWith('guest');

  // Checkout Steps: 'cart' -> 'payment'
  const [step, setStep] = useState<'cart' | 'payment'>('cart');
  const [guestName, setGuestName] = useState('');
  const [guestNameError, setGuestNameError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cash'>('upi');
  const [promoCode, setPromoCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<{ offer: Offer; discount: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderError, setOrderError] = useState('');

  const subtotal = cart.reduce((s, ci) => s + ci.item.price * ci.quantity, 0);
  const discount = appliedOffer?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  const applyPromo = () => {
    const formattedCart = cart.map(ci => ({ item: { ...ci.item }, quantity: ci.quantity }));
    const result = OffersEngineService.evaluateOffer(promoCode.toUpperCase().trim(), formattedCart, [], offers, {});
    if (result.success && result.result) {
      setAppliedOffer({ offer: result.result.offer, discount: result.result.discountAmount });
      setPromoError('');
    } else {
      setPromoError(result.error || 'Invalid promo code');
    }
  };

  const handleProceedToPayment = () => {
    setGuestNameError('');
    if (isGuest && !guestName.trim()) {
      setGuestNameError('Please enter your name for seat delivery.');
      return;
    }
    setStep('payment');
  };

  const handleCompletePaymentAndOrder = async () => {
    if (cart.length === 0) return;
    setOrderError('');
    setIsPlacing(true);

    const res = await inventoryService.processAtomicCheckout({
      patronId: currentUserId,
      screenId: 'screen-1',
      screenName: selectedScreenName,
      seatNumber: selectedSeat,
      showId: 'show-101',
      movieTitle: 'Kalki 2898 AD (IMAX 3D)',
      cartItems: cart.map(ci => ({ itemId: ci.item.id, name: ci.item.name, unitPrice: ci.item.price, quantity: ci.quantity })),
      promoCodes: appliedOffer ? [appliedOffer.offer.code] : [],
    });

    setIsPlacing(false);

    if (res.success) {
      if (res.order?.id && onOrderPlaced) {
        onOrderPlaced(res.order.id);
      }
      clearCart();
      setPlaced(true);
      setTimeout(() => {
        setPlaced(false);
        onClose();
      }, 2800);
    } else {
      setOrderError(res.error || 'Checkout failed. Stock may have depleted.');
    }
  };

  return (
    <>
      <motion.div className="drawer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="drawer-panel"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {step === 'cart' ? 'Your Food Cart' : 'Test Payment & Delivery'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {cart.reduce((s,ci)=>s+ci.quantity,0)} items · {selectedSeat}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Delivery Seat Context */}
        <div style={{ padding: '12px 20px', background: 'var(--bg-overlay)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={13} color="var(--color-amber-text)" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{selectedSeat}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{selectedScreenName.split('(')[0].trim()}</div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onChangeSeat} style={{ fontSize: 11 }}>Change</button>
          </div>
        </div>

        {/* Order Success Screen */}
        <AnimatePresence>
          {placed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 20, padding: 24 }}
            >
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-green-subtle)', border: '1px solid var(--color-green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={32} color="var(--color-green-text)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Payment & Order Received!</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  Delivering straight to <strong style={{ color: 'var(--color-amber-text)' }}>{selectedSeat}</strong> during screening.
                </div>
                <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--color-green-subtle)', border: '1px solid var(--color-green-border)', borderRadius: 9999, fontSize: 11, fontWeight: 600, color: 'var(--color-green-text)', fontFamily: 'var(--font-mono)' }}>
                  <ShieldCheck size={13} />
                  Transmitted to Kitchen Command (KDS)
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Cart Items & Guest Name */}
        {step === 'cart' ? (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Guest Name Prompt if Guest Patron */}
              {isGuest && (
                <div style={{ padding: 14, background: 'var(--bg-overlay)', border: '1px solid var(--color-amber-border)', borderRadius: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-amber-text)', marginBottom: 6 }}>
                    Patron / Guest Name (For Seat Delivery) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input
                      className="input"
                      placeholder="Enter your name (e.g. Rahul Sharma)"
                      value={guestName}
                      onChange={e => { setGuestName(e.target.value); setGuestNameError(''); }}
                      style={{ paddingLeft: 36, background: 'var(--bg-surface)' }}
                    />
                  </div>
                  {guestNameError && (
                    <div style={{ fontSize: 11, color: 'var(--color-red-text)', marginTop: 4 }}>{guestNameError}</div>
                  )}
                </div>
              )}

              {cart.map(ci => (
                <div key={ci.item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                  <img src={ci.item.imageUrl} alt={ci.item.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-default)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ci.item.name}</div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: 2 }}>₹{ci.item.price} each</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => updateQuantity(ci.item.id, -1)} className="btn btn-ghost btn-icon" style={{ width: 26, height: 26 }}><Minus size={12} /></button>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', minWidth: 20, textAlign: 'center', color: 'var(--text-primary)' }}>{ci.quantity}</span>
                    <button onClick={() => updateQuantity(ci.item.id, 1)} className="btn btn-ghost btn-icon" style={{ width: 26, height: 26 }}><Plus size={12} /></button>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', minWidth: 52, textAlign: 'right' }}>₹{ci.item.price * ci.quantity}</div>
                </div>
              ))}
            </div>

            {/* Promo + Summary + Proceed Button */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
              {!appliedOffer ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Tag size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)', pointerEvents: 'none' }} />
                    <input
                      className="input"
                      placeholder="Promo code (e.g. INTERMISSION50)"
                      value={promoCode}
                      onChange={e => { setPromoCode(e.target.value); setPromoError(''); }}
                      style={{ paddingLeft: 32, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                    />
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={applyPromo} style={{ flexShrink: 0 }}>Apply</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-green-subtle)', border: '1px solid var(--color-green-border)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={12} color="var(--color-green-text)" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-green-text)', fontFamily: 'var(--font-mono)' }}>{appliedOffer.offer.code}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-green-text)', opacity: 0.8 }}>−₹{appliedOffer.discount}</span>
                  </div>
                  <button onClick={() => setAppliedOffer(null)} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}><X size={12} /></button>
                </div>
              )}
              {promoError && <div style={{ fontSize: 11, color: 'var(--color-red-text)', marginTop: -4 }}>{promoError}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Subtotal</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--color-green-text)' }}>Discount</span>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-green-text)' }}>−₹{discount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Total</span>
                  <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>₹{total}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={cart.length === 0}
                className="btn btn-primary btn-lg"
                style={{ justifyContent: 'center', width: '100%' }}
              >
                Proceed to Checkout · ₹{total}
              </button>
            </div>
          </>
        ) : (
          /* Step 2: Test Payment Verification Drawer */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Select Test Payment Method</div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                Simulates real-time seat payment verification for patron ordering
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { id: 'upi' as const, title: 'UPI Instant Pay (GPay / PhonePe / Paytm)', icon: QrCode, desc: 'Instant seat confirmation' },
                { id: 'card' as const, title: 'Credit / Debit Card', icon: CreditCard, desc: 'Saved cards & NetBanking' },
                { id: 'cash' as const, title: 'Pay Cash at Seat Delivery', icon: Banknote, desc: 'Pay usher upon delivery' },
              ].map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: 12, borderRadius: 12, border: '1px solid',
                      borderColor: isSelected ? 'var(--color-amber-border)' : 'var(--border-default)',
                      background: isSelected ? 'var(--color-amber-subtle)' : 'var(--bg-overlay)',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: isSelected ? 'var(--color-amber-subtle)' : 'var(--bg-surface)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={isSelected ? 'var(--color-amber-text)' : 'var(--text-secondary)'} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? 'var(--color-amber-text)' : 'var(--text-primary)' }}>{method.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 2 }}>{method.desc}</div>
                    </div>
                    {isSelected && (
                      <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: 'var(--color-amber-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={12} color="#09090b" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Test Payment Simulation Banner */}
            <div style={{ padding: 12, background: 'var(--color-green-subtle)', border: '1px solid var(--color-green-border)', borderRadius: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--color-green-text)' }}>
                <ShieldCheck size={14} />
                Test Payment Sandbox Ready
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.4 }}>
                Clicking <strong>"Mark Payment Done"</strong> will atomically deduct inventory and transmit the order straight to the Kitchen Display System (KDS).
              </div>
            </div>

            {orderError && (
              <div style={{ padding: '10px 12px', background: 'var(--color-red-subtle)', border: '1px solid var(--color-red-border)', borderRadius: 8, fontSize: 12, color: 'var(--color-red-text)', marginBottom: 16 }}>
                {orderError}
              </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleCompletePaymentAndOrder}
                disabled={isPlacing}
                className="btn btn-primary btn-lg"
                style={{ justifyContent: 'center', width: '100%', gap: 8 }}
              >
                <Check size={16} />
                {isPlacing ? 'Processing Atomic Checkout...' : `Mark Payment Done & Place Order (₹${total})`}
              </button>

              <button className="btn btn-ghost" onClick={() => setStep('cart')} style={{ justifyContent: 'center' }}>
                Back to Cart
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};
