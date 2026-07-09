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

Phase 2 adds **virtual try-on** (upload photo → AI preview) and **stylist CSR handoff**. Redis + Celery process try-on jobs asynchronously.

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

Demo catalog includes 4 categories, 10 products, 26+ variants (cotton, linen, lawn, silk, etc.), and placeholder product images.

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

**Verification (latest audit):** 29 backend tests passing, ESLint clean, `next build` succeeds with zero TypeScript errors.

## Virtual try-on (Phase 2)

Customers can open **Virtual try-on** on any product page, upload a photo (with consent), and receive an AI-generated preview. Staff can manage stylist follow-ups from the admin panel.

| Variable | App | Default | Description |
|----------|-----|---------|-------------|
| `DEFAULT_TRYON_PROVIDER` | Django | `auto` | `auto`, `fal`, `replicate`, or `demo` |
| `FAL_KEY` | Django | — | **Recommended** — Fal.ai key for FASHN v1.6 VTON |
| `TRYON_FAL_MODEL` | Django | `fal-ai/fashn/tryon/v1.6` | Fal virtual try-on model |
| `TRYON_FAL_MODE` | Django | `balanced` | `performance`, `balanced`, or `quality` |
| `REPLICATE_API_TOKEN` | Django | — | Fallback — Replicate IDM-VTON |
| `TRYON_REPLICATE_MODEL` | Django | `cuuupid/idm-vton` | Replicate model slug |
| `TRYON_SYNC_PROCESSING` | Django | `False` | Process jobs inline (no Celery worker) |
| `TRYON_PHOTO_RETENTION_DAYS` | Django | `30` | User photo retention window |
| `CELERY_BROKER_URL` | Django/Celery | `REDIS_URL` | Job queue broker |

**Enable real AI try-on (recommended):**

1. Create a free account at [fal.ai](https://fal.ai) and copy your API key.
2. Add to `apps/backend/.env`:

```env
FAL_KEY=your_fal_api_key_here
DEFAULT_TRYON_PROVIDER=auto
```

With `auto`, the backend picks **Fal (FASHN v1.6)** when `FAL_KEY` is set, else Replicate if token is set, else demo overlay.

> Virtual try-on uses **vision/image models** (VTON), not text LLMs. FASHN and IDM-VTON are purpose-built for fitting clothes onto photos.

**Try-on flow:**
1. Sign in and open a product → **Virtual try-on**
2. Select variant, upload photo, accept consent
3. `POST /api/tryon/jobs/` creates a job; Celery worker runs the provider
4. Frontend polls `GET /api/tryon/jobs/{id}/` until `completed` or `failed`
5. Optional: **Speak with a stylist** → `POST /api/tryon/csr/`

**Staff:** http://localhost:3000/admin/tryon — stylist queue with status + notes (`PATCH /api/admin/tryon/csr/{id}/`).

**Docker:** `docker compose up` starts `backend`, `celery`, `redis`, `db`, and `minio`. Run migrations after pull:

```bash
docker compose exec backend python manage.py migrate
```

**Privacy:** User photos are stored in private media (`tryon/user-photos/`). Demo mode composites locally; production should use `replicate` or another commercial VTON API. Photos are purged after `TRYON_PHOTO_RETENTION_DAYS` (purge task can be scheduled via Celery beat in production).

## Feature checklist (Phase 2)

| Feature | Status |
|---------|--------|
| Try-on job API (upload, poll, list) | ✅ Complete |
| Demo try-on provider (no API key) | ✅ Fallback only |
| Fal.ai FASHN v1.6 provider | ✅ Complete (requires FAL_KEY) |
| Replicate IDM-VTON provider | ✅ Complete (requires token) |
| Celery async processing | ✅ Complete |
| Product page try-on UI | ✅ Complete |
| CSR stylist handoff | ✅ Complete |
| Admin stylist queue | ✅ Complete |
| Photo consent + retention setting | ✅ Complete |
| In-app notifications (bell + inbox) | ✅ Complete |
| Groq AI stylist chat | ✅ Complete |
| Celery Beat (photo + notification purge) | ✅ Complete |
| Push notifications (browser/mobile) | ❌ Future |

## Notifications (Phase 3)

Signed-in customers see a **bell icon** in the navbar. Notifications poll every ~45 seconds and on window focus.

| Event | Who gets notified |
|-------|-------------------|
| Order confirmed | Customer |
| Payment failed | Customer |
| Order shipped / delivered / cancelled | Customer (via Django admin status change) |
| Try-on completed / failed | Customer |
| CSR handoff created | Staff |
| CSR contacted / resolved | Customer |

**API:**
- `GET /api/notifications/` — list
- `GET /api/notifications/unread-count/` — badge count
- `PATCH /api/notifications/{id}/read/` — mark one read
- `POST /api/notifications/mark-all-read/` — mark all read

**Frontend:** `/notifications` full inbox page.

**Celery Beat** (docker `celery-beat` service): purges try-on photos daily, old notifications weekly.

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
| `GET /api/health/` | Liveness/readiness (DB + Redis) |
| `POST /api/webhooks/stripe/` | Stripe payment webhooks (when using Stripe) |
| `GET /api/notifications/` | List in-app notifications |
| `GET /api/notifications/unread-count/` | Unread badge count |
| `POST /api/tryon/jobs/` | Create virtual try-on job (multipart) |
| `GET /api/tryon/jobs/{id}/` | Poll try-on job status + result |
| `POST /api/tryon/csr/` | Request stylist follow-up |
| `GET /api/admin/tryon/csr/` | Staff stylist queue |

## Models

- **Catalog**: `Category`, `Product`, `ProductVariant` (fabric, color, size), `ProductImage`
- **Cart**: `Cart` (user or session), `CartItem` (variant-based)
- **Orders**: `Order`, `OrderItem`, `Address`, `Payment` (pending/paid/failed)
- **Try-on**: `TryOnJob` (user photo, result, status), `CSRHandoff` (stylist requests)
- **Notifications**: `Notification` (in-app alerts per user)

Product images are stored in S3-compatible storage (MinIO locally via Docker).

## Type generation

After API changes:

```bash
npm run generate:types
```

This exports `apps/backend/schema.yaml` via drf-spectacular, then generates `packages/types/src/generated.ts` with openapi-typescript.

## Production hardening

The project includes production-oriented defaults while keeping **demo payments** as the server-side provider (`DEFAULT_PAYMENT_PROVIDER=demo`). Clients cannot override the payment provider at checkout.

| Area | Implementation |
|------|----------------|
| Payments | Server-only provider selection; demo checkout for local/staging |
| Auth | JWT refresh rotation + blacklist; `is_staff` hidden from non-staff `/me` |
| API proxy | Allowlisted paths only (no admin routes) |
| Media | Optional private S3 (`S3_PRIVATE_MEDIA=true`) with presigned URLs |
| Runtime | Gunicorn in backend Docker image; `/api/health/` probe |
| Security | HTTPS headers when `DEBUG=False`; Next.js security headers |
| Ops | Structured logging, optional Sentry (`SENTRY_DSN`), `scripts/backup-db.sh` |

**Before a public deploy**, also set: `DEBUG=False`, strong `SECRET_KEY`, real `ALLOWED_HOSTS` / CORS / CSRF origins, TLS reverse proxy, and `S3_PRIVATE_MEDIA=true` for user try-on photos.

```bash
# Apply new migrations (JWT blacklist + order indexes)
docker compose exec backend python manage.py migrate

# Rebuild backend with Gunicorn
docker compose up -d --build backend celery celery-beat
```

## CI

GitHub Actions runs on push/PR:

- **Backend**: `ruff check` + `pytest` + `pip-audit` (SQLite test settings)
- **Frontend**: ESLint + `next build` + unit tests + `npm audit`
