export function matchesChannel(channel,chat){
 return String(channel.id)===String(chat.id)||(typeof channel.id==='string'&&channel.id.startsWith('@')&&chat.username&&channel.id.toLowerCase()==='@'+chat.username.toLowerCase());
}
export async function approveJoinRequest(request,{db,store,api}){
 if(!request?.chat||!request?.from)return false;
 const channel=db.channels.find(c=>matchesChannel(c,request.chat));if(!channel)return false;
 const known=Object.hasOwn(db.users,store.id(request.from.id));
 const fromLink=!!request.invite_link?.invite_link&&request.invite_link.invite_link===channel.url;
 if(!known&&!fromLink)return false;
 await api('approveChatJoinRequest',{chat_id:request.chat.id,user_id:request.from.id});return true;
}
export function isMember(member){return ['creator','administrator','member'].includes(member.status)||(member.status==='restricted'&&member.is_member===true);}
export async function checkOrApprove(api,chatId,userId){
 let member=await api('getChatMember',{chat_id:chatId,user_id:userId});
 if(isMember(member))return true;
 if(member.status==='kicked')return false;
 // A known user's explicit check can approve an older pending request by ID.
 // If there is no pending request, Telegram rejects approval and access stays closed.
 try{await api('approveChatJoinRequest',{chat_id:chatId,user_id:userId});}catch{return false;}
 member=await api('getChatMember',{chat_id:chatId,user_id:userId});return isMember(member);
}
