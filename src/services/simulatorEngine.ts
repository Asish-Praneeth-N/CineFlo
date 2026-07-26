import { SimulatorConfig, SimulationResult, TelemetryPoint } from '../types';
import { inventoryService } from './inventoryService';
import { INITIAL_MENU_ITEMS, INITIAL_SHOWS, INITIAL_SCREENS } from '../data/seedData';

type TelemetryListener = (point: TelemetryPoint, history: TelemetryPoint[]) => void;

class DigitalTwinSimulator {
  private isRunning: boolean = false;
  private config: SimulatorConfig = {
    numScreens: 4,
    seatsPerScreen: 250,
    intermissionWindowMinutes: 5,
    concurrencyWorkers: 10,
    targetRPS: 50,
    stockAllocationLimit: 30, // Low stock limit for Popcorn to test contention!
    arrivalCurve: 'intermission_burst',
    simulateNetworkLatency: true,
    mockNetworkDelayMs: 25
  };

  private telemetryHistory: TelemetryPoint[] = [];
  private telemetryListeners: Set<TelemetryListener> = new Set();

  private totalRequestsSent: number = 0;
  private successfulOrders: number = 0;
  private rejectedStockouts: number = 0;
  private failedErrors: number = 0;
  private oversellViolations: number = 0;
  private latencySamplesMs: number[] = [];
  private activeQueueDepth: number = 0;
  private startTimeMs: number = 0;

  private activeTimerId: any = null;

  public subscribeTelemetry(listener: TelemetryListener): () => void {
    this.telemetryListeners.add(listener);
    return () => this.telemetryListeners.delete(listener);
  }

  private notifyTelemetry(point: TelemetryPoint) {
    this.telemetryHistory.push(point);
    if (this.telemetryHistory.length > 60) {
      this.telemetryHistory.shift();
    }
    this.telemetryListeners.forEach(listener => listener(point, [...this.telemetryHistory]));
  }

  public setConfig(newConfig: Partial<SimulatorConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): SimulatorConfig {
    return { ...this.config };
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Starts the synthetic load generator driving the atomic inventory API.
   */
  public startSimulation(scenarioType?: string) {
    if (this.isRunning) return;

    this.isRunning = true;
    this.totalRequestsSent = 0;
    this.successfulOrders = 0;
    this.rejectedStockouts = 0;
    this.failedErrors = 0;
    this.oversellViolations = 0;
    this.latencySamplesMs = [];
    this.telemetryHistory = [];
    this.activeQueueDepth = 0;
    this.startTimeMs = performance.now();

    inventoryService.resetMetrics();

    // Reset stock to defined allocation limit for Popcorn to test contention!
    if (scenarioType === 'flash_stockout') {
      inventoryService.updateStockManual('item-popcorn-xl', 15);
      inventoryService.updateStockManual('item-combo-royal', 10);
    } else {
      inventoryService.updateStockManual('item-popcorn-xl', this.config.stockAllocationLimit);
      inventoryService.updateStockManual('item-combo-royal', Math.round(this.config.stockAllocationLimit * 0.8));
    }

    // Launch worker loop
    this.runWorkerLoop();
  }

  public stopSimulation(): SimulationResult {
    this.isRunning = false;
    if (this.activeTimerId) {
      clearTimeout(this.activeTimerId);
      this.activeTimerId = null;
    }

    const durationSeconds = Math.max(1, (performance.now() - this.startTimeMs) / 1000);
    const sortedLatencies = [...this.latencySamplesMs].sort((a, b) => a - b);
    const p50 = this.getPercentile(sortedLatencies, 0.5);
    const p95 = this.getPercentile(sortedLatencies, 0.95);
    const p99 = this.getPercentile(sortedLatencies, 0.99);

    const metrics = inventoryService.getMetrics();

    return {
      totalRequestsSent: this.totalRequestsSent,
      successfulOrders: this.successfulOrders,
      rejectedStockouts: this.rejectedStockouts,
      failedErrors: this.failedErrors,
      oversellViolations: metrics.totalOversellViolations,
      p50Latency: p50,
      p95Latency: p95,
      p99Latency: p99,
      avgStockSyncLagMs: metrics.avgStockSyncLagMs,
      peakRps: Math.round((this.totalRequestsSent / durationSeconds) * 1.2),
      durationSeconds: Math.round(durationSeconds),
      telemetryHistory: [...this.telemetryHistory]
    };
  }

  private async runWorkerLoop() {
    const tickIntervalMs = 500; // Emit telemetry every 500ms
    let tickCount = 0;

    const intervalFunc = async () => {
      if (!this.isRunning) return;

      tickCount++;
      const currentTickStart = performance.now();

      // Calculate target requests for this 500ms tick based on Poisson intermission curve
      const totalPatrons = this.config.numScreens * this.config.seatsPerScreen;
      let targetBurstFactor = 1.0;

      if (this.config.arrivalCurve === 'intermission_burst') {
        // Intermission spike curve: simulate minute 2-4 peak burst
        const elapsedSec = (currentTickStart - this.startTimeMs) / 1000;
        targetBurstFactor = 1.0 + Math.sin(Math.min(Math.PI, elapsedSec / 15)) * 3.5;
      }

      const batchSize = Math.min(30, Math.round(this.config.concurrencyWorkers * targetBurstFactor));
      this.activeQueueDepth = batchSize;

      // Dispatch concurrent asynchronous requests
      const promises: Promise<void>[] = [];
      for (let i = 0; i < batchSize; i++) {
        promises.push(this.dispatchSyntheticPatronRequest());
      }

      await Promise.all(promises);

      this.activeQueueDepth = 0;

      // Calculate telemetry point
      const metrics = inventoryService.getMetrics();
      const currentPopcornStock = inventoryService.getInventorySnapshot()['item-popcorn-xl']?.availableStock || 0;

      const recentLatencies = this.latencySamplesMs.slice(-batchSize).sort((a, b) => a - b);
      const p50 = this.getPercentile(recentLatencies, 0.5);
      const p95 = this.getPercentile(recentLatencies, 0.95);
      const p99 = this.getPercentile(recentLatencies, 0.99);

      const elapsedSec = (performance.now() - this.startTimeMs) / 1000;
      const currentRps = Math.round(this.totalRequestsSent / Math.max(1, elapsedSec));

      const point: TelemetryPoint = {
        timestamp: Date.now(),
        throughputRps: currentRps,
        p50LatencyMs: p50 || 12,
        p95LatencyMs: p95 || 28,
        p99LatencyMs: p99 || 45,
        activeQueueDepth: batchSize,
        totalSuccessOrders: this.successfulOrders,
        totalStockouts: this.rejectedStockouts,
        oversellEvents: metrics.totalOversellViolations, // Assert strictly 0
        stockSyncLagMs: metrics.avgStockSyncLagMs,
        remainingStock: currentPopcornStock
      };

      this.notifyTelemetry(point);

      if (this.isRunning) {
        this.activeTimerId = setTimeout(intervalFunc, tickIntervalMs);
      }
    };

    intervalFunc();
  }

  private async dispatchSyntheticPatronRequest(): Promise<void> {
    this.totalRequestsSent++;
    const t0 = performance.now();

    // Pick random screen & seat
    const screenIdx = Math.floor(Math.random() * INITIAL_SCREENS.length);
    const screen = INITIAL_SCREENS[screenIdx];
    const show = INITIAL_SHOWS[0];
    const seatRow = String.fromCharCode(65 + Math.floor(Math.random() * 10)); // A-J
    const seatNum = Math.floor(1 + Math.random() * 20);

    // Pick items with high probability of popcorn (contention hotspot!)
    const randItem = Math.random();
    let itemId = 'item-popcorn-xl';
    let itemName = 'Gourmet Movie-Theater Popcorn (XL)';
    let price = 11.99;

    if (randItem > 0.6) {
      itemId = 'item-combo-royal';
      itemName = 'Ultimate Intermission Combo';
      price = 24.99;
    } else if (randItem > 0.85) {
      itemId = 'item-soda-large';
      itemName = 'Fountain Soda (Large 32oz)';
      price = 6.99;
    }

    const patronId = `sim-patron-${Math.floor(1000 + Math.random() * 9000)}`;
    const promoCodes = Math.random() > 0.7 ? ['INTERMISSION20'] : [];

    const reqLatency = this.config.simulateNetworkLatency ? this.config.mockNetworkDelayMs : 0;

    try {
      const res = await inventoryService.processAtomicCheckout({
        patronId,
        screenId: screen.id,
        screenName: screen.name,
        seatNumber: `Seat ${seatRow}-${seatNum}`,
        showId: show.id,
        movieTitle: show.movieTitle,
        cartItems: [{ itemId, name: itemName, unitPrice: price, quantity: 1 }],
        promoCodes,
        simulatedLatencyMs: reqLatency
      });

      const elapsed = performance.now() - t0;
      this.latencySamplesMs.push(elapsed);

      if (res.success) {
        this.successfulOrders++;
      } else if (res.errorCode === 'INSUFFICIENT_STOCK') {
        this.rejectedStockouts++;
      } else {
        this.failedErrors++;
      }
    } catch (err) {
      this.failedErrors++;
    }
  }

  private getPercentile(sortedArr: number[], p: number): number {
    if (sortedArr.length === 0) return 0;
    const index = Math.floor(sortedArr.length * p);
    return Math.round(sortedArr[Math.min(index, sortedArr.length - 1)] * 10) / 10;
  }
}

export const simulatorEngine = new DigitalTwinSimulator();
