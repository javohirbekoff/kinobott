import {Store} from './store.mjs';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {createUI} from './ui.mjs';
import {telegram} from './telegram.mjs';
import {fail} from './diagnostics.mjs';
import {approveJoinRequest,checkOrApprove} from './join-requests.mjs';

// No raw errors, Telegram updates, IDs, tokens or message text go to stdout.
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ready=false,stopping=false,lastPoll=0,stage='CONFIG';
async function main(){
 const token=process.env.BOT_TOKEN;
 const admins=new Set((process.env.ADMIN_IDS||'').split(',').map(x=>x.trim()).filter(x=>/^\d+$/.test(x)));
 if(!token||!admins.size) throw Error('CONFIG');
 if(process.env.RAILWAY_ENVIRONMENT_ID&&!process.env.RAILWAY_VOLUME_MOUNT_PATH) throw Error('VOLUME_REQUIRED');
 stage='STORAGE';
 const store=new Store(join(process.env.RAILWAY_VOLUME_MOUNT_PATH||process.env.DATA_DIR||'./data','catalog.enc'),process.env.DATA_KEY);
 const db=store.data,pending=new Map(),rates=new Map();
 const api=telegram(token);
 const send=(id,text,buttons=[[{text:'🏠 Bosh menyu',callback_data:'home'}]])=>api('sendMessage',{chat_id:id,text,reply_markup:{inline_keyboard:buttons},protect_content:true});
 const button=(text,data)=>({text,callback_data:data});
 async function gate(id){
  if(!db.channels.length)return true;
  for(const channel of db.channels){
   let joined;try{joined=await checkOrApprove(api,channel.id,id);}catch{await send(id,'Obunani tekshirib bo‘lmadi. Keyinroq qayta urinib ko‘ring.');return false;}
   if(!joined){
    await send(id,'Davom etish uchun kanallarga obuna bo‘ling.',[...db.channels.map(c=>[{text:c.title,url:c.url}]),[button('✅ Tekshirish','check')]]);return false;
   }
  }return true;
 }
 const ui=createUI({db,store,send,api,gate,admins});
 async function handle(update){
  if(update.chat_join_request){await approveJoinRequest(update.chat_join_request,{db,store,api});return;}
  const cb=update.callback_query,msg=update.message||cb?.message,from=cb?.from||update.message?.from;
  if(!msg||!from||msg.chat.type!=='private'||msg.chat.id!==from.id)return;
  const id=from.id,admin=admins.has(String(id)),uid=store.id(id);
  if(cb)try{await api('answerCallbackQuery',{callback_query_id:cb.id});}catch{} // Old callbacks may expire while queued.
  const now=Date.now();const wait=700-(now-(rates.get(uid)||0));if(wait>0)await sleep(wait);rates.set(uid,Date.now());
  if(rates.size>10000)for(const [key,t] of rates)if(now-t>60000)rates.delete(key);
  let text=(msg.text||msg.caption||'').trim(),action=cb?.data||text;
  if(action==='/forget'){delete db.users[uid];await store.save();return send(id,'Bot bazasidagi shaxsiy sozlamalaringiz o‘chirildi. Telegramdagi xabarlarni o‘zingiz o‘chirishingiz mumkin.');}
  db.users[uid]||={favorites:[],blocked:false};const user=db.users[uid];
  if(user.blocked&&!admin)return;
  const handled=await ui({id,uid,admin,user,action,text,msg,cb});
  if(handled===true)return;
  if(handled?.command){text=handled.command;action=text;}
  if(admin&&!cb&&text.startsWith('/broadcast ')){pending.set(uid,{text:text.slice(11,3511),expires:now+300000});return send(id,'Yuboriladigan xabar:\n'+text.slice(11,3511),[[button('✅ Tasdiqlash','broadcast_yes'),button('✖️ Bekor qilish','broadcast_no')]]);}
  if(admin&&action.startsWith('broadcast_')){
   const draft=pending.get(uid);if(action!=='broadcast_yes'||!draft||draft.expires<now){pending.delete(uid);return send(id,'Bekor qilindi.');}
   pending.delete(uid);
   let sent=0;for(const u of Object.values(db.users)){if(u.chat&&!u.blocked){try{await send(u.chat,draft.text);sent++;}catch{}await sleep(60);}}return send(id,`Yuborildi: ${sent}`);
  }
 }
 stage='TELEGRAM';await api('getMe');await api('deleteWebhook',{drop_pending_updates:true});ready=true;lastPoll=Date.now();stage='RUNNING';
 while(!stopping){try{const updates=await api('getUpdates',{offset:db.offset,timeout:25,allowed_updates:['message','callback_query','chat_join_request']});lastPoll=Date.now();for(const update of updates){try{await handle(update);}catch{}db.offset=update.update_id+1;}}catch{await sleep(3000);}}

}
const server=createServer((req,res)=>{res.statusCode=ready&&Date.now()-lastPoll<180000?200:503;res.end(res.statusCode===200?'ok':'unavailable');});
server.on('error',error=>fail(error,'HTTP'));
process.on('uncaughtException',error=>fail(error,stage));
process.on('unhandledRejection',error=>fail(error,stage));
server.listen(Number(process.env.PORT||3000),'0.0.0.0');
process.on('SIGTERM',()=>{stopping=true;server.close();setTimeout(()=>process.exit(0),45000).unref();});
main().catch(error=>fail(error,stage));
