
import "dotenv/config"; import express from "express"; import cors from "cors"; import {init} from "./db.js"; import api from "./routes/api.js";
const app=express();app.use(cors());app.use(express.json());app.get("/api/health",(q,s)=>s.json({ok:true}));app.use("/api",api);await init();app.listen(process.env.PORT||5000,()=>console.log("API on 5000"));
