export function matchesChannel(channel,chat){
 return String(channel.id)===String(chat.id)||(typeof channel.id==='string'&&channel.id.startsWith('@')&&chat.username&&channel.id.toLowerCase()==='@'+chat.username.toLowerCase());
}
export function createJoinRequests({db,store,api}){
 // Volatile, pseudonymous markers only. No approval or decline API calls.
 const requests=new Set();
 const key=(channel,userId)=>JSON.stringify([String(channel.id).toLowerCase(),channel.url,store.id(userId)]);
 return {
  remember(request){
   if(!request?.chat||!request?.from)return false;
   const channel=db.channels.find(c=>matchesChannel(c,request.chat));if(!channel)return false;
   requests.add(key(channel,request.from.id));return true;
  },
  async allows(channel,userId){
   const member=await api('getChatMember',{chat_id:channel.id,user_id:userId});
   if(member.status==='kicked'){requests.delete(key(channel,userId));return false;}
   if(['creator','administrator','member'].includes(member.status)||(member.status==='restricted'&&member.is_member===true))return true;
   return requests.has(key(channel,userId));
  }
 };
}
