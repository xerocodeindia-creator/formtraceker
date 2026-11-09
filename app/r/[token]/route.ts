import {NextResponse} from "next/server";
import {randomUUID} from "crypto";
import {getSupabase} from "@/lib/supabase";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{token:string}>}){
 try{
  const {token}=await params;const db=getSupabase();
  const {data:link,error}=await db.from("tracking_links").select("token,form_id,aff_id,sub_aff_id,forms!inner(slug,active)").eq("token",token).single();
  const linkedForm=Array.isArray(link?.forms)?link.forms[0]:link?.forms;
  if(error||!link||!linkedForm?.active)return NextResponse.json({error:"Short tracking link not found."},{status:404});
  const clickId=randomUUID();const attribution={aff_id:link.aff_id,sub_aff_id:link.sub_aff_id};
  const {error:clickError}=await db.from("clicks").insert({form_id:link.form_id,click_id:clickId,attribution,user_agent:request.headers.get("user-agent"),referer:request.headers.get("referer")});
  if(clickError)throw clickError;
  const appBase=process.env.NEXT_PUBLIC_APP_URL||new URL(request.url).origin;
  const destination=new URL("/form/"+encodeURIComponent(linkedForm.slug),appBase);
  destination.searchParams.set("aff_id",link.aff_id);destination.searchParams.set("sub_aff_id",link.sub_aff_id);destination.searchParams.set("click_id",clickId);
  return NextResponse.redirect(destination,302);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Tracking error."},{status:500})}
}