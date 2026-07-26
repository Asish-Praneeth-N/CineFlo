import React, { useState } from 'react';
import { CartItem, Offer } from '../../types';
import { OffersEngine } from '../../services/offersEngine';
import { inventoryService } from '../../services/inventoryService';
import { X, ShoppingBag, Tag, Trash2, ShieldAlert, CheckCircle2, ArrowRight, Loader2, Armchair } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  selectedScreenName: string;
  selectedSeat: string;
  onChangeSeatClick: () => void;
  availableOffers: Offer[];
  onOrderPlacedSuccess: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  clearCart,
  selectedScreenName,
  selectedSeat,
  onChangeSeatClick,
  availableOffers,
  onOrderPlacedSuccess
}) => {
  const [promoInput, setPromoInput] = useState<string>('');
  const [appliedCodes, setAppliedCodes] = useState<string[]>(['INTERMISSION50']); // Pre-applied ₹50 demo discount
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate Subtotal in ₹ INR
  const subtotal = cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);

  // Evaluate Applied Offers
  let totalDiscount = 0;
  const appliedOfferResults: { code: string; title: string; discount: number }[] = [];

  for (const code of appliedCodes) {
    const res = OffersEngine.evaluateOffer(code, cart, appliedOfferResults.map(r => r.code), availableOffers);
    if (res.success && res.result) {
      appliedOfferResults.push({
        code: res.result.offer.code,
        title: res.result.offer.title,
        discount: res.result.discountAmount
      });
      totalDiscount += res.result.discountAmount;
    }
  }

  const finalTotal = Math.max(0, subtotal - totalDiscount);

  const handleApplyPromo = (codeToApply?: string) => {
    const code = (codeToApply || promoInput).trim().toUpperCase();
    setPromoError(null);
    setPromoSuccessMsg(null);

    if (!code) return;

    const evalRes = OffersEngine.evaluateOffer(code, cart, appliedCodes, availableOffers);
    if (evalRes.success && evalRes.result) {
      setAppliedCodes([...appliedCodes, evalRes.result.offer.code]);
      setPromoSuccessMsg(`Promo code '${code}' applied! Saved ₹${evalRes.result.discountAmount.toFixed(0)}.`);
      setPromoInput('');
    } else {
      setPromoError(evalRes.error || 'Failed to apply offer.');
    }
  };

  const handleRemovePromo = (code: string) => {
    setAppliedCodes(appliedCodes.filter(c => c !== code));
    setPromoError(null);
    setPromoSuccessMsg(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    setCheckoutError(null);

    const patronId = `patron-${Math.floor(100 + Math.random() * 900)}`;

    const result = await inventoryService.processAtomicCheckout({
      patronId,
      screenId: 'screen-1',
      screenName: selectedScreenName,
      seatNumber: selectedSeat,
      showId: 'show-101',
      movieTitle: 'Kalki 2898 AD (IMAX 3D)',
      cartItems: cart.map(ci => ({
        itemId: ci.item.id,
        name: ci.item.name,
        unitPrice: ci.item.price,
        quantity: ci.quantity
      })),
      promoCodes: appliedCodes,
      simulatedLatencyMs: 35
    });

    setIsCheckingOut(false);

    if (result.success) {
      clearCart();
      onOrderPlacedSuccess();
      onClose();
    } else {
      setCheckoutError(result.error || 'Checkout failed due to stock contention.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-amber-500/20 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-white">Your Cart Summary</h2>
              <p className="text-xs text-slate-400">{cart.reduce((a, c) => a + c.quantity, 0)} snacks selected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seat Delivery Target Bar */}
        <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2.5">
            <Armchair className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Seat Delivery Target</span>
              <span className="font-extrabold text-white text-xs font-display">{selectedScreenName} • {selectedSeat}</span>
            </div>
          </div>
          <button
            onClick={onChangeSeatClick}
            className="text-amber-400 hover:underline font-bold text-[11px]"
          >
            Change Seat
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto" />
              <p className="text-slate-400 text-sm font-medium">Your cart is empty.</p>
              <p className="text-xs text-slate-600">Select snacks from the menu to place your seat order.</p>
            </div>
          ) : (
            cart.map(({ item, quantity }) => (
              <div key={item.id} className="glass-card p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-slate-950" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-100">{item.name}</h4>
                    <p className="text-xs text-amber-400 font-mono font-bold">₹{item.price.toFixed(0)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center text-xs hover:bg-slate-700"
                  >
                    -
                  </button>
                  <span className="w-5 text-center text-xs font-bold font-mono text-white">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-6 h-6 rounded bg-amber-500 text-black flex items-center justify-center text-xs font-bold hover:bg-amber-400"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Offers & Promo Codes Section */}
          {cart.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Promo Codes & Discount Offers</span>
                </span>
              </div>

              {/* Promo Input Box */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Code (e.g. INTERMISSION50, CHAI20)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="flex-1 glass-input text-xs font-mono uppercase"
                />
                <button
                  onClick={() => handleApplyPromo()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors"
                >
                  Apply
                </button>
              </div>

              {/* Feedback messages */}
              {promoError && (
                <p className="text-[11px] text-rose-400 flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{promoError}</span>
                </p>
              )}
              {promoSuccessMsg && (
                <p className="text-[11px] text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{promoSuccessMsg}</span>
                </p>
              )}

              {/* Applied Promo Pills */}
              {appliedOfferResults.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {appliedOfferResults.map(aor => (
                    <div key={aor.code} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                      <span className="text-amber-300 font-mono font-semibold">{aor.code} ({aor.title})</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-400 font-bold">-₹{aor.discount.toFixed(0)}</span>
                        <button onClick={() => handleRemovePromo(aor.code)} className="text-slate-400 hover:text-rose-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Checkout Error Message */}
          {checkoutError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Stock Lock Conflict</span>
                <span>{checkoutError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer & Order Total in ₹ INR */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/90 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="font-mono text-slate-200">₹{subtotal.toFixed(0)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Promotional Discount</span>
                  <span className="font-mono">-₹{totalDiscount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                <span>Total Amount Due</span>
                <span className="text-amber-400 font-display text-lg">₹{finalTotal.toFixed(0)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all transform active:scale-98"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locking Stock & Sending to Seat...</span>
                </>
              ) : (
                <>
                  <span>Pay ₹{finalTotal.toFixed(0)} & Deliver to Seat</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
