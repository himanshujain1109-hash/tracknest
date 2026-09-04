# StockPilot Backend

Express API, MongoDB models, inventory services and barcode/order routes.

## Environment
- `PORT`: server port. Render provides this automatically.
- `MONGODB_URI`: MongoDB Atlas connection string.
- `GEMINI_API_KEY`: optional; analytics falls back to deterministic recommendations.
- `FRONTEND_URL`: deployed frontend origin for CORS.

## Local development
```bash
npm install
npm run dev
```

## Production
```bash
npm install
npm run build
npm start
```
