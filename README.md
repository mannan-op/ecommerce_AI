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

## Quick start (Docker — recommended)

Run the **full stack** in Docker: PostgreSQL, Redis, MinIO, Django API, Celery workers, and Next.js frontend.

### 1. Install JS dependencies (needed for type generation / local dev)

```bash
npm install
```

### 2. Backend environment

```bash
cp apps/backend/.env.docker.example apps/backend/.env
```

Edit `apps/backend/.env` and set at minimum:

```env
# Required for Hugging Face virtual try-on (free token from https://huggingface.co/settings/tokens)
HF_TOKEN=hf_your_token_here

# Optional — AI stylist chat (https://console.groq.com/keys)
GROQ_API_KEY=gsk_your_key_here
```

Never commit `.env`.

> **Try-on provider:** `docker-compose.yml` sets `DEFAULT_TRYON_PROVIDER=huggingface` for backend + Celery. To use local demo overlay instead (no external API), change it to `demo` in `docker-compose.yml` and run `docker compose up -d backend celery celery-beat`.

### 3. Build and start all services

```bash
docker compose up --build -d
```

Wait until services are healthy:

```bash
docker compose ps
```

Migrations run automatically when backend/Celery containers start.

### 4. Load demo catalog (first time)

```bash
docker compose exec backend python manage.py seed_demo --replace-images
```

Use `--clear` to reset users + catalog first:

```bash
docker compose exec backend python manage.py seed_demo --clear --replace-images
```

### 5. Open the app

| Service | URL |
|---------|-----|
| **Store (frontend)** | http://localhost:3000 |
| **API health** | http://localhost:8000/api/health/ |
| **API docs (Swagger)** | http://localhost:8000/api/docs/ |
| **Django admin** | http://localhost:8000/admin/ |
| **MinIO console** | http://localhost:9001 (`minioadmin` / `minioadmin`) |

**Demo accounts**

| Email | Password | Role |
|-------|----------|------|
| `demo@example.com` | `demo12345` | Customer (with saved PK addresses) |
| `admin@example.com` | `admin12345` | Staff + Django superuser |

### Useful Docker commands

```bash
# View logs (all services)
docker compose logs -f

# View logs (one service)
docker compose logs -f celery

# Stop everything
docker compose down

# Rebuild after code changes
docker compose up -d --build

# Rebuild frontend only (e.g. after Next.js config changes)
docker compose up -d --build frontend

# Run backend tests
docker compose exec backend pytest

# Apply migrations manually
docker compose exec backend python manage.py migrate

# Django shell
docker compose exec backend python manage.py shell
```

---

## Quick start (hybrid — Docker backend + local frontend)

Use this if you want hot reload on the Next.js app while keeping infra in Docker.

### 1–2. Same as above (`npm install`, copy `.env`)

### 3. Start backend stack only (no frontend container)

```bash
docker compose up --build -d db redis minio createbuckets backend celery celery-beat
```

### 4. Seed demo data

```bash
docker compose exec backend python manage.py seed_demo --replace-images
```

### 5. Frontend env + dev server

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
npm run dev --workspace=@ecommerce/frontend
```

Frontend: http://localhost:3000

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

| Variable | App | Default (Docker) | Description |
|----------|-----|------------------|-------------|
| `DEFAULT_TRYON_PROVIDER` | Django | `huggingface` | `demo`, `huggingface`, `fal`, `replicate`, or `auto` |
| `HF_TOKEN` | Django | — | **Free** Hugging Face token for IDM-VTON Space |
| `TRYON_HF_SPACE` | Django | `yisol/IDM-VTON` | Hugging Face Gradio Space slug |
| `TRYON_PREFER_FREE` | Django | `True` | With `auto`, prefer HF before paid providers |
| `FAL_KEY` | Django | — | Fal.ai key for FASHN v1.6 VTON |
| `TRYON_FAL_MODEL` | Django | `fal-ai/fashn/tryon/v1.6` | Fal virtual try-on model |
| `REPLICATE_API_TOKEN` | Django | — | Replicate IDM-VTON fallback |
| `TRYON_SYNC_PROCESSING` | Django | `False` | Process jobs inline (no Celery worker) |
| `TRYON_PHOTO_RETENTION_DAYS` | Django | `30` | User photo retention window |
| `THROTTLE_TRYON` | Django | `60/hour` | Rate limit for **creating** try-on jobs only |
| `CELERY_BROKER_URL` | Django/Celery | `REDIS_URL` | Job queue broker |

**Enable Hugging Face try-on (recommended for local Docker):**

1. Create a free token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) (read access is enough).
2. Add to `apps/backend/.env`:

```env
HF_TOKEN=hf_your_token_here
DEFAULT_TRYON_PROVIDER=huggingface
```

3. Recreate workers:

```bash
docker compose up -d backend celery celery-beat
```

4. Verify:

```bash
docker compose exec backend python -c "import urllib.request,json; print(json.loads(urllib.request.urlopen('http://localhost:8000/api/tryon/jobs/config/').read())['provider'])"
# Expected: huggingface
```

**Notes:**
- First request after the HF Space sleeps can take **1–3 minutes** (cold start + free GPU queue).
- Free HF accounts have **daily GPU limits**; retry tomorrow or switch provider if quota is exceeded.
- If Hugging Face times out from Docker, retry once. For offline demos, set `DEFAULT_TRYON_PROVIDER=demo` in `docker-compose.yml`.

**Other providers (`auto` selection order when keys are set):**

1. Hugging Face (if `HF_TOKEN` + `TRYON_PREFER_FREE=True`)
2. Fal (if `FAL_KEY`)
3. Replicate (if `REPLICATE_API_TOKEN`)
4. Demo overlay (fallback)

**Try-on flow:**
1. Sign in and open a product → **Virtual try-on**
2. Select variant, upload photo, accept consent
3. `POST /api/tryon/jobs/` creates a job; Celery worker runs the provider
4. Frontend polls `GET /api/tryon/jobs/{id}/` until `completed` or `failed` (up to ~3 min)
5. Optional: **Speak with a stylist** → `POST /api/tryon/csr/`

**Staff:** http://localhost:3000/admin/tryon — stylist queue with status + notes (`PATCH /api/admin/tryon/csr/{id}/`).

**Docker services for try-on:** `backend`, `celery`, `celery-beat`, `redis`, `minio`, `db`. Celery must be running — check with `docker compose ps` and `docker compose logs celery`.

**Privacy:** User photos are stored in media (`tryon/user-photos/`). Set `S3_PRIVATE_MEDIA=true` in production. Photos are purged after `TRYON_PHOTO_RETENTION_DAYS` via Celery Beat.

## Feature checklist (Phase 2)

| Feature | Status |
|---------|--------|
| Try-on job API (upload, poll, list) | ✅ Complete |
| Demo try-on provider (no API key) | ✅ Complete |
| Hugging Face IDM-VTON provider | ✅ Complete (requires HF_TOKEN) |
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

**Product images in Docker:** The frontend container loads images directly from MinIO at `http://localhost:9000/...` (`NEXT_IMAGE_UNOPTIMIZED=true` in `docker-compose.yml`). If images are missing after first run, seed with `--replace-images`.

## Troubleshooting (Docker)

| Issue | Fix |
|-------|-----|
| Product images blank | `docker compose exec backend python manage.py seed_demo --replace-images` then hard-refresh browser |
| Try-on rate limited | Wait for window to reset, or `docker compose exec redis redis-cli KEYS "throttle_tryon_*"` and delete keys |
| HF SSL / timeout error | Retry; ensure Docker has outbound HTTPS. Temporarily set `DEFAULT_TRYON_PROVIDER=demo` |
| Celery not processing | `docker compose ps` — ensure `celery` is up; check `docker compose logs celery` |
| Frontend changes not applied | `docker compose up -d --build frontend` |
| Backend code changes | Auto-loaded via volume mount; restart if needed: `docker compose restart backend celery` |

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
