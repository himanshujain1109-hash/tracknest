# SmartStock / TrackNest Deployment Fix

This package fixes the blank Vercel frontend caused by an incomplete `frontend/src/main.jsx`
and fixes the backend database module so Render can initialize SQLite correctly.

## Vercel
Set Root Directory to:
frontend

Framework:
Vite

Build Command:
npm run build

Output Directory:
dist

Environment variable (optional because main.jsx contains a fallback):
VITE_API_URL=https://tracknest-4sp1.onrender.com

After changing environment variables, redeploy.

## Render
Set Root Directory to:
backend

Build Command:
npm install

Start Command:
npm start

Environment:
JWT_SECRET=smartstock-demo-secret
FRONTEND_URL=https://tracknest.vercel.app

## Demo login
admin@example.com
123456

## Backend checks
https://tracknest-4sp1.onrender.com/
https://tracknest-4sp1.onrender.com/api/health
