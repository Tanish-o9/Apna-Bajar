# ApniCart — Mini E-Commerce Platform

> **Clean Baseline Architecture for College-Level Bug-Hunting Competition**

ApniCart is a full-stack, responsive mini e-commerce web application engineered with a clean **React (Vite)** frontend and an MVC **Node.js / Express / MongoDB** backend.

---

## 🌟 Key Features & Highlights

- **5 Dedicated Pages**:
  1. `Home Page (/)`: Engaging hero banner with CTA, value propositions, category navigation, promotional discount banner, and live backend-driven featured products.
  2. `Products Page (/products)`: Dynamic product grid with search filtering, category selection pills, price sorting (Low to High / High to Low), stock status badges, and instant cart addition.
  3. `Shopping Cart Page (/cart)`: Interactive cart manager with quantity steppers (+/- bounded by actual inventory), item deletion, free delivery threshold meter, immediate subtotal/total calculations, and localStorage persistence.
  4. `Checkout Page (/checkout)`: Streamlined order form with strict client-side & server-side regex validations (Name, Email, 10-digit Indian Phone, 6-digit PIN code, City, State), Order Summary preview, and simulated Cash on Delivery (COD).
  5. `My Orders Page (/orders)`: Session-authenticated order history showing order ID, placement timestamp, status badges (`Pending`, `Confirmed`, `Shipped`, `Delivered`), expandable itemized breakdowns, delivery address, and price snapshots.
- **Financial Precision (Paise Storage)**:
  - All monetary values (`price`, `subtotal`, `deliveryCharge`, `totalAmount`) are stored internally as integer **paise** (1 INR = 100 paise) to prevent IEEE 754 floating-point rounding errors.
  - Converted seamlessly to INR currency display (`formatPrice` / virtual getters) on the client and server.
- **Server-Side Price Recalculation & Tamper Resistance**:
  - The backend recalculates all item line totals, subtotals, delivery charges, and final order totals directly from database records, rejecting client-side price tampering.
- **Zero-Configuration MongoDB Fallback**:
  - The application automatically connects to local MongoDB or MongoDB Atlas via `MONGODB_URI`.
  - If a local MongoDB daemon is not detected in development mode, it automatically starts an in-memory database (`mongodb-memory-server`) and auto-seeds the 20 products so developers can test immediately with zero friction.
- **Session-Based Privacy**:
  - Uses an opaque, randomly generated customer session identifier (`demoSessionId`) stored in `localStorage` and verified on the server to isolate demo order histories without requiring complex user authentication.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18+ with Vite
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios (configured with base URL and timeout)
- **Icons**: Lucide React
- **Styling**: Vanilla CSS3 design system (`global.css`, `components.css`) — *No Tailwind CSS, No Redux, No TypeScript*

### Backend
- **Runtime**: Node.js
- **Web Framework**: Express.js (MVC Pattern)
- **Database**: MongoDB with Mongoose ODM
- **Environment**: dotenv, cors
- **Testing**: Jest, Supertest, MongoDB Memory Server

---

## 📂 Project Structure

```text
ApniCart/
│
├── package.json               # Root scripts (install:all, dev:backend, dev:frontend, test, seed, build)
├── .gitignore
├── README.md
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Navigation bar, brand logo, search bar, cart badge, mobile drawer
│   │   │   ├── Footer.jsx      # Brand info, quick links, trust badges, competition notice
│   │   │   ├── ProductCard.jsx # Product card with image, category, price, stock status, add to cart
│   │   │   └── CartItem.jsx    # Cart row with thumbnail, quantity stepper, price snapshot, delete
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Hero, categories, value props, featured products, promo banner
│   │   │   ├── Products.jsx    # Catalog with search, category filtering, price sorting
│   │   │   ├── Cart.jsx        # Cart management, free delivery meter, summary, checkout CTA
│   │   │   ├── Checkout.jsx    # Customer shipping form, validation, order preview, COD placement
│   │   │   └── MyOrders.jsx    # Customer order history, status pills, item details, address
│   │   ├── context/
│   │   │   └── CartContext.jsx # Cart state, localStorage sync, calculations, session ID, toasts
│   │   ├── services/
│   │   │   └── api.js          # Reusable Axios API client and currency formatter
│   │   ├── styles/
│   │   │   ├── global.css      # Design tokens, color system, buttons, badges, toasts
│   │   │   └── components.css  # Component-specific styles and responsive media queries
│   │   ├── App.jsx             # Route definitions and layout wrapper
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── .env.example
│   └── .env
│
└── backend/
    ├── config/
    │   └── db.js               # Mongoose connection with auto in-memory fallback
    ├── models/
    │   ├── Product.js          # Product schema with paise storage and INR virtuals
    │   └── Order.js            # Order schema with line-item price snapshots and address
    ├── controllers/
    │   ├── productController.js# Products, categories, search, filter, and sort handlers
    │   └── orderController.js  # Order creation with stock check, recalculation, and session fetch
    ├── routes/
    │   ├── productRoutes.js    # Routes for /api/products
    │   └── orderRoutes.js      # Routes for /api/orders
    ├── middleware/
    │   └── errorMiddleware.js  # 404 handler and central error formatter
    ├── data/
    │   └── seedProducts.js     # 20 realistic sample products and CLI seed script
    ├── tests/
    │   └── api.test.js         # Automated test suite covering the 10 minimum test cases
    ├── server.js               # Express application entrypoint
    ├── package.json
    ├── .env.example
    └── .env
```

---

## 🗄️ Database Schemas

### 1. Product Schema (`backend/models/Product.js`)
| Field | Type | Description |
|---|---|---|
| `name` | String | Required, trimmed, max 150 chars |
| `description` | String | Required, trimmed, max 1000 chars |
| `price` | Number | Required integer **paise** (e.g. `299900` = ₹2,999.00) |
| `category` | String | Required, indexed (Electronics, Fashion, Accessories, Home Essentials) |
| `image` | String | Direct image URL (Unsplash high-resolution product photos) |
| `stock` | Number | Required integer inventory count (min: 0) |
| `featured` | Boolean | True for highlighted products |
| `createdAt` | Date | Timestamp of record creation |
| *`priceInINR`* | Virtual | Computed `price / 100` |

### 2. Order Schema (`backend/models/Order.js`)
| Field | Type | Description |
|---|---|---|
| `demoSessionId` | String | Required opaque session ID indexed for fast query |
| `customerName` | String | Required, trimmed |
| `email` | String | Validated email address |
| `phone` | String | Validated 10-digit Indian phone starting with 6-9 |
| `shippingAddress` | Object | `{ address, city, state, pincode }` (6-digit PIN code) |
| `items` | Array | Array of `{ productId, productName, quantity, unitPrice, lineTotal }` |
| `subtotal` | Number | Computed subtotal in paise |
| `deliveryCharge` | Number | `0` if subtotal >= 99900 paise, else `4900` paise (₹49) |
| `totalAmount` | Number | `subtotal + deliveryCharge` in paise |
| `orderStatus` | String | Enum: `['Pending', 'Confirmed', 'Shipped', 'Delivered']` (default: `Confirmed`) |
| `createdAt` | Date | Timestamp of order |

---

## 🚀 API Endpoints

| Method | Endpoint | Description | Auth / Headers |
|---|---|---|---|
| `GET` | `/` | API Health Check and documentation overview | Public |
| `GET` | `/api/products` | Fetch all products (supports `?category=`, `?search=`, `?sort=`, `?featured=`) | Public |
| `GET` | `/api/products/:id` | Fetch single product by ID | Public |
| `GET` | `/api/categories` | Fetch list of distinct product categories | Public |
| `POST` | `/api/orders` | Place a new order with stock validation & server price recalculation | `x-demo-session-id` |
| `GET` | `/api/orders` | Fetch orders placed by the current demo customer session | `x-demo-session-id` |
| `GET` | `/api/orders/:id` | Fetch an authorized order by ID | `x-demo-session-id` |

---

## 💻 Installation & Setup Instructions

### Prerequisites
- Node.js (v18+ or v20+ recommended)
- npm (v9+)
- *(Optional)* MongoDB installed locally or a free MongoDB Atlas connection string. If MongoDB is not installed locally, the backend automatically runs with an in-memory database!

### 1. Clone & Install Dependencies
From the project root:
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```
Or install separately:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Configuration
The `.env` files are already pre-configured. If needed, customize:

**Backend (`backend/.env`):**
```ini
PORT=5000
MONGODB_URI=mongodb://localhost:27017/apnicart
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```ini
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Seed Sample Products (Optional)
If running with an external MongoDB instance:
```bash
npm run seed
```
*(If using the built-in development fallback, 20 sample products are seeded automatically on first boot).*

### 4. Running the Application
Open two terminal windows:

**Terminal 1 — Backend API:**
```bash
npm run dev:backend
# Or: cd backend && npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
# Or: cd frontend && npm run dev
# Web application starts on http://localhost:5173
```

Now open **http://localhost:5173** in your web browser.

---

## 🧪 Automated Testing Suite

The project includes automated tests covering all 10 required competition baseline scenarios:

```bash
npm test
# Or: cd backend && npm test
```

### Verified Test Cases:
1. **Product listing API**: `GET /api/products` returns 200 and all products.
2. **Product search and sorting**: Filters by keyword in name/description and sorts price ascending.
3. **Cart quantity updates**: Enforces upper limit based on product stock and prevents quantity < 1.
4. **Cart total calculation**: Computes subtotal, free/paid delivery charge, and grand total.
5. **Invalid checkout input**: Rejects malformed phone, invalid email, and short names with 400 Bad Request.
6. **Successful order creation**: Persists order in database and decrements inventory.
7. **Order total recalculation**: Server overrides client tampering and calculates totals strictly from DB prices.
8. **Order history access restrictions**: Session A cannot view Session B orders (returns 403 Forbidden).
9. **Empty cart checkout prevention**: Checkout with empty items array returns 400 Bad Request.
10. **Invalid product ID handling**: Malformed ObjectId or non-existent product returns 404 Not Found.

All 10 tests run cleanly and pass with a 100% pass rate.


