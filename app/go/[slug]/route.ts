import {NextResponse} from "next/server";
import {randomUUID} from "crypto";
import {getSupabase} from "@/lib/supabase";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
 try{
  const {slug}=await params;const incoming=new URL(request.url);const db=getSupabase();
  const {data:form,error}=await db.from("forms").select("id,slug").eq("slug",slug).eq("active",true).single();
  if(error||!form)return NextResponse.json({error:"Tracking link not found."},{status:404});
  const clickId=randomUUID();const keys=["aff_id","sub_aff_id","utm_source","utm_medium","utm_campaign","utm_content","fbclid"];const attribution:Record<string,string>={};
  for(const k of keys){const v=incoming.searchParams.get(k);if(v)attribution[k]=v.slice(0,255)}
  const {error:insertError}=await db.from("clicks").insert({form_id:form.id,click_id:clickId,attribution,user_agent:request.headers.get("user-agent"),referer:request.headers.get("referer")});
  if(insertError)throw insertError;
  const appBase=process.env.NEXT_PUBLIC_APP_URL||incoming.origin;const destination=new URL("/form/"+encodeURIComponent(slug),appBase);
  for(const [k,v] of Object.entries(attribution))destination.searchParams.set(k,v);
  destination.searchParams.set("click_id",clickId);
  return NextResponse.redirect(destination,302);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Tracking error."},{status:500})}
}
