import React from 'react';
import { Order, OrderStatus } from '../../types';
import { CheckCircle2, Clock, UtensilsCrossed, PackageCheck, Armchair, ChevronRight } from 'lucide-react';

interface OrderTrackerProps {
  orders: Order[];
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({ orders }) => {
  if (orders.length === 0) return null;

  const activeOrder = orders[0]; // Most recent order

  const getStepStatus = (step: OrderStatus) => {
    const orderSteps: OrderStatus[] = ['placed', 'preparing', 'ready', 'delivered'];
    const currentIdx = orderSteps.indexOf(activeOrder.status);
    const stepIdx = orderSteps.indexOf(step);

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white text-sm font-display">Order #{activeOrder.id}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 uppercase">
                {activeOrder.status}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Target: <span className="text-slate-200 font-semibold">{activeOrder.screenName} • {activeOrder.seatNumber}</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-500 block uppercase font-mono">Estimated Delivery</span>
          <span className="text-xs font-extrabold text-amber-400 font-mono">{activeOrder.estimatedDeliveryTime || '3-5 mins'}</span>
        </div>
      </div>

      {/* Visual Stepper Timeline */}
      <div className="grid grid-cols-4 gap-2 pt-2">
        
        {/* Step 1: Placed */}
        <div className="flex flex-col items-center text-center space-y-1.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
            getStepStatus('placed') === 'completed' || getStepStatus('placed') === 'active'
              ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md shadow-amber-500/30'
              : 'bg-slate-900 text-slate-600 border-slate-800'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200">Placed</span>
        </div>

        {/* Step 2: Preparing */}
        <div className="flex flex-col items-center text-center space-y-1.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
            getStepStatus('preparing') === 'completed'
              ? 'bg-amber-500 text-black border-amber-400 font-bold'
              : getStepStatus('preparing') === 'active'
              ? 'bg-amber-500 text-black border-amber-400 font-bold animate-pulse shadow-md shadow-amber-500/30'
              : 'bg-slate-900 text-slate-600 border-slate-800'
          }`}>
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200">Preparing</span>
        </div>

        {/* Step 3: Ready */}
        <div className="flex flex-col items-center text-center space-y-1.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
            getStepStatus('ready') === 'completed'
              ? 'bg-amber-500 text-black border-amber-400 font-bold'
              : getStepStatus('ready') === 'active'
              ? 'bg-amber-500 text-black border-amber-400 font-bold animate-pulse'
              : 'bg-slate-900 text-slate-600 border-slate-800'
          }`}>
            <PackageCheck className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200">In Transit</span>
        </div>

        {/* Step 4: Seat Delivered */}
        <div className="flex flex-col items-center text-center space-y-1.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
            getStepStatus('delivered') === 'completed' || getStepStatus('delivered') === 'active'
              ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-md shadow-emerald-500/30'
              : 'bg-slate-900 text-slate-600 border-slate-800'
          }`}>
            <Armchair className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200">Delivered</span>
        </div>

      </div>

      {/* Order Item Summary */}
      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-xs flex items-center justify-between">
        <span className="text-slate-400">
          Items: {activeOrder.items.map(i => `${i.quantity}x ${i.itemName}`).join(', ')}
        </span>
        <span className="font-mono font-bold text-amber-400">${activeOrder.totalAmount.toFixed(2)}</span>
      </div>

    </div>
  );
};
