import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB, getDBStatus } from './server/db.js';
import { seedDatabase } from './server/seed.js';

import productRoutes from './server/routes/productRoutes.js';
import orderRoutes from './server/routes/orderRoutes.js';
import warehouseRoutes from './server/routes/warehouseRoutes.js';
import scanRoutes from './server/routes/scanRoutes.js';
import analyticsRoutes from './server/routes/analyticsRoutes.js';
import activityRoutes from './server/routes/activityRoutes.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 10000;

async function startServer() {
  const app = express();

  const allowedOrigin = process.env.FRONTEND_URL?.trim();
  app.use(
    cors({
      origin: allowedOrigin ? allowedOrigin.replace(/\/$/, '') : true,
      credentials: false,
    })
  );
  app.use(express.json());

  // Connect to MongoDB
  try {
    const mongoUri = await connectDB();
    console.log(`StockPilot connected to MongoDB (${mongoUri})`);
    await seedDatabase(false);
  } catch (err: any) {
    console.error('Database connection error on start:', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  // API Health & DB status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'STOCKPILOT API',
      version: '1.0.0',
      database: getDBStatus(),
      timestamp: new Date().toISOString(),
    });
  });

  // REST API Routes
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/warehouse', warehouseRoutes);
  app.use('/api/scan', scanRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/activity', activityRoutes);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StockPilot API listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
