
import sqlite3 from "sqlite3"; import fs from "fs"; import path from "path";
sqlite3.verbose(); fs.mkdirSync("data",{recursive:true});
const db=new sqlite3.Database("data/inventory.db");
export const run=(q,p=[])=>new Promise((res,rej)=>db.run(q,p,function(e){e?rej(e):res({id:this.lastID,changes:this.changes})}));
export const get=(q,p=[])=>new Promise((res,rej)=>db.get(q,p,(e,r)=>e?rej(e):res(r)));
export const all=(q,p=[])=>new Promise((res,rej)=>db.all(q,p,(e,r)=>e?rej(e):res(r)));
export async function init(){db.exec(`PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,email TEXT UNIQUE,password_hash TEXT,role TEXT,phone TEXT,is_active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,barcode TEXT UNIQUE,name TEXT,category TEXT,description TEXT,minimum_stock INTEGER DEFAULT 5);
CREATE TABLE IF NOT EXISTS warehouse_rows(id INTEGER PRIMARY KEY AUTOINCREMENT,row_code TEXT UNIQUE,capacity INTEGER DEFAULT 500,status TEXT DEFAULT 'ACTIVE');
CREATE TABLE IF NOT EXISTS bins(id INTEGER PRIMARY KEY AUTOINCREMENT,row_id INTEGER,bin_code TEXT UNIQUE,capacity INTEGER DEFAULT 50,current_quantity INTEGER DEFAULT 0,status TEXT DEFAULT 'EMPTY',FOREIGN KEY(row_id) REFERENCES warehouse_rows(id));
CREATE TABLE IF NOT EXISTS inventory(id INTEGER PRIMARY KEY AUTOINCREMENT,product_id INTEGER,bin_id INTEGER,quantity INTEGER DEFAULT 0,UNIQUE(product_id,bin_id),FOREIGN KEY(product_id) REFERENCES products(id),FOREIGN KEY(bin_id) REFERENCES bins(id));
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,order_number TEXT UNIQUE,customer_name TEXT,customer_phone TEXT,customer_address TEXT,latitude REAL,longitude REAL,status TEXT DEFAULT 'PENDING',delivery_person_id INTEGER,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER,product_id INTEGER,quantity INTEGER,picked_quantity INTEGER DEFAULT 0,UNIQUE(order_id,product_id));
CREATE TABLE IF NOT EXISTS stock_movements(id INTEGER PRIMARY KEY AUTOINCREMENT,product_id INTEGER,from_bin_id INTEGER,to_bin_id INTEGER,quantity INTEGER,movement_type TEXT,order_id INTEGER,performed_by INTEGER,barcode_scanned TEXT,notes TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS delivery_tracking(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER,delivery_person_id INTEGER,latitude REAL,longitude REAL,status TEXT,recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP);
`)}
