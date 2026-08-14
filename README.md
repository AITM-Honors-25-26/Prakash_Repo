# Melina's Bakery ☕🍰

A full-featured **restaurant & bakery management system** with a customer-facing
ordering portal and an admin/staff dashboard. The project is a monorepo
containing an Express API backend and a React Single-Page Application (SPA)
frontend, both containerized with Docker.

> **Melina's Bakery – Where passion blooms and pastries rise. Freshly baked
> happiness every day.**

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Setup & Installation](#setup--installation)
  - [Option 1 — Docker Compose (recommended)](#option-1--docker-compose-recommended)
  - [Option 2 — Run Locally](#option-2--run-locally)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [App Ports](#app-ports)
- [Author](#author)

---

## Features

### Customer-Facing (Frontend)

- **Table QR ordering** – Scan a table's QR code to open the menu on your phone;
  the table number is passed through the URL so orders are auto-linked to a table.
- **Dynamic menu** – Browse menu items grouped by category (Bread, Cake,
  Cupcake, Cookies, Pastries, Donuts, Beverage, Special).
- **Cart & checkout** – Add items to a cart, checkout as a guest or registered
  user, and pay via **eSewa** (Nepal payment gateway).
- **Order tracking** – Real-time order status updates (Pending → Preparing →
  Ready → Completed) powered by **Socket.IO**.
- **Contact / About pages** – Static info pages with an embedded Google Map.

### Staff & Admin (Frontend + Backend)

- **Role-based access** – Admin, Chef, Waiter, Reception, and Employee roles.
- **Staff management** – List, add, edit, and manage staff users.
- **Menu management** – Add, edit, and delete menu items with image uploads
  (stored on **Cloudinary**).
- **Table management** – Create, occupy, release, and scan QR codes for tables.
  Tables show real-time occupancy status.
- **Order management** – Kitchen dashboard to update order statuses; orders are
  filtered by the staff member's role and table ownership.
- **Dashboard** – Overview cards and quick actions for management.
- **Analytics** – Sales trends and top-selling items reports.
- **Membership** – OTP-based membership enrollment via WhatsApp / SMS; members
  get loyalty benefits.
- **Billing settings** – Configure service charges, VAT, and packaging fees;
  preview the computed bill.
- **Reception billing** – Reception view to look up table payments and settle
  bills.
- **Profile settings** – Update profile photo and personal details.

### Infrastructure

- **JWT-based authentication** with bcrypt-hashed passwords.
- **Redis** (BullMQ) for background job processing: email, SMS, and WhatsApp
  notification workers.
- **Socket.IO** for real-time table occupancy and order status updates.
- **Multer** for file uploads with centralized error handling.
- **Cloudflare Turnstile** CAPTCHA on auth forms.
- **Health check** endpoint (`GET /health`).
- **Dockerized** with a single `docker-compose.yml` covering backend, frontend,
  and Redis.

---

## Tech Stack

| Layer         | Technology                                      |
| ------------- | ----------------------------------------------- |
| **Frontend**  | React 19, TypeScript, Vite, React Router DOM 7   |
| **Styling**   | SCSS Modules                                    |
| **HTTP**      | Axios                                           |
| **Realtime**  | Socket.IO client                                |
| **UI libs**   | sweetalert2, react-toastify, @marsidev/turnstile|
| **Backend**   | Node.js, Express 5, Mongoose (MongoDB)          |
| **Auth**      | JSON Web Tokens, bcryptjs, Joi validation       |
| **Queues**    | BullMQ (Redis)                                  |
| **Realtime**  | Socket.IO (server)                              |
| **Media**     | Cloudinary, Multer                              |
| **Messaging** | Nodemailer (email), Sparrow SMS, WhatsApp BAP   |
| **Payments**  | eSewa (Nepal)                                   |
| **Infra**     | Docker, Docker Compose, Redis 7 Alpine          |

---

## Project Structure

```
melinas-bakery/
├── docker-compose.yml         # Orchestration: backend, frontend, redis
├── Backend/
│   ├── index.js               # HTTP + Socket.IO server entrypoint (port 9005)
│   ├── Dockerfile
│   ├── package.json
│   ├── .env                   # Actual env (git-ignored)
│   ├── .env.sample            # Env variable template
│   ├── README.md              # Backend quick notes
│   ├── src/
│   │   ├── config/            # Express, MongoDB, router, queue, constants
│   │   ├── middleware/        # Auth, file-handling, validation, timeout
│   │   └── modules/           # auth | menu | table | order | contactAdmin |
│   │                            payment | settings | analytics | membership
│   └── public/uploads/        # Local uploaded files
└── Frontend/
    ├── index.html
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.app.json
    └── src/
        ├── components/        # Reusable UI (header, layout, esewa, membership)
        ├── pages/             # Route pages (Home, Menu, Checkout, OrderTracking,
        │                       Dashboard, Analytics, StaffManagement, etc.)
        ├── constants/         # API endpoints, categories, order statuses
        ├── utils/             # Session ID, eSewa signature helper
        └── assets/img/        # Images & logos
```


---

## Prerequisites

- **Docker** & **Docker Compose** (recommended), **or**
- **Node.js 22** (local dev), plus
- **MongoDB** (Atlas or local)
- **Redis** (local or via Docker)
- Accounts/keys for Cloudinary, eSewa, SMTP, Sparrow SMS, and WhatsApp BAP (only
  required for features that use them)

---

## Environment Variables

Copy the sample and fill in your values. The backend loads variables from
`Backend/.env` via `dotenv`.

```bash
cp Backend/.env.sample Backend/.env
```

| Variable                    | Purpose                                         |
| --------------------------- | ----------------------------------------------- |
| `MONGODB_URL`               | MongoDB connection string                       |
| `MONGO_DB_NAME`             | Database name (default `Prakash`)               |
| `CLOUDINARY_*`              | Cloudinary cloud name, API key & secret         |
| `JWT_SECRET`                | Secret used to sign JWT tokens                  |
| `FRONTEND_URL`              | Frontend origin (for CORS, redirects, emails)   |
| `BACKEND_URL`               | Backend API origin                              |
| `SMTP_*`                    | Outgoing email (host, port, user, password)     |
| `ESEWA_SECRET_KEY`          | eSewa payment secret                            |
| `MERCHANT_ID`               | eSewa merchant ID                               |
| `SPARROW_*`                 | Sparrow SMS gateway credentials                 |
| `WHATSAPP_*`                | WhatsApp Business API credentials               |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection (defaults to `127.0.0.1:6379`) |

> 💡 In Docker Compose the `REDIS_HOST` is set to the `redis` service name so the
> backend can reach the containerized Redis.

### Frontend environment variables

The frontend reads Vite-prefixed env vars at build time. In Docker Compose these
are injected from the host environment (with sensible empty-string fallbacks).

| Variable             | Purpose                          |
| -------------------- | -------------------------------- |
| `VITE_PUBLIC_URL`    | Publicly accessible frontend URL |
| `VITE_API_BASE_URL`  | Backend API base URL             |

If unset, the frontend **auto-detects** the API and frontend origins from the
current browser location, and can even discover the local network IP via WebRTC
STUN — so the QR-code table-ordering experience works seamlessly on LAN devices
without any env configuration.


---

## Setup & Installation

### Option 1 — Docker Compose (recommended)

This brings up the **backend (9005)**, **frontend (5173)**, and **Redis (6379)**
in one command.

```bash
# 1. Copy env sample & fill in your secrets
cp Backend/.env.sample Backend/.env

# 2. (Optional) Set frontend env vars if auto-detection is not enough
export VITE_PUBLIC_URL="http://localhost:5173"
export VITE_API_BASE_URL="http://localhost:9005/api"

# 3. Build & start
docker-compose up --build
```

> **Note on the Windows lock-file:** `package-lock.json` was generated on Windows.
> The Dockerfiles for both services **regenerate** dependencies inside the Linux
> Alpine container (`RUN npm install` without copying the lock file) to avoid
> missing native optional dependencies (e.g. `@rolldown/binding-linux-x64-musl`).
> The bind-mount of `node_modules` is excluded from the host so the container's

---

## API Overview

All API routes are mounted under `/api`. A health check is available at
`/health`.

| Resource        | Base path                | Methods                              |
| --------------- | ------------------------ | ------------------------------------ |
| Auth            | `/auth/...`              | Register, Login, Forgot/Reset pass, Profile photo, Staff CRUD |
| Menu            | `/menu/...`              | List, add-item, get, update, delete  |
| Tables          | `/table/...`             | List, add, get, occupy, update, delete |
| Orders          | `/order/...`             | List, by-table, status, action       |
| Contact Admin   | `/conatctAdmin`          | Submit contact form                  |
| Payments        | `/payment/esewa/...`     | eSewa init, QR generation, verification |
| Settings        | `/settings/billing/...`  | Get/set billing config, preview      |
| Analytics       | `/analytics/...`         | Overview, sales-trend, top-items     |
| Membership      | `/members/...`           | OTP request/verify, lookup, list, CRUD |

See [`Frontend/src/constants/constants.tsx`](Frontend/src/constants/constants.tsx)
for the full list of `API_ENDPOINTS`.

**Authentication:** JWT tokens are issued on login and sent in the
`Authorization: Bearer <token>` header for protected routes.

**Real-time:** The Socket.IO server (same as the HTTP server on port 9005)
supports a `join-room` event so clients can subscribe to table/order rooms and
receive live status updates.

---

## App Ports

| Service  | Port |
| -------- | ---- |
| Frontend | 5173 |
| Backend  | 9005 |
| Redis    | 6379 |

---

## Author

**Prakash Budha Magar** — Built with ❤️ in Nepal.

---

*Made for Melina's Bakery.*

> install is preserved at runtime.

### Option 2 — Run Locally

#### Backend

```bash
cd Backend

# Install once (Node 22 recommended)
npm install

# Make sure .env is configured (see Environment Variables above)

# Start HTTP + Socket.IO server (port 9005)
npm run watch

# Optional: start the BullMQ workers — these are auto-imported by index.js,
# but you can also run them directly:
# node src/queues/email.worker.js
# node src/queues/sms.worker.js
# node src/queues/whatsapp.worker.js
```

#### Frontend

```bash
cd Frontend

# Install dependencies
npm install

# Start Vite dev server (host 0.0.0.0:5173)
npm run dev

# Build for production (runs tsc type-check first)
npm run build

# Preview the production build locally
npm run preview
```

---

## Available Scripts

### Backend (`Backend/`)

| Script        | Description                               |
| ------------- | ----------------------------------------- |
| `npm run watch` | Start dev server with nodemon           |
| `npm test`    | (Placeholder) echo "no test specified"   |

### Frontend (`Frontend/`)

| Script           | Description                      |
| ---------------- | -------------------------------- |
| `npm run dev`    | Start Vite dev server            |
| `npm run build`  | Type-check + production build    |
| `npm run lint`   | Run ESLint                       |
| `npm run preview`| Serve the production build       |

