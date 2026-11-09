import {NextResponse} from "next/server";
import {getSupabase,requireAdmin} from "@/lib/supabase";
export const runtime="nodejs";

/**
 * Permanently clears the workspace: links, leads, clicks, and campaign forms.
 * Child attribution rows are deleted first; form definitions are deleted last.
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
  const forms=await db.from("forms").delete().not("id","is",null).select("id");
  if(forms.error)throw forms.error;
  return NextResponse.json({
   success:true,
   deleted:{
    tracking_links:links.data?.length||0,
    leads:leads.data?.length||0,
    clicks:clicks.data?.length||0,
    forms:forms.data?.length||0
   }
  });
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:"Could not clear the workspace."},{status:500});
 }
}
