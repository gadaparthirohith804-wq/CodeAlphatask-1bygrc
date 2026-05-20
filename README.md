# 🌐 Aetheria - Premium Indian E-Commerce Platform

A high-performance, full-stack, cyberpunk-themed Indian e-commerce application designed with a premium user experience in the style of Amazon and Flipkart. Features real Indian products, local currency (INR), a multi-language switcher, complex refinements, and interactive delivery tracking.

---

## 🚀 Key Features

*   **🇮🇳 Fully Localized Experience**: Standard Indian Rupee (`₹`) pricing formatted using `toLocaleString('en-IN')` with real products sold in India (i.e. iPhone 15 Pro, Galaxy S24 Ultra, Air Jordans, DJI Drones, etc.).
*   **🗣️ Amazon-Style Language Switcher**: Dynamically toggle the entire user interface language between:
    *   English (EN)
    *   Hindi (HI - हिन्दी)
    *   Telugu (TE - తెలుగు)
    *   Tamil (TA - தமிழ்)
    *   Kannada (KN - ಕನ್ನಡ)
*   **🔍 Amazon/Flipkart Refinements & Search**:
    *   Auto-suggest categories search ribbon.
    *   Sidebar filters: Category nodes, Price budget inputs (under 5K, 5K-20K, etc.), Dynamic brands checkboxes, Star rating filters, and Flipkart-like "Assured" badge toggles.
    *   Active filter summary pills (click-to-dismiss) synchronized instantly with browser URL parameters (`useSearchParams`).
*   **📦 Interactive Variation Engine**: Product pages allow selecting configurations (e.g., Colors, Storage, Sizes). Modifying variants applies a visual CSS hue-shift filter on the product image and recalculates prices dynamically.
*   **🛒 Shopping Cart & Secure Checkout**: Cart state syncs with local user authentication, supporting UPI payments, Credit Cards, and Cash on Delivery (COD).
*   **📍 Dynamic Address Geolocation**: Detects the logged-in user's address/PIN code to render an active location-picker widget in the header.
*   **📍 Real-Time Order Tracking**: Follows ordered items with simulated tracking progress: Placed ➔ Packed ➔ Shipped ➔ Out for Delivery ➔ Delivered (includes active shipping coordinates and simulated weather delays).

---

## 🛠️ Tech Stack

### Frontend
*   **Core**: React 18, TypeScript, Vite
*   **Styling**: TailwindCSS, CSS Variables
*   **Animations**: Framer Motion (smooth, state-driven animations)
*   **Routing**: React Router DOM (v6)

### Backend & Database
*   **Server**: Node.js, Express
*   **Database**: MySQL (uses high-concurrency connection pools)
*   **Migration**: Automated seed script using `mysql2/promise`

---

## ⚙️ Configuration & Setup

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16 or higher)
*   [MySQL Server](https://www.mysql.com/) running locally or remotely

### 1. Database Configuration
Create a `.env` file in the root directory (or update the existing one) with your MySQL credentials:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=aetheria_db
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

### 2. Database Migration & Seeding
Populate the database tables and seed them with the updated products, reviews, and test users:
```bash
# Run the seed migration script in the root directory
node migrate.js
```

---

## 🏃 Run the Application

You can launch both the backend server and frontend development environments in one of two ways:

### Method A: One-Click Startup (Windows)
Double-click the `start-web.bat` file in the root directory. It automatically installs dependencies and starts both servers.

### Method B: Manual Startup
1.  **Start the Backend API Server:**
    ```bash
    # From the root directory:
    npm install
    npm start
    ```
    *The API will run at `http://localhost:3000`*

2.  **Start the Frontend Client:**
    ```bash
    # Open a new terminal window and navigate to the frontend directory:
    cd frontend
    npm install
    npm run dev
    ```
    *The frontend will run at `http://localhost:5173`*

---

## 📁 Repository Structure

```text
├── frontend/                 # React client application (Vite + TypeScript)
│   ├── src/
│   │   ├── components/       # Header, Footer, ProductCard, PageTransition
│   │   ├── contexts/         # Auth, Cart, and Language context states
│   │   ├── pages/            # Home, Catalog, Details, Cart, Checkout, Profile
│   │   ├── App.tsx           # Application routers & providers
│   │   └── main.tsx          # Client entrypoint
│   └── vite.config.ts        # Vite configuration (includes /images proxies)
├── public/                   # Public asset folders
│   └── images/products/      # Product webp image database
├── db.js                     # MySQL Database connection wrapper
├── db.json                   # Product seed database
├── migrate.js                # Schema and Seeding migration script
├── server.js                 # Express server API endpoints
└── start-web.bat             # Batch run script
```
