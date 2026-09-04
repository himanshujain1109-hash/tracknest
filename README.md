# StockPilot

StockPilot is split into independent frontend and backend deployments.

## 1. Deploy backend to Render
Use the `backend` folder as the Render root directory.

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variables:
  - `MONGODB_URI` = MongoDB Atlas connection string
  - `GEMINI_API_KEY` = optional Gemini API key
  - `FRONTEND_URL` = deployed Vercel frontend URL

Render supplies `PORT` automatically.

## 2. Deploy frontend to Vercel
Use the `frontend` folder as the Vercel project root.

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:
  - `VITE_API_URL` = `https://YOUR-RENDER-SERVICE.onrender.com/api`

The included `vercel.json` handles SPA routes.

## 3. Camera scanner
The scanner container is kept visible while `html5-qrcode` initializes. The previous hidden-container behavior could cause a black/blank camera view. Camera access also requires HTTPS and browser permission.
