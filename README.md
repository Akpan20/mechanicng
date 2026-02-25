# MechanicNG

A full-stack web platform connecting vehicle owners with mechanics in Nigeria. Users can search for nearby mechanics, request quotes, leave reviews, and book services — while mechanics can manage their profiles and subscriptions.

---

## Tech Stack

### Frontend

- **React 18** + **TypeScript** — UI framework
- **Vite** — Build tool and dev server
- **Tailwind CSS** — Utility-first styling
- **Redux Toolkit** + **React Query** — State management and server-state caching
- **React Router v6** — Client-side routing
- **Radix UI** — Accessible component primitives
- **Recharts** — Dashboard charts
- **React Leaflet** — Map integration
- **Framer Motion** — Animations
- **Zod** + **React Hook Form** — Form validation
- **Paystack** — Payment integration

### Backend

- **Node.js** + **Express** + **TypeScript** — REST API server
- **MongoDB** + **Mongoose** — Database and ODM
- **JWT** + **bcryptjs** — Authentication and password hashing
- **Nodemailer** — Email notifications
- **Multer** — File/image uploads
- **Helmet** + **CORS** + **express-rate-limit** — Security middleware
- **Zod** — Request validation

---

## Project Structure

```bash
mechanicng/
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Route-level page components
│       ├── hooks/         # Custom React hooks
│       ├── store/         # Redux slices
│       ├── lib/           # API clients, utilities, constants
│       └── types/         # TypeScript type definitions
│
└── backend/           # Express REST API
    └── src/
        ├── controllers/   # Route handler logic
        ├── models/        # Mongoose schemas
        ├── routes/        # Express route definitions
        ├── middleware/     # Auth, error handling
        └── lib/           # DB connection, JWT utilities
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/mechanicng
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=your_email_password
```

Start the development server:

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

Start the development server:

```bash
npm run dev
```

---

## Available Scripts

### Backend Scripts

| Script | Description |
| -------- | ------------- |
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run create-admin` | Seed an admin user |
| `npm run test-admin-api` | Run admin endpoint smoke tests |

### Frontend Scripts

| Script | Description |
| -------- | ------------- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript check without emitting |
| `npm test` | Run Vitest unit tests |
| `npm run test:coverage` | Run tests with coverage report |

---

## Key Features

- **Mechanic Search** — Find mechanics by location using geolocation and map-based search
- **Profiles** — Detailed mechanic profiles with ratings, reviews, and service listings
- **Quotes** — Request and manage service quotes
- **Reviews** — Leave and read mechanic reviews
- **Authentication** — JWT-based auth with protected routes for mechanics, users, and admins
- **Subscriptions** — Mechanic subscription management with Paystack payments
- **Ads Platform** — Admin-controlled ad campaigns with advertiser dashboard
- **Admin Panel** — Platform-wide stats, mechanic management, revenue reports, and campaign controls

---

## API Overview

The backend exposes a RESTful API under `/api`:

| Route | Description |
| ------- | ------------- |
| `/api/auth` | Register, login, token refresh |
| `/api/mechanics` | Search and view mechanic profiles |
| `/api/quotes` | Create and manage service quotes |
| `/api/reviews` | Submit and fetch mechanic reviews |
| `/api/subscriptions` | Manage mechanic subscription plans |
| `/api/ads` | Serve and manage ad campaigns |
| `/api/admin/mechanics` | Admin: mechanic management |

---

## Admin Setup

To create the initial admin account:

```bash
cd backend
npm run create-admin
```

See [`ADMIN_SETUP.md`](backend/ADMIN_SETUP.md) for full admin configuration details.

---

## Deployment

### Backend Deployment

Build and deploy to any Node.js host (Railway, Render, etc.):

```bash
npm run build
npm start
```

### Frontend Deployment

The frontend includes a `vercel.json` configuration for zero-config deployment to Vercel:

```bash
npm run build
# Deploy the dist/ folder
```

---

## License

Private. All rights reserved.
