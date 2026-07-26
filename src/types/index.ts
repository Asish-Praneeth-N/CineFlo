export type UserRole = 'patron' | 'kitchen' | 'admin' | 'simulator';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  favoriteSeat?: string;
  avatarUrl?: string;
  createdAt: string;
}

export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Screen {
  id: string;
  name: string;
  totalSeats: number;
}

export interface Show {
  id: string;
  screenId: string;
  movieTitle: string;
  showtime: string;
  intermissionTime: string;
  isIntermissionActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'Combos' | 'Popcorn' | 'Beverages' | 'Hot Food' | 'Snacks' | 'Desserts';
  price: number;
  description: string;
  imageUrl: string;
  calories?: number;
  isPopular?: boolean;
  isVeg?: boolean;
}

export interface InventoryItem {
  itemId: string;
  availableStock: number;
  reservedStock: number;
  totalAllocated: number;
  version: number;
  lastUpdated: string;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface Offer {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxRedemptionsTotal: number;
  currentRedemptionsCount: number;
  maxRedemptionsPerUser: number;
  minOrderAmount: number;
  validFrom: string;
  validUntil: string;
  isStackable: boolean;
  applicableCategories?: string[];
  isActive: boolean;
}

export interface AppliedOfferResult {
  offer: Offer;
  discountAmount: number;
  discountMessage: string;
}

export interface OrderItem {
  itemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  patronId: string;
  screenId: string;
  screenName: string;
  seatNumber: string;
  showId: string;
  movieTitle: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  totalAmount: number;
  appliedOfferCodes: string[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryTime?: string;
}

// Digital Twin Simulator Types
export interface SimulatorConfig {
  numScreens: number;
  seatsPerScreen: number;
  intermissionWindowMinutes: number;
  concurrencyWorkers: number;
  targetRPS: number;
  stockAllocationLimit: number;
  arrivalCurve: 'intermission_burst' | 'uniform' | 'exponential';
  simulateNetworkLatency: boolean;
  mockNetworkDelayMs: number;
}

export interface TelemetryPoint {
  timestamp: number;
  throughputRps: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  activeQueueDepth: number;
  totalSuccessOrders: number;
  totalStockouts: number;
  oversellEvents: number;
  stockSyncLagMs: number;
  remainingStock: number;
}

export interface SimulationResult {
  totalRequestsSent: number;
  successfulOrders: number;
  rejectedStockouts: number;
  failedErrors: number;
  oversellViolations: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  avgStockSyncLagMs: number;
  peakRps: number;
  durationSeconds: number;
  telemetryHistory: TelemetryPoint[];
}
