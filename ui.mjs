import {recordSubscriber,recordView,statsText} from './stats.mjs';
export function createUI({db,store,send,api,gate,admins}) {
 const sessions=new Map();
 const b=(text,callback_data)=>({text,callback_data});
 const back=[[b('🏠 Bosh menyu','home')]];
 const cancel=[[b('✖️ Bekor qilish','home')]];
 const adminBack=[[b('⚙️ Admin panel','panel')]];
 const fields=[['code','🔢 Kino kodini yozing.'],['title','🎬 Kino nomini yozing.'],['file','📤 Kino videosini yoki video faylini yuboring.']];
 function state(uid,s){sessions.set(uid,{...s,expires:Date.now()+1800000});}
 async function home(id,admin){return send(id,'🎬 Kino kodini yuboring.',admin?[[b('⚙️ Admin panel','panel')]]:[]);}
 async function panel(id){return send(id,'⚙️ ADMIN PANEL',[[b('➕ Kino qo‘shish','manage:add'),b('🗑 Kino o‘chirish','manage:delete')],[b('📢 Majburiy kanallar','manage:channels')],[b('📣 Ommaviy xabar','manage:broadcast'),b('📊 Statistika','manage:stats')],...back]);}
 async function ask(id,s){const [key,prompt]=fields[s.step];return send(id,prompt,[...(['series','poster'].includes(key)?[[b('⏭ O‘tkazish','skip')]]:[]),...cancel]);}
 return async function ui({id,uid,admin,user,action,text,msg,cb}){
  for(const [k,s] of sessions)if(s.expires<Date.now())sessions.delete(k);
  let s=sessions.get(uid);
  if(['home','/start','/help','check'].includes(action)){sessions.delete(uid);if(!await gate(id))return true;user.chat=id;recordSubscriber(db,uid);await store.save();await home(id,admin);return true;}
  if(action==='panel'||action==='/admin'||(!cb&&text.trim().toLowerCase()==='admin')){if(admin){sessions.delete(uid);await panel(id);}return true;}
  if(action.startsWith('manage:')){
   if(!admin)return true;
   const kind=action.slice(7);if(!['add','delete','channels','channel','broadcast','stats'].includes(kind))return true;sessions.delete(uid);
   if(kind==='stats'){await send(id,statsText(db),[[b('🔄 Yangilash','manage:stats')],...adminBack]);return true;}
   if(kind==='channels'){await send(id,'📢 MAJBURIY OBUNA KANALLARI',[...db.channels.map((c,i)=>[b('🗑 '+c.title,'removechannel:'+i)]),[b('➕ Kanal qo‘shish','manage:channel')],...adminBack]);return true;}
   if(kind==='add'){s={kind:'add',step:0,m:{}};state(uid,s);await ask(id,s);return true;}
   const prompts={edit:'✏️ Tahrirlanadigan kino kodini yozing. Ma’lumotlarni qaytadan kiritasiz.',delete:'🗑 O‘chiriladigan kino kodini yozing.',channel:'📢 Kanal ID sini yozing: @kanal_nomi yoki -100 bilan boshlanuvchi raqam.',broadcast:'📣 Tarqatiladigan matnni yozing (3500 belgigacha).',block:'🚫 Telegram raqamli ID sini yozing.',unblock:'✅ Telegram raqamli ID sini yozing.'};
   if(prompts[kind]){state(uid,{kind});await send(id,prompts[kind],cancel);}return true;
  }
  if(action.startsWith('removechannel:')){if(admin){const i=Number(action.split(':')[1]);db.channels.splice(i,1);if(!db.channels.length)db.subscription=false;await store.save();await panel(id);}return true;}
  if(action==='privacy'){await send(id,'🔐 MAXFIYLIK\n\nMa’lumotlar bazada shifrlanadi. Xabar va qidiruv tarixi logga yozilmaydi. Chat va adminga yozish yo‘q. Telegram xabarlari Telegramda saqlanadi.',[[b('🗑 Ma’lumotlarimni o‘chirish','forget_confirm')],...back]);return true;}
  if(action==='forget_confirm'){await send(id,'Sevimlilar va botdagi shaxsiy sozlamalaringiz o‘chirilsinmi?',[[b('🗑 Ha, o‘chirish','forget_yes')],...back]);return true;}
  if(action==='forget_yes'){sessions.delete(uid);delete db.users[uid];await store.save();await send(id,'✅ Vaqtinchalik sozlamalaringiz o‘chirildi. Statistik hisob va takroriy hisoblashdan himoya belgisi saqlanadi.',back);return true;}
  if(action==='confirm_movie'||action==='confirm_delete'){
   if(!admin||!s||!['preview','delete_confirm'].includes(s.kind))return true;
   if(action==='confirm_movie'&&s.kind==='preview'){const old=db.movies[s.m.code];db.movies[s.m.code]={...s.m,created:old?.created||Date.now(),views:old?.views||0};}
   else if(action==='confirm_delete'&&s.kind==='delete_confirm')delete db.movies[s.code];else return true;
   await store.save();sessions.delete(uid);await send(id,'✅ Bajarildi.',adminBack);return true;
  }
  if(s&&admin&&(!cb||action==='skip')&&!text.startsWith('/')){
   if(s.kind==='add'){
    const key=fields[s.step][0];let value=text;
    if(key==='file'){const f=msg.video||msg.document;if(!f){await send(id,'Video yoki fayl yuboring.',cancel);return true;}value=f.file_id;s.m.type=msg.video?'video':'document';}
    else if(!value||value.length>(key==='description'?600:150)||(key==='code'&&(!/^[A-Za-z0-9_-]{1,24}$/.test(value)||['__proto__','constructor','prototype'].includes(value)))||(['year','season','episode'].includes(key)&&!/^\d{1,4}$/.test(value))){await send(id,'Qiymat noto‘g‘ri yoki juda uzun. Qayta kiriting.',cancel);return true;}
    s.m[key]=value;s.step++;
    if(s.step===fields.length){state(uid,{kind:'preview',m:s.m});await send(id,`🎬 ${s.m.title}\n🔢 ${s.m.code}\n\n${Object.hasOwn(db.movies,s.m.code)?'⚠️ Shu koddagi kino almashtiriladi.':'Saqlansinmi?'}`,[[b('✅ Saqlash','confirm_movie')],...cancel]);}
    else{state(uid,s);await ask(id,s);}return true;
   }
   if(s.kind==='delete'){if(!Object.hasOwn(db.movies,text)){await send(id,'Kino topilmadi.',cancel);return true;}state(uid,{kind:'delete_confirm',code:text});await send(id,`«${db.movies[text].title}» o‘chirilsinmi?`,[[b('🗑 O‘chirish','confirm_delete')],...cancel]);return true;}
   if(s.kind==='broadcast'){if(!text||text.length>3500){await send(id,'1–3500 belgi kiriting.',cancel);return true;}sessions.delete(uid);return {command:'/broadcast '+text};}
   if(s.kind==='channel'){if(!/^(@[A-Za-z0-9_]{5,}|-100\d+)$/.test(text)){await send(id,'Kanal ID noto‘g‘ri.',cancel);return true;}state(uid,{kind:'channel_title',channel:{id:text}});await send(id,'Kanal uchun tugma nomini yozing.',cancel);return true;}
   if(s.kind==='channel_title'){if(!text||text.length>80)return true;s.channel.title=text;s.kind='channel_url';state(uid,s);await send(id,'Kanal havolasini yozing: https://t.me/...',cancel);return true;}
   if(s.kind==='channel_url'){if(!/^https:\/\/t\.me\/[A-Za-z0-9_+/-]+$/.test(text)||db.channels.length>=10){await send(id,'Havola noto‘g‘ri yoki 10 ta kanal chegarasiga yetildi.',cancel);return true;}try{const me=await api('getMe');const member=await api('getChatMember',{chat_id:s.channel.id,user_id:me.id});if(!['administrator','creator'].includes(member.status))throw Error();}catch{await send(id,'Avval botni shu kanalda admin qiling, so‘ng havolani qayta yuboring.',cancel);return true;}db.channels.push({...s.channel,url:text});db.subscription=true;await store.save();sessions.delete(uid);await send(id,'✅ Kanal qo‘shildi. Botni shu kanalda admin qiling.',adminBack);return true;}
  }
  if(action==='broadcast_yes'||action==='broadcast_no')return admin?false:true;
  if(!await gate(id))return true;
  user.chat=id;
  recordSubscriber(db,uid);await store.save();
  const code=cb?'':text;
  if(Object.hasOwn(db.movies,code)){
   const m=db.movies[code];
   await api(m.type==='video'?'sendVideo':'sendDocument',{chat_id:id,[m.type]:m.file,caption:'🎬 '+m.title,protect_content:true});
   recordView(db);
   await store.save();return true;
  }
  await send(id,code&&!code.startsWith('/')?'Kino topilmadi. Kodni tekshirib qayta yuboring.':'🎬 Kino kodini yuboring.',admin?[[b('⚙️ Admin panel','panel')]]:[]);
  return true;
 };
}
