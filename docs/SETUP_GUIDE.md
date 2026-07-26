# CineFlo Platform Setup & Deployment Guide
**How to set up and run CineFlo on any new laptop or environment with custom environment keys.**

---

This guide walks you step-by-step through setting up, configuring, seeding the database, and running the CineFlo In-Cinema Commerce Platform from scratch on a clean machine or staging server.

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Project Clone & Installation](#2-project-clone--installation)
3. [Environment Configuration (.env)](#3-environment-configuration-env)
4. [Supabase Database & Auth Setup](#4-supabase-database--auth-setup)
   - [Step 4.1: Run Schema & Seed SQL](#step-41-run-schema--seed-sql)
   - [Step 4.2: Create All Test Users via SQL](#step-42-create-all-test-users-via-sql)
   - [Step 4.3: Deploy Atomic Checkout RPC Stored Procedure](#step-43-deploy-atomic-checkout-rpc-stored-procedure)
5. [Running the Application](#5-running-the-application)
6. [Login Credentials & Roles](#6-login-credentials--roles)
7. [Testing the Flows & Features](#7-testing-the-flows--features)

---

## 1. Prerequisites

Before starting, ensure your system has:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Supabase Account**: ([Create Free Account at Supabase.com](https://supabase.com/))
- **Git**: Installed and configured

---

## 2. Project Clone & Installation

1. Open your terminal / PowerShell and navigate to your workspace directory:
   ```bash
   cd path/to/your/workspace
   ```

2. Clone or extract the `cineflo` project folder:
   ```bash
   cd cineflo
   ```

3. Install all Node module dependencies:
   ```bash
   npm install
   ```

---

## 3. Environment Configuration (.env)

Create a `.env` file in the root of the project directory (`cineflo/.env`).

Copy and paste the following template into your `.env` file, replacing the placeholder values with your own Supabase project keys:

```env
# ====================================================================
# CineFlo Environment Configuration
# ====================================================================

# 1. Your Supabase Project URL (e.g. https://xyzcompany.supabase.co)
VITE_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co

# 2. Your Supabase Anon Key (found in Supabase Dashboard → Project Settings → API)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> 💡 **Note**: If `VITE_SUPABASE_URL` is omitted or empty, CineFlo will automatically run in **Offline Sandbox Mode** using local atomic storage so you can test features without a database.

---

## 4. Supabase Database & Auth Setup

To connect to a live Supabase backend, perform the following 3 SQL executions in your **Supabase Dashboard → SQL Editor → New Query**:

### Step 4.1: Run Schema & Seed SQL
Open the file [`supabase/migrations/20260726_seed_all_data.sql`](file:///c:/Users/asish/OneDrive/Desktop/cineflo/supabase/migrations/20260726_seed_all_data.sql), copy all text, paste into Supabase SQL Editor, and click **Run**.

This initializes:
- Tables: `screens`, `menu_items`, `item_inventory`, `offers`, `orders`, `order_items`, `profiles`
- Initial 20 Indian F&B catalog items, stock allocation levels, and promo codes
- Row Level Security (RLS) policies

### Step 4.2: Create All Test Users via SQL
Open the file [`supabase/migrations/create_all_users.sql`](file:///c:/Users/asish/OneDrive/Desktop/cineflo/supabase/migrations/create_all_users.sql), copy all text, paste into Supabase SQL Editor in a new tab, and click **Run**.

This creates pre-confirmed system accounts in `auth.users` & `auth.identities` with pre-hashed passwords:
- **Admin**: `nagavallikamma1979@gmail.com`
- **Kitchen Staff**: `kitchen@cineflo.com`
- **Patron**: `patron@cineflo.com`

### Step 4.3: Deploy Atomic Checkout RPC Stored Procedure
Open the file [`supabase/rpc/checkout_order_atomic.sql`](file:///c:/Users/asish/OneDrive/Desktop/cineflo/supabase/rpc/checkout_order_atomic.sql), copy all text, paste into Supabase SQL Editor in a new tab, and click **Run**.

This deploys the PostgreSQL PL/pgSQL function `checkout_order_atomic` with explicit row-level locking (`FOR UPDATE`) to guarantee **Zero Overselling** under burst load.

---

## 5. Running the Application

### Development Server
Start the local development server:
```bash
npm run dev
```
Open your browser and navigate to: **`http://localhost:3000`** (or the URL printed in the terminal).

### TypeScript Check & Lint
To verify code correctness and types:
```bash
npm run lint
```

### Production Build
To create an optimized production build:
```bash
npm run build
```

---

## 6. Login Credentials & Roles

You can test all user personas with the following pre-configured credentials:

| Persona / Role | Email | Password | Access & Features |
|---|---|---|---|
| 👑 **Cinema Admin** | `nagavallikamma1979@gmail.com` | `Admin@123` | Full access to KDS, Inventory Control, Offers Engine, Analytics, Digital Twin |
| 👨‍🍳 **Kitchen Staff** | `kitchen@cineflo.com` | `Kitchen@123` | Lands directly on Kitchen Display System (KDS) to manage orders |
| 🍿 **Patron (Registered)** | `patron@cineflo.com` | `Patron@123` | Browse menu, select seat, apply promos, test payment, live tracker |
| 👤 **Patron (Guest)** | *No Email needed* | *No Password* | Click **"Continue as Guest Patron"** on login screen |

---

## 7. Testing the Flows & Features

### 1. Guest Patron Flow
1. On `http://localhost:3000`, click **"Continue as Guest Patron"**.
2. Browse the food & beverage menu (prices in ₹ INR).
3. Click **"Select Delivery Seat"** to choose an auditorium seat on the glowing cinema screen map (e.g. `Audi 1 · Seat F-14`).
4. Add items to cart ➔ Click **"View Cart"**.
5. Enter guest name (e.g. `Rahul Sharma`) ➔ Click **"Proceed to Checkout"**.
6. Select test payment method (UPI / Card / Cash) ➔ Click **"Mark Payment Done & Place Order"**.
7. View your order immediately in the **Live Order Status Tracker**.

### 2. Kitchen KDS Flow
1. Log out or open an Incognito window ➔ Sign in as `kitchen@cineflo.com` / `Kitchen@123`.
2. The order placed by the patron appears instantly in the **New Orders** lane.
3. Click **"Start Preparing"** ➔ **"Mark Ready"** ➔ **"Mark Delivered"**.
4. Refresh the page (`F5`) — your Kitchen session and orders remain intact without logging out.

### 3. Order ID Lookup Flow (Cross-Session Guest Tracking)
1. If a guest patron logs out and logs back in under a new session, click **"Track Order by ID"** on the top bar.
2. Type the Order ID (e.g., `ord-849201` or `849201`) or Seat Code (e.g., `Seat F-14`).
3. The order status timeline immediately opens and pins to their live status tracker.

### 4. Admin Inventory & Menu Management
1. Sign in as `nagavallikamma1979@gmail.com` / `Admin@123`.
2. Navigate to **Inventory Control**.
3. Click **"+ Add New Item"** to create a new food item with initial stock.
4. Click the **Pencil (Edit)** icon on any row to edit name, category, price in ₹ INR, description, calories, or stock levels.
5. Click **"Sold Out / Restock"** to toggle immediate item availability across all patron devices.

### 5. Digital Twin Load Simulator
1. Sign in as Admin ➔ Navigate to **Digital Twin**.
2. Click **"Launch Load Simulator"** or select a What-If scenario (e.g. *Popcorn Flash Stockout*).
3. Observe real-time synthetic throughput, p95 latency, stock sync lag, and verify **0 Oversell Events**.
