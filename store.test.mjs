import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {Store} from './store.mjs';
test('encrypted roundtrip, randomized nonce, wrong-key and tamper rejection',()=>{
 const dir=mkdtempSync(join(tmpdir(),'kino-test-')),path=join(dir,'data.enc'),key=randomBytes(32).toString('base64');
 try{
  const s=new Store(path,key);s.data.users[s.id(123)]={chat:123,favorites:['private-movie-title']};s.save();
  const first=readFileSync(path);assert.equal(first.includes(Buffer.from('private-movie-title')),false);
  assert.deepEqual(new Store(path,key).data,s.data);s.save();assert.notDeepEqual(readFileSync(path),first);
  assert.throws(()=>new Store(path,randomBytes(32).toString('base64')));
  const damaged=readFileSync(path);damaged[damaged.length-1]^=1;writeFileSync(path,damaged);assert.throws(()=>new Store(path,key));
  assert.throws(()=>new Store(path,'bad'));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
