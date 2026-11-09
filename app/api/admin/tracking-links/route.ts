import {NextResponse} from "next/server";
import {randomBytes} from "crypto";
import {getSupabase,requireAdmin} from "@/lib/supabase";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!requireAdmin(request))return NextResponse.json({error:"Please sign in."},{status:401});
 try{
  const b=await request.json();const form_id=String(b.form_id||"");
  const aff_id=String(b.aff_id||"").trim();
  if(!form_id||!aff_id)return NextResponse.json({error:"Form and affiliate ID are required."},{status:400});
  if(aff_id.length>100)return NextResponse.json({error:"Affiliate ID must be 100 characters or less."},{status:400});
  const db=getSupabase();const {data:form,error:formError}=await db.from("forms").select("id,slug").eq("id",form_id).eq("active",true).single();
  if(formError||!form)return NextResponse.json({error:"Form not found."},{status:404});
  for(let i=0;i<4;i++){
   const token=randomBytes(4).toString("base64url").replace(/[-_]/g,"").slice(0,6);
   const {error}=await db.from("tracking_links").insert({token,form_id,aff_id,sub_aff_id});
   if(!error)return NextResponse.json({token,slug:form.slug});
   if(!String(error.code||"").startsWith("23"))throw error;
  }
  throw new Error("Could not create a unique short link. Try again.");
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Could not create short link."},{status:500})}
}