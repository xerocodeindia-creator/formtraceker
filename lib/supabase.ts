import {createClient} from "@supabase/supabase-js";
import {createHmac,timingSafeEqual} from "node:crypto";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
export function getSupabase(){if(!url||!serviceKey)throw new Error("Supabase environment variables are not configured.");return createClient(url,serviceKey,{auth:{persistSession:false}});}
export function requireAdmin(request:Request){
 const secret=process.env.SESSION_SECRET;if(!secret)return false;
 const value=request.headers.get("cookie")?.split(";").map(v=>v.trim()).find(v=>v.startsWith("ft_admin="))?.slice("ft_admin=".length);
 if(!value)return false;const [timestamp,sig]=value.split(".");if(!timestamp||!sig||Date.now()-Number(timestamp)>7*24*60*60*1000||Number(timestamp)>Date.now())return false;
 const expected=createHmac("sha256",secret).update(timestamp).digest("hex");
 try{return timingSafeEqual(Buffer.from(sig,"hex"),Buffer.from(expected,"hex"));}catch{return false;}
}