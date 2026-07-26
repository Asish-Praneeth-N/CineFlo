import { Offer, CartItem, AppliedOfferResult } from '../types';

export class OffersEngine {
  /**
   * Deterministically evaluates a candidate promo code against a patron's cart,
   * checking validity, time windows, spend thresholds, global redemption caps,
   * user redemption caps, and stackability conflicts with already applied offers.
   */
  static evaluateOffer(
    code: string,
    cartItems: CartItem[],
    alreadyAppliedCodes: string[],
    allOffers: Offer[],
    userRedemptionsCountMap: Record<string, number> = {}
  ): { success: boolean; result?: AppliedOfferResult; error?: string } {
    const offer = allOffers.find(o => o.code.toUpperCase() === code.trim().toUpperCase());

    if (!offer) {
      return { success: false, error: `Promo code '${code}' not found or invalid.` };
    }

    if (!offer.isActive) {
      return { success: false, error: `Promo code '${offer.code}' is no longer active.` };
    }

    // Time Window Validation
    const now = new Date().toISOString();
    if (offer.validFrom && now < offer.validFrom) {
      return { success: false, error: `Promo code '${offer.code}' is not yet active.` };
    }
    if (offer.validUntil && now > offer.validUntil) {
      return { success: false, error: `Promo code '${offer.code}' has expired.` };
    }

    // Global Redemption Cap Check
    if (offer.currentRedemptionsCount >= offer.maxRedemptionsTotal) {
      return { success: false, error: `Promo code '${offer.code}' total redemption cap reached.` };
    }

    // Per-User Cap Check
    const userCount = userRedemptionsCountMap[offer.code] || 0;
    if (userCount >= offer.maxRedemptionsPerUser) {
      return { 
        success: false, 
        error: `You have reached the maximum redemptions limit (${offer.maxRedemptionsPerUser}) for code '${offer.code}'.` 
      };
    }

    // Cart Subtotal Calculation
    const subtotal = cartItems.reduce((acc, ci) => acc + ci.item.price * ci.quantity, 0);

    if (subtotal < offer.minOrderAmount) {
      return {
        success: false,
        error: `Minimum order amount of $${offer.minOrderAmount.toFixed(2)} required for code '${offer.code}'. Current cart is $${subtotal.toFixed(2)}.`
      };
    }

    // Stackability Conflict Resolution
    if (alreadyAppliedCodes.length > 0) {
      if (alreadyAppliedCodes.includes(offer.code)) {
        return { success: false, error: `Offer '${offer.code}' is already applied.` };
      }

      // Check if existing offers permit stacking
      const existingOffers = allOffers.filter(o => alreadyAppliedCodes.includes(o.code));
      const hasNonStackable = existingOffers.some(o => !o.isStackable);

      if (!offer.isStackable || hasNonStackable) {
        return {
          success: false,
          error: `Offer '${offer.code}' cannot be combined with already applied promo codes.`
        };
      }
    }

    // Calculate Discount Value
    let eligibleSubtotal = subtotal;
    if (offer.applicableCategories && offer.applicableCategories.length > 0) {
      eligibleSubtotal = cartItems
        .filter(ci => offer.applicableCategories!.includes(ci.item.category))
        .reduce((acc, ci) => acc + ci.item.price * ci.quantity, 0);

      if (eligibleSubtotal === 0) {
        return {
          success: false,
          error: `Offer '${offer.code}' only applies to items in: ${offer.applicableCategories.join(', ')}.`
        };
      }
    }

    let discountAmount = 0;
    if (offer.discountType === 'percentage') {
      discountAmount = (eligibleSubtotal * offer.discountValue) / 100;
    } else {
      discountAmount = Math.min(offer.discountValue, eligibleSubtotal);
    }

    return {
      success: true,
      result: {
        offer,
        discountAmount: Math.round(discountAmount * 100) / 100,
        discountMessage: `${offer.title}: -$${discountAmount.toFixed(2)}`
      }
    };
  }
}
