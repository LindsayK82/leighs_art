// Leigh's newsletter delivery — staged. No email is sent unless explicitly enabled.
import { createClient } from 'npm:@supabase/supabase-js@2';
const URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const allowed = (Deno.env.get('NEWSLETTER_ALLOWED_ORIGIN') ?? '').replace(/\/$/, '');
Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '';
  const headers = {'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Origin':origin===allowed?origin:'','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
  const reply = (status:number, message:string) => new Response(JSON.stringify({message}),{status,headers});
  if (!allowed || origin!==allowed) return reply(403,'Not available');
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
  if(req.method!=='POST') return reply(405,'POST required');
  const jwt=(req.headers.get('authorization')??'').replace(/^Bearer\s+/i,'');
  if(!jwt||!URL||!ANON||!SERVICE) return reply(401,'Unauthorized');
  const auth=createClient(URL,ANON,{auth:{persistSession:false}});
  const {data:{user},error:authError}=await auth.auth.getUser(jwt);
  if(authError||!user) return reply(401,'Unauthorized');
  const db=createClient(URL,SERVICE,{auth:{persistSession:false}});
  const {data:admin,error:adminError}=await db.from('site_admins').select('user_id').eq('user_id',user.id).maybeSingle();
  if(adminError||!admin) return reply(403,'Not authorized');
  let payload:any;
  try{payload=await req.json();}catch{return reply(400,'Invalid request');}
  const id=payload?.newsletter_id;
  if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) return reply(400,'Invalid newsletter');
  const {data:d,error}=await db.from('studio_newsletters').select('id,subject,headline,greeting,message,studio_news').eq('id',id).maybeSingle();
  if(error||!d) return reply(404,'Newsletter not found');
  if(payload.action!=='test') return reply(409,'Subscriber sending is not enabled yet');
  if(Deno.env.get('NEWSLETTER_TEST_SEND_ENABLED')!=='true') return reply(503,'Test email delivery is not enabled yet');
  const to=Deno.env.get('NEWSLETTER_TEST_RECIPIENT')??'';
  const from=Deno.env.get('NEWSLETTER_FROM_EMAIL')??'';
  const key=Deno.env.get('RESEND_API_KEY')??'';
  if(!to||!from||!key) return reply(503,'Email sender configuration incomplete');
  const content=[d.headline||'',d.greeting||'',d.message||'',d.studio_news||''].filter(Boolean).join('\n\n');
  const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[to],subject:`[TEST] ${d.subject}`,text:`TEST NEWSLETTER — not sent to subscribers\n\n${content}\n\nThis is a test only.`})});
  if(!sent.ok){console.error('Resend test failed',sent.status);return reply(502,'Email provider rejected test');}
  return reply(200,'Test newsletter accepted by email provider');
});
