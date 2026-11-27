import {NextResponse} from "next/server";
import {randomBytes} from "crypto";
import {getSupabase} from "@/lib/supabase";
export const runtime="nodejs";
export async function POST(request:Request){
 try{
  const b=await request.json();
  const slug=String(b.slug||"");
  const values=b.fields&&typeof b.fields==="object"?b.fields:{};
  const {data:form,error:formError}=await getSupabase().from("forms").select("id,target_url,fields").eq("slug",slug).eq("active",true).single();
  if(formError||!form)return NextResponse.json({error:"This form is unavailable."},{status:404});
  const configured=Array.isArray((form as any).fields)?(form as any).fields:[];const cleanValues:Record<string,string>={};for(const field of configured){const key=String(field.name),value=String(values[key]??"").trim();if(field.required&&!value)return NextResponse.json({error:field.label+" is required."},{status:400});if(value&&field.type==="email"&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))return NextResponse.json({error:"Enter a valid "+field.label+"."},{status:400});if(value)cleanValues[key]=value}const name=String(values.name||"").trim(),phone=String(values.phone||"").trim();
  if(!name||!phone)return NextResponse.json({error:"Name and mobile number are required."},{status:400});
  if(!/^[6-9][0-9]{9}$/.test(phone))return NextResponse.json({error:"Enter a valid 10-digit Indian mobile number."},{status:400});

  const allowed=["aff_id","sub_aff_id","click_id","utm_source","utm_medium","utm_campaign","utm_content","fbclid"];
  const attribution:Record<string,string>={};
  for(const k of allowed)if(b[k])attribution[k]=String(b[k]).slice(0,255);
  // Telegram user ID passed from the bot link, digits only.
  const tg=String(b.tg||"").trim();if(/^[0-9]{3,20}$/.test(tg))attribution["tg"]=tg;

  // Keep the campaign affiliate ID unchanged; generate only a unique sub-affiliate ID per lead.
  const affiliateId=String(attribution["aff_id"]||"").trim();
  const perLeadSubId=randomBytes(6).toString("base64url").slice(0,8);
  if(affiliateId)attribution["sub_aff_id"]=perLeadSubId;

  const {data,error}=await getSupabase().from("leads").insert({
   form_id:form.id,name,phone,fields:cleanValues,attribution,status:"pending"
  }).select("id").single();
  if(error)throw error;

  // Preserve the original query-string spelling, including trailing base64 "=" signs.
  const [baseUrl,rawQuery=""]=String(form.target_url).split("?");
  let redirectUrl=String(form.target_url);
  // If the company destination URL already carries a fixed subref value (e.g. subref=8112, no {placeholder}),
  // keep the URL exactly as given and do not replace subref.
  const fixedSubref=rawQuery.split("&").some(part=>{const [k,...v]=part.split("=");let key=k;try{key=decodeURIComponent(k)}catch{};const val=v.join("=");return key==="subref"&&val!==""&&!/[{}]|%7B|%7D/i.test(val)});
  if(affiliateId&&!fixedSubref){
   const keptParams=rawQuery.split("&").filter(Boolean).filter(part=>{
    const rawKey=part.split("=")[0];
    let key=rawKey;try{key=decodeURIComponent(rawKey)}catch{}
    return key!=="subref"&&key!=="subid";
   });
   keptParams.push("subref="+affiliateId+"_"+perLeadSubId);
   redirectUrl=baseUrl+"?"+keptParams.join("&");
  }
  return NextResponse.json({success:true,lead_id:data.id,redirect_url:redirectUrl});
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:"Unable to submit lead."},{status:500});
 }
}
