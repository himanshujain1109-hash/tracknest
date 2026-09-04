import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import {
  connectDB,
  getDBStatus,
} from './server/db.js';

import { seedDatabase } from './server/seed.js';

import productRoutes from './server/routes/productRoutes.js';
import orderRoutes from './server/routes/orderRoutes.js';
import warehouseRoutes from './server/routes/warehouseRoutes.js';
import scanRoutes from './server/routes/scanRoutes.js';
import analyticsRoutes from './server/routes/analyticsRoutes.js';
import activityRoutes from './server/routes/activityRoutes.js';

dotenv.config();

const app = express();

const PORT =
  Number(process.env.PORT) || 10000;

const frontendUrl =
  process.env.FRONTEND_URL?.trim().replace(
    /\/$/,
    ''
  );

app.use(
  cors({
    origin: frontendUrl || true,
    credentials: false,
  })
);

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'StockPilot API',
    version: '1.0.0',
    database: getDBStatus(),
    timestamp: new Date().toISOString(),
  });
});

/*
 * API ROUTES
 *
 * Every frontend request must use /api.
 */

app.use('/api/products', productRoutes);

app.use('/api/orders', orderRoutes);

app.use('/api/warehouse', warehouseRoutes);

app.use('/api/scan', scanRoutes);

app.use('/api/analytics', analyticsRoutes);

app.use('/api/activity', activityRoutes);

/*
 * Unknown API route
 */

app.use('/api/*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
  });
});

/*
 * Production static frontend.
 *
 * This is only useful if you deploy the combined
 * backend/frontend application.
 */

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(
    process.cwd(),
    'dist'
  );

  app.use(express.static(distPath));

  app.get('*', (_req, res) => {
    res.sendFile(
      path.join(distPath, 'index.html')
    );
  });
}

/*
 * Start server
 */

async function startServer() {
  try {
    await connectDB();

    console.log(
      'StockPilot database connected'
    );

    try {
      await seedDatabase(false);
      console.log(
        'StockPilot database initialized'
      );
    } catch (seedError) {
      console.warn(
        'Database seed skipped:',
        seedError
      );
    }

    app.listen(
      PORT,
      '0.0.0.0',
      () => {
        console.log(
          `StockPilot API running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      'Failed to start StockPilot:',
      error
    );

    process.exit(1);
  }
}

startServer();
