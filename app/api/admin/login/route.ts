import {NextResponse} from "next/server";
import {createHmac} from "node:crypto";
export const runtime="nodejs";
function signature(value:string){return createHmac("sha256",process.env.SESSION_SECRET||"").update(value).digest("hex")}
export async function POST(request:Request){
 const {password}=await request.json().catch(()=>({password:""}));
 if(!process.env.ADMIN_PASSWORD||!process.env.SESSION_SECRET)return NextResponse.json({error:"Admin login is not configured on the server."},{status:503});
 if(typeof password!=="string"||password!==process.env.ADMIN_PASSWORD)return NextResponse.json({error:"Incorrect password."},{status:401});
 const token=String(Date.now());const value=token+"."+signature(token);
 const response=NextResponse.json({ok:true});
 response.cookies.set("ft_admin",value,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*7});
 return response;
}
export async function DELETE(){const response=NextResponse.json({ok:true});response.cookies.set("ft_admin","",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});return response;}