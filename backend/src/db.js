
import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

sqlite3.verbose();


// =====================================================
// DATABASE LOCATION
// =====================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendRoot = path.resolve(
  __dirname,
  ".."
);

const dataDirectory = path.join(
  backendRoot,
  "data"
);

fs.mkdirSync(dataDirectory, {
  recursive: true,
});

const databasePath = path.join(
  dataDirectory,
  "inventory.db"
);

console.log(
  `SQLite database: ${databasePath}`
);


// =====================================================
// DATABASE CONNECTION
// =====================================================

const db = new sqlite3.Database(
  databasePath,
  (error) => {
    if (error) {
      console.error(
        "SQLite connection error:",
        error
      );
    } else {
      console.log(
        "SQLite database connected."
      );
    }
  }
);


// =====================================================
// DATABASE HELPERS
// =====================================================

export const run = (
  query,
  params = []
) =>
  new Promise((resolve, reject) => {
    db.run(
      query,
      params,
      function (error) {
        if (error) {
          reject(error);
        } else {
          resolve({
            id: this.lastID,
            changes: this.changes,
          });
        }
      }
    );
  });


export const get = (
  query,
  params = []
) =>
  new Promise((resolve, reject) => {
    db.get(
      query,
      params,
      (error, row) => {
        if (error) {
          reject(error);
        } else {
          resolve(row);
        }
      }
    );
  });


export const all = (
  query,
  params = []
) =>
  new Promise((resolve, reject) => {
    db.all(
      query,
      params,
      (error, rows) => {
        if (error) {
          reject(error);
        } else {
          resolve(rows);
        }
      }
    );
  });


// =====================================================
// DATABASE INITIALIZATION
// =====================================================

export async function init() {

  await run("PRAGMA foreign_keys = ON");

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      role TEXT,
      phone TEXT,
      is_active INTEGER DEFAULT 1
    )
  `);


  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE,
      name TEXT,
      category TEXT,
      description TEXT,
      minimum_stock INTEGER DEFAULT 5
    )
  `);


  await run(`
    CREATE TABLE IF NOT EXISTS warehouse_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      row_code TEXT UNIQUE,
      capacity INTEGER DEFAULT 500,
      status TEXT DEFAULT 'ACTIVE'
    )
  `);


  await run(`
    CREATE TABLE IF NOT EXISTS bins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      row_id INTEGER,
      bin_code TEXT UNIQUE,
      capacity INTEGER DEFAULT 50,
      current_quantity INTEGER DEFAULT 0,
      status TEXT DEFAULT 'EMPTY',

      FOREIGN KEY(row_id)
      REFERENCES warehouse_rows(id)
    )
  `);


  await run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      bin_id INTEGER,
      quantity INTEGER DEFAULT 0,

      UNIQUE(product_id, bin_id),

      FOREIGN KEY(product_id)
      REFERENCES products(id),

      FOREIGN KEY(bin_id)
      REFERENCES bins(id)
    )
  `);


  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE,
      customer_name TEXT,
      customer_phone TEXT,
      customer_address TEXT,
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
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      picked_quantity INTEGER DEFAULT 0,

      UNIQUE(order_id, product_id)
    )
  `);


  await run(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      from_bin_id INTEGER,
      to_bin_id INTEGER,
      quantity INTEGER,
      movement_type TEXT,
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
      order_id INTEGER,
      delivery_person_id INTEGER,
      latitude REAL,
      longitude REAL,
      status TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);


  console.log(
    "All database tables are ready."
  );
}
