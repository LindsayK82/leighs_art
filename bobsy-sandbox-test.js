/* ===== BOBSY DEVELOPMENT-ONLY PAYPAL SANDBOX TEST ===== */
(() => {
"use strict";
const project="https://hqkcqvxppoboryqcwksi.supabase.co";
const expectedId="21b1ad67-b1ae-484b-8d24-fa32231a7232";
const client=window.artistSupabase;
const status=document.getElementById("test-status");
const start=document.getElementById("start-test");
const capture=document.getElementById("capture-test");
const approval=document.getElementById("approval");
const link=document.getElementById("approval-link");
const key="leigh-bobsy-sandbox-checkout";
let checkoutId=sessionStorage.getItem(key);
function message(s){status.textContent=s;}
async function authorized(){
 const {data:{session}}=await client.auth.getSession();
 if(!session){throw new Error("Sign in to the artist dashboard first, then return here.");}
 const {data,error}=await client.from("site_admins").select("user_id").eq("user_id",session.user.id).maybeSingle();
 if(error||!data)throw new Error("Artist administrator access required.");
 return session.access_token;
}
async function invoke(name,body){
 const token=await authorized();
 const response=await fetch(project+"/functions/v1/"+name,{
 method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token,"apikey":"sb_publishable_ePeAQ5b-9vFZkOVmOMHLzA_zhLGbaOB"},body:JSON.stringify(body)
 });
 const data=await response.json().catch(()=>({}));
 if(!response.ok||data.error)throw new Error(data.error||"Server error ("+response.status+")");
 return data;
}
function restore(){if(checkoutId){start.disabled=true;capture.hidden=false;message("Existing checkout found. Approve it in PayPal if needed, then verify/capture. Do not start another checkout.");}}
start.addEventListener("click",async()=>{
 start.disabled=true;message("Creating Sandbox checkout…");
 try{
 const result=await invoke("paypal-bobsy-checkout",{items:[{id:expectedId,kind:"print",size:"10 × 10"}]});
 if(!result.checkout_id||!result.approval_url)throw new Error("Missing PayPal approval link. Do not retry automatically.");
 checkoutId=result.checkout_id;sessionStorage.setItem(key,checkoutId);
 link.href=result.approval_url;approval.hidden=false;capture.hidden=false;
 message("Checkout created. Open PayPal Sandbox and approve the $1 test. Then return here to capture.");
 }catch(err){message(err.message);start.disabled=false;}
});
capture.addEventListener("click",async()=>{
 if(!checkoutId)return;
 capture.disabled=true;message("Checking PayPal approval; no capture attempted yet…");
 try{
 const check=await invoke("paypal-bobsy-capture",{checkout_id:checkoutId,action:"inspect"});
 if(check.payment_already_captured){message("PayPal already shows a completed capture. Do not retry. Ask Finch to reconcile if order is missing.");return;}
 if(!check.approved_for_capture){message("Not approved for capture yet. Complete PayPal approval first. Status: "+String(check.paypal_status||"unknown"));return;}
 if(!window.confirm("Capture the approved $1.00 PAYPAL SANDBOX test payment for Bobsy?")){message("Capture cancelled.");return;}
 const result=await invoke("paypal-bobsy-capture",{checkout_id:checkoutId,action:"capture"});
 if(result.payment_captured&&result.success){message("Sandbox payment verified and recorded! Open Leigh's Orders dashboard and refresh. Bobsy should appear.");sessionStorage.removeItem(key);}
 else message("Capture may need reconciliation. Do not retry automatically. Stage: "+String(result.stage||"unknown"));
 }catch(err){message("Capture result uncertain: "+err.message+". Do not create another payment or retry capture automatically.");}
 finally{capture.disabled=false;}
});
authorized().then(()=>{message("Artist admin verified. Ready for Bobsy's Sandbox test.");restore();}).catch(e=>{message(e.message);start.disabled=true;capture.disabled=true;});
})();