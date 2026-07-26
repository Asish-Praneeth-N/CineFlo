import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, Plus, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import { Offer } from '../../types';
import { inventoryService } from '../../services/inventoryService';

interface OffersEngineProps {
  offers: Offer[];
}

export const OffersEngine: React.FC<OffersEngineProps> = ({ offers }) => {
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newValue, setNewValue] = useState(50);
  const [newType, setNewType] = useState<'fixed' | 'percentage'>('fixed');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (!newCode.trim() || !newTitle.trim()) return;
    inventoryService.addOffer({
      id: `offer-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      title: newTitle.trim(),
      description: `${newType === 'percentage' ? newValue + '%' : '₹' + newValue} promotional offer`,
      discountType: newType,
      discountValue: newValue,
      maxRedemptionsTotal: 100,
      currentRedemptionsCount: 0,
      maxRedemptionsPerUser: 1,
      minOrderAmount: 200,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      isStackable: false,
      isActive: true,
    });
    setNewCode(''); setNewTitle(''); setIsCreating(false);
  };

  const activeCount = offers.filter(o => o.isActive).length;
  const totalRedemptions = offers.reduce((s, o) => s + o.currentRedemptionsCount, 0);

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--color-violet-subtle)', border: '1px solid var(--color-violet-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={16} color="var(--color-violet-text)" />
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Offers Engine</h1>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', paddingLeft: 42 }}>
            Configurable promo rules with stackability, redemption caps, and ₹ INR discount resolution
          </p>
        </div>
        <button
          onClick={() => setIsCreating(v => !v)}
          className="btn btn-primary"
          style={{ gap: 6 }}
        >
          <Plus size={14} />
          New Offer Rule
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Active Rules', value: activeCount, color: 'var(--color-green-text)' },
          { label: 'Total Offers', value: offers.length, color: 'var(--text-primary)' },
          { label: 'Total Redemptions', value: totalRedemptions, color: 'var(--color-violet-text)' },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: m.color, letterSpacing: '-0.04em' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 20, marginBottom: 20 }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={14} color="var(--color-amber-text)" />
            Create New Promo Rule
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input className="input" placeholder="PROMO CODE (e.g. FESTIVE200)" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }} />
            <input className="input" placeholder="Offer Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <input type="number" className="input" value={newValue} onChange={e => setNewValue(Number(e.target.value))} />
            <select value={newType} onChange={e => setNewType(e.target.value as any)}
              style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, padding: '8px 12px', fontFamily: 'var(--font-sans)', outline: 'none' }}>
              <option value="fixed">₹ INR Fixed</option>
              <option value="percentage">% Percentage</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={handleCreate} style={{ gap: 6 }}><Zap size={13} />Publish Rule</button>
            <button className="btn btn-ghost" onClick={() => setIsCreating(false)}>Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Offers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {offers.map(offer => {
          const pct = Math.round((offer.currentRedemptionsCount / offer.maxRedemptionsTotal) * 100);
          return (
            <div key={offer.id} style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${offer.isActive ? 'var(--color-violet-border)' : 'var(--border-default)'}`,
              borderRadius: 14,
              padding: 18,
              opacity: offer.isActive ? 1 : 0.55,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--color-violet-text)', background: 'var(--color-violet-subtle)', border: '1px solid var(--color-violet-border)', borderRadius: 6, padding: '2px 8px', display: 'inline-block', marginBottom: 6 }}>{offer.code}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{offer.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>{offer.description}</div>
                </div>
                <button
                  onClick={() => inventoryService.toggleOfferActive(offer.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: offer.isActive ? 'var(--color-green-text)' : 'var(--text-disabled)', flexShrink: 0, padding: 4 }}
                >
                  {offer.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                  {offer.discountType === 'percentage' ? `${offer.discountValue}% off` : `₹${offer.discountValue} off`}
                </span>
                <span className="badge badge-neutral" style={{ fontSize: 10 }}>Min ₹{offer.minOrderAmount}</span>
                {offer.isStackable && <span className="badge badge-blue" style={{ fontSize: 10 }}>Stackable</span>}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>Redemptions</span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{offer.currentRedemptionsCount}/{offer.maxRedemptionsTotal}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: pct > 80 ? 'var(--color-red-text)' : 'var(--color-violet-bright)' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
