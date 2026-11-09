import { createClient } from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
export function getSupabase(){if(!url||!serviceKey)throw new Error('Supabase environment variables are not configured.');return createClient(url,serviceKey,{auth:{persistSession:false}});}
export function requireAdmin(request:Request){const expected=process.env.ADMIN_API_KEY;const supplied=request.headers.get('x-admin-key');return Boolean(expected&&supplied&&supplied===expected);}
