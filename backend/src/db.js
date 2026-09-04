import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.resolve(__dirname, "../data");

fs.mkdirSync(dataDirectory, { recursive: true });

const databasePath = path.join(dataDirectory, "inventory.db");
console.log(`SQLite database: ${databasePath}`);

const db = new sqlite3.Database(databasePath, error => {
  if (error) console.error("SQLite connection error:", error);
  else console.log("SQLite database connected.");
});

export const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) reject(error);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });

export const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row);
    });
  });

export const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });

export async function init() {
  await run("PRAGMA foreign_keys = ON");

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      is_active INTEGER DEFAULT 1
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT DEFAULT '',
      description TEXT DEFAULT '',
      minimum_stock INTEGER DEFAULT 5
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS warehouse_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      row_code TEXT UNIQUE NOT NULL,
      capacity INTEGER DEFAULT 500,
      status TEXT DEFAULT 'ACTIVE'
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS bins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      row_id INTEGER NOT NULL,
      bin_code TEXT UNIQUE NOT NULL,
      capacity INTEGER DEFAULT 50,
      current_quantity INTEGER DEFAULT 0,
      status TEXT DEFAULT 'EMPTY',
      FOREIGN KEY(row_id) REFERENCES warehouse_rows(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      bin_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 0,
      UNIQUE(product_id, bin_id),
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(bin_id) REFERENCES bins(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT DEFAULT '',
      customer_address TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      status TEXT DEFAULT 'PENDING',
      delivery_person_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      picked_quantity INTEGER DEFAULT 0,
      UNIQUE(order_id, product_id),
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      from_bin_id INTEGER,
      to_bin_id INTEGER,
      quantity INTEGER NOT NULL,
      movement_type TEXT NOT NULL,
      order_id INTEGER,
      performed_by INTEGER,
      barcode_scanned TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS delivery_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      delivery_person_id INTEGER NOT NULL,
      latitude REAL,
      longitude REAL,
      status TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Database tables ready.");
}
