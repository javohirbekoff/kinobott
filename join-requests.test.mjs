import {test} from 'node:test';import assert from 'node:assert/strict';import {createJoinRequests} from './join-requests.mjs';
test('recorded request grants access without approving or declining anyone',async()=>{
 const channel={id:'@Example',url:'https://t.me/+invite'},db={channels:[channel]},store={id:x=>'hash-'+x},calls=[];
 let status='left';const api=async(method,args)=>{calls.push(method);assert.equal(method,'getChatMember');return {status};};
 const service=createJoinRequests({db,store,api}),request={chat:{id:-100123,username:'example'},from:{id:1}};
 assert.equal(await service.allows(channel,1),false);assert.equal(service.remember(request),true);assert.equal(await service.allows(channel,1),true);assert.equal(await service.allows(channel,2),false);
 assert.equal(service.remember({...request,chat:{id:-100999,username:'other'},from:{id:2}}),false);
 assert.equal(await service.allows({...channel,id:'@Other'},1),false);
 assert.equal(await createJoinRequests({db,store,api}).allows(channel,1),false);
 status='kicked';assert.equal(await service.allows(channel,1),false);status='left';assert.equal(await service.allows(channel,1),false);
 status='member';assert.equal(await service.allows(channel,2),true);assert.ok(calls.every(m=>m==='getChatMember'));
});
