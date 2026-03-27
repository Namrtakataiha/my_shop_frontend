# MyShop — Full Project Documentation

> A full-stack e-commerce platform with ML-powered features, built with Django REST Framework + React + Vite.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [How to Run](#3-how-to-run)
4. [Backend Documentation](#4-backend-documentation)
5. [Frontend Documentation](#5-frontend-documentation)
6. [ML Features Documentation](#6-ml-features-documentation)
7. [Database Models](#7-database-models)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Authentication Flow](#9-authentication-flow)

---

## 1. Project Overview

MyShop is a full-featured e-commerce web application with two user roles:

| Role | Description |
|------|-------------|
| **Admin (Seller)** | Creates products, manages categories, views orders, handles returns |
| **User (Customer)** | Browses products, adds to cart, places orders, writes reviews, manages wishlist |

**Key ML features:**
- Visual image search (upload a photo → find similar products)
- Sentiment analysis on product reviews (positive / negative / neutral)

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│              React + Vite (port 5173)               │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / REST (Axios)
┌──────────────────────▼──────────────────────────────┐
│           Django REST Framework (port 8000)         │
│  ┌─────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │   Views     │  │Serializers│  │  Permissions  │  │
│  └──────┬──────┘  └──────────┘  └───────────────┘  │
│         │                                           │
│  ┌──────▼──────┐  ┌──────────┐  ┌───────────────┐  │
│  │   Models    │  │  Celery  │  │   ml_utils    │  │
│  └──────┬──────┘  └────┬─────┘  └───────────────┘  │
└─────────┼──────────────┼─────────────────────────── ┘
          │              │
┌─────────▼──────┐  ┌────▼──────┐
│  PostgreSQL DB │  │   Redis   │
│  (data store)  │  │(cache+MQ) │
└────────────────┘  └───────────┘
```

All services run via **Docker Compose**.

---

## 3. How to Run

### Prerequisites
- Docker + Docker Compose installed

### Start Backend
```bash
cd e_commerce
docker-compose up --build
```
This starts: Django (port 8000), PostgreSQL, Redis, Celery worker.

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

### Run Migrations (first time)
```bash
docker exec -it <django_container> python manage.py migrate
```

---

## 4. Backend Documentation

### Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **Django** | 5.2.8 | Web framework |
| **Django REST Framework** | 3.16.1 | REST API layer |
| **djangorestframework-simplejwt** | latest | JWT authentication |
| **PostgreSQL** | latest | Primary database |
| **Redis** | 5.0.4 | Cache + Celery message broker |
| **Celery** | 5.3.6 | Async background tasks (emails, notifications) |
| **django-redis** | 5.4.0 | Redis cache backend for Django |
| **django-cors-headers** | latest | Allow frontend to call backend from different port |
| **drf-yasg** | 1.21.15 | Auto-generate Swagger API docs at `/api/swagger/` |
| **psycopg2-binary** | latest | PostgreSQL driver for Python |
| **django-filter** | latest | Query filtering on API endpoints |

### Project Structure

```
e_commerce/
├── e_commerce/          # Django project config
│   ├── settings.py      # All settings (DB, Redis, JWT, Celery)
│   ├── urls.py          # Root URL config
│   ├── celery.py        # Celery app setup
│   └── wsgi.py
├── api/                 # Main app
│   ├── models.py        # All database models
│   ├── views.py         # All API view functions
│   ├── serializers.py   # DRF serializers (model ↔ JSON)
│   ├── urls.py          # All API URL patterns
│   ├── permissions.py   # Custom permission classes
│   ├── tasks.py         # Celery async tasks
│   ├── utils.py         # Helper functions (OTP, email)
│   └── ml_utils.py      # ML logic (CLIP, sentiment)
├── recommendation/
│   └── recommendation.py  # Product recommendation logic
├── requirements.txt
└── dockerfile
```

### Key Concepts

#### Custom User Model
Django's default User is extended with extra fields:
```python
class User(AbstractUser):
    role        # 'admin' or 'user'
    mobile_no
    address
    is_verified  # must verify email via OTP before login
    is_admin
```

#### Authentication — 2-Factor OTP
1. User registers → OTP sent to email → must verify to activate account
2. User logs in with email+password → OTP sent again → must verify to get JWT tokens
3. JWT access token (4h) + refresh token (7 days) returned on success

#### Permissions
Two custom permission classes in `permissions.py`:
- `IfAdmin` — only allows users with `role='admin'`
- `IfUser` — only allows users with `role='user'`
- Combined with `|` operator: `IfUser | IfAdmin` allows both

#### Caching Strategy (Redis)
- Product list queries cached with version-tagged keys
- Cache busted on every product create/update/delete
- Product comment lists cached per product (5 min TTL)
- CLIP text embeddings for products cached 24h per product

#### Celery Async Tasks (`tasks.py`)
Background tasks triggered after key events:
- `notify_order_placed` — email customer when order placed
- `notify_order_status_updated` — email when admin changes order status
- `notify_comment_added` — email product owner when review posted
- `notify_product_created` — notify on product create/update
- `notify_payment_success` — email on payment confirmation
- `warmup_product_cache` — pre-warm Redis cache after product update
- `warmup_product_comments_cache` — pre-warm comment cache

---

## 5. Frontend Documentation

### Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **React** | 18.2 | UI library |
| **Vite** | 5.2 | Build tool + dev server (fast HMR) |
| **React Router DOM** | 6.23 | Client-side routing |
| **Axios** | 1.6.8 | HTTP client for API calls |
| **Lucide React** | 0.378 | Icon library (SVG icons as components) |

### Project Structure

```
frontend/src/
├── main.jsx              # App entry point, wraps with providers
├── App.jsx               # Route definitions
├── index.css             # Global CSS variables and base styles
├── context/
│   ├── AuthContext.jsx   # Global auth state (user, login, logout)
│   └── CartContext.jsx   # Global cart item count
├── components/
│   ├── Navbar.jsx        # Top navigation bar + image search
│   ├── Navbar.css
│   ├── ProductCard.jsx   # Reusable product card with Add to Cart
│   ├── ProductCard.css
│   ├── ImageViewer.jsx   # Zoomable/pannable image lightbox
│   ├── ImageViewer.css
│   ├── AdminLayout.jsx   # Collapsible sidebar layout for admin pages
│   ├── ProtectedRoute.jsx # Route guard (redirects if not logged in)
│   └── Toast.jsx         # Global toast notification system
├── pages/
│   ├── Home.jsx / Home.css          # Landing page with hero, categories, products
│   ├── Products.jsx / Products.css  # Product listing with filters + image search results
│   ├── ProductDetail.jsx            # Single product: images, reviews, ratings, recommendations
│   ├── Cart.jsx / Cart.css          # Shopping cart
│   ├── Checkout.jsx                 # Place order form
│   ├── Orders.jsx                   # Customer order history with status tracker
│   ├── Wishlist.jsx                 # Saved products
│   ├── Returns.jsx                  # Return request management
│   ├── Profile.jsx                  # User profile + edit
│   ├── Login.jsx                    # Login with 2FA OTP
│   ├── Register.jsx                 # Registration with OTP verification
│   ├── Auth.css                     # Shared auth page styles
│   └── admin/
│       ├── Dashboard.jsx            # Admin stats overview
│       ├── AdminProducts.jsx        # CRUD products
│       ├── AdminCategories.jsx      # CRUD categories
│       ├── AdminOrders.jsx          # View + update order status
│       ├── AdminReturns.jsx         # Approve/deny return requests
│       └── AdminUsers.jsx           # View all users
└── utils/
    └── api.js            # All Axios API call functions
```

### Global State Management

#### AuthContext (`context/AuthContext.jsx`)
Stores logged-in user info in memory + `localStorage`.
```js
const { user, login, logout } = useAuth();
// user = { username, email, role, access, refresh }
```
- `login(data)` — saves tokens + user info to localStorage
- `logout()` — clears localStorage, resets state
- On app load, reads localStorage to restore session

#### CartContext (`context/CartContext.jsx`)
Tracks cart item count for the badge on the navbar cart icon.
```js
const { cartCount, refreshCart } = useCart();
```
Calls `GET /api/cart/` to get current count. `refreshCart()` is called after add/remove.

### Routing (`App.jsx`)
Uses React Router v6 with `ProtectedRoute` wrapper:
```
/                    → Home
/products            → Products list
/products/:id        → Product detail
/cart                → Cart (user only)
/checkout            → Checkout (user only)
/orders              → My orders (user only)
/wishlist            → Wishlist (user only)
/returns             → Returns (user only)
/profile             → Profile (both roles)
/login               → Login
/register            → Register
/admin/dashboard     → Admin dashboard (admin only)
/admin/products      → Manage products (admin only)
/admin/categories    → Manage categories (admin only)
/admin/orders        → Manage orders (admin only)
/admin/returns       → Manage returns (admin only)
/admin/users         → View users (admin only)
```

### API Layer (`utils/api.js`)
Single Axios instance with:
- Base URL: `http://localhost:8000/api`
- Request interceptor: auto-attaches `Authorization: Bearer <token>` header
- Response interceptor: on 401, auto-refreshes token using refresh token; on failure, clears localStorage and redirects to `/login`

All API functions are named exports:
```js
// Auth
registerUser(data), verifyOtp(data), loginUser(data), verifyOtp2f(data)

// Products
getProducts(params), createProduct(categoryId, data), updateProduct(id, data)

// Cart
getCart(), addToCart(data), updateCartItem(id, data), removeCartItem(id)

// Orders
checkout(data), getMyOrders(), cancelOrder(id), getAdminOrders()

// Comments & Reviews
getComments(productId), addComment(productId, data), replyComment(...)
addRating(data), getProductRatings(productId)

// Wishlist
getWishlist(), addToWishlist(productId), removeFromWishlist(productId)

// Returns
createReturnRequest(data), getMyReturns(), approveReturnRequest(id, data)

// ML
imageSearch(formData)   // multipart/form-data with 'image' file
getRecommendations(productId)
predictPrice(data)
```

### Design System
- Primary color: `#ff3f6c` (pink-red, like Myntra)
- Dark color: `#282c3f`
- CSS custom properties defined in `index.css`
- Responsive grid: `grid-4` (4 cols → 2 → 1 on mobile)
- Animation classes: `animate-fade`, `animate-left`, `animate-right`

---

## 6. ML Features Documentation

### Libraries Used

| Library | Version | Purpose |
|---------|---------|---------|
| **transformers** | 4.40.0 | CLIP model (OpenAI) for image+text embeddings |
| **torch** | 2.2.2 | PyTorch — runs CLIP neural network |
| **torchvision** | 0.17.2 | Image transforms for PyTorch |
| **Pillow** | 10.3.0 | Image loading and preprocessing |
| **scikit-learn** | 1.8.0 | `cosine_similarity` for comparing embeddings |
| **numpy** | 2.4.3 | Numerical operations on embedding vectors |
| **textblob** | 0.18.0 | Sentiment polarity scoring on text |
| **requests** | 2.31.0 | Downloading product images from URLs |

All ML code lives in `e_commerce/api/ml_utils.py`.

---

### Feature 1: Sentiment Analysis on Reviews

**Where it runs:** Backend, triggered when a user posts or edits a review.

**Library:** TextBlob

**How it works:**
```
User posts review text
        ↓
TextBlob(text).sentiment.polarity
        ↓
Returns float between -1.0 and +1.0
        ↓
score > 0.1  → "positive"
score < -0.1 → "negative"
else         → "neutral"
        ↓
Saved to ProductComment.sentiment field in DB
        ↓
Returned in API response
        ↓
Frontend shows colored badge on each review card
```

**Sentiment badge colors:**
- 😊 Positive → green (`#03a685`)
- 😞 Negative → pink (`#ff3f6c`)
- 😐 Neutral → grey (`#94969f`)

**Code location:** `get_sentiment(text)` in `ml_utils.py`

**Views that call it:**
- `add_product_comment` — on new review
- `reply_to_comment` — on new reply
- `update_comment_by_user` — on edit

---

### Feature 2: Visual Image Search

**Where it runs:** Backend endpoint `POST /api/image-search/`

**Model:** OpenAI CLIP (`clip-vit-base-patch32`) via HuggingFace Transformers

**What CLIP is:** A neural network trained on 400 million image-text pairs. It learns a shared "embedding space" where images and their text descriptions land close together. So a photo of sunglasses and the text "Ray-Ban Aviator sunglasses" will have similar vectors.

#### Full Algorithm

```
User uploads image
        ↓
Step 1: Encode uploaded image with CLIP
        → 512-dimensional float vector (image embedding)
        
Step 2: Detect product category
        → Encode each DB category name as CLIP text embedding
        → Cosine similarity: image_emb vs each category_text_emb
        → Pick highest scoring category
        → Example: iPhone photo → "Electronics & Mobiles" wins
        
Step 3: Filter products to detected category
        → Only compare against products in that category
        → Prevents phone showing up when searching sunglasses
        
Step 4: Score each product using CLIP text embeddings
        → For each product: encode "ProductName CategoryName" as text
        → Cosine similarity: image_emb vs product_text_emb
        → Products cached in Redis (24h) — fast on repeat searches
        
Step 5: Group results by score
        → score >= 0.28 → "exact"    (nearly identical product)
        → score >= 0.22 → "similar"  (same type/style)
        → below 0.22   → "suggestion" (same category, different style)
        
Step 6: If no exact/similar found
        → All same-category products become suggestions
        → User always sees relevant products, never random ones
```

#### Why text embeddings for products (not image embeddings)?

| Approach | Speed | Accuracy |
|----------|-------|----------|
| Image-to-image (download + encode each product image) | Slow (~1s per product) | Good visually but ignores semantics |
| Image-to-text (encode product name+category as text) | Fast (cached in Redis) | Correct — "Samsung Galaxy" never matches "sunglasses" |

CLIP was specifically trained to align images and text, so comparing an image embedding against text embeddings works correctly and is much faster.

#### Result Groups (Frontend Display)

```
✓ Exact Match     (green)  — score >= 28%  — nearly same product
≈ Similar Style   (purple) — score >= 22%  — same category/style  
💡 Other [Category] Products (orange) — fallback, always same category
```

Each product card shows a badge like "87% match".

#### Caching
- Product text embeddings: cached in Redis with key `clip_txt_{id}_{updated_at_timestamp}`
- Auto-invalidates when product is edited (timestamp changes)
- TTL: 24 hours

---

### Feature 3: Product Recommendations

**Where it runs:** Backend endpoint `GET /api/product/{id}/recommendations/`

**Location:** `recommendation/recommendation.py`

**How it works:** Collaborative/content-based filtering using product metadata (category, price, description similarity) to suggest related products on the product detail page.

---

### Feature 4: Price Prediction

**Where it runs:** Backend endpoint `POST /api/predict-price/`

**Libraries:** scikit-learn, pandas

**How it works:** A regression model trained on existing product data (description, category, stock quantity) to predict a suggested price for a new product. Used by admins when creating products.

---

## 7. Database Models

```
User (extends AbstractUser)
├── role: 'admin' | 'user'
├── mobile_no, address
└── is_verified (OTP email verification)

Category
├── name (unique)
├── description
└── is_active

Product
├── name, description, price
├── category → Category (FK)
├── created_by → User (FK, the seller)
├── stock_quantity
├── image (URL)
└── is_active

ProductComment
├── product → Product (FK)
├── user → User (FK)
├── parent → ProductComment (FK, nullable — for replies)
├── comment (text)
└── sentiment: 'positive' | 'negative' | 'neutral'

ProductRating
├── product → Product (FK)
├── user → User (FK)
├── rating (1–5)
└── review (text, optional)

Cart
├── user → User (FK)
├── product → Product (FK)
└── quantity

Order
├── user → User (FK)
├── order_number (unique, e.g. ORD-A1B2C3D4)
├── total_amount
├── status: pending | processing | shipped | delivered | cancelled
└── shipping_address

OrderItem
├── order → Order (FK)
├── product → Product (FK)
├── quantity
└── price (snapshot at time of order)

Payment
├── order → Order (OneToOne)
├── payment_method: 'cod' | 'online'
└── payment_status: 'pending' | 'success' | 'failed'

Wishlist
├── user → User (FK)
└── product → Product (FK)

ReturnRequest
├── user → User (FK)
├── order → Order (FK)
├── product → Product (FK)
├── reason
├── status: pending | approved | denied | pickup_in_progress | completed
├── pickup_date
└── refund_status: none | pending | processed
```

---

## 8. API Endpoints Reference

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/registration/` | Register new user |
| POST | `/api/verify_otp/` | Verify registration OTP |
| POST | `/api/login/` | Login (sends OTP) |
| POST | `/api/verify_otp_2f/` | Verify login OTP → returns JWT |
| POST | `/api/resend_otp/` | Resend OTP |
| POST | `/api/reset_password/` | Password reset via OTP |

### Products
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/all_products/` | List/filter products (public) |
| POST | `/api/product_list_create/{category_id}/` | Create product (admin) |
| PUT | `/api/product_modify/{id}/` | Update product (admin) |
| DELETE | `/api/product_delete/{id}/` | Delete product (admin) |

### Categories
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/public/categories/` | List all categories (public) |
| POST | `/api/admin/category/create/` | Create category (admin) |
| PUT | `/api/admin/category/{id}/update/` | Update category (admin) |
| DELETE | `/api/admin/category/{id}/delete/` | Delete category (admin) |

### Cart & Orders
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/cart/` | Get cart items |
| POST | `/api/cart/add/` | Add to cart |
| PUT | `/api/cart/{id}/update/` | Update quantity |
| DELETE | `/api/cart/{id}/delete/` | Remove item |
| POST | `/api/checkout/` | Place order |
| POST | `/api/checkout/cancel/{id}/` | Cancel order |
| GET | `/api/my-orders/` | Customer order history |
| GET | `/api/admin/my-orders/` | Admin's customers' orders |
| PUT | `/api/admin/order/{id}/status/` | Update order status |

### Reviews & Ratings
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/comments/{product_id}/` | Get all reviews |
| POST | `/api/add_comment/{product_id}/` | Post review (auto-sentiment) |
| POST | `/api/reply_to_comment/{product_id}/{comment_id}/` | Reply to review |
| PUT | `/api/update_by_user/{comment_id}/` | Edit review |
| DELETE | `/api/delete_by_user/{comment_id}/` | Delete own review |
| POST | `/api/product-rating/` | Submit star rating |
| GET | `/api/product-rating/{product_id}/` | Get ratings + average |

### ML
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/image-search/` | Visual image search (multipart, key: `image`) |
| GET | `/api/product/{id}/recommendations/` | Get recommended products |
| POST | `/api/predict-price/` | Predict price for new product |

### Returns & Wishlist
| Method | URL | Description |
|--------|-----|-------------|
| GET/POST/DELETE | `/api/wishlist/` | Manage wishlist |
| POST | `/api/create_return_request/` | Create return |
| GET | `/api/user_view_return_requests/` | My returns |
| PATCH | `/api/approve_return_request/{id}/` | Approve/deny (admin) |

### Swagger UI
Visit `http://localhost:8000/api/swagger/` for interactive API documentation.

---

## 9. Authentication Flow

```
REGISTRATION
────────────
1. POST /registration/  { username, email, password, mobile_no, address, role }
2. OTP sent to email
3. POST /verify_otp/    { email, otp }
4. Account activated ✓

LOGIN (2-Factor)
────────────────
1. POST /login/         { email, password }
2. OTP sent to email
3. POST /verify_otp_2f/ { email, otp }
4. Response: { access, refresh, role, username }
5. Frontend stores tokens in localStorage
6. All subsequent requests: Authorization: Bearer <access_token>

TOKEN REFRESH
─────────────
- Axios interceptor catches 401 responses
- Automatically calls POST /token/refresh/ with refresh token
- Retries original request with new access token
- If refresh fails → logout + redirect to /login
```
