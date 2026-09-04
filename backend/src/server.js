import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";

import { init, run, get } from "./db.js";
import api from "./routes/api.js";

const app = express();

const PORT = process.env.PORT || 5000;

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests from tools/server-side requests
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Keep deployment easy while testing
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());


// =====================================================
// ROOT ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    status: "online",
    message: "SmartStock API is running 🚀",
    service: "Smart Barcode Inventory & Delivery Tracking",
  });
});


// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    message: "SmartStock backend is working",
  });
});


// =====================================================
// API ROUTES
// =====================================================

app.use("/api", api);


// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});


// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});


// =====================================================
// CREATE DEMO USERS
// =====================================================

async function createDemoUsers() {
  console.log("Checking demo users...");

  const users = [
    {
      name: "Admin",
      email: "admin@example.com",
      password: "123456",
      role: "ADMIN",
    },
    {
      name: "Warehouse",
      email: "warehouse@example.com",
      password: "123456",
      role: "WAREHOUSE",
    },
    {
      name: "Delivery",
      email: "delivery@example.com",
      password: "123456",
      role: "DELIVERY",
    },
  ];

  for (const user of users) {
    const existing = await get(
      "SELECT id FROM users WHERE email = ?",
      [user.email]
    );

    if (!existing) {
      const passwordHash = await bcrypt.hash(user.password, 10);

      await run(
        `
        INSERT INTO users
        (name, email, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, 1)
        `,
        [
          user.name,
          user.email,
          passwordHash,
          user.role,
        ]
      );

      console.log(`Created demo user: ${user.email}`);
    } else {
      console.log(`Demo user exists: ${user.email}`);
    }
  }
}


// =====================================================
// CREATE DEMO PRODUCTS
// =====================================================

async function createDemoProducts() {
  const products = [
    [
      "8901234567890",
      "Wireless Mouse",
      "Electronics",
    ],
    [
      "8901234567891",
      "Keyboard",
      "Electronics",
    ],
    [
      "8901234567892",
      "USB Cable",
      "Accessories",
    ],
    [
      "8901234567893",
      "Webcam",
      "Electronics",
    ],
    [
      "8901234567894",
      "Headphones",
      "Audio",
    ],
  ];

  for (const product of products) {
    const existing = await get(
      "SELECT id FROM products WHERE barcode = ?",
      [product[0]]
    );

    if (!existing) {
      await run(
        `
        INSERT INTO products
        (barcode, name, category)
        VALUES (?, ?, ?)
        `,
        product
      );

      console.log(`Created product: ${product[1]}`);
    }
  }
}


// =====================================================
// CREATE WAREHOUSE
// =====================================================

async function createWarehouse() {
  const rows = ["A", "B", "C"];

  for (const rowCode of rows) {
    await run(
      `
      INSERT OR IGNORE INTO warehouse_rows
      (row_code, capacity, status)
      VALUES (?, 500, 'ACTIVE')
      `,
      [rowCode]
    );

    const row = await get(
      `
      SELECT id
      FROM warehouse_rows
      WHERE row_code = ?
      `,
      [rowCode]
    );

    for (let i = 1; i <= 5; i++) {
      const binCode =
        rowCode + String(i).padStart(2, "0");

      await run(
        `
        INSERT OR IGNORE INTO bins
        (row_id, bin_code, capacity, current_quantity, status)
        VALUES (?, ?, 50, 0, 'EMPTY')
        `,
        [
          row.id,
          binCode,
        ]
      );
    }
  }

  console.log("Warehouse structure ready.");
}


// =====================================================
// START SERVER
// =====================================================

async function startServer() {
  try {
    console.log("------------------------------------");
    console.log("Starting SmartStock backend...");
    console.log("------------------------------------");

    // Initialize database
    await init();

    console.log("Database initialized.");

    // Automatically create demo data
    await createDemoUsers();
    await createDemoProducts();
    await createWarehouse();

    console.log("------------------------------------");
    console.log("Demo Login");
    console.log("Email: admin@example.com");
    console.log("Password: 123456");
    console.log("------------------------------------");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `SmartStock API running on port ${PORT}`
      );
    });

  } catch (error) {
    console.error(
      "FAILED TO START SMARTSTOCK SERVER:"
    );

    console.error(error);

    process.exit(1);
  }
}

startServer();
