import { InventoryItem, Order, OrderItem, OrderStatus, Offer, MenuItem } from '../types';
import { supabase, isLiveSupabaseConfigured } from './supabaseClient';
import { OffersEngine } from './offersEngine';

// ─── local fallback data (no mock orders, no demo data) ───────────────
import { INITIAL_MENU_ITEMS, INITIAL_INVENTORY, INITIAL_OFFERS } from '../data/seedData';

type StockChangeListener = (inventory: Record<string, InventoryItem>, updatedItemId?: string) => void;
type OrderChangeListener = (orders: Order[]) => void;
type MenuChangeListener  = (menuItems: MenuItem[]) => void;
type OfferChangeListener = (offers: Offer[]) => void;

const ORDERS_STORAGE_KEY = 'cineflo_local_orders';

class InventoryService {
  private inventory: Record<string, InventoryItem>  = {};
  private offers:    Offer[]                         = [];
  private orders:    Order[]                         = [];
  private menuItems: MenuItem[]                      = [];
  private userRedemptions: Record<string, Record<string, number>> = {};

  private stockListeners: Set<StockChangeListener> = new Set();
  private orderListeners: Set<OrderChangeListener> = new Set();
  private menuListeners:  Set<MenuChangeListener>  = new Set();
  private offerListeners: Set<OfferChangeListener> = new Set();

  // Metrics
  private totalOversellViolations   = 0;
  private totalStockoutRejections   = 0;
  private stockSyncLagSumMs         = 0;
  private stockSyncSampleCount      = 0;

  constructor() {
    this.boot();
  }

  // ─── BOOT: load data from Supabase or local fallback ─────────────────
  private async boot() {
    // First load saved local orders from localStorage (no data loss on refresh!)
    this.loadLocalOrders();

    if (isLiveSupabaseConfigured) {
      await Promise.all([
        this.loadMenuItemsFromDB(),
        this.loadInventoryFromDB(),
        this.loadOffersFromDB(),
        this.loadOrdersFromDB(),
      ]);
      this.subscribeRealtimeInventory();
      this.subscribeRealtimeOrders();
    } else {
      // Offline / local fallback — NO mock orders, real product data only
      this.menuItems = INITIAL_MENU_ITEMS;
      this.inventory = { ...INITIAL_INVENTORY };
      this.offers    = [...INITIAL_OFFERS];
      this.notifyAll();
    }
  }

  private loadLocalOrders() {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) {
        this.orders = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load local orders from localStorage:', e);
    }
  }

  private saveLocalOrders() {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(this.orders));
    } catch (e) {
      console.warn('Failed to save local orders to localStorage:', e);
    }
  }

  // ─── DB LOADERS ───────────────────────────────────────────────────────

  private async loadMenuItemsFromDB() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('[CineFlo] menu_items load error:', error.message);
      this.menuItems = INITIAL_MENU_ITEMS; // fallback
    } else {
      this.menuItems = (data || []).map(row => ({
        id:          row.id,
        name:        row.name,
        category:    row.category,
        price:       Number(row.price),
        description: row.description || '',
        imageUrl:    row.image_url   || '',
        calories:    row.calories    || 0,
        isPopular:   row.is_popular  || false,
        isVeg:       row.is_veg      ?? true,
      }));
    }
    this.notifyMenuChange();
  }

  private async loadInventoryFromDB() {
    const { data, error } = await supabase
      .from('item_inventory')
      .select('*');

    if (error) {
      console.error('[CineFlo] item_inventory load error:', error.message);
      this.inventory = { ...INITIAL_INVENTORY };
    } else {
      const inv: Record<string, InventoryItem> = {};
      (data || []).forEach(row => {
        inv[row.item_id] = {
          itemId:         row.item_id,
          availableStock: row.available_stock,
          reservedStock:  row.reserved_stock,
          totalAllocated: row.total_allocated,
          version:        row.version,
          lastUpdated:    row.updated_at,
        };
      });
      this.inventory = inv;
    }
    this.notifyStockChange();
  }

  private async loadOffersFromDB() {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('[CineFlo] offers load error:', error.message);
      this.offers = [...INITIAL_OFFERS];
    } else {
      this.offers = (data || []).map(row => ({
        id:                       row.id,
        code:                     row.code,
        title:                    row.title,
        description:              row.description || '',
        discountType:             row.discount_type,
        discountValue:            Number(row.discount_value),
        maxRedemptionsTotal:      row.max_redemptions_total,
        currentRedemptionsCount:  row.current_redemptions_count,
        maxRedemptionsPerUser:    row.max_redemptions_per_user,
        minOrderAmount:           Number(row.min_order_amount),
        applicableCategories:     row.applicable_categories || undefined,
        validFrom:                row.valid_from,
        validUntil:               row.valid_until,
        isStackable:              row.is_stackable,
        isActive:                 row.is_active,
      }));
    }
    this.notifyOfferChange();
  }

  private async loadOrdersFromDB() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('[CineFlo] orders load error:', error.message);
    } else if (data && data.length > 0) {
      const dbOrders: Order[] = (data || []).map(row => ({
        id:                 row.id,
        patronId:           row.patron_id || 'guest',
        screenId:           row.screen_id,
        screenName:         row.screen_name || '',
        seatNumber:         row.seat_number,
        showId:             row.show_id     || '',
        movieTitle:         row.movie_title || '',
        items:              (row.order_items || []).map((oi: any) => ({
          itemId:    oi.item_id,
          itemName:  oi.item_name,
          unitPrice: Number(oi.unit_price),
          quantity:  oi.quantity,
        })),
        subtotal:           Number(row.subtotal),
        discountTotal:      Number(row.discount_total),
        totalAmount:        Number(row.total_amount),
        appliedOfferCodes:  row.applied_offer_codes || [],
        status:             row.status,
        estimatedDeliveryTime: row.estimated_delivery || '5-7 mins',
        createdAt:          row.created_at,
        updatedAt:          row.updated_at,
      }));

      // Merge DB orders with any local unsaved orders
      const dbIds = new Set(dbOrders.map(o => o.id));
      const localOnly = this.orders.filter(o => !dbIds.has(o.id));
      this.orders = [...dbOrders, ...localOnly];
      this.saveLocalOrders();
    }
    this.notifyOrderChange();
  }

  // ─── REALTIME SUBSCRIPTIONS ───────────────────────────────────────────

  private subscribeRealtimeInventory() {
    supabase
      .channel('inventory-realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'item_inventory'
      }, (payload: any) => {
        const row = payload.new;
        if (!row?.item_id) return;
        this.inventory[row.item_id] = {
          itemId:         row.item_id,
          availableStock: row.available_stock,
          reservedStock:  row.reserved_stock,
          totalAllocated: row.total_allocated,
          version:        row.version,
          lastUpdated:    row.updated_at,
        };
        this.notifyStockChange(row.item_id);
      })
      .subscribe();
  }

  private subscribeRealtimeOrders() {
    supabase
      .channel('orders-realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders'
      }, () => {
        this.loadOrdersFromDB();
      })
      .subscribe();
  }

  // ─── PUB/SUB ─────────────────────────────────────────────────────────

  public subscribeStock(listener: StockChangeListener): () => void {
    this.stockListeners.add(listener);
    listener(this.getInventorySnapshot());
    return () => this.stockListeners.delete(listener);
  }

  public subscribeOrders(listener: OrderChangeListener): () => void {
    this.orderListeners.add(listener);
    listener(this.getOrdersSnapshot());
    return () => this.orderListeners.delete(listener);
  }

  public subscribeMenu(listener: MenuChangeListener): () => void {
    this.menuListeners.add(listener);
    listener([...this.menuItems]);
    return () => this.menuListeners.delete(listener);
  }

  public subscribeOffers(listener: OfferChangeListener): () => void {
    this.offerListeners.add(listener);
    listener([...this.offers]);
    return () => this.offerListeners.delete(listener);
  }

  private notifyStockChange(updatedItemId?: string, changeStartTime?: number) {
    if (changeStartTime) {
      const lag = performance.now() - changeStartTime;
      this.stockSyncLagSumMs += lag;
      this.stockSyncSampleCount++;
    }
    const snapshot = this.getInventorySnapshot();
    this.stockListeners.forEach(l => l(snapshot, updatedItemId));
  }

  private notifyOrderChange() {
    this.saveLocalOrders();
    const snapshot = this.getOrdersSnapshot();
    this.orderListeners.forEach(l => l(snapshot));
  }

  private notifyMenuChange() {
    this.menuListeners.forEach(l => l([...this.menuItems]));
  }

  private notifyOfferChange() {
    this.offerListeners.forEach(l => l([...this.offers]));
  }

  private notifyAll() {
    this.notifyStockChange();
    this.notifyOrderChange();
    this.notifyMenuChange();
    this.notifyOfferChange();
  }

  // ─── ATOMIC CHECKOUT ─────────────────────────────────────────────────

  public async processAtomicCheckout(params: {
    patronId: string;
    screenId: string;
    screenName: string;
    seatNumber: string;
    showId: string;
    movieTitle: string;
    cartItems: { itemId: string; name: string; unitPrice: number; quantity: number }[];
    promoCodes: string[];
    simulatedLatencyMs?: number;
  }): Promise<{ success: boolean; order?: Order; error?: string; errorCode?: string }> {
    const startTime = performance.now();

    if (params.simulatedLatencyMs && params.simulatedLatencyMs > 0) {
      await new Promise(resolve => setTimeout(resolve, params.simulatedLatencyMs));
    }

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('checkout_order_atomic', {
          p_patron_id:   params.patronId,
          p_screen_id:   params.screenId,
          p_screen_name: params.screenName,
          p_seat_number: params.seatNumber,
          p_show_id:     params.showId,
          p_movie_title: params.movieTitle,
          p_cart_items:  params.cartItems,
          p_promo_codes: params.promoCodes,
        });

        if (error) {
          console.warn('[CineFlo] RPC checkout notice:', error.message);
          if (error.message.includes('INSUFFICIENT_STOCK')) {
            return { success: false, errorCode: 'INSUFFICIENT_STOCK', error: 'Some items are out of stock.' };
          }
          if (error.message.includes('Could not find the function') || error.code === 'PGRST202') {
            console.warn('[CineFlo] RPC function not found in Supabase. Executing local atomic checkout...');
          } else {
            return { success: false, error: error.message };
          }
        } else {
          await this.loadOrdersFromDB();
          return { success: true };
        }
      } catch (err: any) {
        console.warn('[CineFlo] Checkout RPC exception:', err);
      }
    }

    // ─── LOCAL ATOMIC CHECKOUT (offline / local dev fallback) ──────────
    for (const req of params.cartItems) {
      const itemStock = this.inventory[req.itemId];
      if (!itemStock) return { success: false, error: `Item '${req.name}' not found.` };
      if (itemStock.availableStock < req.quantity) {
        this.totalStockoutRejections++;
        return {
          success: false, errorCode: 'INSUFFICIENT_STOCK',
          error: `Only ${itemStock.availableStock} left for '${req.name}'.`
        };
      }
    }

    // Evaluate promo codes
    let totalDiscount = 0;
    const validOfferCodes: string[] = [];
    const userRedemptionsMap = this.userRedemptions[params.patronId] || {};
    const subtotal = params.cartItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    for (const code of params.promoCodes) {
      const formattedCart = params.cartItems.map(ci => ({
        item: { id: ci.itemId, name: ci.name, price: ci.unitPrice, category: 'Combos' as any, description: '', imageUrl: '' },
        quantity: ci.quantity,
      }));
      const evalRes = OffersEngine.evaluateOffer(code, formattedCart, validOfferCodes, this.offers, userRedemptionsMap);
      if (evalRes.success && evalRes.result) {
        validOfferCodes.push(evalRes.result.offer.code);
        totalDiscount += evalRes.result.discountAmount;
        const tgt = this.offers.find(o => o.code === evalRes.result!.offer.code);
        if (tgt) tgt.currentRedemptionsCount++;
      }
    }

    if (!this.userRedemptions[params.patronId]) this.userRedemptions[params.patronId] = {};
    validOfferCodes.forEach(code => {
      this.userRedemptions[params.patronId][code] = (this.userRedemptions[params.patronId][code] || 0) + 1;
    });

    // Atomic decrement
    for (const req of params.cartItems) {
      const item = this.inventory[req.itemId];
      if (item.availableStock < req.quantity) {
        this.totalOversellViolations++;
        throw new Error(`FATAL: Oversell detected for ${req.itemId}`);
      }
      item.availableStock -= req.quantity;
      item.reservedStock  += req.quantity;
      item.version        += 1;
      item.lastUpdated     = new Date().toISOString();
    }

    const newOrder: Order = {
      id:                 `ord-${Math.floor(100000 + Math.random() * 900000)}`,
      patronId:           params.patronId,
      screenId:           params.screenId,
      screenName:         params.screenName,
      seatNumber:         params.seatNumber,
      showId:             params.showId,
      movieTitle:         params.movieTitle,
      items:              params.cartItems.map(ci => ({
        itemId:    ci.itemId,
        itemName:  ci.name,
        unitPrice: ci.unitPrice,
        quantity:  ci.quantity,
      })),
      subtotal:           Math.round(subtotal * 100) / 100,
      discountTotal:      Math.round(totalDiscount * 100) / 100,
      totalAmount:        Math.max(0, Math.round((subtotal - totalDiscount) * 100) / 100),
      appliedOfferCodes:  validOfferCodes,
      status:             'placed',
      createdAt:          new Date().toISOString(),
      updatedAt:          new Date().toISOString(),
      estimatedDeliveryTime: '5-7 mins',
    };

    this.orders.unshift(newOrder);
    this.notifyStockChange(undefined, startTime);
    this.notifyOrderChange();
    return { success: true, order: newOrder };
  }

  // ─── ADMIN STOCK MANAGEMENT ───────────────────────────────────────────

  public async updateStockManual(itemId: string, newStock: number) {
    const clamped = Math.max(0, newStock);

    if (isLiveSupabaseConfigured) {
      await supabase
        .from('item_inventory')
        .update({ available_stock: clamped, updated_at: new Date().toISOString() })
        .eq('item_id', itemId);
    } else {
      const item = this.inventory[itemId];
      if (item) {
        item.availableStock  = clamped;
        item.totalAllocated  = Math.max(item.totalAllocated, clamped);
        item.version        += 1;
        item.lastUpdated     = new Date().toISOString();
        this.notifyStockChange(itemId);
      }
    }
  }

  public async toggleItemSoldOut(itemId: string) {
    const item = this.inventory[itemId];
    if (!item) return;
    const newStock = item.availableStock > 0 ? 0 : 20;
    await this.updateStockManual(itemId, newStock);
  }

  public async addMenuItem(item: MenuItem, initialStock: number) {
    if (isLiveSupabaseConfigured) {
      await supabase.from('menu_items').insert({
        id:          item.id,
        name:        item.name,
        category:    item.category,
        price:       item.price,
        description: item.description,
        image_url:   item.imageUrl,
        calories:    item.calories,
        is_popular:  item.isPopular,
        is_veg:      item.isVeg,
      });

      await supabase.from('item_inventory').insert({
        item_id:         item.id,
        available_stock: initialStock,
        reserved_stock:  0,
        total_allocated: initialStock,
        version:         1,
      });

      await Promise.all([this.loadMenuItemsFromDB(), this.loadInventoryFromDB()]);
    } else {
      this.menuItems.push(item);
      this.inventory[item.id] = {
        itemId:         item.id,
        availableStock: initialStock,
        reservedStock:  0,
        totalAllocated: initialStock,
        version:        1,
        lastUpdated:    new Date().toISOString(),
      };
      this.notifyMenuChange();
      this.notifyStockChange(item.id);
    }
  }

  public async updateMenuItem(item: MenuItem) {
    if (isLiveSupabaseConfigured) {
      await supabase.from('menu_items').update({
        name:        item.name,
        category:    item.category,
        price:       item.price,
        description: item.description,
        image_url:   item.imageUrl,
        calories:    item.calories,
        is_popular:  item.isPopular,
        is_veg:      item.isVeg,
      }).eq('id', item.id);

      await this.loadMenuItemsFromDB();
    } else {
      const idx = this.menuItems.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        this.menuItems[idx] = { ...item };
        this.notifyMenuChange();
      }
    }
  }

  public async updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    if (isLiveSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    }
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status    = newStatus;
      order.updatedAt = new Date().toISOString();
    }
    this.notifyOrderChange();
  }

  public async addOffer(newOffer: Offer) {
    if (isLiveSupabaseConfigured) {
      await supabase.from('offers').insert({
        id:                       newOffer.id,
        code:                     newOffer.code,
        title:                    newOffer.title,
        description:              newOffer.description,
        discount_type:            newOffer.discountType,
        discount_value:           newOffer.discountValue,
        max_redemptions_total:    newOffer.maxRedemptionsTotal,
        max_redemptions_per_user: newOffer.maxRedemptionsPerUser,
        min_order_amount:         newOffer.minOrderAmount,
        valid_from:               newOffer.validFrom,
        valid_until:              newOffer.validUntil,
        is_stackable:             newOffer.isStackable,
        is_active:                newOffer.isActive,
      });
      await this.loadOffersFromDB();
    } else {
      this.offers.push(newOffer);
      this.notifyOfferChange();
    }
  }

  public async toggleOfferActive(offerId: string) {
    const offer = this.offers.find(o => o.id === offerId);
    if (!offer) return;
    const next = !offer.isActive;

    if (isLiveSupabaseConfigured) {
      await supabase.from('offers').update({ is_active: next }).eq('id', offerId);
      await this.loadOffersFromDB();
    } else {
      offer.isActive = next;
      this.notifyOfferChange();
    }
  }

  // ─── SNAPSHOTS ────────────────────────────────────────────────────────

  public getInventorySnapshot(): Record<string, InventoryItem> {
    return JSON.parse(JSON.stringify(this.inventory));
  }

  public getOrdersSnapshot(): Order[] {
    return JSON.parse(JSON.stringify(this.orders));
  }

  public getOffersSnapshot(): Offer[] {
    return JSON.parse(JSON.stringify(this.offers));
  }

  public getMenuItemsSnapshot(): MenuItem[] {
    return JSON.parse(JSON.stringify(this.menuItems));
  }

  public getMetrics() {
    return {
      totalOversellViolations: this.totalOversellViolations,
      totalStockoutRejections:  this.totalStockoutRejections,
      avgStockSyncLagMs:        this.stockSyncSampleCount > 0
        ? Math.round(this.stockSyncLagSumMs / this.stockSyncSampleCount * 10) / 10
        : 1.2,
    };
  }

  public resetMetrics() {
    this.totalOversellViolations = 0;
    this.totalStockoutRejections  = 0;
    this.stockSyncLagSumMs        = 0;
    this.stockSyncSampleCount     = 0;
  }
}

export const inventoryService = new InventoryService();
