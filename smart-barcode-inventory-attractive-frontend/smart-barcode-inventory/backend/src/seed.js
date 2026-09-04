
import "dotenv/config"; import bcrypt from "bcryptjs"; import {init,run,get} from "./db.js"; await init();
const pw=await bcrypt.hash("123456",10); for(const u of [["Admin","admin@example.com","ADMIN"],["Warehouse","warehouse@example.com","WAREHOUSE"],["Delivery","delivery@example.com","DELIVERY"]])await run("INSERT OR IGNORE INTO users(name,email,password_hash,role) VALUES(?,?,?,?)",[u[0],u[1],pw,u[2]]);
for(const row of ["A","B","C"]){const x=await run("INSERT OR IGNORE INTO warehouse_rows(row_code,capacity) VALUES(?,500)",[row]);const r=await get("SELECT * FROM warehouse_rows WHERE row_code=?",[row]);for(let i=1;i<=5;i++)await run("INSERT OR IGNORE INTO bins(row_id,bin_code,capacity,current_quantity,status) VALUES(?,?,?,?,?)",[r.id,row+String(i).padStart(2,"0"),50,0,"EMPTY"])}
for(const p of [["8901234567890","Wireless Mouse","Electronics"],["8901234567891","Keyboard","Electronics"],["8901234567892","USB Cable","Accessories"],["8901234567893","Webcam","Electronics"],["8901234567894","Headphones","Audio"]])await run("INSERT OR IGNORE INTO products(barcode,name,category) VALUES(?,?,?)",p);
console.log("Seeded. Login: admin@example.com / 123456"); process.exit();
