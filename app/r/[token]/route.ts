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
  const clickId=randomUUID();const attribution:Record<string,string>={};if(link.aff_id)attribution.aff_id=link.aff_id;if(link.sub_aff_id)attribution.sub_aff_id=link.sub_aff_id;
  // Telegram user ID from the bot link (?tg=123456789), digits only.
  const tg=(new URL(request.url).searchParams.get("tg")||"").trim();if(/^[0-9]{3,20}$/.test(tg))attribution.tg=tg;
  const {error:clickError}=await db.from("clicks").insert({form_id:link.form_id,click_id:clickId,attribution,user_agent:request.headers.get("user-agent"),referer:request.headers.get("referer")});
  if(clickError)throw clickError;
  const appBase=process.env.NEXT_PUBLIC_APP_URL||new URL(request.url).origin;
  const destination=new URL("/form/"+encodeURIComponent(linkedForm.slug),appBase);
  if(link.aff_id)destination.searchParams.set("aff_id",link.aff_id);if(link.sub_aff_id)destination.searchParams.set("sub_aff_id",link.sub_aff_id);destination.searchParams.set("click_id",clickId);if(attribution.tg)destination.searchParams.set("tg",attribution.tg);
  return NextResponse.redirect(destination,302);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Tracking error."},{status:500})}
}