const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export function telegram(token){
 let next=0;const chats=new Map();
 return async function api(method,args={}){
  for(let attempt=0;attempt<5;attempt++){
   if(method!=='getUpdates'){
    const chat=method.startsWith('send')?args.chat_id:null;
    const slot=Math.max(Date.now(),next,chat?(chats.get(chat)||0):0);next=slot+50;if(chat)chats.set(chat,slot+1100);
    if(chats.size>10000)for(const [key,time] of chats)if(time<Date.now())chats.delete(key);
    await sleep(Math.max(0,slot-Date.now()));
   }
   let result;
   try{const res=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(45000)});result=await res.json();}catch{if(attempt===4)throw Error('NETWORK');await sleep(1000*2**attempt);continue;}
   if(result.ok)return result.result;
   if(result.error_code===429){const wait=Math.max(1,Number(result.parameters?.retry_after)||2)*1000;next=Math.max(next,Date.now()+wait);await sleep(wait);continue;}
   if(result.error_code>=500){await sleep(1000*2**attempt);continue;}
   const error=Error('API');error.status=result.error_code;error.permanent=[400,403].includes(result.error_code);throw error;
  }throw Error('RETRY');
 };
}
