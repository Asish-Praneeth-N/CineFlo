import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, Clock, CheckCircle, Truck, Package, AlertTriangle,
  ChevronRight, User, MapPin, Flame, Filter, ArrowUpRight,
  Utensils, Timer, RotateCcw, X, Activity
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { inventoryService } from '../../services/inventoryService';

interface KitchenCommandCenterProps {
  orders: Order[];
}

type Lane = { status: OrderStatus; label: string; color: string; accent: string; borderColor: string; bgSubtle: string };

const LANES: Lane[] = [
  { status: 'placed',    label: 'New Orders',        color: 'var(--color-amber-text)',  accent: 'var(--color-amber-bright)', borderColor: 'var(--color-amber-border)', bgSubtle: 'var(--color-amber-subtle)' },
  { status: 'preparing', label: 'Preparing',         color: 'var(--color-blue-text)',   accent: 'var(--color-blue-bright)',  borderColor: 'var(--color-blue-border)',  bgSubtle: 'var(--color-blue-subtle)'  },
  { status: 'ready',     label: 'Ready for Delivery',color: 'var(--color-violet-text)', accent: 'var(--color-violet-bright)',borderColor: 'var(--color-violet-border)',bgSubtle: 'var(--color-violet-subtle)'},
  { status: 'delivered', label: 'Delivered',          color: 'var(--color-green-text)',  accent: 'var(--color-green-bright)', borderColor: 'var(--color-green-border)', bgSubtle: 'var(--color-green-subtle)' },
];

const STATUS_ADVANCE: Record<OrderStatus, OrderStatus | null> = {
  placed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
  delivered: null,
  cancelled: null,
};

const ACTION_LABEL: Record<OrderStatus, string> = {
  placed: 'Start Preparing',
  preparing: 'Mark Ready',
  ready: 'Mark Delivered',
  delivered: '',
  cancelled: '',
};

const getAgeSeconds = (createdAt: string) =>
  Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);

const formatAge = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const getAgeClass = (createdAt: string, status: OrderStatus) => {
  if (status === 'delivered') return 'age-fresh';
  const s = getAgeSeconds(createdAt);
  if (s < 180) return 'age-fresh';
  if (s < 360) return 'age-normal';
  if (s < 600) return 'age-warning';
  return 'age-critical';
};

const RUNNERS = ['Rahul K.', 'Priya S.', 'Vikram M.', 'Anita R.'];

export const KitchenCommandCenter: React.FC<KitchenCommandCenterProps> = ({ orders }) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [filterScreen, setFilterScreen] = useState<string>('all');

  // Re-render every second for live timers
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceStatus = useCallback((orderId: string, currentStatus: OrderStatus) => {
    const next = STATUS_ADVANCE[currentStatus];
    if (next) {
      inventoryService.updateOrderStatus(orderId, next);
    }
  }, []);

  const filtered = filterScreen === 'all'
    ? orders
    : orders.filter(o => o.screenId === filterScreen);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // Metrics
  const waiting = orders.filter(o => o.status === 'placed').length;
  const preparing = orders.filter(o => o.status === 'preparing').length;
  const ready = orders.filter(o => o.status === 'ready').length;
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const totalToday = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  const uniqueScreens = [...new Set(orders.map(o => o.screenId))];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-canvas)' }}>

      {/* ─── MAIN COLUMN ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ─── PAGE HEADER ─── */}
        <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--color-amber-subtle)', border: '1px solid var(--color-amber-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChefHat size={16} color="var(--color-amber-text)" />
                </div>
                <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Kitchen Command Center</h1>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', paddingLeft: 42 }}>
                Real-time order workflow • Atomic PostgreSQL RPC Stock Engine
              </p>
            </div>

            {/* Screen filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={13} color="var(--text-tertiary)" />
              <select
                value={filterScreen}
                onChange={e => setFilterScreen(e.target.value)}
                style={{
                  background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
                  borderRadius: 8, color: 'var(--text-primary)', fontSize: 12,
                  padding: '6px 10px', fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="all">All Screens</option>
                {uniqueScreens.map(s => (
                  <option key={s} value={s}>{s.replace('screen-', 'Audi ').toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ─── METRICS BAR ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Waiting', value: waiting, lane: LANES[0], icon: Clock },
              { label: 'Preparing', value: preparing, lane: LANES[1], icon: Flame },
              { label: 'Ready', value: ready, lane: LANES[2], icon: Package },
              { label: 'Delivered Today', value: delivered, lane: LANES[3], icon: CheckCircle },
              { label: 'Revenue Today', value: `₹${totalToday.toLocaleString('en-IN')}`, lane: null, icon: Activity, isRevenue: true },
            ].map(({ label, value, lane, icon: Icon, isRevenue }) => (
              <div key={label} className="metric-card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="metric-label" style={{ margin: 0 }}>{label}</span>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: lane ? lane.bgSubtle : 'var(--bg-subtle)',
                    border: `1px solid ${lane ? lane.borderColor : 'var(--border-default)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={13} color={lane ? lane.color : 'var(--text-tertiary)'} />
                  </div>
                </div>
                <motion.div
                  key={String(value)}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="metric-value"
                  style={{ color: lane?.color || (isRevenue ? 'var(--color-green-text)' : 'var(--text-primary)'), fontSize: isRevenue ? 18 : 28 }}
                >
                  {value}
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── KANBAN BOARD ─── */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '0 24px 24px' }}>
          <div className="kanban-scroll" style={{ height: '100%', alignItems: 'flex-start' }}>
            {LANES.map(lane => {
              const laneOrders = filtered.filter(o => o.status === lane.status);
              const avgWaitSec = laneOrders.length > 0
                ? Math.round(laneOrders.reduce((sum, o) => sum + getAgeSeconds(o.createdAt), 0) / laneOrders.length)
                : 0;

              return (
                <div key={lane.status} className="kanban-lane" style={{ height: '100%', minHeight: 400 }}>
                  {/* Lane Header */}
                  <div className="kanban-lane-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: lane.accent }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                          {lane.label}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                          background: lane.bgSubtle, color: lane.color,
                          border: `1px solid ${lane.borderColor}`,
                          borderRadius: 9999, padding: '1px 7px',
                        }}>
                          {laneOrders.length}
                        </span>
                      </div>
                    </div>
                    {/* Lane stats */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>Avg wait</span>
                          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: avgWaitSec > 300 ? 'var(--color-amber-text)' : 'var(--text-tertiary)' }}>
                            {laneOrders.length > 0 ? formatAge(avgWaitSec) : '—'}
                          </span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(100, (laneOrders.length / Math.max(1, filtered.length)) * 100)}%`,
                              background: lane.accent,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lane Cards */}
                  <div className="kanban-lane-scroll">
                    <AnimatePresence initial={false}>
                      {laneOrders.length === 0 ? (
                        <EmptyLane lane={lane} />
                      ) : (
                        laneOrders.map(order => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            lane={lane}
                            tick={tick}
                            isSelected={selectedOrderId === order.id}
                            onSelect={() => setSelectedOrderId(prev => prev === order.id ? null : order.id)}
                            onAdvance={() => handleAdvanceStatus(order.id, order.status)}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── CONTEXT PANEL ─── */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderContextPanel
            key={selectedOrder.id}
            order={selectedOrder}
            tick={tick}
            onClose={() => setSelectedOrderId(null)}
            onAdvance={() => handleAdvanceStatus(selectedOrder.id, selectedOrder.status)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── ORDER CARD ─── */
const OrderCard: React.FC<{
  order: Order;
  lane: Lane;
  tick: number;
  isSelected: boolean;
  onSelect: () => void;
  onAdvance: () => void;
}> = ({ order, lane, tick, isSelected, onSelect, onAdvance }) => {
  const ageClass = getAgeClass(order.createdAt, order.status);
  const ageSec = getAgeSeconds(order.createdAt);
  const isCritical = ageClass === 'age-critical';
  const nextStatus = STATUS_ADVANCE[order.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div
        className={`order-card ${ageClass} ${isSelected ? 'selected' : ''}`}
        onClick={onSelect}
      >
        {/* Card Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              #{order.id.toUpperCase()}
            </span>
            {isCritical && (
              <span className="badge badge-red" style={{ fontSize: 10 }}>
                <AlertTriangle size={9} />
                URGENT
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Timer size={12} color={isCritical ? 'var(--color-red-text)' : 'var(--text-tertiary)'} />
            <span style={{
              fontSize: 11, fontFamily: 'var(--font-mono)',
              color: isCritical ? 'var(--color-red-text)' : ageSec > 300 ? 'var(--color-amber-text)' : 'var(--text-tertiary)',
              fontWeight: isCritical ? 600 : 400,
            }}>
              {formatAge(ageSec)}
            </span>
          </div>
        </div>

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '6px 8px', background: 'var(--bg-subtle)', borderRadius: 7, border: '1px solid var(--border-subtle)' }}>
          <MapPin size={11} color="var(--text-tertiary)" />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {order.screenName.replace('Screen ', 'AUDI')} · <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{order.seatNumber}</span>
          </span>
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
          {order.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
                  background: lane.bgSubtle, color: lane.color,
                  border: `1px solid ${lane.borderColor}`,
                  borderRadius: 5, padding: '1px 5px', flexShrink: 0,
                }}>
                  ×{item.quantity}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.itemName}
                </span>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', flexShrink: 0, marginLeft: 8 }}>
                ₹{item.unitPrice * item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* Card Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            ₹{order.totalAmount.toLocaleString('en-IN')}
          </span>

          {nextStatus && (
            <button
              onClick={(e) => { e.stopPropagation(); onAdvance(); }}
              className="btn btn-sm"
              style={{
                background: lane.bgSubtle,
                color: lane.color,
                border: `1px solid ${lane.borderColor}`,
                fontSize: 11, fontWeight: 600, gap: 4,
              }}
            >
              {ACTION_LABEL[order.status]}
              <ChevronRight size={11} />
            </button>
          )}

          {order.status === 'delivered' && (
            <span className="badge badge-green" style={{ fontSize: 10 }}>
              <CheckCircle size={9} />
              Delivered
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ─── EMPTY LANE ─── */
const EmptyLane: React.FC<{ lane: Lane }> = ({ lane }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="empty-state"
    style={{ padding: '32px 16px' }}
  >
    <div className="empty-state-icon">
      <Utensils size={20} />
    </div>
    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)' }}>No orders here</p>
    <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>
      {lane.status === 'placed' ? 'Waiting for new orders...' :
       lane.status === 'preparing' ? 'Nothing in preparation' :
       lane.status === 'ready' ? 'No orders ready for delivery' :
       'All clear — great work!'}
    </p>
  </motion.div>
);

/* ─── ORDER CONTEXT PANEL ─── */
const OrderContextPanel: React.FC<{
  order: Order;
  tick: number;
  onClose: () => void;
  onAdvance: () => void;
}> = ({ order, tick, onClose, onAdvance }) => {
  const [assignedRunner, setAssignedRunner] = useState(RUNNERS[0]);
  const ageSec = getAgeSeconds(order.createdAt);
  const lane = LANES.find(l => l.status === order.status) || LANES[0];
  const nextStatus = STATUS_ADVANCE[order.status];

  // Build a mock preparation timeline
  const timeline = [
    { label: 'Order Placed', time: new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), done: true },
    { label: 'Preparing in Kitchen', time: order.status !== 'placed' ? new Date(new Date(order.createdAt).getTime() + 60000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null, done: ['preparing', 'ready', 'delivered'].includes(order.status) },
    { label: 'Ready for Delivery', time: order.status === 'ready' || order.status === 'delivered' ? new Date(new Date(order.createdAt).getTime() + 240000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null, done: ['ready', 'delivered'].includes(order.status) },
    { label: 'Delivered to Seat', time: order.status === 'delivered' ? new Date(order.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null, done: order.status === 'delivered' },
  ];

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      style={{
        width: 320,
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Panel Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Order #{order.id.toUpperCase()}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Inspection Panel</div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onClose}>
          <X size={15} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Status & Age */}
        <div style={{ display: 'flex', gap: 8 }}>
          <span className={`badge badge-${order.status === 'placed' ? 'amber' : order.status === 'preparing' ? 'blue' : order.status === 'ready' ? 'violet' : 'green'}`}>
            {order.status.toUpperCase()}
          </span>
          <span className="badge badge-neutral">
            <Timer size={9} />
            {formatAge(ageSec)}
          </span>
        </div>

        {/* Location */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-disabled)', marginBottom: 8 }}>Delivery Location</div>
          <div style={{ padding: '12px', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={13} color="var(--color-violet-text)" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{order.screenName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>🎬 {order.movieTitle}</div>
              </div>
            </div>
            <div style={{ padding: '8px 10px', background: 'var(--color-violet-subtle)', border: '1px solid var(--color-violet-border)', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-violet-text)' }}>{order.seatNumber}</span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-disabled)', marginBottom: 8 }}>Items ({order.items.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{item.itemName}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>×{item.quantity} · ₹{item.unitPrice} each</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>₹{item.unitPrice * item.quantity}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderTop: '1px solid var(--border-subtle)', marginTop: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Total</span>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Preparation Timeline */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-disabled)', marginBottom: 12 }}>Preparation Timeline</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {timeline.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative', paddingBottom: idx < timeline.length - 1 ? 16 : 0 }}>
                {/* Connector line */}
                {idx < timeline.length - 1 && (
                  <div style={{
                    position: 'absolute', left: 7, top: 16, bottom: 0,
                    width: 1, background: step.done ? 'var(--color-green-border)' : 'var(--border-subtle)'
                  }} />
                )}
                <div style={{
                  width: 15, height: 15, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  background: step.done ? 'var(--color-green-subtle)' : 'var(--bg-subtle)',
                  border: `1px solid ${step.done ? 'var(--color-green-border)' : 'var(--border-default)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {step.done && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-green-bright)' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: step.done ? 500 : 400, color: step.done ? 'var(--text-primary)' : 'var(--text-disabled)' }}>{step.label}</div>
                  {step.time && <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{step.time}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Runner Assignment */}
        {(order.status === 'ready') && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-disabled)', marginBottom: 8 }}>Assign Delivery Runner</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {RUNNERS.map(runner => (
                <button
                  key={runner}
                  onClick={() => setAssignedRunner(runner)}
                  style={{
                    padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: assignedRunner === runner ? 'var(--color-violet-subtle)' : 'var(--bg-overlay)',
                    color: assignedRunner === runner ? 'var(--color-violet-text)' : 'var(--text-secondary)',
                    border: `1px solid ${assignedRunner === runner ? 'var(--color-violet-border)' : 'var(--border-default)'}`,
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    transition: 'all 120ms ease',
                  }}
                >
                  {runner}
                </button>
              ))}
            </div>
            {assignedRunner && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
                <Truck size={11} style={{ display: 'inline', marginRight: 5 }} />
                {assignedRunner} assigned to {order.seatNumber}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel Footer — action */}
      {nextStatus && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <button
            onClick={onAdvance}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <ArrowUpRight size={15} />
            {ACTION_LABEL[order.status]}
          </button>
        </div>
      )}
    </motion.div>
  );
};
