import React, { useState } from 'react';
import { Offer } from '../../types';
import { inventoryService } from '../../services/inventoryService';
import { Tag, Plus, Check, ShieldCheck, Zap } from 'lucide-react';

interface PromoRulesEditorProps {
  offers: Offer[];
}

export const PromoRulesEditor: React.FC<PromoRulesEditorProps> = ({ offers }) => {
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDiscountValue, setNewDiscountValue] = useState(50);
  const [newDiscountType, setNewDiscountType] = useState<'percentage' | 'fixed'>('fixed');

  const handleToggleOfferActive = (offerId: string) => {
    inventoryService.toggleOfferActive(offerId);
  };

  const handleCreateOffer = () => {
    if (!newCode || !newTitle) return;

    const offer: Offer = {
      id: `offer-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      title: newTitle.trim(),
      description: `Custom ${newDiscountType === 'percentage' ? newDiscountValue + '%' : '₹' + newDiscountValue} promotional offer`,
      discountType: newDiscountType,
      discountValue: Number(newDiscountValue),
      maxRedemptionsTotal: 100,
      currentRedemptionsCount: 0,
      maxRedemptionsPerUser: 1,
      minOrderAmount: 200,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      isStackable: false,
      isActive: true
    };

    inventoryService.addOffer(offer);
    setNewCode('');
    setNewTitle('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-amber-400" />
            <h2 className="font-display font-extrabold text-xl text-white">Tier 1 (A) — Indian Offers & Promotional Rules Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configurable stackability rules, per-user redemption caps, minimum spend in ₹ INR, and showtime window constraints.
          </p>
        </div>
      </div>

      {/* Offers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {offers.map(offer => (
          <div
            key={offer.id}
            className={`glass-card p-5 rounded-3xl border flex flex-col justify-between space-y-4 ${
              offer.isActive ? 'border-amber-500/40' : 'border-slate-800 opacity-60'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-sm text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
                  {offer.code}
                </span>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  offer.isStackable ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {offer.isStackable ? 'STACKABLE' : 'NON-STACKABLE'}
                </span>
              </div>

              <h3 className="font-display font-extrabold text-slate-100 text-base">{offer.title}</h3>
              <p className="text-xs text-slate-400">{offer.description}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Discount Value</span>
                <span className="font-mono font-extrabold text-white">
                  {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Redemptions Used</span>
                <span className="font-mono font-extrabold text-amber-400">
                  {offer.currentRedemptionsCount} / {offer.maxRedemptionsTotal}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Min Order Spend</span>
                <span className="font-mono text-slate-300">₹{offer.minOrderAmount}</span>
              </div>
            </div>

            <button
              onClick={() => handleToggleOfferActive(offer.id)}
              className={`w-full py-2.5 rounded-2xl text-xs font-extrabold transition-all border ${
                offer.isActive
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              {offer.isActive ? 'Deactivate Rule' : 'Activate Rule'}
            </button>
          </div>
        ))}

        {/* Create Offer Card */}
        <div className="glass-panel p-5 rounded-3xl border border-dashed border-slate-800 flex flex-col justify-between space-y-4">
          <h3 className="font-display font-bold text-slate-200 text-base flex items-center space-x-2">
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Create New Promo Rule</span>
          </h3>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Promo Code (e.g. FESTIVE100)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full glass-input text-xs font-mono uppercase"
            />
            <input
              type="text"
              placeholder="Title (e.g. ₹100 Off Festive Combo)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full glass-input text-xs"
            />

            <div className="flex space-x-2">
              <input
                type="number"
                value={newDiscountValue}
                onChange={(e) => setNewDiscountValue(Number(e.target.value))}
                className="w-1/2 glass-input text-xs font-mono"
              />
              <select
                value={newDiscountType}
                onChange={(e) => setNewDiscountType(e.target.value as any)}
                className="w-1/2 glass-input text-xs bg-slate-900"
              >
                <option value="fixed">₹ INR Fixed</option>
                <option value="percentage">% Percentage</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleCreateOffer}
            className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-colors shadow-md"
          >
            Publish Rule to Engine
          </button>
        </div>
      </div>

    </div>
  );
};
