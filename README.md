# E-Commerce AI

Turborepo monorepo with a Django REST API and Next.js (App Router) frontend.

## Structure

```
apps/
  backend/     Django — catalog, accounts, cart, orders
  frontend/    Next.js App Router
packages/
  types/       TypeScript types generated from OpenAPI schema
```

Phase 2/3 apps (`tryon`, `notifications`) are not scaffolded yet. Redis is wired in Django settings for future use.

## Prerequisites

- Node.js 20+
- Python 3.12+
- Docker & Docker Compose (PostgreSQL, Redis, MinIO, Django)

## Quick start

### 1. Install JS dependencies

```bash
npm install
```

### 2. Environment files

```bash
# Backend (Docker Compose — includes MinIO/S3 settings)
cp apps/backend/.env.docker.example apps/backend/.env

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local
```

Never commit `.env` or `.env.local`.

### 3. Start infrastructure + Django

```bash
docker compose up --build
```

- API: http://localhost:8000/api/catalog/products/
- OpenAPI schema: http://localhost:8000/api/schema/
- Swagger UI: http://localhost:8000/api/docs/
- Django admin: http://localhost:8000/admin/
- MinIO console: http://localhost:9001 (minioadmin / minioadmin)

### 4. Start Next.js (separate terminal)

```bash
npm run dev --workspace=@ecommerce/frontend
```

Frontend: http://localhost:3000

### 5. Load demo data

```bash
# With Docker backend running
docker compose exec backend python manage.py seed_demo

# Or locally
cd apps/backend && python manage.py seed_demo
```

Re-run with `--clear` to reset demo catalog and users first.

**Demo accounts**

| Email | Password | Role |
|-------|----------|------|
| `demo@example.com` | `demo12345` | Customer (with saved PK addresses) |
| `admin@example.com` | `admin12345` | Django admin superuser |

Demo catalog includes 5 categories, 12 products, 30+ variants (cotton, linen, lawn, silk, etc.), and placeholder product images.

## Development without Docker

```bash
# Backend
cd apps/backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -e ".[dev]"
cp .env.example .env          # set USE_S3=False if no MinIO
python manage.py migrate
python manage.py runserver

# Frontend (from repo root)
npm run dev --workspace=@ecommerce/frontend
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps via Turborepo |
| `npm run lint` | Ruff + ESLint |
| `npm run test` | Pytest + frontend tests |
| `npm run build` | Build frontend + types |
| `npm run schema` | Export OpenAPI schema from Django |
| `npm run generate:types` | Export schema + regenerate TS types |
| `npm run seed` | Load demo catalog + test users (Django) |

## Admin panel (staff)

Staff users can manage the catalog at **http://localhost:3000/admin** (no Django Admin required for day-to-day work).

| Account | Password |
|---------|----------|
| `admin@example.com` | `admin12345` |

**Features (Phase 1):**
- Products — create, edit, delete, search
- Variants — SKU, price, fabric, color, size, stock
- Images — upload, set primary, delete
- Categories — create and delete

Staff-only API routes live under `/api/admin/catalog/*` and require `is_staff=true`.

## Payment (Demo Mode)

By default the store runs in **Demo Payment Mode** — no Stripe API key required.

| Variable | App | Default | Description |
|----------|-----|---------|-------------|
| `DEFAULT_PAYMENT_PROVIDER` | Django | `demo` | Backend payment provider |
| `NEXT_PUBLIC_PAYMENT_PROVIDER` | Next.js | `demo` | Frontend checkout UI |
| `PAYMENT_CURRENCY` | Django | `usd` | Checkout currency |

**Checkout flow (demo):**
1. User completes address + order summary
2. Clicks **Pay with Demo Mode** (simulated ~1.2s delay)
3. `POST /api/orders/payments/confirm/` marks payment as paid, reduces stock, clears cart, sends confirmation email (console backend in dev)
4. Redirect to `/orders/{id}?confirmed=1`

**Switch to Stripe later:** set both provider env vars to `stripe` and add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. The checkout wizard and payment factory are provider-agnostic.

Public config endpoint: `GET /api/orders/payments/config/`

## Feature checklist (Phase 1)

| Feature | Status |
|---------|--------|
| Login / Register / Logout / JWT refresh | ✅ Complete |
| httpOnly cookie auth (Next.js proxy) | ✅ Complete |
| Guest cart (localStorage + session) | ✅ Complete |
| Guest cart merge on login/register | ✅ Complete |
| Product listing, detail, categories | ✅ Complete |
| Search, fabric/color/size/price filters | ✅ Complete |
| Pagination (shop) | ✅ Complete |
| Cart add/update/remove/clear | ✅ Complete |
| Stock validation (cart + checkout) | ✅ Complete |
| Multi-step checkout | ✅ Complete |
| Address validation + saved addresses | ✅ Complete |
| Demo payment (full pipeline) | ✅ Complete |
| Order creation + confirmation page | ✅ Complete |
| Order history | ✅ Complete |
| Confirmation email (console/SMTP) | ✅ Complete |
| Inventory reduction on payment | ✅ Complete |
| Admin catalog panel (`/admin`) | ✅ Complete |
| Responsive layouts | ✅ Complete |
| Loading / empty / error states | ✅ Complete |
| 404 + error pages | ✅ Complete |
| SEO metadata (all main pages) | ✅ Complete |
| Standardized API errors | ✅ Complete |
| Rate limiting | ✅ Complete |
| Coupons | ❌ Not implemented |
| Password reset email flow | ❌ Stub only |
| Stripe live payments | ⏳ Requires Stripe keys |
| PayFast / JazzCash | ⏳ Stubs only |
| Stripe webhooks | ⏳ Not implemented |
| Category page pagination | ❌ Not implemented |
| Mobile hamburger nav | ❌ Not implemented |
| Frontend unit tests | ❌ Not implemented |
| Address book CRUD UI | ❌ API only |

**Verification (latest audit):** 25 backend tests passing, ESLint clean, `next build` succeeds with zero TypeScript errors.

## API overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/token/` | JWT access + refresh (email + password) |
| `POST /api/auth/token/refresh/` | Refresh access token |
| `POST /api/accounts/register/` | Create account |
| `GET /api/accounts/me/` | Current user (JWT required) |
| `GET /api/catalog/products/` | Product list with `min_price` |
| `GET /api/catalog/products/{slug}/` | Product detail with variants & images |
| `GET /api/cart/` | Cart (user or session) |
| `POST /api/cart/items/` | Add variant to cart |
| `POST /api/orders/checkout/` | Create order + payment intent |
| `POST /api/orders/payments/confirm/` | Confirm payment (demo or Stripe) |
| `GET /api/orders/payments/config/` | Active payment provider config |
| `GET /api/accounts/addresses/` | User shipping addresses |

## Models

- **Catalog**: `Category`, `Product`, `ProductVariant` (fabric, color, size), `ProductImage`
- **Cart**: `Cart` (user or session), `CartItem` (variant-based)
- **Orders**: `Order`, `OrderItem`, `Address`, `Payment` (pending/paid/failed)
- **Accounts**: custom `User` (email login), `Address`

Product images are stored in S3-compatible storage (MinIO locally via Docker).

## Type generation

After API changes:

```bash
npm run generate:types
```

This exports `apps/backend/schema.yaml` via drf-spectacular, then generates `packages/types/src/generated.ts` with openapi-typescript.

## CI

GitHub Actions runs on push/PR:

- **Backend**: `ruff check` + `pytest` (SQLite test settings)
- **Frontend**: ESLint + `next build`
