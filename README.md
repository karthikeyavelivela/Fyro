# FYRO — Logistics Marketplace

FYRO is a full-stack logistics marketplace connecting customers in Vijayawada with transport drivers (trucks/tempos) and hamali workers (loading/unloading labour). Customers can book vehicles for goods transport or hire hamali teams for loading/unloading jobs, track their provider in real time, chat during the job, pay online, and file complaints.

---

## Tech Stack

### Frontend (`/client`)
- **Framework**: Next.js 14 (App Router, `'use client'` components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS custom properties (design tokens)
- **Animations**: Framer Motion
- **HTTP**: Axios (`withCredentials: true` for cookie auth)
- **Real-time**: Socket.IO client
- **Maps**: Leaflet (via `react-leaflet`, dynamic import)
- **Toast**: react-hot-toast
- **Icons**: Lucide React
- **Font**: Syne (Google Fonts)

### Backend (`/server`)
- **Runtime**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT stored in HTTP-only cookie (`fyro_token`, 7-day expiry)
- **Real-time**: Socket.IO
- **Validation**: express-validator
- **Rate limiting**: express-rate-limit
- **Image uploads**: Cloudinary + Multer
- **Payments**: Razorpay (mock in dev)
- **Password hashing**: bcryptjs

---

## Prerequisites

- Node.js >= 18
- npm >= 9
- MongoDB (local or Atlas)
- Git

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repo-url>
cd Fyro
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Install client dependencies

```bash
cd ../client
npm install
```

---

## Environment Variables

### Server — `server/.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fyro
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:3000

# Razorpay (use test keys from dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Cloudinary (optional — for profile photo uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Client — `client/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Running the Project

### Start the backend server

```bash
cd server
npm run dev
# Server starts on http://localhost:5000
```

### Start the frontend (in a new terminal)

```bash
cd client
npm run dev
# Client starts on http://localhost:3000
```

Both must be running simultaneously for the app to work.

---

## Seeding the Database

The seed script clears all collections and inserts 13 users, 5 vehicles, 4 hamali profiles, 16 bookings, 6 payments, 3 complaints, and 30 chat messages.

```bash
cd server
node seed.js
```

Expected output:
```
MongoDB connected
All collections cleared
Users created: 13
Vehicles created: 5
Hamali profiles created: 4
Bookings created: 16
Payments created: 6
Complaints created: 3
Messages created: 30
Seed completed successfully
```

---

## Test Credentials

All accounts use the password: **`Test@1234`**

| Name | Email | Role |
|---|---|---|
| Admin User | admin@fyro.com | admin |
| Arjun Reddy | customer1@fyro.com | customer |
| Priya Sharma | customer2@fyro.com | customer |
| Mohammed Irfan | customer3@fyro.com | customer |
| Ravi Kumar | driver1@fyro.com | driver |
| Suresh Babu | driver2@fyro.com | driver |
| Venkat Rao | driver3@fyro.com | driver |
| Kiran Kumar | driver4@fyro.com | driver |
| Prasad Naidu | driver5@fyro.com | driver |
| Ramesh | hamali1@fyro.com | hamali |
| Mahesh Team | hamali2@fyro.com | hamali |
| Ganesh Group | hamali3@fyro.com | hamali |
| Rajesh | hamali4@fyro.com | hamali |

Login via `http://localhost:3000/login` with email + password.

---

## Socket Events Reference

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join:user` | Client → Server | `{ userId }` | Subscribe to personal notifications |
| `join:booking` | Client → Server | `{ bookingId }` | Subscribe to a booking room |
| `driver:location_update` | Client → Server | `{ bookingId, lat, lng }` | Driver sends GPS position |
| `driver:location` | Server → Client | `{ lat, lng, updatedAt }` | Broadcast driver position to booking room |
| `message:send` | Client → Server | `{ bookingId, senderId, content }` | Send a chat message |
| `message:new` | Server → Client | Message object (populated) | New chat message in booking room |
| `booking:new` | Server → Client | `{ booking }` | New booking request for driver/hamali |
| `booking:accepted` | Server → Client | Booking object | Provider accepted booking (to customer) |
| `booking:rejected` | Server → Client | `{ bookingId, message }` | Provider declined (to customer) |
| `booking:status_update` | Server → Client | `{ status, booking }` | Status changed (all participants) |
| `kyc:updated` | Server → Client | `{ approved, reason, userId }` | KYC result (to provider) |
| `complaint:updated` | Server → Client | Complaint object | Complaint resolved/rejected (to customer) |

---

## Driver Simulation Script

Simulates a driver moving along a route for a given booking. Useful for testing live tracking.

```bash
node server/scripts/simulateDriver.js FY-2025-0009
```

Replace `FY-2025-0009` with any `in_progress` booking ID. The script connects via Socket.IO and emits `driver:location_update` every 4 seconds along a hardcoded Vijayawada route.

---

## API Endpoints Summary

### Auth — `/api/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user (auto-creates vehicle/hamali profile) |
| POST | `/api/auth/login` | Login with email+password, sets `fyro_token` cookie |
| POST | `/api/auth/logout` | Clear auth cookie |
| GET | `/api/auth/me` | Get current authenticated user |

### Customer — mixed routes (auth required, role: customer)

| Method | Path | Description |
|---|---|---|
| GET | `/api/vehicles/available` | List nearby available vehicles (`?lat&lng&type&radius`) |
| GET | `/api/hamali/available` | List nearby available hamali workers (`?lat&lng&radius`) |
| GET | `/api/fare/estimate` | Calculate fare estimate |
| POST | `/api/bookings` | Create a new booking |
| GET | `/api/bookings` | List customer's bookings (`?status&page`) |
| GET | `/api/bookings/:id` | Get booking detail by bookingId |
| PUT | `/api/bookings/:id/cancel` | Cancel a pending booking |
| POST | `/api/payments/order` | Create Razorpay order for a booking |
| POST | `/api/payments/verify` | Verify payment signature |
| GET | `/api/complaints` | List customer's complaints |
| POST | `/api/complaints` | File a new complaint |

### Driver — `/api/driver` (auth required, role: driver)

| Method | Path | Description |
|---|---|---|
| GET | `/api/driver/incoming` | Nearby pending transport bookings (within 15 km) |
| PUT | `/api/driver/bookings/:id/accept` | Accept a booking |
| PUT | `/api/driver/bookings/:id/reject` | Decline a booking |
| PUT | `/api/driver/bookings/:id/start` | Start a trip (status → `in_progress`) |
| PUT | `/api/driver/bookings/:id/complete` | Complete a trip |
| GET | `/api/driver/bookings` | List driver's bookings (`?status&page&limit`) |
| GET | `/api/driver/earnings` | Earnings summary + last 7 days chart data |
| PUT | `/api/driver/availability` | Toggle availability (`{ isAvailable }`) |
| PUT | `/api/driver/location` | Update GPS location (`{ lat, lng }`) |
| GET | `/api/vehicles/mine` | Get driver's vehicle details |

### Hamali — `/api/hamali` (auth required, role: hamali)

| Method | Path | Description |
|---|---|---|
| GET | `/api/hamali/incoming` | Nearby pending hamali bookings (within 8 km) |
| PUT | `/api/hamali/bookings/:id/accept` | Accept a job |
| PUT | `/api/hamali/bookings/:id/reject` | Decline a job |
| PUT | `/api/hamali/bookings/:id/start` | Start a job (status → `in_progress`) |
| PUT | `/api/hamali/bookings/:id/complete` | Complete a job |
| GET | `/api/hamali/bookings` | List hamali's bookings (`?status&page&limit`) |
| GET | `/api/hamali/earnings` | Earnings summary + last 7 days chart data |
| PUT | `/api/hamali/availability` | Toggle availability (`{ isAvailable }`) |
| PUT | `/api/hamali/location` | Update location (`{ lat, lng }`) |
| GET | `/api/hamali/profile/mine` | Get hamali profile (team size, rates, skills) |
| POST | `/api/hamali/profile` | Create hamali profile |
| PUT | `/api/hamali/profile` | Update hamali profile |

### Admin — `/api/admin` (auth required, role: admin)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/stats` | Platform stats (users, bookings today, revenue, complaints) |
| GET | `/api/admin/users` | List users with filters (`?role&search&kyc&page`) |
| PUT | `/api/admin/users/:id/deactivate` | Deactivate a user account |
| GET | `/api/admin/bookings` | List all bookings (`?status&bookingType&page`) |
| GET | `/api/admin/complaints` | List complaints (`?status&page`) |
| PUT | `/api/admin/complaints/:id` | Update complaint status + admin note |
| PUT | `/api/admin/kyc/:userId` | Approve or reject KYC (`{ approved, reason }`) |

### Messages — `/api/messages`

| Method | Path | Description |
|---|---|---|
| GET | `/api/messages/:bookingId` | Get chat messages for a booking |

---

## User Roles and Route Access

| Role | Frontend Routes |
|---|---|
| `customer` | `/dashboard`, `/book`, `/bookings`, `/bookings/[id]`, `/payments`, `/complaints`, `/profile` |
| `driver` | `/driver` (home), `/driver/incoming`, `/driver/bookings/[id]`, `/driver/earnings`, `/driver/profile` |
| `hamali` | `/hamali` (home), `/hamali/incoming`, `/hamali/bookings/[id]`, `/hamali/earnings`, `/hamali/profile` |
| `admin` | `/admin` (dashboard), `/admin/users`, `/admin/bookings`, `/admin/complaints`, `/admin/kyc` |

Route protection is handled by `middleware.ts` which reads the `fyro_token` cookie, decodes the JWT, and redirects to `/login` if missing or to the correct role home if the path does not match the user's role.

---

## Fare Calculation Examples

### Transport Fare Formula

```
fare = baseFare + (distanceKm x ratePerKm)
returnLoadDiscount = fare x 15%  (if returnLoad = true)
subtotal = fare - returnLoadDiscount
total = subtotal + (subtotal x 18% GST)
```

| Vehicle Type | Base Fare | Rate per km |
|---|---|---|
| Mini Truck | 80 | 12/km |
| Tempo | 110 | 16/km |
| 407 Truck | 160 | 22/km |
| 1-Ton Truck | 220 | 30/km |
| 2-Ton Truck | 300 | 40/km |

Example: Tempo, 12.5 km — Base 110 + Distance 200 = 310 + 18% GST = **366**

### Hamali Fare Formula

```
fare = baseFare + hourlyFare x (estimatedHours - 1)
floorSurcharge = 40 x floorNumber
heavySurcharge = (baseFare + hourlyFare) x 25%  (if heavyGoods = true)
subtotal = fare + floorSurcharge + heavySurcharge
total = subtotal + (subtotal x 18% GST)
```

| Team Size | Base Fare | Rate per extra hour |
|---|---|---|
| 1 person | 180 | 70/hr |
| 2–4 persons | 320 | 130/hr |
| 5+ persons | 550 | 220/hr |

Example: 1 person, 2 hours, ground floor, no heavy goods — Base 180 + 1 extra hr 70 = 250 + 18% GST = **295**

Example: 3 persons, 3 hours, floor 1, no heavy goods — Base 320 + 2 hrs 260 + floor 40 = 620 + 18% GST = **732**

---

## Design Tokens (CSS custom properties)

```css
--accent: #FF6B2B        /* Orange — transport/driver */
--teal: #0D9488          /* Teal — hamali */
--teal-light: #CCFBF1
--bg: #F2EFE9
--surface: #EAE6DF
--surface-raised: #E3DED6
--text: #0F0E0C
--text-muted: #6B6860
--text-faint: #A8A49E
--border: rgba(15,14,12,0.07)
--border-strong: rgba(15,14,12,0.14)
--green: #16A34A
--red: #DC2626
```

---

## Project Structure

```
Fyro/
├── client/                          # Next.js 14 frontend
│   ├── app/
│   │   ├── (customer)/              # Customer pages (dashboard, book, bookings, payments, complaints, profile)
│   │   ├── (driver)/                # Driver pages (home, incoming, bookings/[id], earnings, profile)
│   │   ├── (hamali)/                # Hamali pages (home, incoming, bookings/[id], earnings, profile)
│   │   ├── (admin)/                 # Admin pages (dashboard, users, bookings, complaints, kyc)
│   │   ├── login/                   # Login page
│   │   └── register/                # Registration page
│   ├── components/                  # Shared UI components
│   │   └── ui/                      # Base components (Button, Badge, Card, Modal, Input, etc.)
│   └── lib/                         # Utilities (api.ts, socket.ts, animations.ts)
│
├── server/                          # Express.js + Socket.IO backend
│   ├── src/
│   │   ├── models/                  # Mongoose models
│   │   ├── routes/                  # Express route files
│   │   ├── controllers/             # Business logic
│   │   ├── middleware/              # Auth, roleGuard, errorHandler
│   │   ├── services/                # Socket setup, booking expiry
│   │   └── utils/                   # Helpers (fareEngine, haversine, jwt, etc.)
│   ├── scripts/
│   │   └── simulateDriver.js        # Driver location simulation tool
│   └── seed.js                      # Database seed script
│
└── README.md
```