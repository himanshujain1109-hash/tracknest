
import jwt from "jsonwebtoken"; export const auth=(req,res,next)=>{try{const t=(req.headers.authorization||"").replace("Bearer ","");req.user=jwt.verify(t,process.env.JWT_SECRET||"smartstock-demo-secret");next()}catch{res.status(401).json({message:"Authentication required"})}};
export const role=(...x)=>(req,res,next)=>x.includes(req.user.role)?next():res.status(403).json({message:"Forbidden"});
