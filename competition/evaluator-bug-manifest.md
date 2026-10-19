# ApniCart Bug-Hunting Competition — Evaluator Bug Manifest
> **Confidential Document for Competition Evaluators and Judges**  
> **Platform:** ApniCart Mini E-Commerce Platform  
> **Target Branch:** `competition/bug-injection`  
> **Clean Baseline Branch:** `main` (Commit `4123b3c`)  
> **Total Injected Bugs:** 16 Bugs (8 Frontend + 8 Backend)  
> **Maximum Score:** 160 Points (10 Points per Bug)

---

## Competition Scoring Rubric (Per Bug)

| Evaluation Criterion | Points Allocated | Description |
| :--- | :---: | :--- |
| **Bug Reproduction** | 1 pt | Participant reproduces the bug with clear input steps in browser or API client. |
| **Root Cause Identification** | 2 pts | Participant correctly pinpoints the exact file, line number, and faulty logic. |
| **Correct Implementation** | 3 pts | Participant writes the correct fix without introducing regressions. |
| **Regression Test** | 2 pts | Participant adds or runs a regression test proving the fix works. |
| **Technical Explanation** | 2 pts | Participant explains why the original code failed and why the fix resolves it. |
| **Total per Bug** | **10 pts** | **16 bugs × 10 points = 160 maximum score** |

---

# PART 1: FRONTEND BUGS (F1 – F8)

---

### Bug F1: Product Search Exact-Match Restriction
- **Bug ID:** `F1`
- **Feature:** Product Search
- **Affected File:** `frontend/src/pages/Products.jsx`
- **Component/Function:** `Products` component (`loadProducts` effect)
- **Difficulty:** Medium (200 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// frontend/src/pages/Products.jsx (inside loadProducts)
const matchedProducts = searchParam.trim()
  ? res.data.filter((p) => p.name.toLowerCase() === searchParam.trim().toLowerCase())
  : res.data;
setProducts(matchedProducts);
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Searching for `"headphone"` or `"smartwatch"` returns any product whose name or description contains that keyword (e.g., *"SoundBeat Wireless ANC Headphones"*).
- **Actual:** Searching for `"headphone"` returns 0 results (`"No Products Found"`). Only typing the 100% exact full title in its entirety matches.

#### 3. Reproduction Steps
1. Navigate to `http://localhost:5173/products` (or live products URL).
2. Type `"watch"` or `"headphone"` into the search bar and press Enter.
3. Observe that the UI displays `"No Products Found"`.

#### 4. Example Inputs & Outputs
- **Input:** Search query: `"headphones"`
- **Expected Output:** 1 product returned (*SoundBeat Wireless ANC Headphones*).
- **Actual Output:** 0 products returned.

#### 5. Root Cause
The filter comparator uses strict equality `p.name.toLowerCase() === searchParam.trim().toLowerCase()` instead of substring inclusion `.includes(...)`.

#### 6. Corrected Code Snippet
```javascript
// frontend/src/pages/Products.jsx
const matchedProducts = searchParam.trim()
  ? res.data.filter((p) => 
      p.name.toLowerCase().includes(searchParam.trim().toLowerCase()) ||
      p.description.toLowerCase().includes(searchParam.trim().toLowerCase())
    )
  : res.data;
setProducts(matchedProducts);
```

#### 7. Fix Explanation
Replacing strict equality `===` with `.includes()` allows partial substring matches across both product name and product description.

#### 8. Regression Test
```javascript
test('F1: Product search should match substrings case-insensitively', () => {
  const products = [
    { name: 'SoundBeat Wireless ANC Headphones', description: 'Noise cancelling' },
    { name: 'Ergonomic Mouse', description: 'Wireless optical mouse' }
  ];
  const query = 'headphones';
  const filtered = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  expect(filtered.length).toBe(1);
  expect(filtered[0].name).toContain('Headphones');
});
```

---

### Bug F2: Inverted Category Filter Exclusion
- **Bug ID:** `F2`
- **Feature:** Category Filter
- **Affected File:** `frontend/src/pages/Products.jsx`
- **Component/Function:** `Products` component (`loadProducts` effect)
- **Difficulty:** Easy (100 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// frontend/src/pages/Products.jsx (inside loadProducts)
const categoryFiltered = categoryParam && categoryParam !== 'All'
  ? matchedProducts.filter((p) => p.category !== categoryParam)
  : matchedProducts;
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Clicking the "Electronics" category pill displays only Electronics products.
- **Actual:** Clicking "Electronics" filters out all Electronics and displays only Fashion, Accessories, and Home Essentials.

#### 3. Reproduction Steps
1. Open the Products catalog page.
2. Click on the `"Electronics"` category pill.
3. Inspect the displayed products: none of them are Electronics; only clothing and home items appear.

#### 4. Example Inputs & Outputs
- **Input:** Selected Category: `"Electronics"`
- **Expected Output:** 4 Electronics items displayed (*Headphones, Smartwatch, Mouse, Keyboard*).
- **Actual Output:** 16 non-Electronics items displayed.

#### 5. Root Cause
The filter condition inverts category matching with inequality `p.category !== categoryParam` instead of equality `p.category === categoryParam`.

#### 6. Corrected Code Snippet
```javascript
// frontend/src/pages/Products.jsx
const categoryFiltered = categoryParam && categoryParam !== 'All'
  ? matchedProducts.filter((p) => p.category === categoryParam)
  : matchedProducts;
```

#### 7. Fix Explanation
Changing `!==` to `===` ensures that only products belonging to the selected category are retained.

#### 8. Regression Test
```javascript
test('F2: Category filter should retain matching category items', () => {
  const items = [
    { name: 'Headphones', category: 'Electronics' },
    { name: 'T-Shirt', category: 'Fashion' }
  ];
  const selectedCat = 'Electronics';
  const result = items.filter(p => p.category === selectedCat);
  expect(result.length).toBe(1);
  expect(result[0].category).toBe('Electronics');
});
```

---

### Bug F3: Lexicographical String Sorting on Numeric Prices
- **Bug ID:** `F3`
- **Feature:** Product Sorting
- **Affected File:** `frontend/src/pages/Products.jsx`
- **Component/Function:** `Products` component (`loadProducts` sort)
- **Difficulty:** Medium (200 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// frontend/src/pages/Products.jsx (inside loadProducts)
const sortedResults = [...categoryFiltered].sort((a, b) => {
  if (sortParam === 'price_asc' || sortParam === 'low_to_high') {
    return String(a.price).localeCompare(String(b.price));
  }
  if (sortParam === 'price_desc' || sortParam === 'high_to_low') {
    return String(b.price).localeCompare(String(a.price));
  }
  return 0;
});
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Selecting "Price: Low to High" sorts products numerically from lowest price to highest price.
- **Actual:** Selecting "Price: Low to High" sorts numbers alphabetically as strings (e.g., ₹14,999 with value `1499900` sorts before ₹2,999 with value `299900` because character `'1' < '2'`).

#### 3. Reproduction Steps
1. Navigate to the Products page.
2. Select `"Price: Low to High"` from the Sort dropdown.
3. Observe that items starting with digit `1` appear before items starting with digit `2`, regardless of total magnitude.

#### 4. Example Inputs & Outputs
- **Input:** Prices: `[299900, 79900, 1499900]`
- **Expected Output:** `[79900, 299900, 1499900]` (₹799, ₹2,999, ₹14,999)
- **Actual Output:** `[1499900, 299900, 79900]` (alphabetical)

#### 5. Root Cause
`String(a.price).localeCompare(String(b.price))` converts numeric paise values to strings and compares them character by character instead of mathematically subtracting.

#### 6. Corrected Code Snippet
```javascript
// frontend/src/pages/Products.jsx
const sortedResults = [...categoryFiltered].sort((a, b) => {
  if (sortParam === 'price_asc' || sortParam === 'low_to_high') {
    return a.price - b.price;
  }
  if (sortParam === 'price_desc' || sortParam === 'high_to_low') {
    return b.price - a.price;
  }
  return 0;
});
```

#### 7. Fix Explanation
Use numeric subtraction `a.price - b.price` for ascending and `b.price - a.price` for descending numerical sorting.

#### 8. Regression Test
```javascript
test('F3: Price ascending should sort numerically rather than lexicographically', () => {
  const items = [{ price: 299900 }, { price: 79900 }, { price: 1499900 }];
  items.sort((a, b) => a.price - b.price);
  expect(items[0].price).toBe(79900);
  expect(items[1].price).toBe(299900);
  expect(items[2].price).toBe(1499900);
});
```

---

### Bug F4: Cart Subtotal Calculation Ignores Quantity
- **Bug ID:** `F4`
- **Feature:** Cart Total
- **Affected File:** `frontend/src/context/CartContext.jsx`
- **Component/Function:** `CartProvider` (`subtotal` computation)
- **Difficulty:** Easy (100 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// frontend/src/context/CartContext.jsx
// BUG F4 (Cart Total): Subtotal accumulator ignores quantity multiplication
const subtotal = cart.reduce(
  (total, item) => total + (item.product.price || 0),
  0
);
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Increasing an item's quantity in the cart from 1 to 3 triples that line's contribution to the subtotal.
- **Actual:** Increasing quantity from 1 to 3 leaves the subtotal completely unchanged because `item.quantity` is omitted from the accumulator.

#### 3. Reproduction Steps
1. Add a single product (e.g. ₹2,999) to the cart.
2. Open the Cart page (`/cart`). Subtotal is ₹2,999.
3. Click the `+` button to increase quantity to 3.
4. Quantity changes to 3, but Subtotal and Total remain stuck at ₹2,999.

#### 4. Example Inputs & Outputs
- **Input:** 1 item of ₹2,999 with `quantity: 3`
- **Expected Output:** Subtotal: ₹8,997 (899700 paise)
- **Actual Output:** Subtotal: ₹2,999 (299900 paise)

#### 5. Root Cause
In `cart.reduce`, `(item.product.price || 0)` is added directly without multiplying by `item.quantity`.

#### 6. Corrected Code Snippet
```javascript
// frontend/src/context/CartContext.jsx
const subtotal = cart.reduce(
  (total, item) => total + (item.product.price || 0) * item.quantity,
  0
);
```

#### 7. Fix Explanation
Multiply unit price by item quantity `(item.product.price || 0) * item.quantity` within the reduction function.

#### 8. Regression Test
```javascript
test('F4: Subtotal should reflect item quantities multiplied by unit prices', () => {
  const cart = [
    { product: { price: 299900 }, quantity: 3 },
    { product: { price: 79900 }, quantity: 2 }
  ];
  const subtotal = cart.reduce((tot, item) => tot + item.product.price * item.quantity, 0);
  expect(subtotal).toBe(299900 * 3 + 79900 * 2);
});
```

---

### Bug F5: Duplicate Cart Entries on Existing Product Addition
- **Bug ID:** `F5`
- **Feature:** Duplicate Cart Items
- **Affected File:** `frontend/src/context/CartContext.jsx`
- **Component/Function:** `addToCart`
- **Difficulty:** Medium (200 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// frontend/src/context/CartContext.jsx (inside addToCart)
setCart((prevCart) => {
  // BUG F5: Compares item.id instead of item.product._id; item.id is undefined, causing findIndex to always return -1
  const existingIndex = prevCart.findIndex((item) => item.id === product._id);
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Clicking "Add to Cart" on a product already in the cart increments its quantity on the existing entry.
- **Actual:** Clicking "Add to Cart" creates a duplicate row for the same product, resulting in multiple identical entries in the cart.

#### 3. Reproduction Steps
1. Navigate to the Products page.
2. Click "Add to Cart" on *PulseFit Pro Smartwatch*.
3. Click "Add to Cart" again on the same item.
4. Navigate to `/cart`: observe two separate card entries for *PulseFit Pro Smartwatch* instead of one entry with quantity 2.

#### 4. Example Inputs & Outputs
- **Input:** Add product `6ad652cb662f2cc5dcff4db2` twice.
- **Expected Output:** `cart = [{ product: {...}, quantity: 2 }]` (1 unique item).
- **Actual Output:** `cart = [{ product: {...}, quantity: 1 }, { product: {...}, quantity: 1 }]` (2 duplicate entries).

#### 5. Root Cause
`prevCart` elements are structured as `{ product, quantity }`. Accessing `item.id` evaluates to `undefined`, so `undefined === product._id` is always false, forcing `findIndex` to return `-1`.

#### 6. Corrected Code Snippet
```javascript
// frontend/src/context/CartContext.jsx
const existingIndex = prevCart.findIndex((item) => item.product._id === product._id);
```

#### 7. Fix Explanation
Access the nested identifier `item.product._id` to match the target `product._id`.

#### 8. Regression Test
```javascript
test('F5: Adding existing product to cart should update quantity, not duplicate', () => {
  const prevCart = [{ product: { _id: 'prod123', name: 'Item A', stock: 10 }, quantity: 1 }];
  const newProduct = { _id: 'prod123', name: 'Item A', stock: 10 };
  const idx = prevCart.findIndex(item => item.product._id === newProduct._id);
  expect(idx).toBe(0);
});
```

---

### Bug F6: Cart State Cleared on Page Refresh (Storage Key Mismatch)
- **Bug ID:** `F6`
- **Feature:** Cart Persistence
- **Affected File:** `frontend/src/context/CartContext.jsx`
- **Component/Function:** `CartProvider` (`cart` state initializer)
- **Difficulty:** Easy (100 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// frontend/src/context/CartContext.jsx
const [cart, setCart] = useState(() => {
  try {
    // BUG F6 (Cart Persistence): Reads from mismatched storage key 'cart' instead of CART_STORAGE_KEY ('apnicart_cart')
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to parse cart from localStorage', e);
    return [];
  }
});
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Items added to the cart remain preserved when the page is reloaded.
- **Actual:** Cart becomes completely empty upon reloading the page.

#### 3. Reproduction Steps
1. Add any product to the cart.
2. Verify the cart badge displays `1`.
3. Press `F5` / Ctrl+R to reload the browser.
4. Cart badge resets to `0` and `/cart` shows "Your Shopping Cart is Empty".

#### 4. Example Inputs & Outputs
- **Input:** Cart saved under `localStorage.getItem('apnicart_cart')`.
- **Expected Output:** Cart restored with previously added items.
- **Actual Output:** `localStorage.getItem('cart')` returns `null`, initializing state to `[]`.

#### 5. Root Cause
The sync effect saves to `CART_STORAGE_KEY` (`'apnicart_cart'`), but the initial state reads from `'cart'`.

#### 6. Corrected Code Snippet
```javascript
// frontend/src/context/CartContext.jsx
const stored = localStorage.getItem(CART_STORAGE_KEY);
return stored ? JSON.parse(stored) : [];
```

#### 7. Fix Explanation
Replace the hardcoded `'cart'` string with the defined constant `CART_STORAGE_KEY`.

#### 8. Regression Test
```javascript
test('F6: Cart initializer should read from CART_STORAGE_KEY', () => {
  const CART_STORAGE_KEY = 'apnicart_cart';
  const mockStorage = { 'apnicart_cart': JSON.stringify([{ product: { _id: '1' }, quantity: 1 }]) };
  const loaded = JSON.parse(mockStorage[CART_STORAGE_KEY]);
  expect(loaded.length).toBe(1);
});
```

---

### Bug F7: Checkout Validation Bypassed for Empty / Incomplete Forms
- **Bug ID:** `F7`
- **Feature:** Checkout Validation
- **Affected File:** `frontend/src/pages/Checkout.jsx`
- **Component/Function:** `validate`
- **Difficulty:** Medium (200 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// frontend/src/pages/Checkout.jsx (inside validate)
setErrors(errs);
// BUG F7 (Checkout Validation): Return condition uses >= 0 instead of === 0, always evaluating to true
return Object.keys(errs).length >= 0;
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Clicking "Confirm & Place Order" with empty name, address, or phone number stops submission and displays red field validation warnings.
- **Actual:** Clicking "Confirm & Place Order" with completely blank fields bypasses validation and sends an invalid payload to the server.

#### 3. Reproduction Steps
1. Add an item to cart and click "Proceed to Checkout".
2. Leave all fields (Full Name, Phone Number, Delivery Address, PIN Code) blank.
3. Click "Confirm & Place Order".
4. The frontend sends the empty form data to the backend.

#### 4. Example Inputs & Outputs
- **Input:** Empty checkout form: `{ customerName: '', phone: '', address: '' }`
- **Expected Output:** `validate()` returns `false`, preventing submission.
- **Actual Output:** `validate()` returns `true`, attempting order creation.

#### 5. Root Cause
`Object.keys(errs).length >= 0` is a tautology (array length is always non-negative). It evaluates to `true` even when there are multiple errors.

#### 6. Corrected Code Snippet
```javascript
// frontend/src/pages/Checkout.jsx
setErrors(errs);
return Object.keys(errs).length === 0;
```

#### 7. Fix Explanation
Change `>= 0` to `=== 0` so `validate()` returns `true` only when the error object contains zero keys.

#### 8. Regression Test
```javascript
test('F7: Validation should return false when error keys exist', () => {
  const errs = { customerName: 'Name is required', phone: 'Invalid phone' };
  const isValid = Object.keys(errs).length === 0;
  expect(isValid).toBe(false);
});
```

---

### Bug F8: My Orders Page Fails to Render (Payload Property Mismatch)
- **Bug ID:** `F8`
- **Feature:** My Orders
- **Affected File:** `frontend/src/pages/MyOrders.jsx`
- **Component/Function:** `MyOrders` component (`loadOrders` effect)
- **Difficulty:** Easy (100 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// frontend/src/pages/MyOrders.jsx (inside loadOrders)
const res = await fetchOrdersApi(demoSessionId);
if (isMounted) {
  // BUG F8 (My Orders): Expects res.orders instead of res.data, causing orders state to remain empty
  if (res && res.orders) {
    setOrders(res.orders);
    if (res.orders.length > 0) {
      setExpandedOrders({ [res.orders[0]._id]: true });
    }
  }
}
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Successfully placed orders appear in the order history timeline on `/orders`.
- **Actual:** `/orders` constantly displays "No Orders Placed Yet", even when orders exist in the backend.

#### 3. Reproduction Steps
1. Place a successful order on checkout.
2. Navigate to "My Orders" (`/orders`).
3. Notice that the page displays "No Orders Placed Yet" and network tab shows HTTP 200 with `{ success: true, count: 1, data: [...] }`.

#### 4. Example Inputs & Outputs
- **Input:** Server response: `{ success: true, count: 1, data: [{ _id: 'ord1', totalAmount: 299900 }] }`
- **Expected Output:** Orders state set to `[ { _id: 'ord1', ... } ]`.
- **Actual Output:** Orders state remains `[]`.

#### 5. Root Cause
The backend API returns orders in `res.data`, but the component looks for `res.orders` (which is `undefined`).

#### 6. Corrected Code Snippet
```javascript
// frontend/src/pages/MyOrders.jsx
if (res && res.data) {
  setOrders(res.data);
  if (res.data.length > 0) {
    setExpandedOrders({ [res.data[0]._id]: true });
  }
}
```

#### 7. Fix Explanation
Access the correct payload key `res.data` sent by Express `res.status(200).json({ success: true, data: orders })`.

#### 8. Regression Test
```javascript
test('F8: Orders extractor should extract array from res.data', () => {
  const apiResponse = { success: true, count: 2, data: [{ id: 1 }, { id: 2 }] };
  const extracted = apiResponse.data || [];
  expect(extracted.length).toBe(2);
});
```

---

# PART 2: BACKEND BUGS (B1 – B8)

---

### Bug B1: Category Filter Inversion with `$ne`
- **Bug ID:** `B1`
- **Feature:** Products API
- **Affected File:** `backend/controllers/productController.js`
- **Component/Function:** `getProducts`
- **Difficulty:** Easy (100 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// backend/controllers/productController.js (inside getProducts)
// Filter by Category
if (category && category !== 'All') {
  // BUG B1 (Products API): Inverts category filter with $ne, returning all categories EXCEPT the requested one
  filter.category = { $ne: category.trim() };
}
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Calling `GET /api/products?category=Electronics` returns only products where `category` matches Electronics.
- **Actual:** Calling `GET /api/products?category=Electronics` returns only products where `category` is NOT Electronics.

#### 3. Reproduction Steps
1. Execute `curl -s http://localhost:5000/api/products?category=Electronics` in terminal.
2. Inspect the returned products: all items have category `"Fashion"`, `"Accessories"`, or `"Home Essentials"`. Zero electronics are returned.

#### 4. Example Inputs & Outputs
- **Input:** `GET /api/products?category=Electronics`
- **Expected Output:** 4 items returned, all with `category: "Electronics"`.
- **Actual Output:** 16 items returned, none with `category: "Electronics"`.

#### 5. Root Cause
The query uses MongoDB operator `$ne` (not equal) instead of matching the string.

#### 6. Corrected Code Snippet
```javascript
// backend/controllers/productController.js
if (category && category !== 'All') {
  filter.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
}
```

#### 7. Fix Explanation
Use a case-insensitive regex or exact string match to filter products belonging to the specified category.

#### 8. Regression Test
```javascript
test('B1: GET /api/products?category=Electronics should return only Electronics', async () => {
  const res = await request(app).get('/api/products?category=Electronics');
  expect(res.status).toBe(200);
  expect(res.body.data.every(p => p.category === 'Electronics')).toBe(true);
});
```

---

### Bug B2: Duplicate Category Entries in Categories API
- **Bug ID:** `B2`
- **Feature:** Categories API
- **Affected File:** `backend/controllers/productController.js`
- **Component/Function:** `getCategories`
- **Difficulty:** Easy (100 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// backend/controllers/productController.js (inside getCategories)
const getCategories = async (req, res, next) => {
  try {
    // BUG B2 (Categories API): Maps non-distinct categories across all product records, returning duplicate entries
    const products = await Product.find({}, 'category');
    const categories = products.map((p) => p.category);
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Calling `GET /api/categories` returns a unique set of 4 categories: `['Accessories', 'Electronics', 'Fashion', 'Home Essentials']`.
- **Actual:** Calling `GET /api/categories` returns 20 category entries with repeated duplicates (e.g. `['Electronics', 'Electronics', 'Electronics', ...]`).

#### 3. Reproduction Steps
1. Execute `curl -s http://localhost:5000/api/categories`.
2. Inspect the `data` array: observe multiple identical string occurrences.

#### 4. Example Inputs & Outputs
- **Input:** `GET /api/categories`
- **Expected Output:** `{ count: 4, data: ['Accessories', 'Electronics', 'Fashion', 'Home Essentials'] }`
- **Actual Output:** `{ count: 20, data: ['Electronics', 'Electronics', 'Electronics', 'Fashion', ...] }`

#### 5. Root Cause
The controller queries all product records and maps categories without using `distinct()` or `Set`.

#### 6. Corrected Code Snippet
```javascript
// backend/controllers/productController.js
const categories = await Product.distinct('category');
res.status(200).json({
  success: true,
  count: categories.length,
  data: categories,
});
```

#### 7. Fix Explanation
Use Mongoose's built-in `Product.distinct('category')` method to fetch only unique category values.

#### 8. Regression Test
```javascript
test('B2: GET /api/categories should return only distinct unique categories', async () => {
  const res = await request(app).get('/api/categories');
  expect(res.status).toBe(200);
  const uniqueCount = new Set(res.body.data).size;
  expect(res.body.data.length).toBe(uniqueCount);
});
```

---

### Bug B3: Invalid ObjectId Produces HTTP 500 Instead of HTTP 404
- **Bug ID:** `B3`
- **Feature:** Product ID Validation
- **Affected Files:** `backend/controllers/productController.js`, `backend/middleware/errorMiddleware.js`
- **Component/Function:** `getProductById` & `errorHandler`
- **Difficulty:** Medium (200 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// backend/controllers/productController.js (inside getProductById)
// BUG B3 (Product ID Validation): Omitted mongoose.Types.ObjectId.isValid check
// if (!mongoose.Types.ObjectId.isValid(id)) { ... }
const product = await Product.findById(id);

// backend/middleware/errorMiddleware.js (inside errorHandler)
// BUG B3: Inappropriate 500 Internal Server Error returned for CastError
if (err.name === 'CastError' && err.kind === 'ObjectId') {
  statusCode = 500;
  message = `Internal server database error processing id of ${err.value}`;
}
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Calling `GET /api/products/non-existent-id` returns a client error `404 Not Found` with `{ success: false, message: 'Product not found...' }`.
- **Actual:** Calling `GET /api/products/non-existent-id` crashes the request pipeline into a `500 Internal Server Error`.

#### 3. Reproduction Steps
1. Execute `curl -i http://localhost:5000/api/products/invalid_id_123`.
2. Inspect the HTTP status code: observe `HTTP/1.1 500 Internal Server Error`.

#### 4. Example Inputs & Outputs
- **Input:** `GET /api/products/abc`
- **Expected Output:** HTTP 404 Not Found.
- **Actual Output:** HTTP 500 Internal Server Error.

#### 5. Root Cause
The controller does not pre-validate `mongoose.Types.ObjectId.isValid(id)`, and the centralized error handler sets `statusCode = 500` for `CastError`.

#### 6. Corrected Code Snippet
```javascript
// backend/controllers/productController.js
if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(404).json({
    success: false,
    message: `Product not found with id ${id}`,
  });
}

// backend/middleware/errorMiddleware.js
if (err.name === 'CastError' && err.kind === 'ObjectId') {
  statusCode = 404;
  message = `Resource not found with id of ${err.value}`;
}
```

#### 7. Fix Explanation
Pre-validate `mongoose.Types.ObjectId.isValid(id)` in the controller and map `CastError` to `404` in the global error middleware.

#### 8. Regression Test
```javascript
test('B3: GET /api/products/invalid_id should return 404, not 500', async () => {
  const res = await request(app).get('/api/products/not-a-valid-id');
  expect(res.status).toBe(404);
  expect(res.body.success).toBe(false);
});
```

---

### Bug B4: Order Quantity Validation Accepts Zero (0)
- **Bug ID:** `B4`
- **Feature:** Quantity Validation
- **Affected File:** `backend/controllers/orderController.js`
- **Component/Function:** `createOrder`
- **Difficulty:** Easy (100 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// backend/controllers/orderController.js (inside createOrder)
const numQuantity = parseInt(quantity, 10);
// BUG B4 (Quantity Validation): Accepts quantity of 0 because condition checks (< 0) instead of (<= 0)
if (isNaN(numQuantity) || numQuantity < 0) {
  return res.status(400).json({
    success: false,
    message: 'Item quantity must be a positive integer greater than zero',
  });
}
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Sending `{ productId, quantity: 0 }` is rejected with `400 Bad Request` ("Item quantity must be a positive integer greater than zero").
- **Actual:** Sending `quantity: 0` passes validation, creating an order with 0 items for that line.

#### 3. Reproduction Steps
1. Send a POST request to `/api/orders` with payload:
   ```json
   {
     "demoSessionId": "test_session",
     "customerName": "Test User",
     "email": "test@example.com",
     "phone": "9876543210",
     "shippingAddress": { "address": "123 Street", "city": "Delhi", "state": "Delhi", "pincode": "110001" },
     "items": [{ "productId": "<VALID_ID>", "quantity": 0 }]
   }
   ```
2. The server responds with `201 Created` instead of `400 Bad Request`.

#### 4. Example Inputs & Outputs
- **Input:** Order item with `quantity: 0`
- **Expected Output:** HTTP 400 Bad Request
- **Actual Output:** HTTP 201 Created

#### 5. Root Cause
The validation check uses `numQuantity < 0` instead of `numQuantity <= 0`.

#### 6. Corrected Code Snippet
```javascript
// backend/controllers/orderController.js
if (isNaN(numQuantity) || numQuantity <= 0) {
  return res.status(400).json({
    success: false,
    message: 'Item quantity must be a positive integer greater than zero',
  });
}
```

#### 7. Fix Explanation
Update the condition from `< 0` to `<= 0` to enforce that order quantities must be strictly positive integers.

#### 8. Regression Test
```javascript
test('B4: POST /api/orders with quantity 0 should return 400 Bad Request', async () => {
  const res = await request(app)
    .post('/api/orders')
    .send({
      demoSessionId: 'sess123',
      customerName: 'User',
      email: 'u@example.com',
      phone: '9876543210',
      shippingAddress: { address: 'A', city: 'B', state: 'C', pincode: '110001' },
      items: [{ productId: validProductId, quantity: 0 }]
    });
  expect(res.status).toBe(400);
});
```

---

### Bug B5: Server Trusts Client-Provided Item Price in Order Calculation
- **Bug ID:** `B5`
- **Feature:** Order Total Calculation
- **Affected File:** `backend/controllers/orderController.js`
- **Component/Function:** `createOrder`
- **Difficulty:** Hard (300 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// backend/controllers/orderController.js (inside createOrder)
// BUG B5 (Order Total Calculation): Trusts client-supplied price in item payload instead of server DB price
const unitPricePaise = item.price !== undefined ? parseInt(item.price, 10) : product.price;
const lineTotalPaise = unitPricePaise * numQuantity;
subtotalPaise += lineTotalPaise;
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Order total is recalculated strictly using `product.price` stored in MongoDB, ignoring any `price` field sent by the client.
- **Actual:** If a client passes `"price": 100` (₹1) in the item payload, the server trusts it and charges ₹1 for a ₹2,999 product.

#### 3. Reproduction Steps
1. Identify a product with price ₹2,999 (`299900` paise).
2. Send POST `/api/orders` including `"price": 100` in the item object.
3. Observe the response: `subtotal` is calculated as `100` paise (₹1) instead of `299900` paise.

#### 4. Example Inputs & Outputs
- **Input:** `{ productId: "<ID_FOR_2999_RUPEE_ITEM>", quantity: 1, price: 100 }`
- **Expected Output:** `subtotal: 299900` (₹2,999)
- **Actual Output:** `subtotal: 100` (₹1)

#### 5. Root Cause
The controller checks `item.price !== undefined` and overrides the verified database price with the user-supplied price.

#### 6. Corrected Code Snippet
```javascript
// backend/controllers/orderController.js
const unitPricePaise = product.price;
const lineTotalPaise = unitPricePaise * numQuantity;
subtotalPaise += lineTotalPaise;
```

#### 7. Fix Explanation
Remove the client `item.price` ternary fallback; always read unit price directly from the verified Mongoose `product` document.

#### 8. Regression Test
```javascript
test('B5: Server should ignore client-provided prices and recalculate from DB', async () => {
  const res = await request(app)
    .post('/api/orders')
    .send({
      demoSessionId: 'sess123',
      customerName: 'User',
      email: 'u@example.com',
      phone: '9876543210',
      shippingAddress: { address: 'A', city: 'B', state: 'C', pincode: '110001' },
      items: [{ productId: product2999Id, quantity: 1, price: 100 }]
    });
  expect(res.status).toBe(201);
  expect(res.body.data.subtotal).toBe(299900);
});
```

---

### Bug B6: Ineffective Stock Validation Allowing Inventory Overselling
- **Bug ID:** `B6`
- **Feature:** Stock Validation
- **Affected File:** `backend/controllers/orderController.js`
- **Component/Function:** `createOrder`
- **Difficulty:** Medium (200 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// backend/controllers/orderController.js (inside createOrder)
// BUG B6 (Stock Validation): Faulty check only checks if stock is <= 0 instead of verifying stock is sufficient for requested quantity
if (product.stock <= 0) {
  return res.status(400).json({
    success: false,
    message: `Insufficient stock for "${product.name}". Only ${product.stock} available.`,
  });
}
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Ordering 10 units of an item with only 2 units in stock is rejected with `400 Bad Request`.
- **Actual:** The order is accepted because `product.stock` (2) is greater than 0; stock is decremented to `-8`.

#### 3. Reproduction Steps
1. Target a product with remaining stock of 2 units.
2. Submit an order requesting `quantity: 10`.
3. The order succeeds (`201 Created`) and the product document in database now shows `stock: -8`.

#### 4. Example Inputs & Outputs
- **Input:** Product stock: `2`. Order quantity: `10`.
- **Expected Output:** HTTP 400 Bad Request ("Insufficient stock").
- **Actual Output:** HTTP 201 Created (`stock` becomes `-8`).

#### 5. Root Cause
The validation checks `product.stock <= 0` instead of `product.stock < numQuantity`.

#### 6. Corrected Code Snippet
```javascript
// backend/controllers/orderController.js
if (product.stock < numQuantity) {
  return res.status(400).json({
    success: false,
    message: `Insufficient stock for "${product.name}". Only ${product.stock} available.`,
  });
}
```

#### 7. Fix Explanation
Compare available stock against the requested quantity: `product.stock < numQuantity`.

#### 8. Regression Test
```javascript
test('B6: Ordering quantity greater than available stock should return 400', async () => {
  const res = await request(app)
    .post('/api/orders')
    .send({
      demoSessionId: 'sess123',
      customerName: 'User',
      email: 'u@example.com',
      phone: '9876543210',
      shippingAddress: { address: 'A', city: 'B', state: 'C', pincode: '110001' },
      items: [{ productId: lowStockProductId, quantity: 50 }]
    });
  expect(res.status).toBe(400);
  expect(res.body.message).toContain('Insufficient stock');
});
```

---

### Bug B7: Order Persistence Omission (Phantom 201 Response)
- **Bug ID:** `B7`
- **Feature:** Order Persistence
- **Affected File:** `backend/controllers/orderController.js`
- **Component/Function:** `createOrder`
- **Difficulty:** Hard (300 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// backend/controllers/orderController.js (inside createOrder)
// BUG B7 (Order Persistence): Constructs un-persisted Order instance without calling .save() or Order.create()
const order = new Order({
  demoSessionId: demoSessionId.trim(),
  customerName: customerName.trim(),
  email: email.trim().toLowerCase(),
  phone: cleanPhone,
  shippingAddress: {
    address: shippingAddress.address.trim(),
    city: shippingAddress.city.trim(),
    state: shippingAddress.state.trim(),
    pincode: shippingAddress.pincode.trim(),
  },
  items: validatedItems,
  subtotal: subtotalPaise,
  deliveryCharge: deliveryChargePaise,
  totalAmount: totalAmountPaise,
  orderStatus: 'Confirmed',
});
// Intentionally omitted: await order.save();

res.status(201).json({
  success: true,
  message: 'Order placed successfully',
  data: order,
});
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** Placing an order saves the document in MongoDB collection `orders`.
- **Actual:** Server responds with `201 Created` and an order object, but the order is never written to MongoDB. Querying `GET /api/orders` returns an empty array.

#### 3. Reproduction Steps
1. Send POST `/api/orders` with valid data.
2. Note the generated `_id` returned in the HTTP 201 response.
3. Query `GET /api/orders` using the same `x-demo-session-id`.
4. Observe that `data` is `[]`: the order does not exist in the database.

#### 4. Example Inputs & Outputs
- **Input:** POST valid order data.
- **Expected Output:** Order saved in MongoDB; subsequent `GET /api/orders` returns 1 order.
- **Actual Output:** Subsequent `GET /api/orders` returns 0 orders.

#### 5. Root Cause
The controller instantiates `new Order({ ... })` but omits `await order.save()` or `await Order.create()`.

#### 6. Corrected Code Snippet
```javascript
// backend/controllers/orderController.js
const order = await Order.create({
  demoSessionId: demoSessionId.trim(),
  customerName: customerName.trim(),
  email: email.trim().toLowerCase(),
  phone: cleanPhone,
  shippingAddress: {
    address: shippingAddress.address.trim(),
    city: shippingAddress.city.trim(),
    state: shippingAddress.state.trim(),
    pincode: shippingAddress.pincode.trim(),
  },
  items: validatedItems,
  subtotal: subtotalPaise,
  deliveryCharge: deliveryChargePaise,
  totalAmount: totalAmountPaise,
  orderStatus: 'Confirmed',
});
```

#### 7. Fix Explanation
Use `await Order.create(...)` or call `await order.save()` before returning the HTTP 201 response.

#### 8. Regression Test
```javascript
test('B7: POST /api/orders must actually persist order document in database', async () => {
  const postRes = await request(app).post('/api/orders').send(validPayload);
  expect(postRes.status).toBe(201);
  const getRes = await request(app).get('/api/orders').set('x-demo-session-id', validPayload.demoSessionId);
  expect(getRes.body.data.length).toBeGreaterThan(0);
});
```

---

### Bug B8: Non-Atomic Concurrent Stock Decrement (Race Condition)
- **Bug ID:** `B8`
- **Feature:** Concurrent Stock Updates
- **Affected File:** `backend/controllers/orderController.js`
- **Component/Function:** `createOrder`
- **Difficulty:** Hard (300 Level) | **Points:** 10 pts

#### 1. Faulty Code Snippet
```javascript
// backend/controllers/orderController.js (inside createOrder loop)
// BUG B8 (Concurrent Stock Updates): Non-atomic read-modify-write stock deduction with async gap enables overselling
await new Promise((resolve) => setTimeout(resolve, 50));
product.stock -= numQuantity;
await product.save();
```

#### 2. Expected vs. Actual Behaviour
- **Expected:** If a product has 5 units in stock, two concurrent orders for 4 units each should result in one succeeding and the second being rejected with `400 Insufficient stock`.
- **Actual:** Because of non-atomic read-modify-write, both orders pass the stock check simultaneously, resulting in 8 units sold and stock becoming negative or corrupt.

#### 3. Reproduction Steps
1. Set a product's stock to 5 units in MongoDB.
2. Fire two asynchronous `POST /api/orders` requests simultaneously via `Promise.all()`, each requesting 4 units.
3. Both requests succeed (`201 Created`), overselling the inventory.

#### 4. Example Inputs & Outputs
- **Input:** Stock: 5. Request A: 4 units. Request B: 4 units sent in parallel.
- **Expected Output:** Request A: 201 Created. Request B: 400 Bad Request ("Insufficient stock").
- **Actual Output:** Both Request A and Request B receive 201 Created.

#### 5. Root Cause
Stock validation and stock deduction are separated into non-atomic read and write operations (`product.stock -= numQuantity; await product.save()`).

#### 6. Corrected Code Snippet
```javascript
// backend/controllers/orderController.js
const updatedProduct = await Product.findOneAndUpdate(
  { _id: productId, stock: { $gte: numQuantity } },
  { $inc: { stock: -numQuantity } },
  { new: true }
);

if (!updatedProduct) {
  return res.status(400).json({
    success: false,
    message: `Insufficient stock for "${product.name}".`,
  });
}
```

#### 7. Fix Explanation
Use atomic MongoDB operation `Product.findOneAndUpdate` with conditional query `{ _id: productId, stock: { $gte: numQuantity } }` and `$inc: { stock: -numQuantity }`.

#### 8. Regression Test
```javascript
test('B8: Simultaneous concurrent orders must not oversell inventory', async () => {
  const [resA, resB] = await Promise.all([
    request(app).post('/api/orders').send(payload4Units),
    request(app).post('/api/orders').send(payload4Units)
  ]);
  const statuses = [resA.status, resB.status];
  expect(statuses).toContain(201);
  expect(statuses).toContain(400);
});
```

---

## Master Bug Summary Table

| # | Bug ID | Category | Feature | Affected File | Line(s) | Difficulty | Points |
| :-: | :---: | :---: | :--- | :--- | :---: | :---: | :-: |
| 1 | **F1** | Frontend | Product Search | `frontend/src/pages/Products.jsx` | 63–65 | Medium | 10 pts |
| 2 | **F2** | Frontend | Category Filter | `frontend/src/pages/Products.jsx` | 68–70 | Easy | 10 pts |
| 3 | **F3** | Frontend | Product Sorting | `frontend/src/pages/Products.jsx` | 73–82 | Medium | 10 pts |
| 4 | **F4** | Frontend | Cart Total | `frontend/src/context/CartContext.jsx` | 134–137 | Easy | 10 pts |
| 5 | **F5** | Frontend | Duplicate Cart Items | `frontend/src/context/CartContext.jsx` | 63–64 | Medium | 10 pts |
| 6 | **F6** | Frontend | Cart Persistence | `frontend/src/context/CartContext.jsx` | 27–28 | Easy | 10 pts |
| 7 | **F7** | Frontend | Checkout Validation | `frontend/src/pages/Checkout.jsx` | 106–107 | Medium | 10 pts |
| 8 | **F8** | Frontend | My Orders | `frontend/src/pages/MyOrders.jsx` | 47–49 | Easy | 10 pts |
| 9 | **B1** | Backend | Products API | `backend/controllers/productController.js` | 16–17 | Easy | 10 pts |
| 10 | **B2** | Backend | Categories API | `backend/controllers/productController.js` | 94–95 | Easy | 10 pts |
| 11 | **B3** | Backend | Product ID Validation | `backend/controllers/productController.js` | 62–64 | Medium | 10 pts |
| 12 | **B4** | Backend | Quantity Validation | `backend/controllers/orderController.js` | 99–104 | Easy | 10 pts |
| 13 | **B5** | Backend | Order Total Calculation | `backend/controllers/orderController.js` | 124–126 | Hard | 10 pts |
| 14 | **B6** | Backend | Stock Validation | `backend/controllers/orderController.js` | 115–121 | Medium | 10 pts |
| 15 | **B7** | Backend | Order Persistence | `backend/controllers/orderController.js` | 148–164 | Hard | 10 pts |
| 16 | **B8** | Backend | Concurrent Stock Updates | `backend/controllers/orderController.js` | 136–138 | Hard | 10 pts |

---

## Instructions for Restoring Clean Baseline

To return the codebase to its 100% bug-free baseline:
```bash
git checkout main
```
To verify the clean baseline status:
```bash
git status
npm test --prefix backend
npm run build --prefix frontend
```
