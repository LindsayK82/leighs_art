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
const reconcile=document.getElementById("reconcile-test");
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

/* ===== VERIFY BOTH CHECKOUT AND ORDER ===== */
async function verifyRecordedOrder(){
 const {data:checkout,error:checkoutError}=await client
  .from("art_checkout_sessions")
  .select("id,status,capture_state,paypal_capture_id,paid_at")
  .eq("id",checkoutId)
  .maybeSingle();

 if(checkoutError){
  console.warn("Checkout verification read unavailable:",checkoutError.message);
  throw new Error("Checkout verification is unavailable. Check the Orders dashboard; do not pay again.");
 }

 if(!checkout||checkout.status!=="paid"||
    checkout.capture_state!=="completed"||
    !checkout.paypal_capture_id||!checkout.paid_at){
  throw new Error("Checkout state could not be verified. Check the Orders dashboard; do not pay again.");
 }

 const {data:order,error:orderError}=await client
  .from("art_orders")
  .select("id,checkout_session_id,payment_status,paypal_capture_id")
  .eq("checkout_session_id",checkoutId)
  .maybeSingle();

 if(orderError){
  console.warn("Order verification read unavailable:",orderError.message);
  throw new Error("Order verification is unavailable. Check the Orders dashboard; do not pay again.");
 }

 if(!order||order.payment_status!=="paid"||
    order.paypal_capture_id!==checkout.paypal_capture_id){
  throw new Error("Payment confirmed, but matching order needs review. Do not pay again.");
 }

 return order.id;
}

/* ===== SAFE RECOVERY: NEVER REPEAT A PAYPAL CAPTURE ===== */
async function recoverExistingCapture(){
 const check=await invoke("paypal-bobsy-capture",{checkout_id:checkoutId,action:"inspect"});
 if(!check.payment_already_captured)return false;
 if(check.checkout_status==="paid"){
  await showVerifiedSuccess();
  return true;
 }
 if(!["processing","needs_reconciliation"].includes(check.capture_state)){
  message("PayPal reports a capture but database state needs manual review. No further charge attempted.");
  return true;
 }
 const result=await invoke("paypal-bobsy-capture",{checkout_id:checkoutId,action:"reconcile"});
 if(result.success&&result.stage==="payment_reconciled"){
  await showVerifiedSuccess();
  return true;
 }
 return false;
}
function restore(){if(checkoutId){start.disabled=true;capture.hidden=false;reconcile.hidden=false;message("Existing checkout found. Approve it in PayPal if needed, then verify/capture. Do not start another checkout.");}}
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
reconcile.addEventListener("click",async()=>{
 if(!checkoutId)return;
 reconcile.disabled=true;
 message("Reconciling previously completed payment...");
 try {
  const result=await invoke("paypal-bobsy-capture",{checkout_id:checkoutId,action:"reconcile"});
  if(result.success&&result.stage==="payment_reconciled"){
   await showVerifiedSuccess();
  } else message("Reconciliation requires review. Do not capture again.");
 } catch(err) {message("Reconciliation error: "+err.message);}
 finally {reconcile.disabled=false;}
});
capture.addEventListener("click",async()=>{
 if(!checkoutId)return;
 capture.disabled=true;message("Checking PayPal approval; no capture attempted yet…");
 try{
 const check=await invoke("paypal-bobsy-capture",{checkout_id:checkoutId,action:"inspect"});
 if(check.payment_already_captured){message("PayPal has a completed capture. Safely checking the order record...");await recoverExistingCapture();return;}
 if(!check.approved_for_capture){message("Not approved for capture yet. Complete PayPal approval first. Status: "+String(check.paypal_status||"unknown"));return;}
 if(!window.confirm("Capture the approved $1.00 PAYPAL SANDBOX test payment for Bobsy?")){message("Capture cancelled.");return;}
 const result=await invoke("paypal-bobsy-capture",{checkout_id:checkoutId,action:"capture"});
 if(result.payment_captured&&result.success){message("Sandbox payment verified and recorded! Open Leigh's Orders dashboard and refresh. Bobsy should appear.");sessionStorage.removeItem(key);}
 else message("Capture may need reconciliation. Do not retry automatically. Stage: "+String(result.stage||"unknown"));
 }catch(err){
 message("Capture result uncertain. Checking PayPal without attempting another charge...");
 try{if(!(await recoverExistingCapture()))message("No confirmed completed capture found. Do not retry payment; ask Finch to review. "+err.message);}
 catch(recoveryError){message("Payment needs review; do not retry capture. "+recoveryError.message);}
}
 finally{capture.disabled=false;}
});
authorized().then(()=>{message("Artist admin verified. Ready for Bobsy's Sandbox test.");restore();}).catch(e=>{message(e.message);start.disabled=true;capture.disabled=true;});
})();