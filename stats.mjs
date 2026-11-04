export function dayKey(now=new Date()){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]));
 return `${p.year}-${p.month}-${p.day}`;
}
export function statistics(db){return db.stats||=( {seen:{},daily:{},totalSubscribers:0,totalViews:0} );}
export function recordSubscriber(db,uid,now=new Date()){
 const s=statistics(db);if(Object.hasOwn(s.seen,uid))return false;
 s.seen[uid]=true;s.totalSubscribers++;const day=dayKey(now);s.daily[day]=(s.daily[day]||0)+1;return true;
}
export function recordView(db){statistics(db).totalViews++;}
export function statsText(db,now=new Date()){
 const s=statistics(db),day=dayKey(now);
 return `📊 BOT STATISTIKASI\n\n📅 Bugun (${day}, Toshkent): ${s.daily[day]||0} ta yangi obunachi\n👥 Jami obunachi: ${s.totalSubscribers}\n🎬 Jami kino ko‘rishlar: ${s.totalViews}\n\nObunachi — obuna tekshiruvidan o‘tib botdan foydalangan odam. Ko‘rish — kino muvaffaqiyatli yuborilgan holat.`;
}
