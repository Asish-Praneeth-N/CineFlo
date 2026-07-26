import React, { useState } from 'react';
import { MenuItem, InventoryItem, CartItem } from '../../types';
import { ShoppingBag, Search, Sparkles, Flame, CheckCircle, AlertCircle, Plus, Minus, Armchair, ChevronRight } from 'lucide-react';

interface MenuCatalogProps {
  menuItems: MenuItem[];
  inventory: Record<string, InventoryItem>;
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  openCart: () => void;
  selectedScreenName: string;
  selectedSeat: string;
  onOpenSeatPicker: () => void;
}

export const MenuCatalog: React.FC<MenuCatalogProps> = ({
  menuItems,
  inventory,
  cart,
  addToCart,
  updateQuantity,
  openCart,
  selectedScreenName,
  selectedSeat,
  onOpenSeatPicker
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Combos', 'Popcorn', 'Beverages', 'Hot Food', 'Snacks', 'Desserts'];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCartQuantity = (itemId: string): number => {
    const found = cart.find(ci => ci.item.id === itemId);
    return found ? found.quantity : 0;
  };

  const totalCartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="space-y-6 pb-24">
      
      {/* Multiplex Seat Delivery Target Header */}
      <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Armchair className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest font-mono">
                Seat-Delivery Active
              </span>
              <span className="text-xs text-slate-400 font-mono">15-Min Intermission Rush</span>
            </div>
            <h2 className="font-display font-extrabold text-xl text-white mt-0.5">
              {selectedScreenName} • <span className="text-amber-400">{selectedSeat}</span>
            </h2>
          </div>
        </div>

        <button
          onClick={onOpenSeatPicker}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center space-x-2 transition-all"
        >
          <span>Change Seat Selection</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Scroll Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/25'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search popcorn, chai, samosa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input pl-10 text-xs text-slate-200 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Food & Beverage Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredItems.map(item => {
          const inv = inventory[item.id] || { availableStock: 0, totalAllocated: 50 };
          const availableStock = inv.availableStock;
          const totalAllocated = inv.totalAllocated || 50;
          const isSoldOut = availableStock <= 0;
          const isLowStock = availableStock > 0 && availableStock <= 10;
          const cartQty = getCartQuantity(item.id);

          const stockPercent = Math.min(100, Math.round((availableStock / totalAllocated) * 100));

          return (
            <div
              key={item.id}
              className={`group glass-card rounded-3xl overflow-hidden flex flex-col justify-between border transition-all ${
                isSoldOut
                  ? 'border-slate-800/60 opacity-60 grayscale-[30%]'
                  : isLowStock
                  ? 'border-amber-500/40 hover:border-amber-400'
                  : 'border-slate-800/80 hover:border-amber-500/50'
              }`}
            >
              <div>
                {/* Image Header & Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-85" />

                  {/* Stock Status Badge */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {isSoldOut ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold badge-sold-out flex items-center space-x-1 shadow-md">
                        <AlertCircle className="w-3 h-3" />
                        <span>SOLD OUT</span>
                      </span>
                    ) : isLowStock ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold badge-low-stock flex items-center space-x-1 shadow-md animate-pulse">
                        <Flame className="w-3 h-3" />
                        <span>ONLY {availableStock} LEFT</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold badge-in-stock flex items-center space-x-1 shadow-md">
                        <CheckCircle className="w-3 h-3" />
                        <span>IN STOCK ({availableStock})</span>
                      </span>
                    )}
                  </div>

                  {item.isPopular && !isSoldOut && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-500 text-black text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1 shadow-lg">
                      <Sparkles className="w-3 h-3 fill-black" />
                      <span>MUST TRY</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h3 className="font-display font-extrabold text-slate-100 text-base leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Stock Progress Bar */}
                  {!isSoldOut && (
                    <div className="space-y-1 pt-1">
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${stockPercent}%` }}
                          className={`h-full rounded-full transition-all ${
                            isLowStock ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer: Price in ₹ INR & Add Controls */}
              <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-800/40 mt-2">
                <div>
                  <span className="text-[10px] text-slate-500 block font-mono uppercase">PRICE</span>
                  <span className="text-xl font-extrabold text-amber-400 font-display">
                    ₹{item.price.toFixed(0)}
                  </span>
                </div>

                {isSoldOut ? (
                  <button
                    disabled
                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-600 text-xs font-bold border border-slate-800 cursor-not-allowed"
                  >
                    Unavailable
                  </button>
                ) : cartQty > 0 ? (
                  <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-amber-500/40">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-white font-mono">
                      {cartQty}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={cartQty >= availableStock}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        cartQty >= availableStock
                          ? 'bg-slate-950 text-slate-600 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-400 text-black'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(item)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black font-extrabold text-xs border border-amber-500/30 transition-all flex items-center space-x-1.5 transform active:scale-95 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Item</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Floating Mobile Cart Bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            onClick={openCart}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black font-extrabold text-sm shadow-2xl shadow-amber-500/40 flex items-center justify-between transition-all transform active:scale-98 animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-black text-amber-400 font-mono text-xs flex items-center justify-center font-bold">
                {totalCartCount}
              </div>
              <span>View Cart & Pay to Seat</span>
            </div>
            <div className="flex items-center space-x-1 font-display text-base">
              <span>Pay & Submit</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

    </div>
  );
};
