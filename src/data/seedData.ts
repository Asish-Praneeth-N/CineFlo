import { MenuItem, Screen, Show, Offer, InventoryItem } from '../types';

export const INITIAL_SCREENS: Screen[] = [
  { id: 'screen-1', name: 'Screen 1 (IMAX 3D AUDI 1)', totalSeats: 350 },
  { id: 'screen-2', name: 'Screen 2 (Dolby Atmos AUDI 2)', totalSeats: 280 },
  { id: 'screen-3', name: 'Screen 3 (4DX AUDI 3)', totalSeats: 220 },
  { id: 'screen-4', name: 'Screen 4 (Gold Class AUDI 4)', totalSeats: 150 },
];

export const INITIAL_SHOWS: Show[] = [
  {
    id: 'show-101',
    screenId: 'screen-1',
    movieTitle: 'Kalki 2898 AD (IMAX 3D)',
    showtime: '19:00',
    intermissionTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    isIntermissionActive: true
  },
  {
    id: 'show-102',
    screenId: 'screen-2',
    movieTitle: 'Pushpa 2: The Rule (Dolby Atmos)',
    showtime: '19:30',
    intermissionTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    isIntermissionActive: false
  },
  {
    id: 'show-103',
    screenId: 'screen-3',
    movieTitle: 'Jawan: Extended Cut',
    showtime: '20:00',
    intermissionTime: new Date(Date.now() + 75 * 60 * 1000).toISOString(),
    isIntermissionActive: false
  }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item-popcorn-xl',
    name: 'Butter Cheese Gourmet Popcorn (XL Tub)',
    category: 'Popcorn',
    price: 390,
    description: 'Crispy warm oversized popcorn tossed in rich Amul butter and spiced cheddar cheese seasoning.',
    imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80',
    calories: 780,
    isPopular: true
  },
  {
    id: 'item-combo-royal',
    name: 'Blockbuster Intermission Mega Combo',
    category: 'Combos',
    price: 690,
    description: '1 XL Butter Popcorn + 2 Large Fountain Sodas + 1 Portion Loaded Paneer Tikka Nachos.',
    imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=600&q=80',
    calories: 1450,
    isPopular: true
  },
  {
    id: 'item-chai-samosa',
    name: 'Desi Masala Chai & Samosa Combo',
    category: 'Combos',
    price: 240,
    description: '2 Crispy Punjabi Potato Samosas served with hot fragrant ginger cardamom tea.',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    calories: 480,
    isPopular: true
  },
  {
    id: 'item-nachos-paneer',
    name: 'Loaded Paneer Tikka Queso Nachos',
    category: 'Hot Food',
    price: 320,
    description: 'Stone-ground tortilla chips topped with charred paneer tikka, jalapeños & hot cheese sauce.',
    imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80',
    calories: 690,
    isPopular: true
  },
  {
    id: 'item-popcorn-salted',
    name: 'Classic Salted Butter Popcorn (Large)',
    category: 'Popcorn',
    price: 290,
    description: 'Traditional theater salted popcorn popped fresh with golden butter.',
    imageUrl: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=600&q=80',
    calories: 540,
    isPopular: false
  },
  {
    id: 'item-coffee-slushie',
    name: 'Chilled Masala Cold Coffee Slushie',
    category: 'Beverages',
    price: 190,
    description: 'Thick creamy blended cold espresso slushie topped with dark cocoa powder.',
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
    calories: 290,
    isPopular: false
  },
  {
    id: 'item-mutton-roll',
    name: 'Desi Seekh Kebab Brioche Roll',
    category: 'Hot Food',
    price: 350,
    description: 'Juicy spiced seekh kebab wrapped in a buttery soft brioche roll with mint chutney.',
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
    calories: 560,
    isPopular: false
  },
  {
    id: 'item-gulab-jamun',
    name: 'Warm Shahi Gulab Jamun Sundae (2 Pcs)',
    category: 'Desserts',
    price: 180,
    description: 'Hot melt-in-the-mouth gulab jamuns served over vanilla bean ice cream & pistachio slivers.',
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
    calories: 420,
    isPopular: false
  }
];

export const INITIAL_INVENTORY: Record<string, InventoryItem> = {
  'item-popcorn-xl': {
    itemId: 'item-popcorn-xl',
    availableStock: 30, // High-contention stock cap for Popcorn XL
    reservedStock: 0,
    totalAllocated: 30,
    version: 1,
    lastUpdated: new Date().toISOString()
  },
  'item-combo-royal': {
    itemId: 'item-combo-royal',
    availableStock: 25,
    reservedStock: 0,
    totalAllocated: 25,
    version: 1,
    lastUpdated: new Date().toISOString()
  },
  'item-chai-samosa': {
    itemId: 'item-chai-samosa',
    availableStock: 50,
    reservedStock: 0,
    totalAllocated: 50,
    version: 1,
    lastUpdated: new Date().toISOString()
  },
  'item-nachos-paneer': {
    itemId: 'item-nachos-paneer',
    availableStock: 20,
    reservedStock: 0,
    totalAllocated: 20,
    version: 1,
    lastUpdated: new Date().toISOString()
  },
  'item-popcorn-salted': {
    itemId: 'item-popcorn-salted',
    availableStock: 60,
    reservedStock: 0,
    totalAllocated: 60,
    version: 1,
    lastUpdated: new Date().toISOString()
  },
  'item-coffee-slushie': {
    itemId: 'item-coffee-slushie',
    availableStock: 100,
    reservedStock: 0,
    totalAllocated: 100,
    version: 1,
    lastUpdated: new Date().toISOString()
  },
  'item-mutton-roll': {
    itemId: 'item-mutton-roll',
    availableStock: 15,
    reservedStock: 0,
    totalAllocated: 15,
    version: 1,
    lastUpdated: new Date().toISOString()
  },
  'item-gulab-jamun': {
    itemId: 'item-gulab-jamun',
    availableStock: 40,
    reservedStock: 0,
    totalAllocated: 40,
    version: 1,
    lastUpdated: new Date().toISOString()
  }
};

export const INITIAL_OFFERS: Offer[] = [
  {
    id: 'offer-intermission-50',
    code: 'INTERMISSION50',
    title: 'Intermission Rush ₹50 Off',
    description: 'Get ₹50 flat discount on orders above ₹300 during movie intermission.',
    discountType: 'fixed',
    discountValue: 50,
    maxRedemptionsTotal: 100,
    currentRedemptionsCount: 24,
    maxRedemptionsPerUser: 1,
    minOrderAmount: 300,
    validFrom: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    isStackable: false,
    isActive: true
  },
  {
    id: 'offer-chai-combo',
    code: 'CHAI20',
    title: '20% Off Samosa & Chai Combo',
    description: 'Save 20% on Desi Masala Chai & Samosa Combos.',
    discountType: 'percentage',
    discountValue: 20,
    maxRedemptionsTotal: 50,
    currentRedemptionsCount: 12,
    maxRedemptionsPerUser: 2,
    minOrderAmount: 200,
    validFrom: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    isStackable: true,
    applicableCategories: ['Combos'],
    isActive: true
  },
  {
    id: 'offer-vip-member',
    code: 'VIPINR100',
    title: 'CineFlo Club ₹100 Off',
    description: 'Exclusive ₹100 discount on snacks for VIP CineFlo Club members.',
    discountType: 'fixed',
    discountValue: 100,
    maxRedemptionsTotal: 1000,
    currentRedemptionsCount: 215,
    maxRedemptionsPerUser: 5,
    minOrderAmount: 400,
    validFrom: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    isStackable: false,
    isActive: true
  }
];
