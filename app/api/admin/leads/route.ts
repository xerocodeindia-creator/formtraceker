import {NextResponse} from "next/server";
import {getSupabase,requireAdmin} from "@/lib/supabase";
export const runtime="nodejs";
export async function GET(request:Request){
 if(!requireAdmin(request))return NextResponse.json({error:"Please sign in to continue."},{status:401});
 try{
  const url=new URL(request.url);
  const from=url.searchParams.get("from");
  const to=url.searchParams.get("to");
  const trackingLinkId=url.searchParams.get("tracking_link_id");
  if(!from||!to||!Number.isFinite(Date.parse(from))||!Number.isFinite(Date.parse(to))||Date.parse(from)>=Date.parse(to)){
   return NextResponse.json({error:"A valid date range is required."},{status:400});
  }
  const supabase=getSupabase();
  let allowedClickIds:Set<string>|null=null;
  if(trackingLinkId){
   const {data:link,error:linkError}=await supabase.from("tracking_links").select("id,form_id,sub_aff_id").eq("id",trackingLinkId).single();
   if(linkError||!link)return NextResponse.json({error:"Tracking link not found."},{status:404});
   const {data:clickRows,error:clickError}=await supabase.from("clicks").select("click_id").eq("form_id",link.form_id).contains("attribution",{sub_aff_id:link.sub_aff_id});
   if(clickError)throw clickError;
   allowedClickIds=new Set((clickRows||[]).map(row=>String(row.click_id)));
  }
  const pageSize=1000;
  let offset=0;
  const leads:unknown[]=[];
  while(true){
   const {data,error}=await supabase.from("leads")
    .select("id,name,phone,attribution,status,created_at,forms(name,slug)")
    .gte("created_at",from).lt("created_at",to)
    .order("created_at",{ascending:false})
    .range(offset,offset+pageSize-1);
   if(error)throw error;
   const batch=data||[];
   leads.push(...(allowedClickIds?batch.filter((row:any)=>allowedClickIds!.has(String(row.attribution?.click_id||""))):batch));
   if(batch.length<pageSize)break;
   offset+=pageSize;
  }
  return NextResponse.json({leads});
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:"Unable to load leads."},{status:500});
 }
}
