import {NextResponse} from "next/server";
import {getSupabase,requireAdmin} from "@/lib/supabase";
export const runtime="nodejs";
export async function GET(request:Request){
 if(!requireAdmin(request))return NextResponse.json({error:"Please sign in to continue."},{status:401});
 try{
  const {data,error}=await getSupabase().from("leads")
   .select("id,name,phone,attribution,status,created_at,forms(name,slug)")
   .order("created_at",{ascending:false}).limit(200);
  if(error)throw error;
  return NextResponse.json({leads:data||[]});
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:"Unable to load leads."},{status:500});
 }
}
