# 🎬 Studio CRM

Complete CRM and business management system for wedding and event photography/videography studios.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 16 (local or Docker)

### 1. Start the Database

**Option A: Docker (Recommended)**
```bash
docker compose up -d
```

**Option B: Local PostgreSQL**  
Make sure PostgreSQL is running and update the `DATABASE_URL` in `backend/.env`.

### 2. Setup Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the App
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

### 📧 Login Credentials
| Email | Password | Role |
|-------|----------|------|
| admin@studio.com | Admin@123 | Owner |
| manager@studio.com | Manager@123 | Manager |
| sales@studio.com | Sales@123 | Sales |
| accounts@studio.com | Accounts@123 | Accountant |

## 📦 Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL 16
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## 🏗️ Modules
| Module | Description |
|--------|------------|
| Dashboard | KPI overview, revenue charts, alerts |
| Customers | Client management with financial summary |
| Leads | Inquiry tracking with status pipeline |
| Events | Wedding/event management with sub-events |
| Packages | Service package pricing & services |
| Contracts | Agreement with items & financial tracking |
| Payments | Transaction recording with validation |
| Invoices | Invoice generation & tracking |
| Team | Employee management & assignments |
| Tasks | Task assignment & status tracking |
| Deliverables | Photo/video delivery tracking |
| Reports | Revenue, customer, lead, event analytics |
| Notifications | Alert system |
| Search | Global search across modules |

## 📁 Project Structure
```
studio-crm/
├── backend/
│   ├── prisma/          # Schema & seed
│   └── src/
│       ├── config/      # App configuration
│       ├── controllers/ # Request handlers
│       ├── middleware/   # Auth, validation, errors
│       ├── routes/       # API routes
│       ├── utils/        # Helpers
│       └── validators/   # Zod schemas
├── frontend/
│   └── src/
│       ├── components/  # UI & layout components
│       ├── lib/         # API client, auth, utils
│       ├── pages/       # All page components
│       └── services/    # API service functions
└── docker-compose.yml
```

## 💰 Currency
All financial values are in **INR (₹)**.

## 📊 Seed Data
The seed script creates:
- 4 users, 40 customers, 15 employees
- 6 packages, 30 leads, 30 events
- 25 contracts, 50 payments, 25 invoices
- 40 tasks, 40 deliverables, 60 interactions
