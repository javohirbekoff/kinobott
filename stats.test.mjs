import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {randomBytes} from 'node:crypto';
import {Store} from './store.mjs';import {recordSubscriber,recordView,dayKey} from './stats.mjs';
test('statistics survive restarts, deduplicate users and roll days at Tashkent midnight',()=>{
 const dir=mkdtempSync(join(tmpdir(),'kino-stats-')),path=join(dir,'catalog.enc'),key=randomBytes(32).toString('base64');
 try{
  let s=new Store(path,key);const uid=s.id(12345678),before=new Date('2026-11-04T18:59:59Z'),after=new Date('2026-11-04T19:00:00Z');
  assert.equal(dayKey(before),'2026-11-04');assert.equal(dayKey(after),'2026-11-05');
  recordSubscriber(s.data,uid,before);recordSubscriber(s.data,uid,before);recordView(s.data);s.data.channels=[{id:'@example'}];s.save();
  s=new Store(path,key);assert.equal(recordSubscriber(s.data,uid,after),false);recordSubscriber(s.data,s.id(999),after);recordView(s.data);s.save();
  s=new Store(path,key);assert.equal(s.data.stats.totalSubscribers,2);assert.equal(s.data.stats.totalViews,2);assert.deepEqual(s.data.stats.daily,{'2026-11-04':1,'2026-11-05':1});assert.deepEqual(s.data.channels,[{id:'@example'}]);assert.deepEqual(s.data.users,{});assert.equal(readFileSync(path).includes(Buffer.from('12345678')),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
