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
