import {NextResponse} from "next/server";
import {getSupabase,requireAdmin} from "@/lib/supabase";
export const runtime="nodejs";

/**
 * Clears historical attribution data while preserving campaign/form definitions.
 * Deletes only tracking_links, leads (including converted statuses), and clicks.
 */
export async function POST(request:Request){
 if(!requireAdmin(request))return NextResponse.json({error:"Please sign in to continue."},{status:401});
 try{
  const db=getSupabase();
  const links=await db.from("tracking_links").delete().not("id","is",null).select("id");
  if(links.error)throw links.error;
  const leads=await db.from("leads").delete().not("id","is",null).select("id");
  if(leads.error)throw leads.error;
  const clicks=await db.from("clicks").delete().not("id","is",null).select("id");
  if(clicks.error)throw clicks.error;
  return NextResponse.json({
   success:true,
   deleted:{
    tracking_links:links.data?.length||0,
    leads:leads.data?.length||0,
    clicks:clicks.data?.length||0
   },
   preserved:"forms"
  });
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:"Could not clear historical tracking data."},{status:500});
 }
}
