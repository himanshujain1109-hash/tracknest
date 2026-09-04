
import {get,run,all} from "../db.js";
export async function binFor(q){
 let b=await get("SELECT * FROM bins WHERE status IN ('EMPTY','AVAILABLE') AND current_quantity+?<=capacity ORDER BY current_quantity,id LIMIT 1",[q]);
 if(b)return b;
 let rows=await all("SELECT * FROM warehouse_rows ORDER BY id");
 let r=rows.find(x=>x.status==="ACTIVE" && x.capacity>0);
 if(!r){const code=String.fromCharCode(65+rows.length); const z=await run("INSERT INTO warehouse_rows(row_code,capacity) VALUES(?,500)",[code]);r=await get("SELECT * FROM warehouse_rows WHERE id=?",[z.id])}
 const n=await get("SELECT COUNT(*) c FROM bins WHERE row_id=?",[r.id]); const code=r.row_code+String(n.c+1).padStart(2,"0");
 const z=await run("INSERT INTO bins(row_id,bin_code,capacity,current_quantity,status) VALUES(?,?,?,?,?)",[r.id,code,Math.max(50,q),q,q>=50?"FULL":"AVAILABLE"]);
 return get("SELECT * FROM bins WHERE id=?",[z.id])
}
export async function refresh(id){const b=await get("SELECT * FROM bins WHERE id=?",[id]);if(b)await run("UPDATE bins SET status=? WHERE id=?",[b.current_quantity===0?"EMPTY":b.current_quantity>=b.capacity?"FULL":"AVAILABLE",id])}
