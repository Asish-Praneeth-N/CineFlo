# CineFlo · In-Cinema Commerce & Concurrency Engine
**ApexFlo MTS-1 Engineering Assignment · Physical AI, In Production Submission**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald.svg)](https://supabase.com/)
[![Tailwind & Custom CSS](https://img.shields.io/badge/Design-Stripe%2FLinear%20Dark-amber.svg)]()

> **CineFlo** is an enterprise-grade in-cinema food & beverage commerce platform engineered to handle **25,000 concurrent moviegoers** during 3-minute auditorium intermission spikes. Built with an **Atomic PostgreSQL PL/pgSQL RPC locking engine (`checkout_order_atomic`)**, CineFlo guarantees **Zero Overselling (0.00% anomaly)** under severe write contention, sub-10ms stock sync lag to mobile devices, an interactive Kitchen Display System (KDS), and an embedded **Digital Twin Load Simulator**.

---

## 📸 Key Platform Features

### 🍿 1. Stock-Aware Patron Mobile Commerce
- **Live Inventory Catalog**: Real-time Indian F&B catalog (prices in ₹ INR). Sold-out items are disabled instantly across all devices.
- **Glowing Auditorium Seat Picker**: Interactive 3D auditorium seat selection map with curved illuminated cinema screen, seat tier pricing (`Recliner Luxury ₹650`, `Executive Prime ₹380`, `Classic Standard ₹290`), and aisle gap dividers.
- **Guest Patron Support**: Moviegoers can order food immediately without upfront registration. Guest name & seat number are captured at checkout.
- **2-Step Test Payment Verification**: Supports test payment via UPI Instant Pay (GPay/PhonePe/Paytm), Credit/Debit Card, or Pay Cash at Seat.

### 🔍 2. Live Order Status Tracker & Order ID Lookup
- **Real-Time Stage Progression**: Visual timeline tracking order state (`Placed` ➔ `Chef Preparing` ➔ `Out for Seat Delivery` ➔ `Delivered`).
- **Cross-Session Order Lookup**: Guest or registered patrons can search by **Order ID** (e.g. `ord-849201` or `849201`) or **Seat Code** (`Seat F-14`). Tracked orders pin to their live status tracker bar even across browser reloads.

### 👨‍🍳 3. Mission-Control Kitchen Command System (KDS)
- **Kanban Dispatch Board**: Four live order lanes (*New Orders*, *Preparing*, *Ready for Delivery*, *Delivered*).
- **Urgency Alerts & Live Timers**: Visual warning indicators for orders exceeding 3 minutes.
- **Delivery Runner Assignment**: Assigns delivery ushers directly to auditorium seats.

### 🏷️ 4. Inventory Control & Menu Management
- **Slide-Over Item Drawer**: Admin can add or edit catalog items (Name, Category, Price in ₹ INR, Stock allocation level, Calories, Description, Image URL, Veg/Non-Veg status, Popular tag).
- **Atomic Manual Stock Refills**: Instant stock adjustments with version locks (`v1`, `v2`, ...).

### 🧪 5. Digital Twin Load Simulator
- **Synthetic Traffic Generator**: Simulates intermission spikes across multi-screen auditoriums (up to 25k concurrent patrons).
- **Performance Readout**: Real-time graphs for Throughput (RPS), p50/p95/p99 Latency, Stock Sync Lag, and **Zero-Oversell Assertions**.

---

## 🏗️ System Architecture

```
                              ┌─────────────────────────────────────────┐
                              │            PATRON MOBILE WEB            │
                              │ (Stock-Aware Menu, Cart, Order Tracker)  │
                              └────────────────────┬────────────────────┘
                                                   │
                                          HTTP / WebSocket
                                                   │
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CINEFLO FRONTEND SERVICES LAYER                                   │
├────────────────────────────┬────────────────────────────┬───────────────────────────┬────────────────┤
│      InventoryService      │      Ordering Service      │       Offers Engine       │  Digital Twin  │
│ (Stock Management & Edit)  │ (State Machine & KDS View) │  (Deterministic Rules)    │ (Load Engine)  │
└──────────────┬─────────────┴──────────────┬─────────────┴─────────────┬─────────────┴───────┬────────┘
               │                            │                           │                     │
               └────────────────────────────┼───────────────────────────┘                     │
                                            │ (Atomic RPC Execution)                          │
                                            ▼                                                 │
┌─────────────────────────────────────────────────────────────────────────────────────────────┼────────┐
│                                   SUPABASE POSTGRESQL ENGINE                                │        │
│                                                                                             │        │
│  ┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────────┐    │        │
│  │   `menu_items` (TEXT)  │    │  `item_inventory`     │    │      `orders` (TEXT)      │    │        │
│  └───────────────────────┘    │  (FOR UPDATE Locks)   │    └─────────────┬─────────────┘    │        │
│                               └───────────────────────┘                  │                  │        │
│                                           ▲                              ▼                  │        │
│                                           │                     ┌────────────────────────┐  │        │
│                                           │                     │ `order_items` (TEXT)   │  │        │
│                                           │                     └────────────────────────┘  │        │
│                                           │                                                 │        │
│  ┌────────────────────────────────────────┴───────────────────────────────────────────────┐  │        │
│  │  PL/pgSQL Atomic Function: `checkout_order_atomic(p_patron_id, p_cart_items, ...)`       │  │        │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │        │
│                                                                                             │        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │        │
│  │  WebSockets / Supabase Realtime PubSub: Broadcast Stock & Order Changes (sub-10ms lag)   │  │        │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │        │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Zero-Oversell Execution Engine (`checkout_order_atomic.sql`)

Under high concurrency, naive `SELECT` then `UPDATE` queries produce race conditions. CineFlo resolves this by executing checkouts inside an explicit PostgreSQL transaction with **row-level locks**:

```sql
FOR v_item IN
  SELECT (x->>'itemId')::TEXT AS item_id, (x->>'quantity')::INT AS qty
  FROM jsonb_array_elements(p_cart_items) AS x
  ORDER BY (x->>'itemId')::TEXT -- Deterministic order prevents deadlocks
LOOP
  SELECT available_stock INTO v_avail_stock
  FROM item_inventory
  WHERE item_id = v_item.item_id
  FOR UPDATE; -- EXPLICIT ROW LOCK

  IF v_avail_stock IS NULL OR v_avail_stock < v_item.qty THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: Item % is sold out', v_item.item_id;
  END IF;
END LOOP;
```

---

## 🚀 Quick Start Guide

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-org/cineflo.git
cd cineflo
npm install
```

### 2. Environment Variables (.env)
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 3. Run Commands
- **Development Server**:
  ```bash
  npm run dev
  ```
  *App will be running live at `http://localhost:3000`*

- **TypeScript Typecheck**:
  ```bash
  npm run lint
  ```

- **Production Build**:
  ```bash
  npm run build
  ```

---

## 🔑 Login Credentials Matrix

| Persona / Role | Email | Password | Primary Interface |
|---|---|---|---|
| 👑 **Cinema Admin** | `nagavallikamma1979@gmail.com` | `Admin@123` | KDS, Inventory Control, Offers, Analytics, Digital Twin |
| 👨‍🍳 **Kitchen Staff** | `kitchen@cineflo.com` | `Kitchen@123` | Kitchen Command Center (KDS) |
| 🍿 **Patron (Registered)** | `patron@cineflo.com` | `Patron@123` | In-Seat Ordering & Live Tracker |
| 👤 **Patron (Guest)** | *No Email needed* | *No Password* | Click **"Continue as Guest Patron"** |

---

## 📚 Complete Assignment Documentation

Detailed architecture reports and step-by-step setup documentation are available inside the [`docs/`](file:///c:/Users/asish/OneDrive/Desktop/cineflo/docs/) directory:

- 📄 **[`MTS1_System_Design_Doc.md`](file:///c:/Users/asish/OneDrive/Desktop/cineflo/docs/MTS1_System_Design_Doc.md)**: Full System Design Document covering Feature Decomposition, PM Matrix, Service Separation Rationale, 25k Concurrency Walkthrough, and Digital Twin Benchmark Readout.
- 🛠️ **[`SETUP_GUIDE.md`](file:///c:/Users/asish/OneDrive/Desktop/cineflo/docs/SETUP_GUIDE.md)**: Comprehensive guide for database migration execution, Supabase RPC deployment, `.env` key configuration, and multi-persona testing workflows.

---

## 🛡️ License & Engineering Ownership

Developed for the **ApexFlo MTS-1 Engineering Assignment**. Designed and built with strict attention to service separation, concurrency safety, and state persistence.
"# CineFlo" 
