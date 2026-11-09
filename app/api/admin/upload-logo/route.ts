import {NextResponse} from "next/server";
import {randomUUID} from "crypto";
import {getSupabase,requireAdmin} from "@/lib/supabase";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!requireAdmin(request))return NextResponse.json({error:"Please sign in."},{status:401});
 try{
  const body=await request.json();const fileName=String(body.file_name||"logo.png");
  const mime=String(body.mime_type||"");const raw=String(body.data||"");
  if(!["image/png","image/jpeg","image/webp","image/svg+xml"].includes(mime))return NextResponse.json({error:"Upload PNG, JPG, WEBP or SVG image."},{status:400});
  const base64=raw.replace(/^data:[^,]+,/,"");const buffer=Buffer.from(base64,"base64");
  if(!buffer.length||buffer.length>2*1024*1024)return NextResponse.json({error:"Logo must be smaller than 2 MB."},{status:400});
  const db=getSupabase();const bucket="form-logos";
  const {data:existing}=await db.storage.getBucket(bucket);
  if(!existing){const {error}=await db.storage.createBucket(bucket,{public:true,fileSizeLimit:2097152,allowedMimeTypes:["image/png","image/jpeg","image/webp","image/svg+xml"]});if(error&&!String(error.message).toLowerCase().includes("already"))throw error;}
  const ext=fileName.split(".").pop()?.toLowerCase()||"png";const path=randomUUID()+"."+ext;
  const {error}=await db.storage.from(bucket).upload(path,buffer,{contentType:mime,upsert:false});
  if(error)throw error;
  const {data}=db.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({logo_url:data.publicUrl});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Logo upload failed."},{status:500})}
}