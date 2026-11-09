import {NextResponse} from "next/server";
import {getSupabase} from "@/lib/supabase";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){try{const {slug}=await params;const {data,error}=await getSupabase().from("forms").select("slug,name,headline,fields,logo_url").eq("slug",slug).eq("active",true).single();if(error||!data)return NextResponse.json({error:"Form not found or inactive."},{status:404});return NextResponse.json({form:data})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to load form."},{status:500})}}
