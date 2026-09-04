import "dotenv/config";
import express from "express";
import cors from "cors";

import { init } from "./db.js";
import api from "./routes/api.js";

const app = express();

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean);

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an origin
      // (Postman, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured frontend origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // During development, allow the request.
      // You can make this stricter later.
      return callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json());

// --------------------------------------------------
// Root route
// --------------------------------------------------

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SmartStock API is running 🚀",
    service: "Smart Barcode Inventory & Delivery Tracking",
    status: "online"
  });
});

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    message: "SmartStock backend is working"
  });
});

// --------------------------------------------------
// API routes
// --------------------------------------------------

app.use("/api", api);

// --------------------------------------------------
// 404 handler
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// --------------------------------------------------
// Error handler
// --------------------------------------------------

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

async function startServer() {
  try {
    await init();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`SmartStock API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
