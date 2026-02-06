# PCRD — Deadstock Intake & Listing Portal

A full-stack application for fashion brands to manage deadstock inventory. Upload items via CSV, auto-price based on condition/category, and list for resale.

## Tech Stack

- **Backend**: NestJS 11, Prisma 7 (PostgreSQL adapter), JWT Authentication
- **Frontend**: Angular 19, Tailwind CSS v4, Font Awesome Icons
- **Database**: PostgreSQL (production), Docker Compose for local development
- **Validation**: Zod schemas for both API and CSV parsing
- **Deployment**: Railway (containerized deployment)

## Quick Start

### Option A: Docker (Recommended - Works on Mac, Linux, Windows)

```bash
# Start both backend and frontend
docker-compose up --build

# Access the app at http://localhost:4200
# API available at http://localhost:3000
```

To stop: `docker-compose down`

> See [Docker Setup & Usage](#docker-setup--usage) section below for detailed Docker information.

### Option B: Manual Setup

#### Prerequisites
- Node.js 20+
- npm 10+

#### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 2. Setup Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma migrate dev --name init
```

#### 3. Configure Environment

Create `backend/.env`:
```env
DATABASE_URL="postgresql://muna_user:muna_password_local_dev@localhost:5432/muna_africa"
JWT_SECRET="your-secret-key-change-in-production"
CORS_ORIGINS="http://localhost:4200"
```

> **Note**: For local development with Docker, the DATABASE_URL is set in `docker-compose.yml`. The above is for manual setup only.

#### 4. Run the Application

```bash
# Terminal 1: Start backend (http://localhost:3000)
cd backend
npm run start:dev

# Terminal 2: Start frontend (http://localhost:4200)
cd frontend
npm run dev
```

## Usage

### Login / Sign Up

1. Navigate to http://localhost:4200
2. Click "Sign up" to create a new account
3. Enter email and password (min 6 characters)

**Test Credentials** (after signup):
- Email: `test@example.com`
- Password: `Password123`

### Uploading Inventory

1. After login, click the **Upload CSV** button
2. Select a CSV file (sample provided in `data/sample_deadstock_inventory_valid.csv`)
3. View upload results showing:
   - Successfully imported items
   - Validation errors with row numbers
   - Duplicate detection (within file and database)

### Sample CSV Format

```csv
merchant_id,sku,title,brand,category,condition,original_price,currency,quantity
m_001,DSK-001,Blue Denim Jacket,Levis,Jackets,good,899.00,ZAR,1
m_001,DSK-002,Classic White Shirt,Zara,Tops,like_new,349.00,ZAR,2
m_001,DSK-003,Black Cotton Tee,,Tops,good,199.00,ZAR,3
```

**Column Specifications:**
| Column | Required | Constraints |
|--------|----------|-------------|
| merchant_id | Yes | Max 10 chars |
| sku | Yes | Max 10 chars, unique per merchant |
| title | Yes | Max 30 chars |
| brand | No | Max 20 chars |
| category | Yes | Tops, Bottoms, Outerwear, Jackets, Dresses, Knitwear, Shoes, Accessories, Activewear |
| condition | Yes | new, like_new, good, fair |
| original_price | Yes | 0.01 - 5000 |
| currency | Yes | 3-letter code (e.g., ZAR, USD) |
| quantity | Yes | 1 - 200 |

### Workflow: Upload → Price → List

1. **Upload**: Items start in DRAFT status
2. **Price**: Click "$" to auto-price or use "Set Price" for manual pricing
3. **List**: Click rocket icon to mark as LISTED

**Bulk Actions**: Select multiple items using checkboxes for bulk pricing/listing/deletion.

**Filtering**: Click status badges (Draft, Priced, Listed) to filter. Click again to toggle off.

## Pricing Formula

```
resale_price = original_price × condition_multiplier × category_multiplier
```

**Condition Multipliers:**
- New: 0.70
- Like New: 0.60
- Good: 0.50
- Fair: 0.35

**Category Multipliers:**
- Outerwear: 1.10
- Jackets: 1.05
- Dresses: 1.00
- Shoes: 0.95
- Knitwear: 0.90
- Bottoms: 0.85
- Tops: 0.80
- Activewear: 0.80
- Accessories: 0.75

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/signup | Create account |
| POST | /auth/signin | Login |
| GET | /inventory | List items (filter: ?status=DRAFT,PRICED) |
| POST | /inventory | Create single item |
| PUT | /inventory/:id | Update item |
| DELETE | /inventory/:id | Delete item |
| POST | /inventory/bulk-upload | Upload CSV |
| POST | /inventory/:id/auto-price | Auto-price single item |
| POST | /inventory/auto-price-bulk | Auto-price multiple items |
| POST | /inventory/:id/set-price | Set manual price |
| POST | /inventory/:id/list | Mark as listed |
| POST | /inventory/list-bulk | List multiple items |

## Running Tests

### With npm (Local Development)

```bash
cd backend
npm test
```

**Expected Output:**
```
 PASS  src/common/constants/pricing.constants.spec.ts
 PASS  src/inventory/helpers/csv-validation.spec.ts

Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
```

**Test Coverage:**
- **Pricing Logic** (11 tests): Validates condition/category multipliers and price calculations
- **CSV Validation** (14 tests): Tests header validation, row parsing, duplicate detection, and error handling

### With Docker

```bash
# Run tests in container
docker-compose run --rm backend npm test

# Or build and test in one command
docker build -t pcrd-backend ./backend && docker run --rm pcrd-backend npm test
```

### Test Files

| File | Tests | Description |
|------|-------|-------------|
| `pricing.constants.spec.ts` | 11 | Pricing formula, multipliers, edge cases |
| `csv-validation.spec.ts` | 14 | Header validation, row parsing, duplicates |


## Docker Setup & Usage

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- No Node.js required on host machine!

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Your Browser                      │
│               http://localhost:4200                  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              Frontend Container                      │
│                (nginx:alpine)                        │
│    • Serves Angular static files                    │
│    • Direct API calls to backend                    │
│    Port: 4200 → 80                                  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               Backend Container                      │
│                (node:20-slim)                        │
│    • NestJS API server                              │
│    • Prisma with @prisma/adapter-pg                 │
│    Port: 3000 → 3000                                │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│            PostgreSQL Container                      │
│              (postgres:16-alpine)                    │
│    • Production-grade RDBMS                         │
│    • Volume: muna-postgres-data                     │
│    Port: 5432 → 5432                                │
└─────────────────────────────────────────────────────┘
```

### Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in background (detached)
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Stop all containers
docker-compose down

# Stop and remove volumes (resets database)
docker-compose down -v

# Rebuild without cache (fresh build)
docker-compose build --no-cache
```

### Checking Status

```bash
# See running containers
docker-compose ps

# Expected output:
# NAME                    STATUS         PORTS
# munaafrica-backend-1    Up 2 minutes   0.0.0.0:3000->3000/tcp
# munaafrica-frontend-1   Up 2 minutes   0.0.0.0:4200->80/tcp
```

### Testing the Deployment

```bash
# Test backend API
curl http://localhost:3000/auth/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"docker@test.com","password":"password123"}'

# Open frontend in browser
open http://localhost:4200  # Mac
start http://localhost:4200 # Windows
```

### Running Tests in Docker

```bash
docker-compose run --rm backend npm test
```

### Data Persistence

PostgreSQL database is stored in a Docker volume:
- Volume name: `muna-postgres-data`
- Persists between container restarts
- To reset: `docker-compose down -v`
- Data survives `docker-compose down` but NOT `docker-compose down -v`

### Troubleshooting Docker

| Problem | Solution |
|---------|----------|
| Port 3000 in use | Stop local backend: `Get-Process -Name node \| Stop-Process` |
| Port 4200 in use | Stop local frontend or change port in docker-compose.yml |
| Container exits immediately | Check logs: `docker-compose logs backend` |
| Database errors | Reset: `docker-compose down -v && docker-compose up --build` |
| Changes not reflected | Rebuild: `docker-compose up --build` |

### Production Deployment

This application is deployed on Railway with:
1. PostgreSQL database (managed service)
2. Separate backend and frontend services
3. Environment variables for secrets
4. HTTPS provided by Railway
5. Automatic deployments from GitHub

See the live demo above for the production instance.

## Key Assumptions & Tradeoffs

### Assumptions
1. **Single currency per item**: Each item has its own currency; no conversion is performed
2. **Unique constraint**: merchant_id + sku must be unique per user
3. **Pricing is one-way**: Once priced, items cannot revert to DRAFT
4. **PostgreSQL with Prisma 7**: Uses driver adapters for connection pooling and production reliability

### Tradeoffs
1. **JWT in localStorage**: Simple but less secure than httpOnly cookies. Acceptable for internal tools; production would use httpOnly cookies.
2. **No pagination**: All items loaded at once. Works for hundreds of items; would need pagination for thousands.
3. **Synchronous pricing**: Auto-price is instant. For complex pricing like ML-based, would need async job queue.
4. **No image upload**: Focus on data workflow. Images could be added as URLs or file uploads.
5. **Driver adapters overhead**: Prisma 7 requires @prisma/adapter-pg for PostgreSQL. Adds dependency but enables connection pooling and better error handling.
6. **Railway deployment costs**: Free tier has limits. Production usage may require paid plan for sustained traffic and database size.

### Future Enhancements
- XLSX support (currently CSV only)
- Image upload and management
- Export functionality
- Audit trail for status changes
- Role-based access control
- Pagination and search

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── inventory/      # Inventory CRUD & bulk operations
│   │   ├── common/         # Guards, pipes, decorators
│   │   └── prisma/         # Database service
│   ├── prisma/schema.prisma
│   ├── Dockerfile          # Backend container definition
│   └── .dockerignore
├── frontend/
│   ├── src/app/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── services/       # API services
│   │   └── models/         # TypeScript interfaces
│   ├── Dockerfile          # Frontend container (multi-stage)
│   ├── nginx.conf          # Nginx configuration
│   └── .dockerignore
├── docs/
│   ├── DOCKER_EXPLAINED.md # Visual Docker architecture guide
│   ├── COMMANDS.md         # CLI command reference
│   └── ISSUES_AND_SOLUTIONS.md
├── data/
│   ├── sample_deadstock_inventory_valid.csv
│   └── sample_deadstock_inventory_with_errors.csv
├── docker-compose.yml      # Container orchestration
└── README.md
```

## License

MIT
