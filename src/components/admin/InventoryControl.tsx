import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Minus, RefreshCw, AlertTriangle, Power, Search, X, Edit3, Image as ImageIcon } from 'lucide-react';
import { MenuItem, InventoryItem } from '../../types';
import { inventoryService } from '../../services/inventoryService';

interface InventoryControlProps {
  menuItems: MenuItem[];
  inventory: Record<string, InventoryItem>;
}

const CATEGORY_OPTIONS = ['Popcorn', 'Combos', 'Hot Food', 'Beverages', 'Snacks', 'Desserts'];
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80';

export const InventoryControl: React.FC<InventoryControlProps> = ({ menuItems, inventory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [updatedItem, setUpdatedItem] = useState<string | null>(null);

  // Add / Edit Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Popcorn');
  const [price, setPrice] = useState<number | ''>(250);
  const [stock, setStock] = useState<number | ''>(50);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [calories, setCalories] = useState<number | ''>(400);
  const [isPopular, setIsPopular] = useState(false);
  const [isVeg, setIsVeg] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const categories = ['all', ...Array.from(new Set(menuItems.map(i => i.category)))];

  const filtered = menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === 'all' || item.category === filterCategory;
    return matchSearch && matchCat;
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('Popcorn');
    setPrice(250);
    setStock(50);
    setDescription('');
    setImageUrl('');
    setCalories(400);
    setIsPopular(false);
    setIsVeg(true);
    setFormError('');
    setIsDrawerOpen(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    const currentStock = inventory[item.id]?.availableStock ?? 50;
    setStock(currentStock);
    setDescription(item.description || '');
    setImageUrl(item.imageUrl || '');
    setCalories(item.calories ?? 350);
    setIsPopular(item.isPopular ?? false);
    setIsVeg(item.isVeg ?? true);
    setFormError('');
    setIsDrawerOpen(true);
  };

  const handleStockChange = (itemId: string, delta: number) => {
    const current = inventory[itemId]?.availableStock || 0;
    inventoryService.updateStockManual(itemId, Math.max(0, current + delta));
    setUpdatedItem(itemId);
    setTimeout(() => setUpdatedItem(null), 800);
  };

  const handleToggleSoldOut = (itemId: string) => {
    inventoryService.toggleItemSoldOut(itemId);
    setUpdatedItem(itemId);
    setTimeout(() => setUpdatedItem(null), 800);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) { setFormError('Item name is required.'); return; }
    if (price === '' || Number(price) <= 0) { setFormError('Please enter a valid price in ₹ INR.'); return; }
    if (stock === '' || Number(stock) < 0) { setFormError('Please enter a valid stock level.'); return; }

    setIsSubmitting(true);

    try {
      if (editingItem) {
        // Edit Mode
        const updatedMenuItem: MenuItem = {
          ...editingItem,
          name: name.trim(),
          category: category as MenuItem['category'],
          price: Number(price),
          description: description.trim() || `${name.trim()} - Premium cinema offering.`,
          imageUrl: imageUrl.trim() || DEFAULT_IMAGE,
          calories: calories !== '' ? Number(calories) : 350,
          isPopular,
          isVeg,
        };
        await inventoryService.updateMenuItem(updatedMenuItem);
        await inventoryService.updateStockManual(editingItem.id, Number(stock));
        setUpdatedItem(editingItem.id);
        setTimeout(() => setUpdatedItem(null), 800);
      } else {
        // Add Mode
        const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const newItem: MenuItem = {
          id: `item-${slug}-${Date.now().toString().slice(-4)}`,
          name: name.trim(),
          category: category as MenuItem['category'],
          price: Number(price),
          description: description.trim() || `${name.trim()} - Premium cinema offering.`,
          imageUrl: imageUrl.trim() || DEFAULT_IMAGE,
          calories: calories !== '' ? Number(calories) : 350,
          isPopular,
          isVeg,
        };
        await inventoryService.addMenuItem(newItem, Number(stock));
      }

      setIsSubmitting(false);
      setIsDrawerOpen(false);
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message || 'Failed to save changes.');
    }
  };

  const totalItems = menuItems.length;
  const lowStockItems = menuItems.filter(i => (inventory[i.id]?.availableStock || 0) > 0 && (inventory[i.id]?.availableStock || 0) <= 10).length;
  const soldOutItems = menuItems.filter(i => (inventory[i.id]?.availableStock || 0) === 0).length;

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--color-blue-subtle)', border: '1px solid var(--color-blue-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} color="var(--color-blue-text)" />
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Inventory & Menu Management</h1>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', paddingLeft: 42 }}>
            Manage catalog pricing, stock allocation levels, and PostgreSQL atomic locks
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn btn-primary"
          style={{ gap: 6, padding: '9px 16px', fontSize: 13 }}
        >
          <Plus size={15} />
          Add New Item
        </button>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Catalog Items', value: totalItems, color: 'var(--text-primary)', bg: 'var(--bg-overlay)', border: 'var(--border-default)' },
          { label: 'Low Stock Alerts', value: lowStockItems, color: 'var(--color-amber-text)', bg: 'var(--color-amber-subtle)', border: 'var(--color-amber-border)' },
          { label: 'Sold Out Items', value: soldOutItems, color: 'var(--color-red-text)', bg: 'var(--color-red-subtle)', border: 'var(--color-red-border)' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 500 }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: m.color, letterSpacing: '-0.04em', fontFeatureSettings: '"tnum"' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder="Search menu items by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, padding: '8px 12px', fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none' }}
        >
          {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>

        <button
          onClick={() => menuItems.forEach(i => inventoryService.updateStockManual(i.id, 50))}
          className="btn btn-secondary"
          style={{ gap: 6, whiteSpace: 'nowrap' }}
        >
          <RefreshCw size={13} />
          Refill All to 50
        </button>
      </div>

      {/* Inventory Table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1.2fr 80px 150px', gap: 16, padding: '10px 20px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-canvas)' }}>
          {['Item & Category', 'Price', 'Stock Level', 'Version', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-disabled)' }}>{h}</div>
          ))}
        </div>

        {/* Table Rows */}
        <div>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              No inventory items matched your search/filter.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const inv = inventory[item.id] || { availableStock: 0, reservedStock: 0, version: 1, lastUpdated: new Date().toISOString() };
              const isSoldOut = inv.availableStock <= 0;
              const isLow = inv.availableStock > 0 && inv.availableStock <= 10;
              const isJustUpdated = updatedItem === item.id;

              return (
                <motion.div
                  key={item.id}
                  animate={isJustUpdated ? { backgroundColor: ['var(--bg-overlay)', 'var(--color-green-subtle)', 'var(--bg-surface)'] } : {}}
                  transition={{ duration: 0.6 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 100px 1.2fr 80px 150px',
                    gap: 16,
                    padding: '14px 20px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    alignItems: 'center',
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  {/* Item info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={item.imageUrl} alt={item.name} style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border-default)', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>{item.category}</span>
                        {item.isVeg && <span style={{ fontSize: 9, color: 'var(--color-green-text)', background: 'var(--color-green-subtle)', padding: '1px 4px', borderRadius: 4, fontWeight: 600 }}>VEG</span>}
                        {item.isPopular && <span style={{ fontSize: 9, color: 'var(--color-amber-text)', background: 'var(--color-amber-subtle)', padding: '1px 4px', borderRadius: 4, fontWeight: 600 }}>POPULAR</span>}
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    ₹{item.price}
                  </div>

                  {/* Stock counter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '3px 4px' }}>
                      <button
                        onClick={() => handleStockChange(item.id, -5)}
                        style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px 5px', borderRadius: 5 }}
                        title="Reduce by 5"
                      >-5</button>
                      <button
                        onClick={() => handleStockChange(item.id, -1)}
                        className="btn-icon btn-ghost" style={{ width: 22, height: 22, borderRadius: 6 }}
                        title="Reduce by 1"
                      >
                        <Minus size={10} />
                      </button>
                      <span style={{
                        fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', minWidth: 32, textAlign: 'center',
                        color: isSoldOut ? 'var(--color-red-text)' : isLow ? 'var(--color-amber-text)' : 'var(--color-green-text)',
                      }}>
                        {inv.availableStock}
                      </span>
                      <button
                        onClick={() => handleStockChange(item.id, 1)}
                        className="btn-icon btn-ghost" style={{ width: 22, height: 22, borderRadius: 6 }}
                        title="Add 1"
                      >
                        <Plus size={10} />
                      </button>
                      <button
                        onClick={() => handleStockChange(item.id, 5)}
                        style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'transparent', border: 'none', color: 'var(--color-amber-text)', cursor: 'pointer', padding: '2px 5px', borderRadius: 5 }}
                        title="Add 5"
                      >+5</button>
                    </div>
                    {isSoldOut && <span className="badge badge-red" style={{ fontSize: 9 }}>OUT</span>}
                    {isLow && <span className="badge badge-amber" style={{ fontSize: 9 }}><AlertTriangle size={8} />LOW</span>}
                  </div>

                  {/* Version */}
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)' }}>v{inv.version}</div>

                  {/* Actions (Edit + Sold Out Toggle) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="btn btn-secondary btn-icon"
                      style={{ width: 30, height: 30, borderRadius: 8 }}
                      title="Edit Item Details"
                    >
                      <Edit3 size={13} />
                    </button>

                    <button
                      onClick={() => handleToggleSoldOut(item.id)}
                      className={`btn btn-sm ${isSoldOut ? 'badge-green' : 'badge-red'}`}
                      style={{
                        background: isSoldOut ? 'var(--color-green-subtle)' : 'var(--color-red-subtle)',
                        color: isSoldOut ? 'var(--color-green-text)' : 'var(--color-red-text)',
                        borderColor: isSoldOut ? 'var(--color-green-border)' : 'var(--color-red-border)',
                        gap: 4, padding: '4px 8px', fontSize: 11
                      }}
                    >
                      <Power size={11} />
                      {isSoldOut ? 'Restock' : 'Sold Out'}
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── ADD / EDIT ITEM DRAWER ─── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              className="drawer-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.div
              className="drawer-panel"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ width: '100%', maxWidth: 440 }}
            >
              {/* Drawer Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {editingItem ? `Update parameters for ${editingItem.name}` : 'Create catalog entry and allocate initial inventory'}
                  </div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setIsDrawerOpen(false)}><X size={16} /></button>
              </div>

              {/* Drawer Form */}
              <form onSubmit={handleFormSubmit} style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {formError && (
                  <div style={{ padding: '10px 12px', background: 'var(--color-red-subtle)', border: '1px solid var(--color-red-border)', borderRadius: 8, fontSize: 12, color: 'var(--color-red-text)' }}>
                    {formError}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Item Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Butter Cheese Gourmet Popcorn (XL)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Category</label>
                    <select
                      className="input"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Price (₹ INR) *</label>
                    <input
                      className="input"
                      type="number"
                      placeholder="250"
                      value={price}
                      onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Stock Level *</label>
                    <input
                      className="input"
                      type="number"
                      placeholder="50"
                      value={stock}
                      onChange={e => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Calories (kcal)</label>
                    <input
                      className="input"
                      type="number"
                      placeholder="400"
                      value={calories}
                      onChange={e => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Short appetizing description for moviegoers..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Image URL</label>
                  <div style={{ position: 'relative' }}>
                    <ImageIcon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                    <input
                      className="input"
                      placeholder="https://images.unsplash.com/..."
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      style={{ paddingLeft: 36 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20, paddingTop: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={isVeg}
                      onChange={e => setIsVeg(e.target.checked)}
                      style={{ accentColor: 'var(--color-green-bright)' }}
                    />
                    Vegetarian
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={isPopular}
                      onChange={e => setIsPopular(e.target.checked)}
                      style={{ accentColor: 'var(--color-amber-bright)' }}
                    />
                    Mark as Popular
                  </label>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setIsDrawerOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ flex: 1, justifyContent: 'center' }}>
                    {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
