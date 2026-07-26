import React from 'react';
import { MenuItem, InventoryItem } from '../../types';
import { inventoryService } from '../../services/inventoryService';
import { RefreshCw, Power, AlertTriangle, Layers, Plus, Minus } from 'lucide-react';

interface InventoryManagerProps {
  menuItems: MenuItem[];
  inventory: Record<string, InventoryItem>;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ menuItems, inventory }) => {

  const handleStockChange = (itemId: string, delta: number) => {
    const current = inventory[itemId]?.availableStock || 0;
    const nextVal = Math.max(0, current + delta);
    inventoryService.updateStockManual(itemId, nextVal);
  };

  const handleToggleSoldOut = (itemId: string) => {
    inventoryService.toggleItemSoldOut(itemId);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="font-display font-extrabold text-xl text-white">Real-Time Inventory & Stock Control</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time PostgreSQL atomic stock locks with instant WebSocket CDC synchronization across patron mobile screens.
          </p>
        </div>

        <button
          onClick={() => {
            menuItems.forEach(i => inventoryService.updateStockManual(i.id, 50));
          }}
          className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 text-xs font-bold transition-all flex items-center space-x-2 shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refill All Stock to 50 Units</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Item & Category</th>
                <th className="px-6 py-4">Price (₹ INR)</th>
                <th className="px-6 py-4">Available Stock</th>
                <th className="px-6 py-4">Atomic Lock Version</th>
                <th className="px-6 py-4 text-right">Quick Stock Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {menuItems.map(item => {
                const inv = inventory[item.id] || { availableStock: 0, reservedStock: 0, version: 1 };
                const isSoldOut = inv.availableStock <= 0;
                const isLow = inv.availableStock > 0 && inv.availableStock <= 10;

                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    
                    {/* Item */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img src={item.imageUrl} alt={item.name} className="w-11 h-11 rounded-xl object-cover bg-slate-950" />
                        <div>
                          <span className="font-bold text-white block text-sm">{item.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{item.category}</span>
                        </div>
                      </div>
                    </td>

                    {/* Price in ₹ INR */}
                    <td className="px-6 py-4 font-mono font-bold text-amber-400 text-sm">
                      ₹{item.price.toFixed(0)}
                    </td>

                    {/* Stock Counter */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                          <button
                            onClick={() => handleStockChange(item.id, -5)}
                            className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-[11px]"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleStockChange(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className={`px-3 font-mono font-bold text-sm ${
                            isSoldOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {inv.availableStock}
                          </span>

                          <button
                            onClick={() => handleStockChange(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-amber-500 text-black hover:bg-amber-400 font-bold flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleStockChange(item.id, 5)}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-bold text-[11px]"
                          >
                            +5
                          </button>
                        </div>

                        {isSoldOut && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                            SOLD OUT
                          </span>
                        )}
                        {isLow && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>LOW STOCK</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Version Lock */}
                    <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                      v{inv.version}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleSoldOut(item.id)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs border transition-all flex items-center space-x-1.5 ml-auto ${
                          isSoldOut
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isSoldOut ? 'Restock Item' : 'Force Sold Out'}</span>
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
