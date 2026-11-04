import {test} from 'node:test';import assert from 'node:assert/strict';import {approveJoinRequest,checkOrApprove} from './join-requests.mjs';
test('only configured channels and bot users or configured links are approved',async()=>{
 const calls=[],db={channels:[{id:'@Example',url:'https://t.me/+invite'}],users:{known:{}}},store={id:x=>x===1?'known':'unknown'},api=async(...a)=>calls.push(a);
 const request={chat:{id:-100123,username:'example'},from:{id:1}};
 assert.equal(await approveJoinRequest(request,{db,store,api}),true);assert.equal(calls[0][1].user_id,1);
 assert.equal(await approveJoinRequest({...request,chat:{id:-100999,username:'other'}},{db,store,api}),false);
 assert.equal(await approveJoinRequest({...request,from:{id:2}},{db,store,api}),false);
 assert.equal(await approveJoinRequest({...request,from:{id:2},invite_link:{invite_link:'https://t.me/+invite'}},{db,store,api}),true);
});
test('pending requests require successful approval and membership recheck',async()=>{
 let reads=0;assert.equal(await checkOrApprove(async method=>method==='getChatMember'?{status:reads++?'member':'left'}:true,-1001,1),true);
 assert.equal(await checkOrApprove(async method=>{if(method==='approveChatJoinRequest')throw Error();return {status:'left'};},-1001,1),false);
 assert.equal(await checkOrApprove(async()=>({status:'left'}),-1001,1),false);
 let approvals=0;assert.equal(await checkOrApprove(async method=>{if(method==='approveChatJoinRequest')approvals++;return {status:'kicked'};},-1001,1),false);assert.equal(approvals,0);
});
