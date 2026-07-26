import React from 'react';
import { Order, OrderStatus } from '../../types';
import { inventoryService } from '../../services/inventoryService';
import { Utensils, CheckCircle2, Clock, Armchair, ChevronRight } from 'lucide-react';

interface KitchenOrderBoardProps {
  orders: Order[];
}

export const KitchenOrderBoard: React.FC<KitchenOrderBoardProps> = ({ orders }) => {

  const handleAdvanceStatus = (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = 'placed';
    if (currentStatus === 'placed') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'delivered';

    inventoryService.updateOrderStatus(orderId, nextStatus);
  };

  const columns: { status: OrderStatus; label: string; color: string }[] = [
    { status: 'placed', label: 'Placed (New Orders)', color: 'text-amber-400 border-amber-500/30' },
    { status: 'preparing', label: 'In Kitchen (Preparing)', color: 'text-cyan-400 border-cyan-500/30' },
    { status: 'ready', label: 'Out for Seat Delivery', color: 'text-purple-400 border-purple-500/30' },
    { status: 'delivered', label: 'Delivered', color: 'text-emerald-400 border-emerald-500/30' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">Kitchen Display System (KDS) & Delivery Dispatch</h2>
            <p className="text-xs text-slate-400">Manage real-time order lifecycle for auditorium runner dispatch.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-slate-400">Total Active:</span>
          <span className="font-bold text-amber-400">{orders.filter(o => o.status !== 'delivered').length}</span>
        </div>
      </div>

      {/* Kanban Order Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(col => {
          const colOrders = orders.filter(o => o.status === col.status);

          return (
            <div key={col.status} className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col h-[600px]">
              
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className={`font-display font-bold text-xs ${col.color}`}>
                  {col.label}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 text-[10px] font-mono font-bold">
                  {colOrders.length}
                </span>
              </div>

              {/* Order Cards */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-xs font-medium">
                    No orders in this queue
                  </div>
                ) : (
                  colOrders.map(order => (
                    <div
                      key={order.id}
                      className="glass-card p-4 rounded-xl border border-slate-800 space-y-3 hover:border-amber-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono font-extrabold text-sm text-white">#{order.id}</span>
                          <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-semibold mt-0.5">
                            <Armchair className="w-3.5 h-3.5" />
                            <span>{order.screenName} • {order.seatNumber}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-900 text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-slate-300">
                            <span><strong className="text-amber-400 font-mono">{item.quantity}x</strong> {item.itemName}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total & Action */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-mono text-slate-400">${order.totalAmount.toFixed(2)}</span>

                        {col.status !== 'delivered' && (
                          <button
                            onClick={() => handleAdvanceStatus(order.id, order.status)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all flex items-center space-x-1"
                          >
                            <span>Next Step</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
