import {NextResponse} from "next/server";
import {randomBytes} from "crypto";
import {getSupabase} from "@/lib/supabase";
export const runtime="nodejs";
export async function POST(request:Request){
 try{
  const b=await request.json();
  const slug=String(b.slug||"");
  const values=b.fields&&typeof b.fields==="object"?b.fields:{};
  const {data:form,error:formError}=await getSupabase().from("forms").select("id,target_url").eq("slug",slug).eq("active",true).single();
  if(formError||!form)return NextResponse.json({error:"This form is unavailable."},{status:404});
  const name=String(values.name||"").trim(),phone=String(values.phone||"").trim();
  if(!name||!phone)return NextResponse.json({error:"Name and mobile number are required."},{status:400});
  if(!/^[6-9][0-9]{9}$/.test(phone))return NextResponse.json({error:"Enter a valid 10-digit Indian mobile number."},{status:400});

  const allowed=["aff_id","sub_aff_id","click_id","utm_source","utm_medium","utm_campaign","utm_content","fbclid"];
  const attribution:Record<string,string>={};
  for(const k of allowed)if(b[k])attribution[k]=String(b[k]).slice(0,255);

  // Keep the campaign affiliate ID unchanged; generate only a unique sub-affiliate ID per lead.
  const affiliateId=String(attribution["aff_id"]||"").trim();
  if(!affiliateId)return NextResponse.json({error:"Affiliate ID is missing. Please open the form using its tracking link."},{status:400});
  const perLeadSubId="SUB"+randomBytes(6).toString("hex").slice(0,10).toUpperCase();
  attribution["sub_aff_id"]=perLeadSubId;

  const {data,error}=await getSupabase().from("leads").insert({
   form_id:form.id,name,phone,fields:values,attribution,status:"pending"
  }).select("id").single();
  if(error)throw error;

  const redirect=new URL(form.target_url);
  redirect.searchParams.set("subref",affiliateId+"_"+perLeadSubId);
  return NextResponse.json({success:true,lead_id:data.id,redirect_url:redirect.toString()});
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:"Unable to submit lead."},{status:500});
 }
}
