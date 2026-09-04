# Smart Barcode Inventory & Delivery Tracking

## Stack
React + Vite frontend, Node.js + Express backend, SQLite database.

## Run
### Backend
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev

### Frontend
cd frontend
npm install
npm run dev

Open http://localhost:5173

## Demo accounts
Admin: admin@example.com / 123456
Warehouse: warehouse@example.com / 123456
Delivery: delivery@example.com / 123456

## Implemented
- Role-based login
- Product/barcode management
- Automatic bin/row allocation
- Inventory receiving
- Warehouse map
- Order search
- Barcode-based picking verification
- Stock movement audit records
- Delivery status workflow
- GPS location API endpoint
- Dashboard statistics

## Main APIs
POST /api/auth/login
GET/POST /api/products
GET /api/inventory
POST /api/inventory/inward
GET /api/warehouse/map
GET/POST /api/orders
GET /api/orders/:id
POST /api/orders/:id/pick
GET /api/delivery/orders
POST /api/delivery/orders/:id/start
POST /api/delivery/location
GET /api/delivery/orders/:id/location
POST /api/delivery/orders/:id/complete
GET /api/dashboard/stats


## Vercel + Render deployment

### Render (backend)
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Add `JWT_SECRET` and `FRONTEND_URL` environment variables.

### Vercel (frontend)
- Root Directory: `frontend`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Add `VITE_API_URL=https://YOUR-RENDER-BACKEND.onrender.com/api`

The backend creates/updates the demo accounts automatically on startup:
- `admin@example.com` / `123456`
- `warehouse@example.com` / `123456`
- `delivery@example.com` / `123456`
