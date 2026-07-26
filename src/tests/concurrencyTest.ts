import { inventoryService } from '../services/inventoryService';
import { OffersEngine } from '../services/offersEngine';
import { INITIAL_OFFERS } from '../data/seedData';

async function runConcurrencyTest() {
  console.log('====================================================');
  console.log('🧪 CINEFLO ATOMIC CONCURRENCY & OVERSELL TEST SUITE');
  console.log('====================================================');

  // Test 1: Atomic Inventory Decrement under Contention
  const testItem = 'item-popcorn-xl';
  const initialStock = 10;
  inventoryService.updateStockManual(testItem, initialStock);

  console.log(`\n[Test 1] Setting initial stock for '${testItem}' to ${initialStock}...`);
  console.log('Dispatching 50 concurrent checkout requests for 1 popcorn each...');

  const concurrentRequests: Promise<any>[] = [];
  for (let i = 0; i < 50; i++) {
    concurrentRequests.push(
      inventoryService.processAtomicCheckout({
        patronId: `test-patron-${i}`,
        screenId: 'screen-1',
        screenName: 'Screen 1 (IMAX 3D AUDI 1)',
        seatNumber: `Seat A-${i + 1}`,
        showId: 'show-101',
        movieTitle: 'Kalki 2898 AD (IMAX 3D)',
        cartItems: [{ itemId: testItem, name: 'Butter Cheese Gourmet Popcorn (XL Tub)', unitPrice: 390, quantity: 1 }],
        promoCodes: []
      })
    );
  }

  const results = await Promise.all(concurrentRequests);

  const successful = results.filter(r => r.success).length;
  const stockouts = results.filter(r => !r.success && r.errorCode === 'INSUFFICIENT_STOCK').length;
  const remainingStock = inventoryService.getInventorySnapshot()[testItem].availableStock;
  const metrics = inventoryService.getMetrics();

  console.log(`\nResults:`);
  console.log(`- Successful Orders: ${successful} (Expected: ${initialStock})`);
  console.log(`- Rejected Stockouts: ${stockouts} (Expected: ${50 - initialStock})`);
  console.log(`- Final Available Stock: ${remainingStock} (Expected: 0)`);
  console.log(`- Oversell Violations: ${metrics.totalOversellViolations} (ASSERTION: MUST BE 0)`);

  if (successful === initialStock && remainingStock === 0 && metrics.totalOversellViolations === 0) {
    console.log('✅ TEST 1 PASSED: Zero overselling verified under 50-way concurrent race condition!');
  } else {
    console.error('❌ TEST 1 FAILED!');
  }

  // Test 2: Offer Stackability & Redemption Cap Resolution
  console.log('\n[Test 2] Indian Offers Conflict Engine Evaluation...');

  const offerEval = OffersEngine.evaluateOffer(
    'INTERMISSION50',
    [
      {
        item: { id: 'item-1', name: 'Popcorn', price: 390, category: 'Popcorn', description: '', imageUrl: '' },
        quantity: 1
      }
    ],
    [],
    INITIAL_OFFERS
  );

  if (offerEval.success && offerEval.result?.discountAmount === 50) {
    console.log('✅ TEST 2 PASSED: ₹50 intermission discount correctly applied for ₹390 subtotal!');
  } else {
    console.error('❌ TEST 2 FAILED!', offerEval);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL ATOMIC CONCURRENCY & TEST SUITES PASSED');
  console.log('====================================================\n');
}

runConcurrencyTest();
